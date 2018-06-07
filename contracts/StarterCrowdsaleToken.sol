pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";


/**
 * @title StarterCrowdsaleToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a crowdsale contract.
 */
contract StarterCrowdsaleToken is MintableToken {

    string public constant name = "Starter Crowdsale Token";
    string public constant symbol = "STR";
    uint8 public constant decimals = 18;

}
