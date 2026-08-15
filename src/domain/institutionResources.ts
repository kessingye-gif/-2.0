import type { Institution, InstitutionCreditEntry, OrderLedgerRecord } from '../types';

interface CreateCreditEntryInput {
  institution: Institution;
  paymentAmount: number;
  creditAmount: number;
  voucherNo: string;
  notes: string;
  operatorName: string;
  now: Date;
}

interface ReverseCreditEntryInput {
  institution: Institution;
  original: InstitutionCreditEntry;
  operatorName: string;
  reason: string;
  now: Date;
}

const stamp = (now: Date) => now.toISOString().slice(0, 16).replace(/[-:T]/g, '');
const time = (now: Date) => now.toISOString().slice(0, 16).replace('T', ' ');

export const createInstitutionCreditEntry = ({ institution, paymentAmount, creditAmount, voucherNo, notes, operatorName, now }: CreateCreditEntryInput) => {
  if (paymentAmount <= 0 || creditAmount <= 0) throw new Error('实收金额和划拨点数必须大于 0');
  if (!voucherNo.trim()) throw new Error('请填写打款凭证或银行流水号');
  const id = `CE-${stamp(now)}`;
  const orderNo = `ORD-${stamp(now)}`;
  const entry: InstitutionCreditEntry = { id, institutionId: institution.id, institutionName: institution.name, paymentAmount, allocatedCredits: creditAmount, entryDate: now.toISOString().slice(0, 10), voucherNo: voucherNo.trim(), operatorName, notes: notes.trim(), createdAt: time(now), status: 'posted' };
  const updatedAt = now.toISOString().slice(0, 10);
  const updatedInstitution = { ...institution, totalQuota: institution.totalQuota + creditAmount, remainingQuota: institution.remainingQuota + creditAmount, updatedAt };
  const ledger: OrderLedgerRecord = { id: `LEDGER-${stamp(now)}`, orderNo, institutionId: institution.id, institutionName: institution.name, type: 'credit_inflow', typeName: '机构点数入账', paymentAmount, creditChange: creditAmount, status: 'completed', operatorName, timestamp: time(now), reason: `线下入账凭证: ${entry.voucherNo}` };
  return { institution: updatedInstitution, entry, ledger };
};

export const reverseInstitutionCreditEntry = ({ institution, original, operatorName, reason, now }: ReverseCreditEntryInput) => {
  if (original.status !== 'posted') throw new Error('只有已入账记录可以冲正');
  if (!reason.trim()) throw new Error('请填写冲正原因');
  if (institution.remainingQuota < original.allocatedCredits) throw new Error('机构当前可用额度不足，不能冲正该入账记录');
  const id = `CE-R-${stamp(now)}`;
  const orderNo = `ORD-R-${stamp(now)}`;
  const entry: InstitutionCreditEntry = { ...original, id, paymentAmount: -original.paymentAmount, allocatedCredits: -original.allocatedCredits, status: 'reversed', reversalOf: original.id, operatorName, notes: reason.trim(), createdAt: time(now) };
  const updatedInstitution = { ...institution, totalQuota: institution.totalQuota - original.allocatedCredits, remainingQuota: institution.remainingQuota - original.allocatedCredits, updatedAt: now.toISOString().slice(0, 10) };
  const ledger: OrderLedgerRecord = { id: `LEDGER-R-${stamp(now)}`, orderNo, institutionId: institution.id, institutionName: institution.name, type: 'reversal', typeName: '机构入账冲正', paymentAmount: -original.paymentAmount, creditChange: -original.allocatedCredits, status: 'reversed', operatorName, timestamp: time(now), originalOrderNo: `ORD-${original.id.replace(/^CE-/, '')}`, reason: reason.trim() };
  return { institution: updatedInstitution, entry, ledger };
};
