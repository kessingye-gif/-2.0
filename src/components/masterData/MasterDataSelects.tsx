import React from 'react';
import { useMasterData } from '../../masterData/MasterDataContext';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> { value: string; onChange: (value: string) => void; emptyLabel?: string; valueMode?: 'id' | 'name'; }
const className = 'w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]';
const MasterSelect = ({ items, value, onChange, emptyLabel = '请选择', valueMode = 'id', ...props }: SelectProps & { items: { id: string; name: string }[] }) => <select {...props} value={value} disabled={props.disabled || items.length === 0} onChange={(event) => onChange(event.target.value)} className={`${className} ${props.className || ''}`}><option value="">{items.length ? emptyLabel : '暂无可用数据'}</option>{items.map((item) => <option key={item.id} value={valueMode === 'id' ? item.id : item.name}>{item.name}</option>)}</select>;

export const StageSelect = (props: SelectProps) => { const { activeStages } = useMasterData(); return <MasterSelect {...props} items={activeStages} />; };
export const GradeSelect = ({ stageId, ...props }: SelectProps & { stageId?: string }) => { const { getActiveGrades } = useMasterData(); return <MasterSelect {...props} items={getActiveGrades(stageId)} />; };
export const SubjectSelect = ({ stageId, ...props }: SelectProps & { stageId?: string }) => { const { getActiveSubjects } = useMasterData(); return <MasterSelect {...props} items={getActiveSubjects(stageId)} />; };
export const TextbookSelect = ({ stageId, ...props }: SelectProps & { stageId?: string }) => { const { getActiveTextbooks } = useMasterData(); return <MasterSelect {...props} items={getActiveTextbooks(stageId)} />; };
