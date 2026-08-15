import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContentPackageManager, ContentPackageWorkspace, filterAuthorizedContentPackages, getPackageWorkspaceKnowledgePoints, resolveKnowledgeTypeName, validateContentPackageDraft } from './ContentPackageManager';
import { MasterDataProvider } from '../../masterData/MasterDataContext';

const subjects = [
  { id: 'SUB-01', name: '初中数学', stage: '初中', textbook: '人教版', kpCount: 156, questionCount: 1280 },
];

test('内容包列表提供可追溯详情和明确新增流程', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(ContentPackageManager, {
      subjects,
      onOpenResource: () => undefined,
    })
  ));
  assert.match(markup, /内容包/);
  assert.match(markup, /进入内容包/);
  assert.match(markup, /机构边界/);
  assert.match(markup, /data-content-package-grid="true"/);
  assert.match(markup, /新增内容包/);
  assert.doesNotMatch(markup, /<table/);
  assert.doesNotMatch(markup, />删除</);
});

test('内容范围为空时不能发布', () => {
  assert.deepEqual(validateContentPackageDraft({ name: '', subjectId: '', kpCount: 0, questionCount: 0 }), [
    '请填写内容包名称',
    '请选择学科',
    '请选择至少一个知识点或一道题目',
  ]);
  assert.deepEqual(validateContentPackageDraft({ name: '初中数学包', subjectId: 'SUB-01', kpCount: 12, questionCount: 30 }), []);
});

test('知识点类型读取系统基础数据而不是页面硬编码文案', () => {
  const knowledgeTypes = [
    { id: 'KT-01', code: 'CONCEPT', name: '概念理解', applicableSubjectIds: [], status: 'active' as const, usageCount: 12, sortOrder: 1 },
  ];
  assert.equal(resolveKnowledgeTypeName(knowledgeTypes, 'KT-01'), '概念理解');
  assert.equal(resolveKnowledgeTypeName([{ ...knowledgeTypes[0], name: '概念与定义' }], 'KT-01'), '概念与定义');
  assert.equal(resolveKnowledgeTypeName(knowledgeTypes, 'KT-MISSING'), '未配置');
});

test('机构管理员只能看到机构已授权的内容包', () => {
  const packages = [{ name: '数学包' }, { name: '物理包' }, { name: '化学包' }];
  assert.deepEqual(filterAuthorizedContentPackages(packages, ['数学包', '化学包']).map((item) => item.name), ['数学包', '化学包']);
  assert.deepEqual(filterAuthorizedContentPackages(packages).map((item) => item.name), ['数学包', '物理包', '化学包']);
});

test('内容包工作区只使用内容包显式选择的三级知识点', () => {
  const points = [
    { id: 'KP-L1-01', code: 'M1', name: '方程', level: 1 as const, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 2, status: 'active' as const },
    { id: 'KP-L3-01', code: 'M3', name: '移项规则', level: 3 as const, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 1, status: 'active' as const },
    { id: 'KP-L3-02', code: 'P3', name: '牛顿定律', level: 3 as const, subject: '物理', grade: '高一', textbook: '人教版', questionCount: 1, status: 'active' as const },
  ];
  assert.deepEqual(getPackageWorkspaceKnowledgePoints(points, ['KP-L3-02']).map((item) => item.id), ['KP-L3-02']);
});

test('内容包工作区与知识点页使用相同操作名称', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(ContentPackageWorkspace, {
      pkg: { id: 'CP-01', code: 'CP-MATH', name: '数学包', subjectId: 'SUB-01', status: 'active', kpCount: 1, questionCount: 1, institutionCount: 1, updatedAt: '2026-08-14', description: '', knowledgePointIds: ['KP-L3-01'] },
      subject: subjects[0],
      knowledgePoints: [{ id: 'KP-L3-01', code: 'M3', name: '移项规则', level: 3, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 1, status: 'active' }],
      onBack: () => undefined,
      onNewPackage: () => undefined,
      onOpenResource: () => undefined,
      onViewQuestions: () => undefined,
      onBatchImportKnowledgePoints: () => undefined,
      onAddKnowledgePoint: () => undefined,
      canCreatePackage: true,
    })
  ));
  assert.match(markup, /批量导入知识点/);
  assert.match(markup, /新增章 \/ 节 \/ 知识点/);
  assert.doesNotMatch(markup, /新建知识点/);
});
