var WebSocketClient = require('websocket').client;
var grpc = require('./grpc');
var config = require('./config');

const authHeader = 'Bearer ' + config.ASTRA_STREAMING_TOKEN;

const consumer = new WebSocketClient();

const subscribers = {};

consumer.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

consumer.on('connect', function (connection) {
    console.log('Consumer Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        console.log('Consumer Connection Closed');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            const msg = JSON.parse(message.utf8Data)
            try {
                const gameId = Buffer.from(msg.payload, 'base64');
                console.log("Received: '" + gameId + "'");
                grpc.getGame(gameId).then(game => {
                    const gameJson = JSON.stringify(game);
                    const listeners = subscribers[gameId];
                    if (listeners) {
                        listeners.forEach(res => {
                            try {
                                res.write(`data: ${gameJson}\n\n`);
                            } catch (e) {
                                console.log(`Failed to write ${gameId} to a client`);
                            }
                        });
                    }
                });
            } catch(e) {
                console.log("Failed to handle message %s", e);
            } finally {
                connection.sendUTF(JSON.stringify({messageId: msg.messageId}))
            }
        }
    });
});

consumer.connect(config.ASTRA_STREAMING_TOPIC, null, null, { "Authorization": authHeader });

function publishGameChange(gameId) {
    const publisher = new WebSocketClient();
    publisher.connect(config.ASTRA_STREAMING_TOPIC_PUB, null, null, { "Authorization": authHeader });
    publisher.on('connect', function (connection) {
        console.log('Publisher Connected');
        connection.on('error', function (error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function () {
            console.log('Publisher Connection Closed');
        });
        connection.sendUTF(JSON.stringify({payload: Buffer.from(gameId).toString('base64')}));
        connection.close();
    });
}

function subscribe(gameId, res) {
    if (subscribers[gameId]) {
        subscribers[gameId].push(res);
    } else {
        subscribers[gameId] = [res];
    }
}

function unsubscribe(gameId, res) {
    if (subscribers[gameId]) {
        var i = subscribers[gameId].indexOf(res);
        if (i >= 0) {
            subscribers[gameId].splice(i, 1);
        }
    }
}

module.exports.subscribe = subscribe;
module.exports.unsubscribe = unsubscribe;
module.exports.publishGameChange = publishGameChange;