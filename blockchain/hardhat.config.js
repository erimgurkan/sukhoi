require('@nomicfoundation/hardhat-toolbox');

const MNEMONIC = process.env.MNEMONIC || 'test test test test test test test test test test test junk';

module.exports = {
  solidity: '0.8.24',
  networks: {
    hardhat: {
      chainId: 19735,
      mining: {
        auto: true
      },
      accounts: {
        mnemonic: MNEMONIC,
        accountsBalance: '10000000000000000000000'
      }
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 19735
    }
  }
};
