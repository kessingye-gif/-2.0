import assert from 'node:assert/strict';
import test from 'node:test';
import { getKnowledgeHierarchyLabels, splitSingleTableData } from './dataSplitter';

test('三级内容使用统一层级术语', () => {
  assert.deepEqual(getKnowledgeHierarchyLabels(), ['一级', '二级', '知识点']);
});

test('单表导入把 AI 补充字段保存到知识点', () => {
  const result = splitSingleTableData([{
    stage: '初中', subject: '数学', grade: '初一', textbook: '人教版',
    level1Name: '数与代数', level2Name: '一元一次方程', level3Name: '方程应用', level3Code: 'KP-3',
    coreContent: '从实际问题中建立方程', learningObjective: '能够求解方程应用题', teachingSuggestion: '结合生活情境',
    title: '示例题', content: '题干', answer: '答案', analysis: '解析', difficulty: '基础', type: '单选题',
  }], [], []);

  const knowledgePoint = result.newKnowledgePoints.find((point) => point.level === 3);
  assert.equal(knowledgePoint?.coreContent, '从实际问题中建立方程');
  assert.equal(knowledgePoint?.learningObjective, '能够求解方程应用题');
  assert.equal(knowledgePoint?.teachingSuggestion, '结合生活情境');
});
