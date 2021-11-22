function envVarNotFound(name) {
  console.error(name + " environment variable required, but not found");
  process.exit(1);
}

const astraUri = process.env.ASTRA_URI || envVarNotFound("ASTRA_URI");
const astraToken = process.env.ASTRA_TOKEN || envVarNotFound("ASTRA_TOKEN");
const keyspace = process.env.KEYSPACE || "sketch";

const astraStreamingTopic = process.env.ASTRA_STREAMING_TOPIC || envVarNotFound("ASTRA_STREAMING_TOPIC");
const astraStreamingTopicPub = process.env.ASTRA_STREAMING_TOPIC_PUB || envVarNotFound("ASTRA_STREAMING_TOPIC_PUB");
const astraStreamingToken = process.env.ASTRA_STREAMING_TOKEN || envVarNotFound("ASTRA_STREAMING_TOKEN");

module.exports = {
    ASTRA_URI: astraUri,
    ASTRA_TOKEN: astraToken,
    KEYSPACE: keyspace,
    ASTRA_STREAMING_TOPIC: astraStreamingTopic,
    ASTRA_STREAMING_TOPIC_PUB: astraStreamingTopicPub,
    ASTRA_STREAMING_TOKEN: astraStreamingToken,
};
