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
  availableContentPackages?: string[]; // 平台配置的机构可用/可维护内容包范围
  availableServicePackageIds?: string[]; // 平台配置的机构可兑换服务包范围
  isFrozen?: boolean;
  teacherCount: number; // 124
  studentCount: number; // 2150
  status: 'active' | 'inactive'; // 已启用 / 已停用
  contractAmount?: number;
  contractStatus?: 'draft' | 'active' | 'expiring' | 'expired';
  contractExpireAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type FulfillmentStageId =
  | 'contracted'
  | 'funded'
  | 'configured'
  | 'issued'
  | 'activated'
  | 'servicing'
  | 'renewal';

export interface FulfillmentMetric {
  id: 'contractAmount' | 'fundedAmount' | 'activatedStudents' | 'revenue' | 'refundAmount';
  label: string;
  value: number;
  displayValue: string;
  tone?: 'default' | 'positive' | 'warning';
}

export interface FulfillmentFunnelStep {
  id: FulfillmentStageId;
  label: string;
  value: number;
  displayValue: string;
  conversionRate?: number;
  targetTab: 'institutions' | 'goods' | 'students' | 'system';
}

export interface FulfillmentWorkItem {
  id: string;
  type: 'low_credit' | 'code_expiring' | 'payment_pending' | 'activation_error' | 'refund_review';
  title: string;
  description: string;
  institutionName: string;
  severity: 'high' | 'medium' | 'low';
  targetTab: 'institutions' | 'goods' | 'students' | 'system';
}

export interface FulfillmentEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'neutral';
}

export interface FulfillmentSnapshot {
  metrics: FulfillmentMetric[];
  funnel: FulfillmentFunnelStep[];
  workItems: FulfillmentWorkItem[];
  recentEvents: FulfillmentEvent[];
  healthyInstitutionCount: number;
  warningInstitutionCount: number;
  exceptionInstitutionCount: number;
}

export interface GlobalSearchResult {
  id: string;
  type: 'institution' | 'student' | 'authCode' | 'order';
  title: string;
  subtitle: string;
  targetTab: 'institutions' | 'goods' | 'students' | 'system';
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
export type QuestionType = '单选题' | '多选题' | '选择题' | '填空题' | '解答题' | '判断题' | '综合题';

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

export interface AiUsagePack {
  id: string;
  name: string;
  code: string;
  usageAmount: number;
  price: number; // e.g. 500 元
  status: 'active' | 'inactive';
  description: string;
  createdAt: string;
}

export interface CreditEntryRecord {
  id: string;
  institutionId: string;
  institutionName: string;
  paymentAmount: number; // 实际收款金额（元）
  allocatedCredits: number; // 实际分配点数
  entryDate: string; // 入账日期
  voucherNo: string; // 凭证/流水号
  operatorName: string; // 经办人
  notes: string;
  createdAt: string;
}

export interface OrderLedgerRecord {
  id: string;
  orderNo: string;
  institutionId: string;
  institutionName: string;
  type: 'credit_inflow' | 'package_redeem' | 'ai_usage_pack_buy' | 'refund' | 'reversal';
  typeName: string;
  paymentAmount: number;
  creditChange: number;
  status: 'completed' | 'reversed' | 'refunded';
  operatorName: string;
  timestamp: string;
  originalOrderNo?: string;
  reason?: string;
}

export interface TeacherPermission {
  canEditContent: boolean; // 编辑题库/知识点
  canImportStudents: boolean; // 批量导入学生
  canManageClass: boolean; // 班级管理
  canRedeemPackage: boolean; // 使用点数兑换授权码
  canViewReport: boolean; // 查看学情报告
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
  permissions: TeacherPermission;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface TeacherClassItem {
  id: string;
  name: string;
  code: string;
  grade: string;
  subject: string;
  institutionId: string;
  institutionName: string;
  headTeacherId: string;
  headTeacherName: string;
  studentCount: number;
  createdAt: string;
}

export interface WeChatRebindRequest {
  id: string;
  studentId: string;
  studentName: string;
  institutionName: string;
  phone: string;
  applyReason: string;
  proofDocument: string;
  status: 'pending' | 'approved' | 'rejected';
  applicant: string;
  applyTime: string;
  reviewTime?: string;
  reviewer?: string;
}

export interface AiModelConfig {
  id: string;
  name: string; // e.g. Gemini 1.5 Pro
  provider: string; // e.g. Google AI
  capability: '文本解析' | '多模态识图' | '语音合成';
  usageMultiplier: number;
  isDefault: boolean;
  status: 'active' | 'inactive';
  updatedAt: string;
}

export interface AiUsageCompensation {
  id: string;
  studentId: string;
  studentName: string;
  institutionName: string;
  usageAmount: number;
  reason: string;
  operatorName: string;
  timestamp: string;
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
