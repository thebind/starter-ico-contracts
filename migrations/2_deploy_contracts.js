var StarterCrowdsaleToken = artifacts.require('StarterCrowdsaleToken.sol');
var StarterCrowdsale = artifacts.require('StarterCrowdsale.sol');
var StarterSavingsWallet = artifacts.require('StarterSavingsWallet.sol');
var RefundVault = artifacts.require('RefundVault.sol');

module.exports = function(deployer, network, accounts) {
  //    return DeployTestCrowdSale(deployer, accounts);
  return liveDeploy(deployer, accounts);
};

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}

function ether(n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

const duration = {
  seconds: function(val) {
    return val;
  },
  minutes: function(val) {
    return val * this.seconds(60);
  },
  hours: function(val) {
    return val * this.minutes(60);
  },
  days: function(val) {
    return val * this.hours(24);
  },
  weeks: function(val) {
    return val * this.days(7);
  },
  years: function(val) {
    return val * this.days(365);
  }
};

async function liveDeploy(deployer, accounts) {
  const BigNumber = web3.BigNumber;
  const openingTime = latestTime() + duration.minutes(30);
  const closingTime = openingTime + duration.years(1);
  const RATE = new BigNumber(1); // 1: 1eth = 1Token
  const CAP = ether(5);
  const GOAL = ether(3);

  const heartbeatTimeout = 3153600000000; // 1000 Year

  let token;
  let wallet;
  let crowdsale;
  let vault;

  await deployer.deploy(StarterCrowdsaleToken).then(function() {
    token = StarterCrowdsaleToken;
  });

  console.log('token address: ', token.address);

  await deployer
    .deploy(StarterSavingsWallet, heartbeatTimeout)
    .then(function() {
      wallet = StarterSavingsWallet;
    });

  console.log('wallet address: ', wallet.address);

  await deployer.deploy(RefundVault, wallet.address).then(function() {
    vault = RefundVault;
  });

  console.log(vault.address);

  await deployer
    .deploy(
      StarterCrowdsale,
      openingTime,
      closingTime,
      RATE.toNumber(),
      wallet.address,
      CAP.toNumber(),
      token.address,
      GOAL.toNumber()
    )
    .then(function() {
      crowdsale = StarterCrowdsale;
    });

  console.log(crowdsale.address);

  // Transfer Ownership from owner address to crowdsale address
  await deployer.then(function() {
    token
      .deployed()
      .then(instance => instance.transferOwnership(crowdsale.address));
  });

  await deployer.then(function() {
    vault
      .deployed()
      .then(instance => instance.transferOwnership(crowdsale.address));
  });
}
