function getLongestActorName() public onlyOwner returns (bytes32 requestId) {
    string memory query = "MATCH (m:Movie)"
    "WITH collect(n.name) as list"
    "RETURN { longest: heat(list) }";

    Chainlink.Request memory req = buildChainlinkRequest(
        SPEC_ID,
        this,
        this.fulfill.selector
    );

    req.add("query", query);

    return sendChainlinkRequest(req, oraclePayment);
}
