import test from "node:test";
import assert from "node:assert/strict";

import { buildReferralNotification } from "./referralNotifications.mjs";


test("returns null when there are no unseen referrals", () => {
  assert.equal(buildReferralNotification({ unseen: { count: 0, diamonds: 0 } }), null);
  assert.equal(buildReferralNotification(null), null);
});

test("builds a single referral diamond notification", () => {
  assert.deepEqual(
    buildReferralNotification({
      unseen: { count: 1, diamonds: 0, crossed_milestone: false },
      milestone: { reward_points: 50 },
    }),
    { count: 1, diamonds: 0, crossedMilestone: false, rewardPoints: 0, reward: null },
  );
});

test("aggregates several unseen referrals into one notification", () => {
  const result = buildReferralNotification({
    unseen: { count: 3, diamonds: 50, crossed_milestone: true },
    milestone: { reward_points: 50, target: 3 },
  });

  assert.equal(result.count, 3);
  assert.equal(result.diamonds, 50);
  assert.equal(result.crossedMilestone, true);
  assert.equal(result.rewardPoints, 50);
  assert.equal(result.reward, null);
});

test("marks milestone without attaching discount-code reward", () => {
  const result = buildReferralNotification({
    unseen: { count: 1, diamonds: 50, crossed_milestone: true },
    milestone: {
      reward_points: 50,
      rewards: [{ code: "GIFT-OLD", amount: 150000, active: true, used_count: 0 }],
    },
  });

  assert.equal(result.crossedMilestone, true);
  assert.equal(result.rewardPoints, 50);
  assert.equal(result.reward, null);
});
