import React from 'react';

import FlipMove from 'react-flip-move';
import propTypes from 'prop-types';
import reactDom from 'react-dom';

const axios = require('axios');

class Title extends React.Component {
	constructor() {
		super();
		this.state = { now: new Date() };
	}
	componentWillMount() {
		this.interval = setInterval(() => this.setState({ now: new Date() }), 1000);
	}
	componentWillUnmount() {
		clearInterval(this.interval);
	}
	render() {
		if (this.props.title) {
			return <div className="text-center">
				<h1>{this.props.title}</h1>
				<h4>Current time: <b>{this.state.now.toString()}</b></h4>
				<h5>Last Updated: <b>{this.props.lastUpdated.toString()}</b></h5>
			</div>;
		} 
		return <h1 className="text-center flash animated infinite">Loading...</h1>;
	}
}

Title.propTypes = {
	title: propTypes.string,
	lastUpdated: propTypes.instanceOf(Date)
};

class Table extends React.Component {
	render() {
		if (!this.props.problems || !this.props.teams) return null;
		const problems = this.props.problems, teams = this.props.teams;
		return <table className="table table-striped">
			<thead>
				<tr>
					<th rowSpan={2}>#</th>	
					<th rowSpan={2}>Team</th>
					<th rowSpan={2}>Slv/Pen</th>
					<th colSpan={problems.length} className="text-center">Problems</th>
				</tr>
				<tr>
					{problems.map((p, id) => <th key={id} title={p.title} className="text-center">
						{String.fromCharCode(id + 'A'.charCodeAt(0))}
						<div><small title="Solved / Attempts">{p.solved}/{p.attempts}</small></div>
					</th>)}
				</tr>
			</thead>
			<FlipMove
				appearAnimation="elevator"
				typeName="tbody"
			>
				{teams.map(team => <Row key={team.id} team={team} problems={problems}/>)}	
			</FlipMove>
			<tfoot>
				<tr>
					<th colSpan={2}>Total</th>
					<td><b>{this.props.totalSolved}/{this.props.totalAttempts}</b></td>
					{problems.map((p, id) => <td key={id} className="text-center"><b>{p.solved}/{p.attempts}</b></td>)}
				</tr>
			</tfoot>
		</table>;
	}
}

Table.propTypes = {
	problems: propTypes.arrayOf(propTypes.object),
	teams: propTypes.arrayOf(propTypes.object),
	totalSolved: propTypes.number,
	totalAttempts: propTypes.number
};

class Row extends React.Component {
	render() {
		const team = this.props.team; const problems = this.props.problems;
		return <tr>
			<td>{team.rank}</td>
			<td>{team.name}</td>
			<td>{team.solved}/{team.penalty}</td>
			{problems.map((p, id) => <Cell key={id} problem={p} teamProblem={team.problems[id]}/>)}
		</tr>;
	}
}

Row.propTypes = {
	problems: propTypes.arrayOf(propTypes.object),
	team: propTypes.object
};

function formatTime(sec) {
	return `${Math.trunc(sec / 60)}:${(sec % 60 < 10 ? '0' : '') + `${sec % 60}`}`;
}

class Cell extends React.Component {
	render() {
		const problem = this.props.problem, team = this.props.teamProblem;
		let upper = '-', lower = '-', classname = '';
		if (team.attempts > 0) {
			if (team.solved) {
				upper = '+' + (team.attempts == 1 ? '' : `${team.attempts - 1}`);
				lower = <span title={`Penalty ${team.penalty}`}>{formatTime(team.submitTime)}</span>;
				classname = 'success';
				if (team.submitTime === problem.bestSolution) {
					classname = 'info';
					upper = <b title="First solved">{upper}</b>;
					lower = <b>{lower}</b>;
				}
			} else if (team.pending) {
				upper = <span className="flash animated infinite ">???</span>;
				lower = `${team.attempts} att.`;
				classname = 'warning';
			} else {
				upper = `-${team.attempts}`;
				lower = '-';
				classname = 'danger';
			}
		}
		return <td className={classname + ' text-center'}>
			{upper}
			<div><small>{lower}</small></div>
		</td>;
	}
}

Cell.propTypes = {
	problem: propTypes.object,
	teamProblem: propTypes.object
};

class Index extends React.Component {
	constructor() {
		super();
		this.state = {
			title: null,
			lastUpdated: null,
			problems: null,
			teams: null
		};
		axios.get('/data')
			.then(response => this.setState(Object.assign(response.data, { lastUpdated: new Date() })))
			.catch(err => { console.log(err); });
		setInterval(() => {
			axios.get('/data')
				.then(response => this.setState(Object.assign(response.data, { lastUpdated: new Date() })))
				.catch(err => { console.log(err); });
		}, 10000);
	}
	render() {
		return <div className="container-fluid">
			<Title title={this.state.title} lastUpdated={this.state.lastUpdated} />	
			<hr />
			<Table
				problems={this.state.problems}
				teams={this.state.teams}
				totalSolved={this.state.totalSolved}
				totalAttempts={this.state.totalAttempts} />
			<hr />
			<div className="rows">
				<div className="col-md-6 col-md-push-3">
					<table className="table table-bordered">
						<tbody>
							<tr className="text-center">
								<th>Legend</th>
								<td>Unsubmitted</td>
								<td className="warning">
									<span className="flash animated infinite">Pending</span>	
								</td>
								<td className="danger">Failed</td>
								<td className="success">Solved</td>
								<td className="info"><b>First Solved</b></td>
							</tr>
						</tbody>	
					</table>	
				</div>	
			</div>
		</div>;
	}
}

reactDom.render(<Index />, document.getElementById('root'));