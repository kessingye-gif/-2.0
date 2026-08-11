import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { initialMasterData } from './initialData';
import { masterDataReducer, selectActive, selectActiveByStage, selectActiveGrades, validateMasterDataItem } from './masterData';
import type { AnyMasterData, MasterDataEntity, MasterDataState } from './types';

interface MasterDataContextValue {
  state: MasterDataState;
  activeStages: MasterDataState['stages'];
  getActiveGrades: (stageId?: string) => MasterDataState['grades'];
  getActiveSubjects: (stageId?: string) => MasterDataState['subjects'];
  getActiveTextbooks: (stageId?: string) => MasterDataState['textbooks'];
  addItem: (entity: MasterDataEntity, item: AnyMasterData) => string | null;
  updateItem: (entity: MasterDataEntity, id: string, changes: Partial<AnyMasterData>) => string | null;
  toggleStatus: (entity: MasterDataEntity, id: string) => void;
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

export const MasterDataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(masterDataReducer, initialMasterData);
  const value = useMemo<MasterDataContextValue>(() => ({
    state,
    activeStages: selectActive(state.stages),
    getActiveGrades: (stageId) => selectActiveGrades(state, stageId),
    getActiveSubjects: (stageId) => selectActiveByStage(state.subjects, stageId),
    getActiveTextbooks: (stageId) => selectActiveByStage(state.textbooks, stageId),
    addItem: (entity, item) => {
      const error = validateMasterDataItem(state[entity], item);
      if (!error) dispatch({ type: 'add', entity, item });
      return error;
    },
    updateItem: (entity, id, changes) => {
      const current = (state[entity] as AnyMasterData[]).find((item) => item.id === id);
      if (!current) return '记录不存在';
      const next = { ...current, ...changes } as AnyMasterData;
      const error = validateMasterDataItem(state[entity], next, id);
      if (!error) dispatch({ type: 'update', entity, id, changes });
      return error;
    },
    toggleStatus: (entity, id) => dispatch({ type: 'toggleStatus', entity, id }),
  }), [state]);
  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
};

export function useMasterData() {
  const value = useContext(MasterDataContext);
  if (!value) throw new Error('useMasterData 必须在 MasterDataProvider 内使用');
  return value;
}
