import assert from 'node:assert/strict';
import test from 'node:test';
import { formatEducationMetadata, getEducationStage } from './educationStage';

test('maps junior and senior grade labels to their school stages', () => {
  assert.equal(getEducationStage('初一'), '初中');
  assert.equal(getEducationStage('初二'), '初中');
  assert.equal(getEducationStage('初三'), '初中');
  assert.equal(getEducationStage('高一'), '高中');
  assert.equal(getEducationStage('高二'), '高中');
  assert.equal(getEducationStage('高三'), '高中');
});

test('keeps an unknown grade value unchanged', () => {
  assert.equal(getEducationStage('小学六年级'), '小学六年级');
});

test('formats subject, school stage, and textbook consistently', () => {
  assert.equal(
    formatEducationMetadata({ subject: '数学', grade: '初二', textbook: '人教版' }),
    '数学 · 初中 · 人教版'
  );
});
