require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const infuraProvider = new HDWalletProvider(
  process.env.MNEMONIC,
  process.env.INFURA_API_KEY
);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    rinkebyInfura: {
      provider: infuraProvider,
      network_id: 4,
      gas: 4698712
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      host: 'localhost',
      port: 8545,
      network_id: 4,
      gas: 4700000
    }
  }
};
