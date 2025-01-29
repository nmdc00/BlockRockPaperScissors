const fs = require("fs");
const path = require("path");
const { artifacts } = require("hardhat");

async function main() {
  const artifact = await artifacts.readArtifact("RockPaperScissors");
  const abiPath = path.resolve(__dirname, "/home/nuno/rps_dapp/app/javascript/contractABI.json");

  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log(`ABI saved to ${abiPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
