import type { ServiceFulfillmentResult, ServicePackage, StudentItem } from '../types';

export interface CreateServiceFulfillmentInput {
  student: StudentItem;
  servicePackage: ServicePackage;
  now: Date;
  nonce: string;
}

export interface CreateBulkServiceFulfillmentsInput {
  students: StudentItem[];
  servicePackage: ServicePackage;
  now: Date;
  nonce: string;
}

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const dateTime = (date: Date) => date.toLocaleString('zh-CN', { hour12: false }).slice(0, 16);

export function createServiceFulfillment({ student, servicePackage, now, nonce }: CreateServiceFulfillmentInput): ServiceFulfillmentResult {
  if (servicePackage.status !== 'active') throw new Error('服务包已停用，无法办理');
  if (!student.institutionId || !student.institutionName) throw new Error('学生缺少所属机构');
  if (!student.teacherId || !student.teacherName) throw new Error('学生缺少负责教师');

  const stamp = `${now.getTime()}-${nonce}`;
  const createdAt = dateTime(now);
  const claimExpireAt = dateOnly(new Date(now.getTime() + 30 * 86400000));
  const guardianExpireAt = dateOnly(new Date(now.getTime() + 7 * 86400000));
  const serviceExpireAt = servicePackage.durationDays === null ? null : dateOnly(new Date(now.getTime() + servicePackage.durationDays * 86400000));
  const authCodeId = `AC-${stamp}`;

  return {
    authCode: {
      id: authCodeId,
      code: `KQ-${dateOnly(now).replaceAll('-', '')}-${nonce}`,
      institutionId: student.institutionId,
      institutionName: student.institutionName,
      teacherId: student.teacherId,
      teacherName: student.teacherName,
      studentId: student.id,
      studentName: student.name,
      packageId: servicePackage.id,
      packageName: servicePackage.name,
      packageType: servicePackage.type,
      quotaConsumed: servicePackage.quotaCost,
      createdAt,
      expireAt: claimExpireAt,
      status: 'pending',
    },
    guardianBindingCode: {
      id: `GBC-${stamp}`,
      code: `JB-${dateOnly(now).replaceAll('-', '')}-${nonce}`,
      studentId: student.id,
      studentName: student.name,
      institutionName: student.institutionName,
      createdAt,
      expireAt: guardianExpireAt,
      status: 'pending',
    },
    right: {
      id: `RIGHT-${stamp}`,
      studentId: student.id,
      studentName: student.name,
      institutionId: student.institutionId,
      institutionName: student.institutionName,
      teacherId: student.teacherId,
      teacherName: student.teacherName,
      packageId: servicePackage.id,
      packageName: servicePackage.name,
      authCodeId,
      includedAiUsage: servicePackage.includedAiUsage,
      quotaConsumed: servicePackage.quotaCost,
      createdAt,
      serviceExpireAt,
      status: 'pending',
    },
  };
}

export function createBulkServiceFulfillments({ students, servicePackage, now, nonce }: CreateBulkServiceFulfillmentsInput) {
  if (students.length === 0) throw new Error('请选择至少一名待办理学生');
  const teacherIds = new Set(students.map((item) => item.teacherId));
  if (teacherIds.size !== 1) throw new Error('批量办理的学生必须属于同一负责教师');
  const results = students.map((student, index) => createServiceFulfillment({
    student,
    servicePackage,
    now,
    nonce: `${nonce}-${String(index + 1).padStart(2, '0')}`,
  }));
  return { results, totalQuotaConsumed: servicePackage.quotaCost * students.length };
}
