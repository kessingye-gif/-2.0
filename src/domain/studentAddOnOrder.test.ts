import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRefundEligibility,
  refundStudentAddOnOrder,
  type StudentAddOnOrder,
} from './studentAddOnOrder';

const paidOrder: StudentAddOnOrder = {
  id: 'PAY-20260808-0192',
  student: '张伟强',
  institution: '浙江大学附属中学',
  packageName: '标准加油包',
  channel: '微信支付',
  paidAmount: 39.9,
  grantedUsage: 1_000_000,
  remainingUsage: 1_000_000,
  status: 'paid',
  orderedAt: '2026-08-08 19:32',
};

test('未使用的已支付订单允许原路全额退款', () => {
  assert.deepEqual(getRefundEligibility(paidOrder), { allowed: true, reason: '可原路全额退款' });
});

test('AI 用量已有消耗时明确说明不可退款', () => {
  assert.deepEqual(
    getRefundEligibility({ ...paidOrder, remainingUsage: 800_000 }),
    { allowed: false, reason: '已使用 200,000 AI 用量，不可退款' },
  );
});

test('已退款订单禁止重复退款', () => {
  assert.deepEqual(
    getRefundEligibility({ ...paidOrder, status: 'refunded' }),
    { allowed: false, reason: '订单已退款' },
  );
});

test('退款一次性返回订单、流水和审计事件', () => {
  const result = refundStudentAddOnOrder(paidOrder, '家长误购', '2026-08-11 17:20');
  assert.equal(result.order.status, 'refunded');
  assert.equal(result.order.remainingUsage, 0);
  assert.equal(result.order.refundNo, 'RF-20260808-0192');
  assert.equal(result.ledger.amount, 39.9);
  assert.equal(result.audit.action, '学生加油包退款');
});

test('不符合资格的订单不能执行退款转换', () => {
  assert.throws(
    () => refundStudentAddOnOrder({ ...paidOrder, remainingUsage: 900_000 }, '申请退款', '2026-08-11 17:20'),
    /已使用 100,000 AI 用量，不可退款/,
  );
});
