const { Requester } = require("@chainlink/external-adapter");
const config = require("./config");

const authToken = Buffer.from(
  `${config.NEO4J_USER}:${config.NEO4J_PASSWORD}`
).toString("base64");

async function endpoint(req, res) {
  const jobRunID = req.body.id || "1";
  const query = req?.body?.data?.query;

  if (typeof query !== "string") {
    const error = new Error("query required");
    return res.status(500).send(Requester.errored(jobRunID, error));
  }

  try {
    const neo4jResponse = await Requester.request({
      baseURL: config.NEO4J_HTTP_URL,
      url: `/db/${config.NEO4J_DB}/tx/commit`,
      method: "POST",
      data: {
        statements: [{ statement: query }],
      },
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (neo4jResponse.data.errors?.length) {
      throw new Error(
        neo4jResponse.data.errors
          .map((e) => `${e.code}:${e.message}`)
          .join("\n")
      );
    }

    /* 
     Not designed to return lots of rows but a single row with key and values.
     This is because a smart contract is expecting the fulfill function -
      - to be called back with a single value.
     You should use the jsondecode job step to destruct the particular value this endpoint should return.
     Examples would be:
      VALID:
          MATCH (m:Movie)
          WITH m AS m
          ORDER BY size(m.title) DESC
          WITH collect(m.title) as list
          RETURN { result: head(list) }
      INVALID
          MATCH (a)
          RETURN a
      INVALID
          RETURN rand()
    */
    const formattedResponse = neo4jResponse.data.results[0].data[0].row[0];

    const response = {
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
      data: {
        result: formattedResponse,
      },
    };

    res.status(200).json(Requester.success(jobRunID, response));
  } catch (e) {
    res.status(500).json(Requester.errored(jobRunID, e));
  }
}

module.exports = endpoint;
