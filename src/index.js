const app = require("./app");

async function main() {
  console.log("Starting");

  await app.listen();

  console.log("Started");
}

main();
