const {
  EA_PORT = "8080",
  NEO4J_HTTP_URL = "http://localhost:7474/",
  NEO4J_BOLT_URL = "bolt://localhost:7687",
  NEO4J_USER = "neo4j",
  NEO4J_PASSWORD = "test",
  NEO4J_DB = "neo4j",
} = process.env;

module.exports = {
  EA_PORT,
  NEO4J_HTTP_URL,
  NEO4J_BOLT_URL,
  NEO4J_USER,
  NEO4J_PASSWORD,
  NEO4J_DB,
};
