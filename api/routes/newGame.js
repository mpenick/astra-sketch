var sg = require('@stargate-oss/stargate-grpc-node-client')
var grpc = require('../grpc')
var config = require('../config')
var express = require('express');
var router = express.Router();

var grpc = require("../grpc")

router.put('/:id', function(req, res, next) {
    if (req.body.vip) {
        id = new sg.Value().setString(req.params.id);
        vip = new sg.Value().setString(req.body.vip);
        var values = new sg.Values();
        values.addValues(id);
        values.addValues(vip);

        var query = new sg.Query();
        query.setCql(`INSERT INTO ${config.KEYSPACE}.game (game_id, vip, state) VALUES (?, ?, 'NEW_GAME')`);
        query.setValues(values);
        grpc.client.executeQuery(query).then((response) => {
            res.status(200);
        }).catch((err) => {
            res.status(500).render('error', { message: "Error attempt to add new game", error: err });
        });

    } else {
        res.status(400).render( 'error', { message: "'vip' not provided", error: new Error("'vip' not provided")})
    }
});

module.exports = router;
