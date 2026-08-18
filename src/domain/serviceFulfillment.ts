import type { AuthCode, ContentPackageItem, Institution, OrderLedgerRecord, ServiceFulfillmentResult, ServicePackage, StudentItem, StudentServiceRight } from '../types';

export interface CreateServiceFulfillmentInput {
  student: StudentItem;
  servicePackage: ServicePackage;
  now: Date;
  nonce: string;
  contentPackages?: ContentPackageItem[];
  existingRights?: StudentServiceRight[];
}

export interface CreateBulkServiceFulfillmentsInput {
  students: StudentItem[];
  servicePackage: ServicePackage;
  now: Date;
  nonce: string;
  contentPackages?: ContentPackageItem[];
  existingRights?: StudentServiceRight[];
}

export interface SettleInstitutionServiceFulfillmentsInput {
  institution: Institution;
  results: ServiceFulfillmentResult[];
  existingRightIds: string[];
  existingRights?: StudentServiceRight[];
  operatorName: string;
  now: Date;
  nonce: string;
}

export interface ActivateStudentServiceInput {
  right: StudentServiceRight;
  authCode: AuthCode;
  servicePackage: ServicePackage;
  activatedAt: Date;
}

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const dateTime = (date: Date) => date.toLocaleString('zh-CN', { hour12: false }).slice(0, 16);
const addDays = (date: Date, days: number) => dateOnly(new Date(date.getTime() + days * 86400000));

export function createServiceFulfillment({ student, servicePackage, now, nonce, contentPackages = [], existingRights = [] }: CreateServiceFulfillmentInput): ServiceFulfillmentResult {
  if (servicePackage.status !== 'active') throw new Error('服务包已停用，无法办理');
  if (!student.institutionId || !student.institutionName) throw new Error('学生缺少所属机构');
  const pendingSamePackage = existingRights.find((item) => item.studentId === student.id && item.packageId === servicePackage.id && item.status === 'pending');
  if (pendingSamePackage) throw new Error(`${student.name}已有待激活的同款服务，请勿重复办理`);
  const allowedContentIds = servicePackage.selectableContentPackageIds?.length
    ? servicePackage.selectableContentPackageIds
    : contentPackages.map((item) => item.id);
  if (contentPackages.some((item) => item.status !== 'active' || !allowedContentIds.includes(item.id))) throw new Error('所选内容包不在服务包可选范围内');
  const requiredCount = servicePackage.selectableContentPackageCount ?? 1;
  if (allowedContentIds.length > 0 && contentPackages.length !== requiredCount) throw new Error(`请选择 ${requiredCount} 个内容包`);
  const latestActiveRight = existingRights
    .filter((item) => item.studentId === student.id && item.status === 'active')
    .sort((a, b) => (b.serviceExpireAt ?? '').localeCompare(a.serviceExpireAt ?? ''))[0];
  const fulfillmentKind = latestActiveRight ? 'renewal' : 'activation';

  const stamp = `${now.getTime()}-${nonce}`;
  const createdAt = dateTime(now);
  const claimExpireAt = dateOnly(new Date(now.getTime() + 30 * 86400000));
  const guardianExpireAt = dateOnly(new Date(now.getTime() + 7 * 86400000));
  const baseDate = latestActiveRight?.serviceExpireAt && latestActiveRight.serviceExpireAt > dateOnly(now) ? new Date(`${latestActiveRight.serviceExpireAt}T00:00:00Z`) : now;
  const serviceExpireAt = fulfillmentKind === 'activation' || servicePackage.durationDays === null ? null : addDays(baseDate, servicePackage.durationDays);
  const authCodeId = `AC-${stamp}`;

  if (latestActiveRight) {
    return {
      right: {
        ...latestActiveRight,
        packageId: servicePackage.id,
        packageName: servicePackage.name,
        contentPackageIds: contentPackages.map((item) => item.id),
        contentPackageNames: contentPackages.map((item) => item.name),
        fulfillmentKind: 'renewal',
        idempotencyKey: `${student.id}:${servicePackage.id}:renewal:${latestActiveRight.serviceExpireAt ?? 'forever'}`,
        includedAiUsage: latestActiveRight.includedAiUsage + servicePackage.includedAiUsage,
        quotaConsumed: servicePackage.quotaCost,
        createdAt,
        serviceExpireAt,
        status: 'active',
      },
    };
  }

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
      contentPackageIds: contentPackages.map((item) => item.id),
      contentPackageNames: contentPackages.map((item) => item.name),
      fulfillmentKind: 'activation',
      idempotencyKey: `${student.id}:${servicePackage.id}:activation:new`,
      authCodeId,
      includedAiUsage: servicePackage.includedAiUsage,
      quotaConsumed: servicePackage.quotaCost,
      createdAt,
      serviceExpireAt: null,
      status: 'pending',
    },
  };
}

