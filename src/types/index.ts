/**
 * 开窍 AI 学伴 - 超级管理员后台 TypeScript 类型定义
 */

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: 'super_admin' | 'institution_admin';
  institutionId?: string;
  institutionName?: string;
  avatar?: string;
}

export type RegionType = 'huadong' | 'huabei' | 'huanan' | 'xinan' | 'central';

export interface Institution {
  id: string; // INS-2023001
  name: string; // 浙江大学附属中学
  code: string;
  region: RegionType;
  regionName: string; // 华东地区
  contactPerson: string; // 李明
  phone: string; // 138-8888-0001
  email: string;
  adminAccount: string;
  adminPassword?: string;
  totalQuota: number; // 100000
  remainingQuota: number; // 75402
  isFrozen?: boolean;
  teacherCount: number; // 124
  studentCount: number; // 2150
  status: 'active' | 'inactive'; // 已启用 / 已停用
  createdAt: string;
  updatedAt: string;
}

export type PackageType = 'single_low' | 'single_high' | 'all_low' | 'all_high';

export interface ServicePackage {
  id: string; // PKG-001
  code: string; // SP-SINGLE-LOW
  name: string; // 单科低量包
  type: PackageType;
  typeName: string; // 单科低量
  quotaCost: number; // 扣减教师采购额度 e.g. 50
  dailyAiLimit: number; // 每日 AI 次数 e.g. 20
  durationDays: number | null; // 365 或 null(长期)
  description: string;
  status: 'active' | 'inactive'; // 可购买 / 已下架
  subjectRequirement: 'single' | 'all';
}

export type AuthCodeStatus = 'pending' | 'used' | 'revoked' | 'expired';

export interface AuthCode {
  id: string; // AC-1002
  code: string; // KQ-2026-8801-9210
  institutionId: string;
  institutionName: string;
  teacherId: string;
  teacherName: string;
  studentId?: string;
  studentName?: string;
  packageId: string;
  packageName: string;
  packageType: PackageType;
  quotaConsumed: number;
  createdAt: string;
  expireAt: string; // 30天后领用截止
  activatedAt?: string;
  status: AuthCodeStatus;
}

// 题目难度 (唯一标准)
export type QuestionDifficulty = '基础' | '提升' | '压轴';

// 题型
export type QuestionType = '选择题' | '填空题' | '解答题' | '判断题' | '综合题';

// 三级知识点结构
export interface KnowledgePointNode {
  id: string;
  code: string; // KP-MATH-101
  name: string;
  level: 1 | 2 | 3; // 1级/2级/3级
  subject: string; // 数学
  grade: string; // 初一
  textbook: string; // 人教版
  parentId?: string;
  questionCount: number; // 绑定精选题数
  status: 'active' | 'inactive';
}

export interface QuestionItem {
  id: string; // Q-2026001
  title: string;
  content: string; // 题干
  options?: string[]; // 选择题选项
  answer: string; // 正确答案
  analysis: string; // 解题步骤与分析
  subject: string; // 数学, 物理, 化学, 生物
  stage: string; // 初中 / 高中
  grade: string; // 初一, 初二...
  textbook: string; // 人教版
  difficulty: QuestionDifficulty; // 基础, 提升, 压轴
  type: QuestionType; // 选择题, 填空题...
  knowledgePointLevel1Id: string;
  knowledgePointLevel2Id: string;
  knowledgePointLevel3Id: string; // 唯一绑定的三级考点
  knowledgePointPathName: string; // 数学 > 一元一次方程 > 解方程基本步骤
  status: 'active' | 'inactive';
  imageUrl?: string;
  createdAt: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  account: string;
  phone: string;
  institutionId: string;
  institutionName: string;
  studentCount: number;
  allocatedQuota: number;
  remainingQuota: number;
  status: 'active' | 'inactive';
}

export interface StudentItem {
  id: string;
  name: string;
  nickname: string;
  account: string;
  grade: string;
  school: string;
  textbook: string;
  institutionId: string;
  institutionName: string;
  teacherId: string;
  teacherName: string;
  subjects: string[]; // ['数学', '物理']
  serviceStatus: 'active' | 'expired' | 'none';
  serviceExpireAt?: string;
  totalStudyHours: number;
  totalQuestions: number;
  accuracyRate: number;
  errorCount: number;
  unreviewedErrorCount: number;
}

export type GuardianshipStatus = 'pending' | 'active' | 'rejected' | 'frozen' | 'released' | 'expired';

export interface ParentGuardianship {
  id: string;
  parentName: string;
  parentPhone: string;
  studentId: string;
  studentName: string;
  institutionName: string;
  relationType: '父亲' | '母亲' | '其他法定监护人';
  status: GuardianshipStatus;
  createdAt: string;
  expireAt?: string;
}

export interface AuditLogItem {
  id: string;
  operatorName: string; // e.g. 超级管理员 (admin)
  operatorRole: string; // Super Admin
  module: '机构管理' | '服务包管理' | '额度授权码' | '题库管理' | '系统设置' | '诊断管理';
  action: string; // e.g. 分配机构额度 +50000
  target: string; // 浙江大学附属中学
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface PlatformStats {
  activeInstitutions: number;
  activeInstitutionsGrowth: number;
  platformRemainingQuota: string;
  totalCoveredStudents: number;
  alertInstitutionsCount: number;
  totalPackageActivationRate: number;
  dailyAiRequests: number;
}
