# chainlink-neo4j-adapter

This contains an [external-adapter](https://docs.chain.link/docs/external-adapters/) for the [Neo4j Database](https://neo4j.com/). Host the adapter on your [Chainlink Node](https://docs.chain.link/docs/running-a-chainlink-node/) and query it using [Solidity](https://docs.soliditylang.org/en/v0.8.11/):

```solidity
public longestMovieTitle bytes32;

function getLongestMovieTitle() public onlyOwner returns (bytes32 requestId) {
    string memory query = "MATCH (m:Movie)"
                          "WITH collect(m.title) as list"
                          "RETURN { longest: head(list) }";

    Chainlink.Request memory req = buildChainlinkRequest(
        SPEC_ID,
        this,
        this.fulfill.selector
    );

    req.add("query", query);

    return sendChainlinkRequest(req, oraclePayment);
}


function fulfill(bytes32 requestId, bytes32 response)
    public
    recordChainlinkFulfillment(requestId)
{
    longestMovieTitle = response;
}
```

## Getting Started

### Dependencies And Docker

1. [Chainlink Node](https://docs.chain.link/docs/running-a-chainlink-node/)
   1. [Postgres Database](https://www.postgresql.org/)
2. [Running Adapter](#starting_the_adapter)
   1. [Neo4j Database](https://neo4j.com/)

You can use the docker-compose, in this repo, to setup all dependencies. Firstly you will need to copy the `./.env.example` file to `./.env` and adjust some required configuration:

1. `LINK_CONTRACT_ADDRESS` - The contract address where the LINK token lives.
2. `ETH_CHAIN_ID` - What chain are you on
3. `ETH_URL` - The web socket url to your Ethereum node for example `wss://rinkeby.infura.io/ws/v3/KEY_HERE`

Then you can run:

```
docker-compose up
```

Now you can skip to [Adding Bridge To Chainlink Node](#Adding_Bridge_To_Chainlink_Node)

### Starting The Adapter

You will need to have your [Neo4j Database](https://neo4j.com/) running at this point, then you should serve this adapter over HTTP. Clone the repo:

```
git clone https://github.com/danstarns/chainlink-neo4j-adapter.git
```

and then enter and run:

```
npm install
```

The adapter relies on the environment variables:

1. `EA_PORT`
2. `NEO4J_HTTP_URL`
3. `NEO4J_USER`
4. `NEO4J_PASSWORD`
5. `NEO4J_DB`

To run:

```
npm start
```

### Adding Bridge To Chainlink Node

You will need to have your [Chainlink Node](https://docs.chain.link/docs/running-a-chainlink-node/) running at this point, assuming you use the default config provided navigate to your Chainlink Operator, usually at http://localhost:6688, and login with the credentials:

1. email: admin@admin.com
2. password: password

![chainlink-operator](./docs/img/chainlink-operator.png)

Once logged in you can now navigate to the `/bridges` page and add a bridge talking to your running adapter.

1. Bridge Name: neo4j
2. Bridge URL `http://adapter:8080`

![create-bridge](./docs/img/create-bridge.png)

### Adding Job To Chainlink Node

```toml
JOB HERE
```

### Deploying Your Oracle

TODO

### Funding Addresses

TODO

### Preforming The Request

TODO

## License

MIT
