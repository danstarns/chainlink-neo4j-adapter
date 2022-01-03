# chainlink-neo4j-adapter

This contains an [external-adapter](https://docs.chain.link/docs/external-adapters/) for the [Neo4j Database](https://neo4j.com/). Host the adapter on your [Chainlink Node](https://docs.chain.link/docs/running-a-chainlink-node/) and query it using [Solidity](https://docs.soliditylang.org/en/v0.8.11/):

```solidity
using Chainlink for Chainlink.Request;

bytes32 public longestMovieTitle;

uint256 private constant ORACLE_PAYMENT = 1 * LINK_DIVISIBILITY;

function getLongestMovieTitle(address oracle, string memory jobId) public {
    string memory query = "MATCH (m:Movie)"
    "WITH collect(m.title) as list"
    "RETURN { result: head(list) }";

    Chainlink.Request memory req = buildChainlinkRequest(
        stringToBytes32(jobId),
        this,
        this.fulfill.selector
    );

    req.add("query", query);

    return sendChainlinkRequest(req, ORACLE_PAYMENT);
}

function fulfill(bytes32 requestId, bytes32 answer)
    public
    recordChainlinkFulfillment(requestId)
{
    longestMovieTitle = answer;
}
```

## Getting Started

Clone this repo:

```
git clone https://github.com/danstarns/chainlink-neo4j-adapter.git
```

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

You will need to have your [Neo4j Database](https://neo4j.com/) running at this point, then you should serve this adapter over HTTP, to do this run:

```
npm install
```

The adapter relies on the environment variables:

1. `EA_PORT` - HTTP port to server adapter on
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

### Deploying Your Oracle

The Oracle will be a smart contract deployed to the blockchain and serve as an interface between our custom smart contract and thru our Chainlink Node and to this Adapter. Follow [this](https://docs.chain.link/docs/fulfilling-requests/#deploy-your-own-oracle-contract) tutorial and come back with the address of your deployed oracle.

### Adding Job To Chainlink Node

For the purpose of the rest of this documentation we shall use the example of getting the longest title along Movie nodes. For this you should copy the toml below and add it as a job:

> Change `YOUR_ORACLE_ADDRESS` to the address of the deployed oracle contract

```toml
type = "directrequest"
schemaVersion = 1
name = "select"
contractAddress = "YOUR_ORACLE_ADDRESS"
maxTaskDuration = "0s"
observationSource = """
    decode_log   [type="ethabidecodelog"
                  abi="OracleRequest(bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)"
                  data="$(jobRun.logData)"
                  topics="$(jobRun.logTopics)"]
    decode_cbor  [type="cborparse" data="$(decode_log.data)"]

    adapter  [type="bridge" name="neo4j" requestData="{\\"id\\": $(jobSpec.externalJobID), \\"data\\":{\\"query\\": $(decode_cbor.query)}}"]
    jsondecode [type="jsonparse" data="$(adapter)" path="data,result,result"]
    encode_data  [type="ethabiencode" abi="(bytes32 value)" data="{ \\"value\\": $(jsondecode) }"]

    encode_tx    [type="ethabiencode"
                  abi="fulfillOracleRequest(bytes32 requestId, uint256 payment, address callbackAddress, bytes4 callbackFunctionId, uint256 expiration, bytes32 data)"
                  data="{\\"requestId\\": $(decode_log.requestId), \\"payment\\": $(decode_log.payment), \\"callbackAddress\\": $(decode_log.callbackAddr), \\"callbackFunctionId\\": $(decode_log.callbackFunctionId), \\"expiration\\": $(decode_log.cancelExpiration), \\"data\\": $(encode_data)}"
                 ]

    submit_tx [type="ethtx" to="YOUR_ORACLE_ADDRESS" data="$(encode_tx)"]

    decode_log -> decode_cbor -> adapter -> jsondecode -> encode_data -> encode_tx -> submit_tx
"""
```

![create-job](./docs/img/create-job.png)

### Deploying Contract

Using the remix tab you used in 'Deploying Your Oracle' [here](https://docs.chain.link/docs/fulfilling-requests/#deploy-your-own-oracle-contract) create a new file called `MyContract.sol` and paste in the Solidity:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract ExampleContract is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    bytes32 public longestMovieTitle;

    uint256 private constant ORACLE_PAYMENT = 1 * LINK_DIVISIBILITY;

    constructor(address link) {
        setChainlinkToken(link);
    }

    fallback() external payable {}

    receive() external payable {}

    function getLongestMovieTitle(address oracle, string memory jobId) public {
        string memory query = "MATCH (m:Movie)"
        "WITH collect(m.title) as list"
        "RETURN { result: head(list) }";

        Chainlink.Request memory req = buildChainlinkRequest(
            stringToBytes32(jobId),
            this,
            this.fulfill.selector
        );

        req.add("query", query);

        return sendChainlinkRequest(req, ORACLE_PAYMENT);
    }

    function fulfill(bytes32 requestId, bytes32 answer)
        public
        recordChainlinkFulfillment(requestId)
    {
        longestMovieTitle = answer;
    }

    function stringToBytes32(string memory source)
        private
        pure
        returns (bytes32 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            // solhint-disable-line no-inline-assembly
            result := mload(add(source, 32))
        }
    }
}
```

Compile this and then deploy it to your chosen network.

### Funding Addresses

Use the faucet to fund your Chainlink Node, Oracle and Example Contract.

Request testnet LINK and ETH here: https://faucets.chain.link/

### Seeding Neo4j

Navigate to http://localhost:7474/browser/ login and then run the seed:

```gql
CREATE (:Movie {title: "The Matrix"})
CREATE (:Movie {title: "The Matrix Reloaded"})
CREATE (:Movie {title: "Forrest Gump"})
```

### Preforming The Request

The request happens here in `ExampleContract.sol`:

```solidity
function getLongestMovieTitle(address oracle, string memory jobId) public {
    string memory query = "MATCH (m:Movie)"
    "WITH collect(m.title) as list"
    "RETURN { result: head(list) }";

    Chainlink.Request memory req = buildChainlinkRequest(
        stringToBytes32(jobId),
        this,
        this.fulfill.selector
    );

    req.add("query", query);

    return sendChainlinkRequest(req, ORACLE_PAYMENT);
}
```

Use the remix tab to interact with this function, evoke it with your Oracle address and Job id(auto created check jobs page).
Wait some time until all the transactions have happened and check the contracts `longestMovieTitle` property.

## License

MIT
