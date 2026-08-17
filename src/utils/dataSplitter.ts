import { KnowledgePointNode, QuestionItem, QuestionDifficulty, QuestionType } from '../types';

export const getKnowledgeHierarchyLabels = () => ['一级', '二级', '知识点'] as const;

export interface SingleTableRowInput {
  subject: string;
  stage: string;
  grade: string;
  textbook: string;
  // Content hierarchy fields: level 1, level 2, knowledge point
  level1Code?: string;
  level1Name: string;
  level2Code?: string;
  level2Name: string;
  level3Name: string;
  level3Code: string;
  prerequisiteKnowledgePoints?: string;
  coreContent?: string;
  learningObjective?: string;
  teachingSuggestion?: string;
  // Question fields
  title: string;
  content: string;
  options?: string[];
  answer: string;
  analysis: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
}

export interface SplitResult {
  newKnowledgePoints: KnowledgePointNode[];
  newQuestions: QuestionItem[];
  stats: {
    totalRows: number;
    kpCreatedCount: number;
    questionCreatedCount: number;
  };
}

/**
 * 接收包含“一级 + 二级 + 知识点 + 精选题”同行的单表数据，
 * 自动解耦提取为【内容层级表】与【精选题库表】两张独立关联表
 */
export function splitSingleTableData(
  rows: SingleTableRowInput[],
  existingKps: KnowledgePointNode[],
  existingQuestions: QuestionItem[]
): SplitResult {
  const kps = [...existingKps];
  const questions = [...existingQuestions];
  let kpCreatedCount = 0;
  let questionCreatedCount = 0;

  const newCreatedKps: KnowledgePointNode[] = [];
  const newCreatedQuestions: QuestionItem[] = [];

  rows.forEach((row, index) => {
    // 1. 查找或创建一级节点
    let l1 = kps.find(
      (k) => k.level === 1 && k.name === row.level1Name && k.subject === row.subject
    );
    if (!l1) {
      const l1Id = `KP-L1-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
      l1 = {
        id: l1Id,
        code: row.level1Code || `KP-L1-AUTO-${index + 1}`,
        name: row.level1Name,
        level: 1,
        subject: row.subject,
        grade: row.grade,
        textbook: row.textbook,
        questionCount: 0,
        status: 'active',
      };
      kps.push(l1);
      newCreatedKps.push(l1);
      kpCreatedCount++;
    }

    // 2. 查找或创建二级节点
    let l2 = kps.find(
      (k) =>
        k.level === 2 &&
        k.name === row.level2Name &&
        k.parentId === l1?.id &&
        k.subject === row.subject
    );
    if (!l2) {
      const l2Id = `KP-L2-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
      l2 = {
        id: l2Id,
        code: row.level2Code || `KP-L2-AUTO-${index + 1}`,
        name: row.level2Name,
        level: 2,
        subject: row.subject,
        grade: row.grade,
        textbook: row.textbook,
        parentId: l1.id,
        questionCount: 0,
        status: 'active',
      };
      kps.push(l2);
      newCreatedKps.push(l2);
      kpCreatedCount++;
    }

    // 3. 查找或创建知识点（可绑定试题）
    let l3 = kps.find(
      (k) =>
        k.level === 3 &&
        (k.code === row.level3Code || k.name === row.level3Name) &&
        k.parentId === l2?.id
    );
    if (!l3) {
      const l3Id = `KP-L3-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
      l3 = {
        id: l3Id,
        code: row.level3Code || `KP-L3-AUTO-${index + 1}`,
        name: row.level3Name,
        level: 3,
        subject: row.subject,
        grade: row.grade,
        textbook: row.textbook,
        parentId: l2.id,
        questionCount: 1,
        status: 'active',
        coreContent: row.coreContent,
        learningObjective: row.learningObjective,
        teachingSuggestion: row.teachingSuggestion,
      };
      kps.push(l3);
      newCreatedKps.push(l3);
      kpCreatedCount++;
    } else {
      l3.questionCount += 1;
    }

    // 4. 创建【精选题库表】记录，关联外键 l3.id
    const stagePrefix = row.stage ? `${row.stage} > ` : '';
    const pathName = `${stagePrefix}${row.subject} > ${row.level1Name} > ${row.level2Name} > ${row.level3Name}`;
    const questionId = `Q-AUTO-${Date.now().toString().slice(-5)}-${index + 1}`;
    const newQuestion: QuestionItem = {
      id: questionId,
      title: row.title || row.content.slice(0, 30) || '精选试题',
      content: row.content,
      options: row.options,
      answer: row.answer,
      analysis: row.analysis,
      subject: row.subject,
      stage: row.stage,
      grade: row.grade,
      textbook: row.textbook,
      difficulty: row.difficulty,
      type: row.type || '单选题',
      knowledgePointLevel1Id: l1.id,
      knowledgePointLevel2Id: l2.id,
      knowledgePointLevel3Id: l3.id,
      knowledgePointPathName: pathName,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    questions.push(newQuestion);
    newCreatedQuestions.push(newQuestion);
    questionCreatedCount++;
  });

  return {
    newKnowledgePoints: kps,
    newQuestions: questions,
    stats: {
      totalRows: rows.length,
      kpCreatedCount,
      questionCreatedCount,
    },
  };
}
