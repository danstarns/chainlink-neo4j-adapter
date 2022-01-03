const {
  EA_PORT = "8080",
  NEO4J_HTTP_URL = "neo4j://localhost:7474",
  NEO4J_USER = "admin",
  NEO4J_PASSWORD = "password",
  NEO4J_DB = "neo4j",
} = process.env;

module.exports = {
  EA_PORT,
  NEO4J_HTTP_URL,
  NEO4J_USER,
  NEO4J_PASSWORD,
  NEO4J_DB,
};
