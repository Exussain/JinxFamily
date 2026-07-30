import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mergeServerMessages,
  nextAdminMessagePollDelay,
  nextVisitorPollDelay,
} from './chatSync.mjs';

const baseMessage = {
  sender: 'user',
  message_type: 'text',
  file_url: '',
};

test('mergeServerMessages replaces matching optimistic messages', () => {
  const optimistic = {
    ...baseMessage,
    id: 'temp-1',
    text: 'hello',
    created_at: '2026-07-25T12:00:00Z',
  };
  const confirmed = {
    ...baseMessage,
    id: 42,
    text: 'hello',
    created_at: '2026-07-25T12:00:01Z',
  };

  assert.deepEqual(
    mergeServerMessages([optimistic], [confirmed]),
    [confirmed],
  );
});

test('mergeServerMessages deduplicates server ids and preserves unseen messages', () => {
  const first = {
    ...baseMessage,
    id: 1,
    text: 'first',
    created_at: '2026-07-25T12:00:00Z',
  };
  const second = {
    ...baseMessage,
    id: 2,
    text: 'second',
    created_at: '2026-07-25T12:00:02Z',
  };
  const updatedFirst = {...first, text: 'first from server'};

  assert.deepEqual(
    mergeServerMessages([first, second], [updatedFirst]),
    [updatedFirst, second],
  );
});

test('poll delays back off and stay capped', () => {
  assert.equal(nextVisitorPollDelay(0), 3000);
  assert.equal(nextVisitorPollDelay(4), 20000);
  assert.equal(nextVisitorPollDelay(50), 20000);
  assert.equal(nextAdminMessagePollDelay(0), 2000);
  assert.equal(nextAdminMessagePollDelay(50), 12000);
});
