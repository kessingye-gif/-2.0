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
    headers: [...knowledgePointImportFields.map((field) => field.label), '题型', '难度', '题干', '选项', '答案', '解析', '题干图片', '选项图片'],
    exampleRows: [['初中', '数学', '初一', '人教版', '数与代数', '一元一次方程', '方程应用', '等式的性质', '从实际问题中抽象一元一次方程', '能够列出并求解一元一次方程', '结合具体情境引导学生建立等量关系', '单选题', '基础', '示例题干', 'A.1；B.2；C.3；D.4', 'A.1', '示例解析', '', '']],
  },
  knowledgePoints: {
    fileName: '知识点导入模板',
    headers: knowledgePointImportFields.map((field) => field.label),
    exampleRows: [['初中', '数学', '初一', '人教版', '数与代数', '一元一次方程', '方程应用', '等式的性质', '从实际问题中抽象一元一次方程', '能够列出并求解一元一次方程', '结合具体情境引导学生建立等量关系']],
  },
};
import { knowledgePointBaseFields, knowledgePointImportFields } from '../domain/contentFields';
