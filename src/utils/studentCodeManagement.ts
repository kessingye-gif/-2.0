import type { AuthCode, GuardianBindingCode, StudentItem } from '../types';

const STATUS_LABELS: Record<AuthCode['status'], '已生效' | '待激活' | '已作废' | '已过期'> = {
  used: '已生效', pending: '待激活', revoked: '已作废', expired: '已过期',
};

export function deriveStudentRights(authCodes: AuthCode[]) {
  return authCodes.filter((item) => item.studentId || item.studentName).map((item) => ({
    ...item,
    studentName: item.studentName || '待绑定学生',
    statusLabel: STATUS_LABELS[item.status],
  }));
}

export function createGuardianBindingCode(
  student: StudentItem,
  now = new Date(),
  createSegment = () => Math.floor(1000 + Math.random() * 9000).toString(),
): GuardianBindingCode {
  return {
    id: `GBC-${now.getTime()}`,
    code: `JB-${createSegment()}-${createSegment()}`,
    studentId: student.id,
    studentName: student.name,
    institutionName: student.institutionName,
    createdAt: now.toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
    expireAt: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10),
    status: 'pending',
  };
}
