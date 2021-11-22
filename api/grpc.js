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
       game_num int,
       vip uuid, 
       state text, 
       topic_player_id uuid, 
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
       game_num int,
       topic_player_id uuid,
       topic text,
       svg text,
       PRIMARY KEY(game_id, game_num, topic_player_id))`));
  await client.executeQuery(new sg.Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.guesses 
      (game_id text, 
       game_num int,
       topic_player_id uuid,
       player_id uuid,
       guess text,
       votes set<uuid>,
       PRIMARY KEY(game_id, game_num, topic_player_id, player_id))`));
}

async function getGame(gameId) {
  const gameQuery = new sg.Query();
  gameQuery.setCql(`SELECT JSON game_id, game_num, vip, topic_player_id, state FROM ${keyspace}.game WHERE game_id = '${gameId}'`);

  const playerQuery = new sg.Query();
  playerQuery.setCql(`SELECT JSON player_id, name FROM ${keyspace}.players WHERE game_id = '${gameId}'`);

  const gameRes = await client.executeQuery(gameQuery);
  const playerRes = await client.executeQuery(playerQuery);

  if (gameRes.hasResultSet() && gameRes.getResultSet().getRowsList()) {
    const game = JSON.parse(gameRes.getResultSet().getRowsList()[0].getValuesList()[0].getString());
    const gameNum = game.game_num;

    const players = [];
    if (playerRes.hasResultSet() && playerRes.getResultSet().getRowsList()) {
      playerRes.getResultSet().getRowsList().forEach(row => {
        players.push(JSON.parse(row.getValuesList()[0].getString()));
      });
      game.players = players;
    }

    const topicsQuery = new sg.Query();
    topicsQuery.setCql(`SELECT JSON topic_player_id, topic, svg FROM ${keyspace}.topics WHERE game_id = '${gameId}' AND game_num = ${gameNum}`);

    const topicsRes = await client.executeQuery(topicsQuery);

    const topics = [];
    if (topicsRes.hasResultSet() && topicsRes.getResultSet().getRowsList()) {
      topicsRes.getResultSet().getRowsList().forEach(row => {
        topics.push(JSON.parse(row.getValuesList()[0].getString()));
      });
      game.topics = topics;
    }

    const guessesQuery = new sg.Query();
    guessesQuery.setCql(`SELECT JSON topic_player_id, player_id, guess, votes FROM ${keyspace}.guesses WHERE game_id = '${gameId}' AND game_num = ${gameNum}`);

    const guessesRes = await client.executeQuery(guessesQuery);

    const guesses = [];
    if (guessesRes.hasResultSet() && guessesRes.getResultSet().getRowsList()) {
      guessesRes.getResultSet().getRowsList().forEach(row => {
        guesses.push(JSON.parse(row.getValuesList()[0].getString()));
      });
      game.guesses = guesses;
    }

    return game;
  }

  return {};
}

module.exports.createSchema = createSchema;
module.exports.getGame = getGame;
module.exports.client = client;