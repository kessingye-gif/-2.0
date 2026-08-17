export type MasterDataStatus = 'active' | 'inactive';
export type MasterDataEntity = 'stages' | 'grades' | 'subjects' | 'textbooks' | 'knowledgeTypes' | 'questionTypes';

export interface MasterDataBase { id: string; code: string; name: string; status: MasterDataStatus; sortOrder: number; }
export interface EducationStage extends MasterDataBase {}
export interface GradeMaster extends MasterDataBase { stageId: string; }
export interface SubjectMaster extends MasterDataBase { stageIds: string[]; }
export interface TextbookMaster extends MasterDataBase { stageIds: string[]; }
export interface KnowledgeTypeMaster extends MasterDataBase { applicableSubjectIds: string[]; usageCount: number; }
export interface QuestionTypeMaster extends MasterDataBase {}

export interface MasterDataState {
  stages: EducationStage[];
  grades: GradeMaster[];
  subjects: SubjectMaster[];
  textbooks: TextbookMaster[];
  knowledgeTypes: KnowledgeTypeMaster[];
  questionTypes: QuestionTypeMaster[];
}

export type AnyMasterData = EducationStage | GradeMaster | SubjectMaster | TextbookMaster | KnowledgeTypeMaster | QuestionTypeMaster;

export type MasterDataAction =
  | { type: 'add'; entity: MasterDataEntity; item: AnyMasterData }
  | { type: 'update'; entity: MasterDataEntity; id: string; changes: Partial<AnyMasterData> }
  | { type: 'toggleStatus'; entity: MasterDataEntity; id: string }
  | { type: 'replaceAll'; state: MasterDataState };
