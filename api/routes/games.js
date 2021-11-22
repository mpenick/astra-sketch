var sg = require('@stargate-oss/stargate-grpc-node-client')
var grpc = require('../grpc')
var config = require('../config')
const uuid = require('uuid');
var express = require('express');
var { publishGameChange } = require('../pulsar')

var router = express.Router();

var grpc = require("../grpc");
const { generateTopic } = require('../../ui/src/utils');

// Get full game state object
router.get('/:id', function(req, res, next) {
    grpc.getGame(req.params.id).then(game => {
        res.status(200).write(JSON.stringify(game, null, 2));
        res.end();
    }).catch(err => {
        res.status(500).render('error', { message: "Error attempting to get game", error: err });
    });
});

// New game
router.post('/:id', function(req, res, next) {
    if (req.body.vip) {
        const vip = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(uuid.v4())));
        const id = new sg.Value().setString(req.params.id);
        const name = new sg.Value().setString(req.body.vip);

        const batch = new sg.Batch();
        batch.setType(sg.Batch.Type.LOGGED);

        const insertGame = new sg.Query();
        const insertGameValues = new sg.Values();
        insertGameValues.addValues(id);
        insertGameValues.addValues(vip);
        insertGame.setCql(`INSERT INTO ${config.KEYSPACE}.game (game_id, game_num, vip, state) VALUES (?, 0, ?, 'NEW_GAME')`);
        insertGame.setValues(insertGameValues);
        batch.addQueries(insertGame);

        const insertPlayer = new sg.Query();
        const insertPlayerValues = new sg.Values();
        insertPlayerValues.addValues(id);
        insertPlayerValues.addValues(vip);
        insertPlayerValues.addValues(name);
        insertPlayer.setCql(`INSERT INTO ${config.KEYSPACE}.players (game_id, player_id, name) VALUES (?, ?, ?)`);
        insertPlayer.setValues(insertPlayerValues);
        batch.addQueries(insertPlayer);

        grpc.client.executeBatch(batch).then((response) => {
            publishGameChange(req.params.id);
            res.status(200).end();
        }).catch((err) => {
            res.status(500).render('error', { message: "Error attempting to add new game", error: err });
        });

    } else {
        res.status(400).render( 'error', { message: "'vip' not provided", error: new Error("'vip' not provided")})
    }
});

// Update topic
router.put('/:id/topic/:topicPlayerId', function(req, res, next) {
    const id = new sg.Value().setString(req.params.id);
    const topicPlayerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(req.params.topicPlayerId)));

    const query = new sg.Query();
    const values = new sg.Values();
    values.addValues(topicPlayerId);
    values.addValues(id);
    query.setCql(`UPDATE ${config.KEYSPACE}.game SET topic_player_id = ? WHERE game_id = ?`);
    query.setValues(values);

    grpc.client.executeQuery(query).then((response) => {
        publishGameChange(req.params.id);
        res.status(200).end();
    }).catch((err) => {
        res.status(500).render('error', { message: "Error attempting to update topic", error: err });
    });
});

// Update topic
router.put('/:id/state/:state', function(req, res, next) {
    const id = new sg.Value().setString(req.params.id);
    const state = new sg.Value().setString(req.params.state);

    const query = new sg.Query();
    const values = new sg.Values();
    values.addValues(state);
    values.addValues(id);
    query.setCql(`UPDATE ${config.KEYSPACE}.game SET state = ? WHERE game_id = ?`);
    query.setValues(values);

    grpc.client.executeQuery(query).then((response) => {
        publishGameChange(req.params.id);
        res.status(200).end();
    }).catch((err) => {
        res.status(500).render('error', { message: "Error attempting to update topic", error: err });
    });
});

// Add player
router.post('/:id/players/:name', function(req, res, next) {
    const id = new sg.Value().setString(req.params.id);
    const name = new sg.Value().setString(req.params.name);

    const values = new sg.Values();
    values.addValues(id);
    values.addValues(name);

    const query = new sg.Query();
    query.setCql(`INSERT INTO ${config.KEYSPACE}.players (game_id, player_id, name) VALUES (?, uuid(), ?)`);
    query.setValues(values);
    grpc.client.executeQuery(query).then((response) => {
        publishGameChange(req.params.id);
        res.status(200).end();
    }).catch((err) => {
        res.status(500).render('error', { message: "Error attempting to add new player", error: err });
    });
});