export function createBulkServiceFulfillments({ students, servicePackage, now, nonce, contentPackages = [], existingRights = [] }: CreateBulkServiceFulfillmentsInput) {
  if (students.length === 0) throw new Error('请选择至少一名待办理学生');
  const results = students.map((student, index) => createServiceFulfillment({
    student,
    servicePackage,
    now,
    nonce: `${nonce}-${String(index + 1).padStart(2, '0')}`,
    contentPackages,
    existingRights,
  }));
  return { results, totalQuotaConsumed: servicePackage.quotaCost * students.length };
}

export function activateStudentService({ right, authCode, servicePackage, activatedAt }: ActivateStudentServiceInput) {
  if (right.status !== 'pending' || authCode.status !== 'pending') throw new Error('该授权码不可激活');
  if (right.authCodeId !== authCode.id || right.studentId !== authCode.studentId || right.packageId !== servicePackage.id) throw new Error('授权码与学生服务不匹配');
  return {
    authCode: { ...authCode, status: 'used' as const, activatedAt: dateTime(activatedAt) },
    right: {
      ...right,
      status: 'active' as const,
      serviceExpireAt: servicePackage.durationDays === null ? null : addDays(activatedAt, servicePackage.durationDays),
    },
  };
}

export function settleInstitutionServiceFulfillments({ institution, results, existingRightIds, existingRights = [], operatorName, now, nonce }: SettleInstitutionServiceFulfillmentsInput) {
  if (results.length === 0) throw new Error('请选择至少一名待开通用户');
  if (institution.status !== 'active') throw new Error('所属机构已停用，不能开通服务');
  if (results.some((item) => item.right.institutionId !== institution.id)) throw new Error('用户与结算机构不一致');
  if (results.some((item) => !institution.availableServicePackageIds?.includes(item.right.packageId))) throw new Error('该机构未获授权使用此服务包');
  const institutionContentScope = new Set(institution.availableContentPackages ?? []);
  if (results.some((item) => (item.right.contentPackageIds ?? []).some((id, index) => !institutionContentScope.has(id) && !institutionContentScope.has(item.right.contentPackageNames?.[index] ?? '')))) throw new Error('该机构未获授权使用所选内容包');
  const existingIds = new Set(existingRightIds);
  if (results.some((item) => item.right.fulfillmentKind !== 'renewal' && existingIds.has(item.right.id))) throw new Error('该服务已提交，请勿重复提交');
  const existingKeys = new Set(existingRights.map((item) => item.idempotencyKey).filter(Boolean));
  if (results.some((item) => item.right.idempotencyKey && existingKeys.has(item.right.idempotencyKey))) throw new Error('该服务已提交，请勿重复提交');

  const totalQuotaConsumed = results.reduce((sum, item) => sum + item.right.quotaConsumed, 0);
  if (institution.remainingQuota < totalQuotaConsumed) throw new Error(`机构剩余点数不足，还差 ${(totalQuotaConsumed - institution.remainingQuota).toLocaleString()} 点`);

  const institutionAfter = institution.remainingQuota - totalQuotaConsumed;
  const updatedInstitution: Institution = {
    ...institution,
    remainingQuota: institutionAfter,
    updatedAt: dateOnly(now),
  };
  const studentNames = results.map((item) => item.right.studentName).join('、');
  const packageNames = [...new Set(results.map((item) => item.right.packageName))].join('、');
  const order: OrderLedgerRecord = {
    id: `ORD-SVC-${now.getTime()}-${nonce}`,
    orderNo: `SVC-${dateOnly(now).replaceAll('-', '')}-${nonce}`,
    institutionId: institution.id,
    institutionName: institution.name,
    type: 'package_redeem',
    typeName: '用户服务开通',
    paymentAmount: 0,
    creditChange: -totalQuotaConsumed,
    status: 'completed',
    operatorName,
    timestamp: dateTime(now),
    reason: `为 ${studentNames} 开通【${packageNames}】，机构账户 ${institution.remainingQuota.toLocaleString()} → ${institutionAfter.toLocaleString()} 点`,
  };

  return { institution: updatedInstitution, order, results, totalQuotaConsumed };
}
