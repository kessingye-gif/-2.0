import type { AuthCode, ServicePackage, StudentServiceRight } from '../types';

const addDays = (dateText: string, days: number) => {
  const date = new Date(`${dateText.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const statusByCode: Record<AuthCode['status'], StudentServiceRight['status']> = {
  pending: 'pending',
  used: 'active',
  expired: 'expired',
  revoked: 'revoked',
};

export function deriveLegacyServiceRights(authCodes: AuthCode[], packages: ServicePackage[]): StudentServiceRight[] {
  return authCodes.flatMap((authCode) => {
    if (!authCode.studentId || !authCode.studentName) return [];
    const servicePackage = packages.find((item) => item.id === authCode.packageId);
    const serviceExpireAt = authCode.status === 'used' && authCode.activatedAt && servicePackage?.durationDays
      ? addDays(authCode.activatedAt, servicePackage.durationDays)
      : null;

    return [{
      id: `RIGHT-LEGACY-${authCode.id}`,
      studentId: authCode.studentId,
      studentName: authCode.studentName,
      institutionId: authCode.institutionId,
      institutionName: authCode.institutionName,
      teacherId: authCode.teacherId,
      teacherName: authCode.teacherName,
      packageId: authCode.packageId,
      packageName: authCode.packageName,
      authCodeId: authCode.id,
      includedAiUsage: servicePackage?.includedAiUsage ?? 0,
      quotaConsumed: authCode.quotaConsumed,
      createdAt: authCode.createdAt,
      serviceExpireAt,
      status: statusByCode[authCode.status],
    }];
  });
}

export function mergeStudentServiceRights(existingRights: StudentServiceRight[], authCodes: AuthCode[], packages: ServicePackage[]): StudentServiceRight[] {
  const existingAuthCodeIds = new Set(existingRights.map((item) => item.authCodeId));
  const missingRights = deriveLegacyServiceRights(authCodes, packages).filter((item) => !existingAuthCodeIds.has(item.authCodeId));
  return [...existingRights, ...missingRights];
}
