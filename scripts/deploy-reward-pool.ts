import hre from "hardhat";

async function main() {
  console.log("Deploying EthRewardPool contract...");

  const { viem } = await hre.network.connect();
  
  // Deploy the contract
  const ethRewardPool = await viem.deployContract("EthRewardPool");
  
  console.log("\n✅ EthRewardPool deployed successfully!");
  console.log("📍 Contract Address:", ethRewardPool.address);
  
  // Get initial contract state
  const roundId = await ethRewardPool.read.roundId();
  const roundStart = await ethRewardPool.read.roundStart();
  const owner = await ethRewardPool.read.owner();

  // ROUND_DURATION is a constant (10 minutes)
  const ROUND_DURATION = 10 * 60; // 10 minutes in seconds

  console.log("\n📊 Initial Contract State:");
  console.log("   Round ID:", roundId.toString());
  console.log("   Round Start:", new Date(Number(roundStart) * 1000).toLocaleString());
  console.log("   Round Duration:", ROUND_DURATION / 60, "minutes");
  console.log("   Owner:", owner);
  
  console.log("\n🔧 Next Steps:");
  console.log("1. Update the contract address in frontend/src/contracts/EthRewardPool.ts");
  console.log(`   export const ETH_REWARD_POOL_ADDRESS = '${ethRewardPool.address}' as const;`);
  console.log("\n2. Start the frontend:");
  console.log("   cd frontend");
  console.log("   npm install");
  console.log("   npm run dev");
  
  return ethRewardPool.address;
}

main()
  .then((address) => {
    console.log("\n✨ Deployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

