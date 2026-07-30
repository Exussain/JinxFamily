const messageMatches = (left, right) => (
  left.sender === right.sender &&
  left.message_type === right.message_type &&
  (left.text || '') === (right.text || '') &&
  (left.file_url || '') === (right.file_url || '')
);

export const mergeServerMessages = (current, incoming) => {
  if (!incoming?.length) return current;
  const incomingIds = new Set(incoming.map(message => message.id));
  const retained = current.filter(message => {
    if (incomingIds.has(message.id)) return false;
    if (typeof message.id === 'string' && message.id.startsWith('temp-')) {
      return !incoming.some(serverMessage => messageMatches(message, serverMessage));
    }
    return true;
  });
  return [...retained, ...incoming].sort(
    (left, right) => new Date(left.created_at) - new Date(right.created_at)
  );
};

export const nextVisitorPollDelay = (idlePolls) => {
  if (idlePolls <= 0) return 3000;
  if (idlePolls === 1) return 5000;
  if (idlePolls === 2) return 8000;
  if (idlePolls === 3) return 12000;
  return 20000;
};

export const nextAdminMessagePollDelay = (idlePolls) => {
  if (idlePolls <= 0) return 2000;
  if (idlePolls === 1) return 3500;
  if (idlePolls === 2) return 5000;
  if (idlePolls === 3) return 8000;
  return 12000;
};
