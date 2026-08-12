import type { Institution, TeacherCreditLedgerEntry, TeacherItem } from '../types';

interface CreditTransferBase {
  institution: Institution;
  teacher: TeacherItem;
  amount: number;
  reason: string;
  now: Date;
  nonce: string;
}

interface TeacherServiceDebitInput {
  teacher: TeacherItem;
  amount: number;
  studentId: string;
  studentName: string;
  packageId: string;
  packageName: string;
  now: Date;
  nonce: string;
}

const validateAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) throw new Error('点数必须是大于 0 的整数');
};

const timestamp = (date: Date) => date.toLocaleString('zh-CN', { hour12: false }).slice(0, 16);

export function allocateTeacherCredits(input: CreditTransferBase) {
  const { institution, teacher, amount, reason, now, nonce } = input;
  validateAmount(amount);
  if (teacher.institutionId !== institution.id) throw new Error('教师不属于当前机构');
  if (institution.status !== 'active') throw new Error('机构已停用，不能分配点数');
  if (teacher.status !== 'active') throw new Error('教师已停用，不能分配点数');
  if (institution.remainingQuota < amount) throw new Error('机构剩余点数不足');

  const updatedInstitution = { ...institution, remainingQuota: institution.remainingQuota - amount, updatedAt: now.toISOString().slice(0, 10) };
  const updatedTeacher = { ...teacher, allocatedQuota: teacher.allocatedQuota + amount, remainingQuota: teacher.remainingQuota + amount };
  const entry: TeacherCreditLedgerEntry = {
    id: `TCL-${now.getTime()}-${nonce}`,
    type: 'institution_to_teacher',
    institutionId: institution.id,
    institutionName: institution.name,
    teacherId: teacher.id,
    teacherName: teacher.name,
    amount,
    institutionBefore: institution.remainingQuota,
    institutionAfter: updatedInstitution.remainingQuota,
    teacherBefore: teacher.remainingQuota,
    teacherAfter: updatedTeacher.remainingQuota,
    reason,
    createdAt: timestamp(now),
  };
  return { institution: updatedInstitution, teacher: updatedTeacher, entry };
}

export function reclaimTeacherCredits(input: CreditTransferBase) {
  const { institution, teacher, amount, reason, now, nonce } = input;
  validateAmount(amount);
  if (teacher.institutionId !== institution.id) throw new Error('教师不属于当前机构');
  if (teacher.remainingQuota < amount) throw new Error('教师可用点数不足，不能收回已使用点数');

  const updatedInstitution = { ...institution, remainingQuota: institution.remainingQuota + amount, updatedAt: now.toISOString().slice(0, 10) };
  const updatedTeacher = { ...teacher, allocatedQuota: Math.max(0, teacher.allocatedQuota - amount), remainingQuota: teacher.remainingQuota - amount };
  const entry: TeacherCreditLedgerEntry = {
    id: `TCL-${now.getTime()}-${nonce}`,
    type: 'teacher_reclaim',
    institutionId: institution.id,
    institutionName: institution.name,
    teacherId: teacher.id,
    teacherName: teacher.name,
    amount,
    institutionBefore: institution.remainingQuota,
    institutionAfter: updatedInstitution.remainingQuota,
    teacherBefore: teacher.remainingQuota,
    teacherAfter: updatedTeacher.remainingQuota,
    reason,
    createdAt: timestamp(now),
  };
  return { institution: updatedInstitution, teacher: updatedTeacher, entry };
}

export function debitTeacherForService(input: TeacherServiceDebitInput) {
  const { teacher, amount, studentId, studentName, packageId, packageName, now, nonce } = input;
  validateAmount(amount);
  if (teacher.status !== 'active') throw new Error('教师已停用，不能办理学生服务');
  if (teacher.remainingQuota < amount) throw new Error('教师剩余点数不足');

  const updatedTeacher = { ...teacher, remainingQuota: teacher.remainingQuota - amount };
  const entry: TeacherCreditLedgerEntry = {
    id: `TCL-${now.getTime()}-${nonce}`,
    type: 'teacher_service_debit',
    institutionId: teacher.institutionId,
    institutionName: teacher.institutionName,
    teacherId: teacher.id,
    teacherName: teacher.name,
    amount,
    teacherBefore: teacher.remainingQuota,
    teacherAfter: updatedTeacher.remainingQuota,
    studentId,
    studentName,
    packageId,
    packageName,
    reason: `为学生办理服务包【${packageName}】`,
    createdAt: timestamp(now),
  };
  return { teacher: updatedTeacher, entry };
}
