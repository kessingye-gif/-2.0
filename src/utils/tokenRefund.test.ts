import assert from 'node:assert/strict';
import test from 'node:test';
import { getTokenRefundEligibility } from './tokenRefund';

test('未使用订单允许全额退款', () => {
  assert.deepEqual(
    getTokenRefundEligibility({ status: 'paid', grantedToken: 1000000, remainingToken: 1000000 }),
    { allowed: true, reason: '可全额退款' },
  );
});

test('Token 已使用后禁止退款', () => {
  assert.deepEqual(
    getTokenRefundEligibility({ status: 'paid', grantedToken: 1000000, remainingToken: 800000 }),
    { allowed: false, reason: 'Token 已使用，不可退款' },
  );
});

test('已退款订单不能再次退款', () => {
  assert.deepEqual(
    getTokenRefundEligibility({ status: 'refunded', grantedToken: 1000000, remainingToken: 1000000 }),
    { allowed: false, reason: '订单已退款' },
  );
});
