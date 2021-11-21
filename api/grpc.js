var grpc = require('@grpc/grpc-js')
var sg = require("@stargate-oss/stargate-grpc-node-client")
var config = require("./config");

const keyspace = config.KEYSPACE;

const bearerToken = new sg.StargateBearerToken(config.ASTRA_TOKEN);
const credentials = grpc.credentials.combineChannelCredentials(
  grpc.credentials.createSsl(), bearerToken);

// For Astra DB: passing the credentials created above
const stargateClient = new sg.StargateClient(config.ASTRA_URI, credentials);

// Create a promisified version of the client, so we don't need to use callbacks
const client = sg.promisifyStargateClient(stargateClient);

async function createSchema() {
  await client.executeQuery(new sg.Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.game 
      (game_id text, 
       vip text, 
       state text, 
       topic text, 
       PRIMARY KEY(game_id))`));
  await client.executeQuery(new sg.Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.players 
      (game_id text, 
       player_id uuid,
       name text, 
       PRIMARY KEY(game_id, player_id))`));
  await client.executeQuery(new sg.Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.topics 
      (game_id text, 
       player_id uuid,
       topic text,
       svg text, 
       PRIMARY KEY(game_id, player_id, topic))`));
  await client.executeQuery(new sg.Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.guesses 
      (game_id text, 
       player_id uuid,
       topic text,
       guess text,
       votes list<text>,
       PRIMARY KEY(game_id, player_id, topic))`));
}

async function getGame(gameId) {
  const gameQuery = new sg.Query();
  gameQuery.setCql(`SELECT JSON * FROM ${keyspace}.game WHERE game_id = '${gameId}'`);

  const playerQuery = new sg.Query();
  playerQuery.setCql(`SELECT JSON player_id, name FROM ${keyspace}.players WHERE game_id = '${gameId}'`);

  const gameRes = await client.executeQuery(gameQuery);
  const playerRes = await client.executeQuery(playerQuery);

  if (gameRes.hasResultSet() && gameRes.getResultSet().getRowsList()) {
    const game = JSON.parse(gameRes.getResultSet().getRowsList()[0].getValuesList()[0].getString());

    const players = [];
    if (playerRes.hasResultSet() && playerRes.getResultSet().getRowsList()) {
      playerRes.getResultSet().getRowsList().forEach(row => {
        players.push(JSON.parse(row.getValuesList()[0].getString()));
      });
      game.players = players;
    }

    return game;
  }

  return {};
}

module.exports.createSchema = createSchema;
module.exports.getGame = getGame;
module.exports.client = client;