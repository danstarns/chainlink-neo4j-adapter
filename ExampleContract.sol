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
        string memory query = "MATCH (m:Movie) "
        "WITH m AS m "
        "ORDER BY size(m.title) DESC "
        "WITH collect(m.title) as list "
        "RETURN { result: head(list) }";

        Chainlink.Request memory req = buildChainlinkRequest(
            stringToBytes32(jobId),
            address(this),
            this.fulfill.selector
        );

        req.add("query", query);

        bytes32 requestId = sendChainlinkRequestTo(oracle, req, ORACLE_PAYMENT);
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
