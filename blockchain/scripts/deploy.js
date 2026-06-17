const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  const SukhoiToken = await hre.ethers.getContractFactory('SukhoiToken');
  const token = await SukhoiToken.deploy(deployer.address);
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log('SukhoiToken deployed to:', tokenAddress);

  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const deployerBalance = await token.balanceOf(deployer.address);
  const contractBalance = await token.balanceOf(tokenAddress);

  console.log('Token Name:', name);
  console.log('Token Symbol:', symbol);
  console.log('Total Supply:', hre.ethers.formatUnits(totalSupply, 18), symbol);
  console.log('Deployer Balance:', hre.ethers.formatUnits(deployerBalance, 18), symbol);
  console.log('Contract Reserve:', hre.ethers.formatUnits(contractBalance, 18), symbol);

  const network = await hre.ethers.provider.getNetwork();
  const block = await hre.ethers.provider.getBlock('latest');

  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'SukhoiToken.sol', 'SukhoiToken.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const deploymentInfo = {
    address: tokenAddress,
    deployer: deployer.address,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    blockNumber: block.number,
    abi: artifact.abi
  };

  const deploymentsPath = path.join(__dirname, '..', '..', 'deployments.json');
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to:', deploymentsPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
