import test from 'node:test';
import assert from 'node:assert/strict';
import {
  discountMessageAfterDiamondToggle,
  nextDiamondUse,
} from './checkoutDiamonds.mjs';

test('selects the allowed diamond amount when currently disabled', () => {
  assert.equal(nextDiamondUse(0, 500, 320), 320);
});

test('disables diamonds when currently enabled', () => {
  assert.equal(nextDiamondUse(320, 500, 320), 0);
});

test('never selects a negative or unavailable amount', () => {
  assert.equal(nextDiamondUse(0, 500, 0), 0);
  assert.equal(nextDiamondUse(0, -10, 100), 0);
});

test('clears an invalid discount message when diamonds are selected', () => {
  assert.equal(
    discountMessageAfterDiamondToggle('error', 'کد تخفیف نامعتبر است'),
    '',
  );
});

test('preserves successful and informational discount messages', () => {
  assert.equal(
    discountMessageAfterDiamondToggle('success', 'کد اعمال شد: ۲۰٪ تخفیف'),
    'کد اعمال شد: ۲۰٪ تخفیف',
  );
  assert.equal(
    discountMessageAfterDiamondToggle('info', 'کد تخفیف را وارد کنید.'),
    'کد تخفیف را وارد کنید.',
  );
});
