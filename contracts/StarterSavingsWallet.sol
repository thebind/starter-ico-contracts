pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Heritable.sol";

/**
 * @title StarterSavingsWallet
 */
contract StarterSavingsWallet is Heritable {

  event Sent(address indexed payee, uint256 amount, uint256 balance);
  event Received(address indexed payer, uint256 amount, uint256 balance);


  function StarterSavingsWallet(uint256 _heartbeatTimeout) Heritable(_heartbeatTimeout) public {}

  /**
   * @dev wallet can receive funds.
   */
  function () public payable {
    emit Received(msg.sender, msg.value, address(this).balance);
  }

  /**
   * @dev wallet can send funds
   */
  function sendTo(address payee, uint256 amount) public onlyOwner {
    require(payee != 0 && payee != address(this));
    require(amount > 0);
    payee.transfer(amount);
    emit Sent(payee, amount, address(this).balance);
  }
}