// New game instance
//
// Input: Takes an array of player uuid strings
//  {
//    "players": [ "2f516cb5-a357-4b11-b71d-592d5d8fe406", "a5c632f5-36c1-4061-8791-1380e81b8c49" ]
//  }
router.post('/:id/instances/:num', function(req, res, next) {
    if (req.body.players && Array.isArray(req.body.players)) {
        const batch = new sg.Batch();
        batch.setType(sg.Batch.Type.LOGGED);
        let topics = [];
        req.body.players.forEach(player => {
            try {
                let topic = generateTopic(topics);
                topics.push(topic);

                const id = new sg.Value().setString(req.params.id);
                const num = new sg.Value().setInt(req.params.num);
                const playerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(player)));
                const topicVal = new sg.Value().setString(topic);

                const values = new sg.Values();
                values.addValues(id);
                values.addValues(num);
                values.addValues(playerId);
                values.addValues(topicVal);

                const query = new sg.Query();
                query.setCql(`INSERT INTO ${config.KEYSPACE}.topics (game_id, game_num, topic_player_id, topic) VALUES (?, ?, ?, ?)`);
                query.setValues(values);

                batch.addQueries(query);
            } catch(e) {
                console.log(`Unable to add player ${player}`);
            }
        });

        grpc.client.executeBatch(batch).then((response) => {
            publishGameChange(req.params.id);
            res.status(200).end();
        }).catch((err) => {
            res.status(500).render('error', { message: "Error attempting to add new game instance", error: err });
        });
    } else {
        res.status(400).render( 'error', { message: "'players' array not provided", error: new Error("'players' array not provided")})
    }
});


// Upload sketch svg
//
// Input: Takes an string with svg data
//  {
//    "svg": "somesvgdata"
//  }
router.put('/:id/instances/:num/topics/:playerId/svg', function(req, res, next) {
    if (req.body.svg) {
        const id = new sg.Value().setString(req.params.id);
        const num = new sg.Value().setInt(req.params.num);
        const playerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(req.params.playerId)));
        const svg = new sg.Value().setString(req.body.svg);

        const values = new sg.Values();
        values.addValues(id);
        values.addValues(num);
        values.addValues(playerId);
        values.addValues(svg);

        const query = new sg.Query();
        query.setCql(`INSERT INTO ${config.KEYSPACE}.topics (game_id, game_num, topic_player_id, svg) VALUES (?, ?, ?, ?)`);
        query.setValues(values);

        grpc.client.executeQuery(query).then((response) => {
            publishGameChange(req.params.id);
            res.status(200).end();
        }).catch((err) => {
            res.status(500).render('error', { message: "Error attempting to update svg on topic", error: err });
        });
    } else {
        res.status(400).render('error', { message: "'svg' not provided", error: new Error("'svg' not provided") })
    }
});

// Add guess
//
// Input: Takes an string with the players guess
//  {
//    "guess": "Wacky Guess"
//  }
router.post('/:id/instances/:num/guesses/:topicPlayerId/guess/:playerId', function(req, res, next) {
    if (req.body.guess) {
        const id = new sg.Value().setString(req.params.id);
        const num = new sg.Value().setInt(req.params.num);
        const playerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(req.params.playerId)));
        const topicPlayerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(req.params.topicPlayerId)));
        const guess = new sg.Value().setString(req.body.guess);

        const values = new sg.Values();
        values.addValues(id);
        values.addValues(num);
        values.addValues(playerId);
        values.addValues(topicPlayerId);
        values.addValues(guess);

        const query = new sg.Query();
        query.setCql(`INSERT INTO ${config.KEYSPACE}.guesses (game_id, game_num, topic_player_id, player_id, guess) VALUES (?, ?, ?, ?, ?)`);
        query.setValues(values);

        grpc.client.executeQuery(query).then((response) => {
            publishGameChange(req.params.id);
            res.status(200).end();
        }).catch((err) => {
            res.status(500).render('error', { message: "Error attempting to add guess", error: err });
        });
    } else {
        res.status(400).render('error', { message: "'guess' not provided", error: new Error("'guess' not provided") })
    }
});

// Vote
// Input: Takes an string with the current player's ID who is voting
//  {
//    "player": "2f516cb5-a357-4b11-b71d-592d5d8fe406"
//  }
router.post('/:id/instances/:num/guesses/:topicPlayerId/vote/:guessPlayerId/', function(req, res, next) {
    if (req.body.player) {
        const id = new sg.Value().setString(req.params.id);
        const num = new sg.Value().setInt(req.params.num);
        const topicPlayerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(req.params.topicPlayerId)));
        const guessPlayerId = new sg.Value().setUuid(new sg.Uuid().setValue(uuid.parse(req.params.guessPlayerId)));

        const values = new sg.Values();
        values.addValues(id);
        values.addValues(num);
        values.addValues(topicPlayerId);
        values.addValues(guessPlayerId);

        const query = new sg.Query();
        query.setCql(`UPDATE ${config.KEYSPACE}.guesses SET votes = votes + {${req.body.player}} WHERE game_id = ? AND game_num = ? AND topic_player_id = ? AND player_id = ?`);
        query.setValues(values);

        grpc.client.executeQuery(query).then((response) => {
            publishGameChange(req.params.id);
            res.status(200).end();
        }).catch((err) => {
            res.status(500).render('error', { message: "Error attempting to add vote", error: err });
        });
    } else {
        res.status(400).render('error', { message: "'player' not provided", error: new Error("'player' not provided") })
    }
});

module.exports = router;