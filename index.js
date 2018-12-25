const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();

const debug = require('debug')('pc2:server');
const config = require('./config.json');
const Watcher = require('./xml');

const port = process.env.PORT || config.port || 8890;

app.use(morgan('tiny'));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

let scoreboard = null;

if (config.xml_path === undefined){
	// try to automatically determine xml_path
	const ps = require('ps-node');
	const fs = require('fs');
	ps.lookup({command: 'java'}, (error, result) => {
		if (error) {
			debug('Cannot determine xml path automatically. Please configure xml_path manually');
			throw error;
		}
		if(result.length == 0) {
			throw Error(
				'It looks like that pc2 is currently not running. Please run pc2 or configure xml_path manually');
		}

		let candidate_xml_paths = []
		for (let proc of result) {
			for (let arg of proc.arguments) {
				candidate_xml_paths.push(path.join(arg, '../../bin/results.xml'));
			}
		}
		candidate_xml_paths = [...new Set(candidate_xml_paths)].filter(x => fs.existsSync(x));

		if(candidate_xml_paths.length == 0)
			throw Error('Cannot determine xml path automatically. Please configure xml_path manually');

		if(candidate_xml_paths.length > 1) {
			debug('Detect multiple possible results.xml path. Please configure xml_path manually.');
			debug('Candidates:');
			for(let candidate of candidate_xml_paths) debug(candidate);
			throw Error();
		}

		config.xml_path = candidate_xml_paths[0];
		debug('Detected xml path: ', config.xml_path);
		process_with_xml_path();
	});
} else {
	process_with_xml_path();
}

function process_with_xml_path() {
	const watcher = new Watcher(config.xml_path);
	watcher.on('error', err => {
		debug(err);
	});
	watcher.on('updated', () => {
		scoreboard = watcher.content;
		for (let team of scoreboard.teams) {
			if (team.id in config.disp_name) {
				team.name = config.disp_name[team.id]
			}
		}
	});

	app.get('/', (req, res) => {
		return res.sendFile(path.join(process.cwd(), 'views/index.html'));
	});

	app.get('/data', (req, res) => {
		return res.json(scoreboard);
	});

	app.listen(port, () => {
		debug(`Listening on port ${port}`);
	});
}
