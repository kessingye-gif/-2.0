import type { MasterDataState } from './types';

export const initialMasterData: MasterDataState = {
  stages: [
    { id: 'STAGE-PRIMARY', code: 'PRIMARY', name: '小学', status: 'active', sortOrder: 1 },
    { id: 'STAGE-JUNIOR', code: 'JUNIOR', name: '初中', status: 'active', sortOrder: 2 },
    { id: 'STAGE-SENIOR', code: 'SENIOR', name: '高中', status: 'active', sortOrder: 3 },
  ],
  grades: [
    { id: 'GRADE-P1', code: 'P1', name: '小学一年级', stageId: 'STAGE-PRIMARY', status: 'active', sortOrder: 1 },
    { id: 'GRADE-P2', code: 'P2', name: '小学二年级', stageId: 'STAGE-PRIMARY', status: 'active', sortOrder: 2 },
    { id: 'GRADE-J1', code: 'J1', name: '初一', stageId: 'STAGE-JUNIOR', status: 'active', sortOrder: 7 },
    { id: 'GRADE-J2', code: 'J2', name: '初二', stageId: 'STAGE-JUNIOR', status: 'active', sortOrder: 8 },
    { id: 'GRADE-J3', code: 'J3', name: '初三', stageId: 'STAGE-JUNIOR', status: 'active', sortOrder: 9 },
    { id: 'GRADE-S1', code: 'S1', name: '高一', stageId: 'STAGE-SENIOR', status: 'active', sortOrder: 10 },
    { id: 'GRADE-S2', code: 'S2', name: '高二', stageId: 'STAGE-SENIOR', status: 'active', sortOrder: 11 },
    { id: 'GRADE-S3', code: 'S3', name: '高三', stageId: 'STAGE-SENIOR', status: 'active', sortOrder: 12 },
  ],
  subjects: ['数学', '语文', '英语', '物理', '化学', '生物'].map((name, index) => ({ id: `SUBJECT-${index + 1}`, code: ['MATH', 'CHINESE', 'ENGLISH', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'][index], name, stageIds: index < 3 ? ['STAGE-PRIMARY', 'STAGE-JUNIOR', 'STAGE-SENIOR'] : ['STAGE-JUNIOR', 'STAGE-SENIOR'], status: 'active' as const, sortOrder: index + 1 })),
  textbooks: ['人教版', '浙教版', '苏教版', '北师大版'].map((name, index) => ({ id: `TEXTBOOK-${index + 1}`, code: ['PEP', 'ZJ', 'SJ', 'BSD'][index], name, stageIds: [], status: 'active' as const, sortOrder: index + 1 })),
  knowledgeTypes: [
    { id: 'KT-01', code: 'CONCEPT', name: '概念理解', applicableSubjectIds: [], status: 'active', usageCount: 12, sortOrder: 1 },
    { id: 'KT-02', code: 'METHOD', name: '方法应用', applicableSubjectIds: [], status: 'active', usageCount: 8, sortOrder: 2 },
    { id: 'KT-03', code: 'COMPREHENSIVE', name: '综合能力', applicableSubjectIds: [], status: 'active', usageCount: 0, sortOrder: 3 },
  ],
};
