const Redis = require("redis");

const client = Redis.createClient({
  url: "redis://localhost:6379"
});

client.connect();

module.exports = client;
