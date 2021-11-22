var express = require('express');
var config = require('../config');

const { subscribe, unsubscribe } = require('../pulsar');

var router = express.Router();

router.get('/:gameId', function (req, res, next) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const gameId = req.params.gameId;

    subscribe(gameId, res);

    // If client closes connection, stop sending events
    res.on('close', () => {
        unsubscribe(gameId, res);
        res.end();
    });
});

module.exports = router;
