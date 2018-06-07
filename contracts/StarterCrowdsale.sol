pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution//FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/utils/RefundVault.sol";

/**
 * @title Starter Crowdsale powered by Zeppelin@1.9.0
 */
contract StarterCrowdsale is CappedCrowdsale, FinalizableCrowdsale, MintedCrowdsale, Pausable {

  using SafeMath for uint256;

  // minimum amount of funds to be raised in weis
  uint256 public goal;

  // refund vault used to hold funds while crowdsale is running
  RefundVault public vault;

  uint256 constant CROWDSALE_RATE_WEEK_1 = 2000;
  uint256 constant CROWDSALE_RATE_WEEK_2 = 1800;
  uint256 constant CROWDSALE_RATE_WEEK_3 = 1600;
  uint256 constant CROWDSALE_RATE_WEEK_4 = 1500;


  function StarterCrowdsale(
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    MintableToken _token,
    uint256 _goal
  )
    public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
  {
    //the value has to be less or equal than a cap
    require(_goal <= _cap);
    require(_goal > 0);
    goal = _goal;
    vault = new RefundVault(_wallet);
  }
  
  /**
   * @dev Returns the rate of tokens per wei at the present time.
   * Note that, as price _increases_ with time, the rate _decreases_.
   * @return The number of tokens a buyer gets per wei at a given time
   */
  function getCurrentRate() public view returns (uint256) {
    
    uint256 currentRate = rate;
    
    if (now <= openingTime.add(1 weeks)) {
      // Till 2018-06-15 00:00:00 UTC
      currentRate = CROWDSALE_RATE_WEEK_1;
    } else if (now <= openingTime.add(2 weeks)) {
      currentRate = CROWDSALE_RATE_WEEK_2;
    } else if (now <= openingTime.add(3 weeks)) {
      currentRate = CROWDSALE_RATE_WEEK_3;
    } else if (now <= openingTime.add(4 weeks)) {
      currentRate = CROWDSALE_RATE_WEEK_4;
    }

    return currentRate;
  }
  
  /**
   * @param _weiAmount The value in wei to be converted into tokens
   * @return The number of tokens _weiAmount wei will buy at present time
   */
  function _getTokenAmount(uint256 _weiAmount)
    internal view returns (uint256)
  {
    uint256 currentRate = getCurrentRate();
    return currentRate.mul(_weiAmount);
  }  

  function getAmountOfInvestment() public view returns(uint256) {
      return weiRaised;
  }

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    require(!paused);
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }
  
  // GOAL
  // mapping (address => uint256) public presaleDeposited;
  // presaleDeposit(invester)

  /**
   * @dev Investors can claim refunds here if crowdsale is unsuccessful
   */
  function claimRefund() public {
    require(isFinalized);
    require(!goalReached());

    vault.refund(msg.sender);
  }

  /**
   * @dev Checks whether funding goal was reached.
   * @return Whether funding goal was reached
   */
  function goalReached() public view returns (bool) {
    return weiRaised >= goal;
  }

  /**
   * @dev vault finalization task, called when owner calls finalize()
   */
  function finalization() internal {
    if (goalReached()) {
      vault.close();
    } else {
      vault.enableRefunds();
    }

    super.finalization();
  }

  /**
   * @dev Overrides Crowdsale fund forwarding, sending funds to vault.
   */
  function _forwardFunds() internal {
    vault.deposit.value(msg.value)(msg.sender);
  }
  

}
