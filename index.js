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