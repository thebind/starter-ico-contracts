import ether from '../helpers/ether';
import { advanceBlock } from '../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';
import assertRevert from '../helpers/assertRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// Starter Crowdsale
const StarterCrowdsale = artifacts.require('../contracts/StarterCrowdsale.sol');

// Starter Crowdsale Token
const StarterCrowdsaleToken = artifacts.require(
  '../contracts/StarterCrowdsaleToken.sol'
);

// Starter Savings Wallet
const StarterSavingWallet = artifacts.require(
  '../contracts/StarterSavingsWallet.sol'
);

// RefundVault
const RefundVault = artifacts.require('../contracts/RefundVault.sol');

contract('StarterCrowdsale', function([owner, investor]) {
  const RATE = new BigNumber(10);
  const GOAL = ether(10);
  const CAP = ether(20);

  console.log('owner: ', owner);
  //console.log('wallet: ', wallet);
  console.log('investor: ', investor);

  before(async function() {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function() {
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.heartbeatTimeout = 1000000000000000;

    this.token = await StarterCrowdsaleToken.new({ from: owner });
    this.wallet = await StarterSavingWallet.new(this.heartbeatTimeout, {
      from: owner
    });
    this.vault = await RefundVault.new(this.wallet.address, { from: owner });

    // Crwodsale
    this.crowdsale = await StarterCrowdsale.new(
      this.openingTime,
      this.closingTime,
      RATE,
      this.wallet.address,
      CAP,
      this.token.address,
      GOAL
    );

    // Transfer Ownership from owner address to crowdsale address
    await this.token.transferOwnership(this.crowdsale.address);
    await this.vault.transferOwnership(this.crowdsale.address);
  });

  it('should create crowdsale with correct parameters', async function() {
    this.crowdsale.should.exist;
    this.token.should.exist;

    const openingTime = await this.crowdsale.openingTime();
    const closingTime = await this.crowdsale.closingTime();
    const rate = await this.crowdsale.rate();
    const walletAddress = await this.crowdsale.wallet();
    const goal = await this.crowdsale.goal();
    const cap = await this.crowdsale.cap();

    openingTime.should.be.bignumber.equal(this.openingTime);
    closingTime.should.be.bignumber.equal(this.closingTime);
    rate.should.be.bignumber.equal(RATE);
    walletAddress.should.be.equal(this.wallet.address);
    goal.should.be.bignumber.equal(GOAL);
    cap.should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function() {
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
    await this.crowdsale
      .buyTokens(investor, { from: investor, value: ether(1) })
      .should.be.rejectedWith(EVMRevert);
  });

  // it('should accept payments during the sale', async function() {
  //   const investmentAmount = ether(1);
  //   const expectedTokenAmount = RATE.mul(investmentAmount);

  //   console.log('investmentAmount', investmentAmount.toNumber());
  //   console.log('expectedTokenAmount', expectedTokenAmount.toNumber());

  //   await increaseTimeTo(this.openingTime);
  //   await this.crowdsale.buyTokens(investor, {
  //     value: investmentAmount,
  //     from: investor
  //   }).should.be.fulfilled;

  //   (await this.token.balanceOf(investor)).should.be.bignumber.equal(
  //     expectedTokenAmount
  //   );
  //   (await this.token.totalSupply()).should.be.bignumber.equal(
  //     expectedTokenAmount
  //   );

  //   console.log('investor', investor);
  //   console.log('this.crowdsale.address', this.crowdsale.address);
  //   const deposited = await this.vault.deposited(investor, {
  //     from: this.crowdsale.address
  //   });
  //   console.log('deposited', deposited.toNumber());
  // });

  it('should reject payments after end', async function() {
    await increaseTimeTo(this.afterEnd);
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
    await this.crowdsale
      .buyTokens(investor, { value: ether(1), from: investor })
      .should.be.rejectedWith(EVMRevert);
  });

  it('should reject payments over cap', async function() {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.send(CAP);
    await this.crowdsale.send(1).should.be.rejectedWith(EVMRevert);
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function() {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.send(GOAL);

    const beforeFinalization = web3.eth.getBalance(this.wallet.address);
    console.log('beforeFinalization in wallet', beforeFinalization.toNumber());
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    const afterFinalization = web3.eth.getBalance(this.wallet.address);
    console.log('afterFinalization in wallet', afterFinalization.toNumber());

    afterFinalization.minus(beforeFinalization).should.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function() {
    const balanceBeforeInvestment = web3.eth.getBalance(investor);

    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({
      value: ether(1),
      from: investor,
      gasPrice: 0
    });
    await increaseTimeTo(this.afterClosingTime);

    await this.crowdsale.finalize({ from: owner });
    await this.crowdsale.claimRefund({
      from: investor,
      gasPrice: 0
    }).should.be.fulfilled;

    const balanceAfterRefund = web3.eth.getBalance(investor);
    balanceBeforeInvestment.should.be.bignumber.equal(balanceAfterRefund);
  });

  describe('when goal > cap', function() {
    // goal > cap
    const HIGH_GOAL = ether(30);

    // Presale Investment
    it('creation reverts', async function() {
      await assertRevert(
        StarterCrowdsale.new(
          this.openingTime,
          this.closingTime,
          RATE,
          this.wallet.address,
          CAP,
          this.token.address,
          HIGH_GOAL
        )
      );
    });
  });
});
