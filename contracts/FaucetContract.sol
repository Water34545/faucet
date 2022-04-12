// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./Owned.sol";
import "./Logger.sol";
import "./IFaucet.sol";

contract Faucet is Owned, Logger, IFaucet {
    uint256 public numberOfFunders;
    mapping(address => bool) public funders;
    mapping(uint256 => address) public lutFunders;

    modifier limitWithdraw(uint256 withdrawAmount) {
        require(
            withdrawAmount <= 100000000000000000,
            "Cannon withdraw more than 0,1 ether"
        );
        _;
    }

    receive() external payable {}

    function emitLog() public pure override returns (bytes32) {
        return "hello world";
    }

    function ransferOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function addFunds() external payable override {
        address funder = msg.sender;
        if (!funders[funder]) {
            uint256 index = numberOfFunders++;
            funders[funder] = true;
            lutFunders[index] = msg.sender;
        }
    }

    function withdraw(uint256 withdrawAmount)
        external
        override
        limitWithdraw(withdrawAmount)
    {
        payable(msg.sender).transfer(withdrawAmount);
    }

    function getFunders() external view returns (address[] memory) {
        address[] memory _funders = new address[](numberOfFunders);

        for (uint256 i = 0; i < numberOfFunders; i++) {
            _funders[i] = lutFunders[i];
        }

        return _funders;
    }

    function getFundertIndex(uint8 index) external view returns (address) {
        return lutFunders[index];
    }
}
