var sg = require('@stargate-oss/stargate-grpc-node-client')
var grpc = require('../grpc')
var config = require('../config')
var express = require('express');
var { publishGameChange } = require('../pulsar')

var router = express.Router();

var grpc = require("../grpc")

router.get('/:id', function(req, res, next) {
    grpc.getGame(req.params.id).then(game => {
        res.status(200).write(JSON.stringify(game));
        res.end();
    }).catch(err => {
        res.status(500).render('error', { message: "Error attempting to get game", error: err });
    });
});

router.put('/:id', function(req, res, next) {
    if (req.body.vip) {
        const id = new sg.Value().setString(req.params.id);
        const vip = new sg.Value().setString(req.body.vip);
        const values = new sg.Values();
        values.addValues(id);
        values.addValues(vip);

        const batch = new sg.Batch();

        const insertGame = new sg.Query();
        insertGame.setCql(`INSERT INTO ${config.KEYSPACE}.game (game_id, vip, state) VALUES (?, ?, 'NEW_GAME')`);
        insertGame.setValues(values);
        batch.addQueries(insertGame);

        const insertPlayer = new sg.Query();
        insertPlayer.setCql(`INSERT INTO ${config.KEYSPACE}.players (game_id, player_id, name) VALUES (?, uuid(), ?)`);
        insertPlayer.setValues(values);
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

router.put('/:id/players/:name', function(req, res, next) {
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

module.exports = router;
