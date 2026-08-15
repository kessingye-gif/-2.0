export type ImportTemplateKey = 'classStudents' | 'questions' | 'knowledgePoints';

export interface ImportTemplateDefinition {
  fileName: string;
  headers: string[];
  exampleRows: string[][];
}

export const importTemplates: Record<ImportTemplateKey, ImportTemplateDefinition> = {
  classStudents: {
    fileName: '班级学员导入模板',
    headers: ['学生姓名', '手机号/微信标识', '初始入学年级'],
    exampleRows: [['张同学', '13800000000', '初三']],
  },
  questions: {
    fileName: '精选题库导入模板',
    headers: ['学段', '学科', '年级', '教材版本', '章名称', '节名称', '知识点名称', '知识点编码', '题型', '难度', '题干', '选项', '答案', '解析', '前置知识点'],
    exampleRows: [['初中', '数学', '初一', '人教版', '数与代数', '一元一次方程', '方程应用', 'KP-MATH-001', '单选题', '基础', '示例题干', 'A.1；B.2；C.3；D.4', 'A.1', '示例解析', '']],
  },
  knowledgePoints: {
    fileName: '知识点导入模板',
    headers: ['学科', '年级', '教材版本', '章编码', '章名称', '节编码', '节名称', '知识点编码', '知识点名称'],
    exampleRows: [['数学', '初一', '人教版', 'CH-001', '数与代数', 'SEC-001', '一元一次方程', 'KP-MATH-001', '方程应用']],
  },
};
