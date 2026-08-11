import type { GradeMaster, MasterDataAction, MasterDataBase, MasterDataState } from './types';

export const sortMasterData = <T extends MasterDataBase>(items: T[]) => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'zh-CN'));
export const selectActive = <T extends MasterDataBase>(items: T[]) => sortMasterData(items.filter((item) => item.status === 'active'));
export const selectActiveGrades = (state: MasterDataState, stageId?: string): GradeMaster[] => selectActive(state.grades.filter((item) => !stageId || item.stageId === stageId));
export const selectActiveByStage = <T extends MasterDataBase & { stageIds: string[] }>(items: T[], stageId?: string) => selectActive(items.filter((item) => !stageId || item.stageIds.length === 0 || item.stageIds.includes(stageId)));

export function validateMasterDataItem(items: MasterDataBase[], draft: Pick<MasterDataBase, 'code' | 'name'>, editingId?: string): string | null {
  const peers = items.filter((item) => item.id !== editingId);
  if (peers.some((item) => item.code.trim().toLowerCase() === draft.code.trim().toLowerCase())) return '编码已存在';
  if (peers.some((item) => item.name.trim() === draft.name.trim())) return '名称已存在';
  return null;
}

export function masterDataReducer(state: MasterDataState, action: MasterDataAction): MasterDataState {
  if (action.type === 'replaceAll') return action.state;
  const list = state[action.entity] as MasterDataBase[];
  if (action.type === 'add') return { ...state, [action.entity]: [...list, action.item] } as MasterDataState;
  if (action.type === 'update') return { ...state, [action.entity]: list.map((item) => item.id === action.id ? { ...item, ...action.changes } : item) } as MasterDataState;
  return { ...state, [action.entity]: list.map((item) => item.id === action.id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item) } as MasterDataState;
}
