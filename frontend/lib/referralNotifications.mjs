export function buildReferralNotification(payload) {
  const count = Math.max(0, Math.trunc(Number(payload?.unseen?.count) || 0));
  if (count === 0) return null;

  const diamonds = Math.max(0, Math.trunc(Number(payload?.unseen?.diamonds) || 0));
  const crossedMilestone = payload?.unseen?.crossed_milestone === true;
  const rewardPoints = Math.max(
    0,
    Math.trunc(Number(payload?.milestone?.reward_points) || 0),
  );

  return {
    count,
    diamonds,
    crossedMilestone,
    rewardPoints: crossedMilestone ? rewardPoints : 0,
    reward: null,
  };
}
