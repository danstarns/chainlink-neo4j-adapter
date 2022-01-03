const express = require("express");
const config = require("./config");
const endpoint = require("./endpoint");

const app = express();
app.use(express.json());
app.post("/", endpoint);

async function listen() {
  await app.listen(config.EA_PORT);
}

module.exports = {
  listen,
  app,
};
