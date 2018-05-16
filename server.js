/*
TO-DO:

-clean up all of the CSS and HTMl

-improve console.logs for when the server has extended uptime

-get server up-and-running on raspberry pi
*/

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

var app = express();

app.set('view engine', "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static(path.join(__dirname, 'resources')));

app.get("/", function (request, response) {
	response.render("home");
});

app.get("/high_scores", function (request, response) {
	response.render("high_scores", {
		snakeScores: getHighScores("snake", 100),
		tetrisScores: getHighScores("tetris", 100),
		asteroidsScores: getHighScores("asteroids", 100)
	})
});

function compareScoreObjects(scoreObj1, scoreObj2) {
	var score1 = parseInt(scoreObj1.score);
	var score2 = parseInt(scoreObj2.score)
	if (score1 < score2) {
		return 1;
	}
	if (score1 > score2) {
		return -1;
	}
	return 0;
}

function getHighScores(game, amount) {
	var scoresText = fs.readFileSync('scores.json', 'utf8');
	var scoresObj = JSON.parse(scoresText);
	var gameScores = scoresObj.games[game];
	var sortedGameScores = gameScores.sort(compareScoreObjects);
	return (sortedGameScores.slice(0, amount));
}

app.get("/snake", function (request, response) {
	response.render("game", {
		game: "Snake",
		gameScript: "games/snake.js",
		top10Scores: getHighScores("snake", 10),
		programmer: "Josh Katofsky",
		codeUrl: "https://github.com/jkatofsky/AHS-Arcade/blob/master/resources/games/snake.js"
	});
});

app.get("/tetris", function (request, response) {
	response.render("game", {
		game: "Tetris",
		gameScript: "games/tetris.js",
		top10Scores: getHighScores("tetris", 10),
		programmer: "Kieran O'Day",
		codeUrl: "https://github.com/jkatofsky/AHS-Arcade/blob/master/resources/games/tetris.js"
	});
});

app.get("/asteroids", function (request, response) {
	response.render("game", {
		game: "Asteroids",
		gameScript: "games/asteroids.js",
		top10Scores: getHighScores("asteroids", 10),
		programmer: "Kieran O'Day",
		codeUrl: "https://github.com/jkatofsky/AHS-Arcade/blob/master/resources/games/asteroids.js"
	});
});

function saveScore(scoreData) {
	fs.readFile('scores.json', 'utf8', function (error, data) {
		if (error) {
			throw error;
		}
		var scoresObj = JSON.parse(data);
		scoresObj.games[scoreData.game].push({
			initials: scoreData.initials,
			score: scoreData.score,
			date: scoreData.date
		});
		updatedJSON = JSON.stringify(scoresObj);
		fs.writeFile('scores.json', updatedJSON, 'utf8', function () {
			console.log("Saved score!");
		});
	});
}

app.post('/submit_score', function (request, response) {
	var scoreData = request.body;
	saveScore(scoreData);
	return response.redirect('/' + scoreData.game);
});

app.listen(8080, function () {
	console.log("Server running on port 8080");
});