import assert from 'node:assert/strict';
import test from 'node:test';
import { createInstitutionCreditEntry, reverseInstitutionCreditEntry } from './institutionResources';
import type { Institution } from '../types';

const institution: Institution = { id: 'INS-1', name: '测试机构', code: 'TEST', region: 'huadong', regionName: '华东地区', contactPerson: '张老师', phone: '13800000000', email: 'test@example.com', adminAccount: 'admin_test', totalQuota: 1000, remainingQuota: 800, teacherCount: 0, studentCount: 0, status: 'active', createdAt: '2026-08-01', updatedAt: '2026-08-01' };
const now = new Date('2026-08-15T10:00:00');

test('入账同时更新机构余额并生成关联流水', () => {
  const result = createInstitutionCreditEntry({ institution, paymentAmount: 500, creditAmount: 1000, voucherNo: 'BANK-001', notes: '对公转账', operatorName: '超级管理员', now });
  assert.equal(result.institution.remainingQuota, 1800);
  assert.equal(result.entry.status, 'posted');
  assert.equal(result.ledger.type, 'credit_inflow');
  assert.equal(result.ledger.reason, '线下入账凭证: BANK-001');
});

test('冲正保留原入账并生成反向流水', () => {
  const posted = createInstitutionCreditEntry({ institution, paymentAmount: 500, creditAmount: 1000, voucherNo: 'BANK-001', notes: '对公转账', operatorName: '超级管理员', now });
  const reversed = reverseInstitutionCreditEntry({ institution: posted.institution, original: posted.entry, operatorName: '超级管理员', reason: '重复录入', now });
  assert.equal(posted.entry.status, 'posted');
  assert.equal(reversed.institution.remainingQuota, 800);
  assert.equal(reversed.entry.status, 'reversed');
  assert.equal(reversed.ledger.type, 'reversal');
  assert.equal(reversed.ledger.originalOrderNo, posted.ledger.orderNo);
});
