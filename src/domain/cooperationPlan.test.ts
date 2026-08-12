import assert from 'node:assert/strict';
import test from 'node:test';
import type { CooperationPlan, ContentPackageItem, ServicePackage } from '../types';
import { validateCooperationPlan } from './cooperationPlan';

const plan: CooperationPlan = {
  id: 'PLAN-001', code: 'PLAN-CZ-STANDARD', name: '初中理科标准方案',
  contentPackageIds: ['CP-01'], servicePackageIds: ['PKG-001'],
  suggestedInitialQuota: 50000, cooperationDurationDays: 365,
  status: 'active', version: 1, institutionCount: 0,
  createdAt: '2026-08-12', updatedAt: '2026-08-12',
};

const contentPackages: ContentPackageItem[] = [{
  id: 'CP-01', code: 'CP-MATH-CZ', name: '初中数学内容包', subjectId: 'SUB-01', subject: '数学',
  stage: '初中', kpCount: 156, questionCount: 1280, status: 'active', description: '初中数学',
}];

const servicePackages: ServicePackage[] = [{
  id: 'PKG-001', code: 'SP-01', name: '单科标准包', type: 'single_low', typeName: '单科低量包',
  quotaCost: 50, includedAiUsage: 200000, durationDays: 365, subjectRequirement: 'single', description: '标准服务', status: 'active',
}];

test('启用方案必须明确选择内容包和服务包', () => {
  assert.equal(validateCooperationPlan({ ...plan, contentPackageIds: [] }, { contentPackages, servicePackages }), '至少选择一个内容包');
  assert.equal(validateCooperationPlan({ ...plan, servicePackageIds: [] }, { contentPackages, servicePackages }), '至少选择一个服务包');
});

test('停用商品不能加入新方案', () => {
  const inactiveServices = servicePackages.map((item) => ({ ...item, status: 'inactive' as const }));
  assert.equal(validateCooperationPlan(plan, { contentPackages, servicePackages: inactiveServices }), '服务包“单科标准包”已停用');
});

test('草稿允许暂时不完整，启用方案通过完整目录校验', () => {
  assert.equal(validateCooperationPlan({ ...plan, status: 'draft', contentPackageIds: [], servicePackageIds: [] }, { contentPackages, servicePackages }), null);
  assert.equal(validateCooperationPlan(plan, { contentPackages, servicePackages }), null);
});
