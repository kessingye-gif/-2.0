import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MasterDataProvider } from '../../masterData/MasterDataContext';
import { GradeSelect, StageSelect, SubjectSelect, TextbookSelect } from './MasterDataSelects';

test('公共选择组件统一读取基础数据', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement('div', null,
      createElement(StageSelect, { value: '', onChange: () => undefined, valueMode: 'name' }),
      createElement(GradeSelect, { value: '', onChange: () => undefined, valueMode: 'name', stageId: 'STAGE-JUNIOR' }),
      createElement(SubjectSelect, { value: '', onChange: () => undefined, valueMode: 'name', stageId: 'STAGE-JUNIOR' }),
      createElement(TextbookSelect, { value: '', onChange: () => undefined, valueMode: 'name', stageId: 'STAGE-JUNIOR' }),
    )
  ));

  assert.match(markup, />初中</);
  assert.match(markup, />初一</);
  assert.match(markup, />数学</);
  assert.match(markup, />人教版</);
  assert.doesNotMatch(markup, />高一</);
});
