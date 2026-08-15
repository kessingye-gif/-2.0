import type { StudentServiceRight } from '../types';

export type StudentServiceReminderKind = 'activation' | 'renewal' | 'expired';

export interface StudentServiceReminder {
  id: string;
  rightId: string;
  studentId: string;
  packageName: string;
  kind: StudentServiceReminderKind;
  title: string;
  description: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const dateAtStart = (value: string | Date): Date => {
  const source = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(source);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export function deriveStudentServiceReminders(rights: StudentServiceRight[], now: Date): StudentServiceReminder[] {
  const today = dateAtStart(now);
  return rights.flatMap((right): StudentServiceReminder[] => {
    if (right.status === 'pending') {
      const pendingDays = Math.floor((today.getTime() - dateAtStart(right.createdAt).getTime()) / DAY_MS);
      return pendingDays >= 3 ? [{
        id: `${right.id}:activation`, rightId: right.id, studentId: right.studentId, packageName: right.packageName,
        kind: 'activation', title: '已办理服务尚未激活', description: '请联系学生完成激活。',
      }] : [];
    }

    if (right.status === 'expired') return [{
      id: `${right.id}:expired`, rightId: right.id, studentId: right.studentId, packageName: right.packageName,
      kind: 'expired', title: '服务已到期', description: '请确认学生是否需要续办。',
    }];

    if (right.status !== 'active' || !right.serviceExpireAt) return [];
    const remainingDays = Math.floor((dateAtStart(right.serviceExpireAt).getTime() - today.getTime()) / DAY_MS);
    return remainingDays >= 0 && remainingDays <= 7 ? [{
      id: `${right.id}:renewal`, rightId: right.id, studentId: right.studentId, packageName: right.packageName,
      kind: 'renewal', title: '服务即将到期', description: '请提醒学生及时续办。',
    }] : [];
  });
}
