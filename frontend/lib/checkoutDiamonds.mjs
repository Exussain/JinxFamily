export function nextDiamondUse(currentUse, balance, cap) {
  if (Number(currentUse) > 0) return 0;
  return Math.max(0, Math.min(Number(balance) || 0, Number(cap) || 0));
}

export function discountMessageAfterDiamondToggle(messageKind, currentMessage) {
  return messageKind === 'error' ? '' : currentMessage;
}
