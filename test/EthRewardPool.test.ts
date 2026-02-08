import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

// Fixture to deploy the contract
async function deployEthRewardPoolFixture() {
  const { viem, networkHelpers } = await hre.network.connect();
  const [owner, participant1, participant2, participant3, participant4] =
    await viem.getWalletClients();

  const ethRewardPool = await viem.deployContract("EthRewardPool");
  const publicClient = await viem.getPublicClient();

  return {
    ethRewardPool,
    owner,
    participant1,
    participant2,
    participant3,
    participant4,
    publicClient,
    networkHelpers,
  };
}

describe("EthRewardPool", () => {
  describe("Deployment", () => {
    test("Should set the right owner", async () => {
      const { ethRewardPool, owner } = await deployEthRewardPoolFixture();
      assert.equal(
        await ethRewardPool.read.owner(),
        getAddress(owner.account.address)
      );
    });

    test("Should initialize with roundId 1", async () => {
      const { ethRewardPool } = await deployEthRewardPoolFixture();
      assert.equal(await ethRewardPool.read.roundId(), 1n);
    });

    test("Should set roundStart to deployment time", async () => {
      const { ethRewardPool } = await deployEthRewardPoolFixture();
      const roundStart = await ethRewardPool.read.roundStart();
      assert.ok(roundStart > 0n);
    });

    test("Should emit NewRoundStarted event on deployment", async () => {
      const { ethRewardPool } = await deployEthRewardPoolFixture();
      const logs = await ethRewardPool.getEvents.NewRoundStarted();
      assert.ok(logs.length > 0);
    });
  });

  describe("Joining Pool", () => {
    test("Should allow participant to join with minimum contribution", async () => {
      const { ethRewardPool, participant1 } = await deployEthRewardPoolFixture();
      const minContribution = parseEther("0.000000000000000001");

      await ethRewardPool.write.joinPool({
        value: minContribution,
        account: participant1.account,
      });

      const participants = await ethRewardPool.read.getParticipants();
      assert.equal(participants.length, 1);
    });

    test("Should emit ParticipantJoined event", async () => {
      const { ethRewardPool, participant1, publicClient } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      const hash = await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await ethRewardPool.getEvents.ParticipantJoined();

      assert.equal(events.length, 1);
      assert.equal(events[0].args.participant, getAddress(participant1.account.address));
      assert.equal(events[0].args.amount, amount);
    });

    // test("Should reject contribution below minimum", async () => {
    //   const { ethRewardPool, participant1 } = await deployEthRewardPoolFixture();
    //   const belowMin = 1n; // 1 wei, below minimum

    //   await assert.rejects(
    //     ethRewardPool.write.joinPool({
    //       value: belowMin,
    //       account: participant1.account,
    //     }),
    //     /Minimum contribution/
    //   );
    // });

    test("Should reject if participant already joined", async () => {
      const { ethRewardPool, participant1 } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await assert.rejects(
        ethRewardPool.write.joinPool({
          value: amount,
          account: participant1.account,
        }),
        /Already joined this round/
      );
    });

    test("Should reject joining after round closes", async () => {
      const { ethRewardPool, participant1, networkHelpers } = await deployEthRewardPoolFixture();
      await networkHelpers.time.increase(11 * 60); // 11 minutes
      const amount = parseEther("0.01");

      await assert.rejects(
        ethRewardPool.write.joinPool({
          value: amount,
          account: participant1.account,
        }),
        /Round closed/
      );
    });

    test("Should add participant to the list", async () => {
      const { ethRewardPool, participant1 } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      const participants = await ethRewardPool.read.getParticipants();
      assert.equal(participants.length, 1);
      assert.equal(participants[0], getAddress(participant1.account.address));
    });

    test("Should update pool balance", async () => {
      const { ethRewardPool, participant1 } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      const balance = await ethRewardPool.read.getPoolBalance();
      assert.equal(balance, amount);
    });

    test("Should allow multiple participants to join", async () => {
      const { ethRewardPool, participant1, participant2, participant3 } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant2.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant3.account,
      });

      const participants = await ethRewardPool.read.getParticipants();
      assert.equal(participants.length, 3);

      const balance = await ethRewardPool.read.getPoolBalance();
      assert.equal(balance, parseEther("0.03"));
    });
  });

  describe("Reward Distribution", () => {
    test("Should reject distribution before round ends", async () => {
      const { ethRewardPool, participant1 } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await assert.rejects(
        ethRewardPool.write.distributeReward(),
        /Round not finished/
      );
    });

    test("Should reject distribution with no participants", async () => {
      const { ethRewardPool, networkHelpers } = await deployEthRewardPoolFixture();
      await networkHelpers.time.increase(11 * 60); // Wait for round to end

      await assert.rejects(
        ethRewardPool.write.distributeReward(),
        /No participants/
      );
    });

    test("Should distribute reward to a winner", async () => {
      const { ethRewardPool, participant1, participant2, participant3, publicClient, networkHelpers } =
        await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      // Multiple participants join
      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant2.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant3.account,
      });

      const poolBalanceBefore = await ethRewardPool.read.getPoolBalance();
      assert.equal(poolBalanceBefore, parseEther("0.03"));

      // Get balances before distribution
      const balance1Before = await publicClient.getBalance({
        address: participant1.account.address,
      });
      const balance2Before = await publicClient.getBalance({
        address: participant2.account.address,
      });
      const balance3Before = await publicClient.getBalance({
        address: participant3.account.address,
      });

      // Wait for round to end
      await networkHelpers.time.increase(11 * 60);

      // Distribute reward
      await ethRewardPool.write.distributeReward();

      // Get balances after distribution
      const balance1After = await publicClient.getBalance({
        address: participant1.account.address,
      });
      const balance2After = await publicClient.getBalance({
        address: participant2.account.address,
      });
      const balance3After = await publicClient.getBalance({
        address: participant3.account.address,
      });

      // One of the participants should have received the reward
      const winner1 = balance1After > balance1Before;
      const winner2 = balance2After > balance2Before;
      const winner3 = balance3After > balance3Before;

      assert.ok(winner1 || winner2 || winner3, "One participant should have won");

      // Pool should be empty
      const poolBalanceAfter = await ethRewardPool.read.getPoolBalance();
      assert.equal(poolBalanceAfter, 0n);
    });

    test("Should emit RewardDistributed event", async () => {
      const { ethRewardPool, participant1, publicClient, networkHelpers } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await networkHelpers.time.increase(11 * 60);

      const hash = await ethRewardPool.write.distributeReward();
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await ethRewardPool.getEvents.RewardDistributed();
      assert.equal(events.length, 1);
      assert.equal(events[0].args.amount, amount);
      assert.equal(events[0].args.roundId, 1n);
    });

    test("Should reset participants after distribution", async () => {
      const { ethRewardPool, participant1, participant2, networkHelpers } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant2.account,
      });

      await networkHelpers.time.increase(11 * 60);
      await ethRewardPool.write.distributeReward();

      const participants = await ethRewardPool.read.getParticipants();
      assert.equal(participants.length, 0);
    });

    test("Should start a new round after distribution", async () => {
      const { ethRewardPool, participant1, publicClient, networkHelpers } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      const roundIdBefore = await ethRewardPool.read.roundId();

      await networkHelpers.time.increase(11 * 60);
      const hash = await ethRewardPool.write.distributeReward();
      await publicClient.waitForTransactionReceipt({ hash });

      const roundIdAfter = await ethRewardPool.read.roundId();
      assert.equal(roundIdAfter, roundIdBefore + 1n);
    });
  });

  describe("View Functions", () => {
    test("Should return correct participants list", async () => {
      const { ethRewardPool, participant1, participant2 } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant2.account,
      });

      const participants = await ethRewardPool.read.getParticipants();
      assert.equal(participants.length, 2);
      assert.equal(participants[0], getAddress(participant1.account.address));
      assert.equal(participants[1], getAddress(participant2.account.address));
    });

    test("Should return correct pool balance", async () => {
      const { ethRewardPool, participant1, participant2 } = await deployEthRewardPoolFixture();
      const amount1 = parseEther("0.01");
      const amount2 = parseEther("0.02");

      await ethRewardPool.write.joinPool({
        value: amount1,
        account: participant1.account,
      });

      await ethRewardPool.write.joinPool({
        value: amount2,
        account: participant2.account,
      });

      const balance = await ethRewardPool.read.getPoolBalance();
      assert.equal(balance, parseEther("0.03"));
    });

    test("Should return correct reward recipient for past rounds", async () => {
      const { ethRewardPool, participant1, networkHelpers } = await deployEthRewardPoolFixture();
      const amount = parseEther("0.01");

      await ethRewardPool.write.joinPool({
        value: amount,
        account: participant1.account,
      });

      await networkHelpers.time.increase(11 * 60);
      await ethRewardPool.write.distributeReward();

      const recipient = await ethRewardPool.read.getRewardRecipient([1n]);
      assert.equal(recipient, getAddress(participant1.account.address));
    });
  });
});
