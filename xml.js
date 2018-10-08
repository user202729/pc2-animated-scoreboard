// Parser for the XML file.

const events = require('events');
const fs = require('fs');
const xml = require('xml2js');

function parseContest(xml) {
	xml = xml.contestStandings;
	const contest = {
		title: xml.standingsHeader[0].$.title,
		totalAttempts: Number(xml.standingsHeader[0].$.totalAttempts),
		totalSolved: Number(xml.standingsHeader[0].$.totalSolved),
		problems: [],
		teams: []
	};
	let problems = xml.standingsHeader[0].problem || [];
	problems.sort((a, b) => Number(a.$.id) - Number(b.$.id));
	for (let p of problems) {
		contest.problems.push({
			title: p.$.title,
			attempts: Number(p.$.attempts),
			solved: Number(p.$.numberSolved),
			bestSolution: Number(p.$.bestSolutionTime),
			lastSolution: Number(p.$.lastSolutionTime)
		});
	}
	xml.teamStanding.sort((a, b) => Number(a.$.rank) - Number(b.$.rank));
	for (let c of xml.teamStanding) {
		const team = {
			name: c.$.teamName,
			id: c.$.teamId,
			key: c.$.teamKey,
			penalty: Number(c.$.points),
			solved: Number(c.$.solved),
			rank: Number(c.$.rank),
			problems: []
		};
		let problemSummaryInfo = c.problemSummaryInfo || [];
		problemSummaryInfo.sort((a, b) => Number(a.$.index) - Number(b.$.index));
		for (let p of problemSummaryInfo) {
			team.problems.push({
				index: p.$.index,
				pending: p.$.isPending === 'true',
				solved: p.$.isSolved === 'true',
				attempts: Number(p.$.attempts),
				penalty: Number(p.$.points),
				submitTime: Number(p.$.solutionTime)
			});
		}
		contest.teams.push(team);
	}
	return contest;
}

/**
 * parseFile parses an XML scoreboard and convert it into friendly-JSON format.
 * @param {string} filepath The path to the XML file.
 * @param {function} callback (err, json)
 */
function parseFile(filepath, callback) {
	fs.readFile(filepath, 'utf-8', (err, data) => {
		if (err) return callback(err);
		const parser = new xml.Parser();
		parser.parseString(data, (err, xmlData) => {
			callback(err, parseContest(xmlData));
		});
	});
}

class Watcher extends events.EventEmitter {
	constructor(filename) {
		super();
		this.filename = filename;
		this.content = null;
		parseFile(filename, (err, content) => {
			if (err) return this.emit('error', err);
			this.content = content;
			this.emit('updated');
		});
		fs.watchFile(filename, () => {
			parseFile(filename, (err, content) => {
				if (err) return this.emit('error', err);
				this.content = content;
				this.emit('updated');
			});
		});
	}
}

Watcher.parseFile = parseFile;

module.exports = Watcher;
