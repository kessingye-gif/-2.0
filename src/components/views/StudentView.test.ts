import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuthCodes, initialContentPackages, initialInstitutions, initialParentGuardianships, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
import { MasterDataProvider } from '../../masterData/MasterDataContext';
import { StudentServiceReminderCards, StudentView } from './StudentView';

test('总部用户页面以服务和使用为主，教师与机构只作为归属条件', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(StudentView, {
      students: initialStudents,
      guardianships: initialParentGuardianships,
      authCodes: initialAuthCodes,
      guardianBindingCodes: [{
        id: 'GBC-1', code: 'JB-DEMO-1001', studentId: 'STU-001', studentName: '王小明',
        institutionName: '浙江大学附属中学', createdAt: '2026-08-12', expireAt: '2026-08-19', status: 'pending',
      }],
      serviceRights: [{
        id: 'RIGHT-1', studentId: 'STU-001', studentName: '王小明', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学',
        teacherId: 'TCH-001', teacherName: '张敏老师', packageId: 'PKG-004', packageName: '全科高量包', authCodeId: 'AC-001',
        includedAiUsage: 5000000, quotaConsumed: 350, createdAt: '2026-08-12', serviceExpireAt: '2027-08-12', status: 'pending',
      }],
      packages: initialServicePackages,
      contentPackages: initialContentPackages,
      teachers: initialTeachers,
      institutions: [],
      onAddStudents: () => undefined,
      onFulfillService: () => undefined,
      onRevokeAuthCode: () => undefined,
      onUpdateGuardianshipStatus: () => undefined,
    })
  ));

  assert.match(markup, /学生管理/);
  assert.match(markup, /查看学生、导入名单并办理服务/);
  assert.match(markup, /导入学生/);
  assert.match(markup, /全部/);
  assert.match(markup, /服务中/);
  assert.match(markup, /待办理/);
  assert.match(markup, /即将到期/);
  assert.doesNotMatch(markup, /先创建教师并导入学生，再为学生办理服务/);
  assert.doesNotMatch(markup, /学生配置/);
  assert.match(markup, /更多筛选/);
  assert.doesNotMatch(markup, /全部班级/);
  assert.doesNotMatch(markup, /使用情况/);
  assert.match(markup, /服务包 \/ 内容包/);
  assert.match(markup, /AI 用量/);
  assert.match(markup, />归属</);
  assert.doesNotMatch(markup, /微信重新绑定审核/);
  assert.doesNotMatch(markup, />服务权益 \(/);
  assert.doesNotMatch(markup, />家长监护关系 \(/);
});

test('批量开通已合并为用户服务列表操作，不再作为独立页签', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setActiveTab\('bulk'\)/);
  assert.match(source, /selectedBulkStudentIds\.size > 0/);
  assert.match(source, /需要给多名学生办理服务/);
  assert.match(source, /勾选学生/);
  assert.match(source, />办理服务<\/button>/);
  assert.match(source, /title=\{`批量办理服务 · 已选/);
  assert.match(source, /maxWidthClass="max-w-5xl"/);
  assert.match(source, /关闭弹窗不会取消已勾选的学生/);
  assert.match(source, /本次办理学生/);
  assert.match(source, /请选择服务包/);
  assert.match(source, /selectedBulkStudents\.map/);
  assert.match(source, /机构管理员暂管/);
  assert.doesNotMatch(source, /退出批量办理/);
  assert.match(source, /选择内容包/);
  assert.match(source, /实际扣除/);
});

test('学生导入直接打开上传弹窗，教师为可选归属', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.match(source, /onClick=\{\(\) => openImportDialog\(\)\}/);
  assert.match(source, /负责教师（选填）/);
  assert.match(source, /暂不分配，由机构管理员管理/);
  assert.match(source, /allowUnassigned: true/);
  assert.doesNotMatch(source, /teacher-picker-title/);
  assert.doesNotMatch(source, /新增教师/);
});

test('学生列表只保留一个主入口，批量操作在选择学生后出现', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /filteredStudents\.length} \/ \{students\.length/);
  assert.doesNotMatch(source, /全部服务状态/);
  assert.match(source, /学生管理[\s\S]*导入学生/);
  assert.match(source, /selectedBulkStudentIds\.size > 0[\s\S]*批量办理服务/);
  assert.doesNotMatch(source, /aria-label="学生状态"/);
  assert.match(source, /aria-label="按服务状态筛选"/);
  assert.doesNotMatch(source, /teacher-picker-title/);
});

test('办理服务属于学生页弹窗，不跳转到商品页', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.match(source, /DialogShell/);
  assert.match(source, /ServiceFulfillmentPanel/);
  assert.doesNotMatch(source, /onStartService/);
});

test('学生详情集中承载服务权益、双码和家长关系', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.match(source, /基本资料/);
  assert.match(source, /每笔服务包、AI 用量、双码和有效期分别保留/);
  assert.match(source, /家长关系/);
  assert.doesNotMatch(source, /flex justify-end bg-black\/30/);
  assert.doesNotMatch(source, /<aside className="h-full/);
});

test('学生详情为命中规则的服务权益显示待跟进提醒', () => {
  const markup = renderToStaticMarkup(createElement(StudentServiceReminderCards, {
    reminders: [{
      id: 'RIGHT-1:activation', rightId: 'RIGHT-1', studentId: 'STU-001', packageName: '全科高量包',
      kind: 'activation' as const, title: '已办理服务尚未激活', description: '请联系学生完成激活。',
    }],
    onDismiss: () => undefined,
  }));

  assert.match(markup, /待跟进提醒/);
  assert.match(markup, /联系学生完成激活/);
  assert.match(markup, /标记已处理/);
});

test('没有学生时直接给出导入入口并说明教师可后续分配', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null, createElement(StudentView, {
    students: [], guardianships: [], authCodes: [], guardianBindingCodes: [], serviceRights: [], packages: initialServicePackages,
    teachers: initialTeachers, institutions: initialInstitutions, onAddStudents: () => undefined,
    onFulfillService: () => undefined, onRevokeAuthCode: () => undefined, onUpdateGuardianshipStatus: () => undefined,
  })));
  assert.match(markup, /还没有学生，先完成首次导入/);
  assert.match(markup, /未分配的学生先由机构管理员统一管理/);
  assert.doesNotMatch(markup, /步骤 1/);
});

test('加载学生数据时显示独立骨架状态', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null, createElement(StudentView, {
    students: [], guardianships: [], authCodes: [], guardianBindingCodes: [], serviceRights: [], packages: [], teachers: [],
    onFulfillService: () => undefined, onRevokeAuthCode: () => undefined, onUpdateGuardianshipStatus: () => undefined, isLoading: true,
  })));
  assert.match(markup, /学生数据加载中/);
  assert.doesNotMatch(markup, /还没有学生/);
});
