const request = require("supertest");
const { app } = require("../../src/app");
const { generate } = require("randomstring");
const { driver } = require("./neo4j");

describe("endpoint", () => {
  test("should throw that no query was provided", async () => {
    const res = await request(app).post("/").send({});

    expect(res.status).toEqual(500);
  });

  test("should perform query and return correct data", async () => {
    const session = driver.session();

    const testId = generate({
      charset: "alphabetic",
    });

    const query = `
        MATCH (m:Movie)
        WHERE m.testId = "${testId}"
        WITH m AS m
        ORDER BY size(m.title) DESC
        WITH collect(m.title) as list
        RETURN { result: head(list) }
    `;

    const payload = {
      data: {
        query,
      },
    };

    try {
      await session.run(`
            CREATE (:Movie {testId: "${testId}", title: "The Matrix"})
            CREATE (:Movie {testId: "${testId}", title: "The Matrix Reloaded"})
            CREATE (:Movie {testId: "${testId}", title: "Forrest Gump"})
        `);

      const res = await request(app).post("/").send(payload);

      expect(res.status).toEqual(200);
      expect(res.body.result.result).toEqual("The Matrix Reloaded");
    } finally {
      await session.close();
    }
  });
});
