var WebSocketClient = require('websocket').client;
var config = require('./config');

const authHeader = 'Bearer ' + config.ASTRA_STREAMING_TOKEN;

const client = new WebSocketClient();

const subscribers = {};

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            const msg = JSON.parse(message.utf8Data)
            try {
                const gameId = Buffer.from(msg.payload, 'base64');
                const listeners = subscribers[gameId];
                if (listeners) {
                    listeners.forEach(res => {
                        try {
                            res.write(`data: ${gameId}\n\n`);
                        } catch(e) {
                            console.log(`Failed to write ${gameId} to a client`);
                        }
                    });
                }
                console.log("Received: '" + gameId + "'");
            } catch(e) {
                console.log("Failed to handle message %s", e);
            } finally {
                connection.sendUTF(JSON.stringify({messageId: msg.messageId}))
            }
        }
    });
});

client.connect(config.ASTRA_STREAMING_TOPIC, null, null, { "Authorization": authHeader });

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