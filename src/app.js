const express = require("express");
const bodyParser = require("body-parser");
const config = require("./config");
const endpoint = require("./endpoint");

const app = express();
app.use(bodyParser.json());
app.post("/", endpoint);

async function listen() {
  await app.listen(config.EA_PORT);
}

module.exports = {
  listen,
  app,
};
