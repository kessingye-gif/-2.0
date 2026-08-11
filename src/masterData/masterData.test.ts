import assert from 'node:assert/strict';
import test from 'node:test';
import { initialMasterData } from './initialData';
import { masterDataReducer, selectActiveGrades, validateMasterDataItem } from './masterData';

test('启用的年级按学段关联和排序返回', () => {
  const junior = initialMasterData.stages.find((item) => item.code === 'JUNIOR')!;
  assert.deepEqual(selectActiveGrades(initialMasterData, junior.id).map((item) => item.name), ['初一', '初二', '初三']);
});

test('同类基础数据的名称和编码不能重复', () => {
  assert.equal(validateMasterDataItem(initialMasterData.stages, { code: 'JUNIOR', name: '初中部' }), '编码已存在');
  assert.equal(validateMasterDataItem(initialMasterData.stages, { code: 'NEW-STAGE', name: '初中' }), '名称已存在');
});

test('reducer 统一处理新增、编辑和启停', () => {
  const added = masterDataReducer(initialMasterData, { type: 'add', entity: 'textbooks', item: { id: 'TB-NEW', code: 'HUA', name: '华师版', stageIds: [], status: 'active', sortOrder: 9 } });
  assert.equal(added.textbooks.at(-1)?.name, '华师版');
  const edited = masterDataReducer(added, { type: 'update', entity: 'textbooks', id: 'TB-NEW', changes: { name: '华东师大版' } });
  assert.equal(edited.textbooks.at(-1)?.name, '华东师大版');
  const toggled = masterDataReducer(edited, { type: 'toggleStatus', entity: 'textbooks', id: 'TB-NEW' });
  assert.equal(toggled.textbooks.at(-1)?.status, 'inactive');
});
