var grpc = require('@grpc/grpc-js')
var sg = require("@stargate-oss/stargate-grpc-node-client")
var config = require("./config")

const bearerToken = new sg.StargateBearerToken(config.ASTRA_TOKEN);
const credentials = grpc.credentials.combineChannelCredentials(
  grpc.credentials.createSsl(), bearerToken);

// For Astra DB: passing the credentials created above
const stargateClient = new sg.StargateClient(config.ASTRA_URI, credentials);

// Create a promisified version of the client, so we don't need to use callbacks
const client = sg.promisifyStargateClient(stargateClient);

exports.client = client;