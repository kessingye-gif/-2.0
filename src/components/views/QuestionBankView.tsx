import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  KnowledgePointNode,
  QuestionItem,
  QuestionDifficulty,
  QuestionType,
  ContentPackageItem,
} from '../../types';
import { initialContentPackages } from '../../mockData';
import { SingleTableRowInput, splitSingleTableData } from '../../utils/dataSplitter';
import { formatEducationMetadata, getEducationStage } from '../../utils/educationStage';
import { getContentRoutePath, getContentRouteState } from '../../router/contentRoutes';
import { ContentPackageManager } from '../content/ContentPackageManager';
import { useMasterData } from '../../masterData/MasterDataContext';
import { StageSelect, SubjectSelect, TextbookSelect } from '../masterData/MasterDataSelects';
import { filterQuestions } from '../../utils/questionFilters';

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  stage: string;
  textbook: string;
  kpCount: number;
  questionCount: number;
  status: 'active' | 'inactive';
  sortOrder: number;
}

const initialSubjects: SubjectItem[] = [
  { id: 'SUB-01', code: 'MATH-CZ', name: '初中数学', stage: '初中', textbook: '人教版', kpCount: 156, questionCount: 1280, status: 'active', sortOrder: 1 },
  { id: 'SUB-02', code: 'PHYS-CZ', name: '初中物理', stage: '初中', textbook: '人教版', kpCount: 98, questionCount: 840, status: 'active', sortOrder: 2 },
  { id: 'SUB-03', code: 'CHEM-CZ', name: '初中化学', stage: '初中', textbook: '人教版', kpCount: 75, questionCount: 620, status: 'active', sortOrder: 3 },
  { id: 'SUB-04', code: 'ENG-CZ', name: '初中英语', stage: '初中', textbook: '人教版', kpCount: 110, questionCount: 950, status: 'active', sortOrder: 4 },
  { id: 'SUB-05', code: 'CHN-CZ', name: '初中语文', stage: '初中', textbook: '人教版', kpCount: 85, questionCount: 710, status: 'active', sortOrder: 5 },
  { id: 'SUB-06', code: 'MATH-GZ', name: '高中数学', stage: '高中', textbook: '人教版A版', kpCount: 210, questionCount: 1850, status: 'active', sortOrder: 6 },
  { id: 'SUB-07', code: 'PHYS-GZ', name: '高中物理', stage: '高中', textbook: '人教版', kpCount: 140, questionCount: 1120, status: 'active', sortOrder: 7 },
  { id: 'SUB-08', code: 'CHEM-GZ', name: '高中化学', stage: '高中', textbook: '人教版', kpCount: 120, questionCount: 980, status: 'active', sortOrder: 8 },
];

interface QuestionBankViewProps {
  knowledgePoints: KnowledgePointNode[];
  questions: QuestionItem[];
  onAddQuestion: (q: Omit<QuestionItem, 'id' | 'createdAt'>) => void;
  onUpdateQuestion: (id: string, updates: Partial<QuestionItem>) => void;
  onBatchImportQuestions: (parsedResult: {
    knowledgePoints: KnowledgePointNode[];
    questions: QuestionItem[];
    stats: { totalRows: number; kpCreatedCount: number; questionCreatedCount: number };
  }) => void;
  onAddKnowledgePoint: (kp: Omit<KnowledgePointNode, 'id' | 'questionCount'>) => void;
  authorizedContentPackageNames?: string[];
  canCreateContentPackage?: boolean;
}

// 模拟单表同行的 Excel 数据结构样本 (1行包含考点+试题)
const sampleSingleTableRows: SingleTableRowInput[] = [
  {
    stage: '初中',
    subject: '数学',
    grade: '初一',
    textbook: '人教版',
    level1Name: '数与代数',
    level2Name: '一元一次方程应用',
    level3Name: '行程问题与追及方程',
    level3Code: 'KP-MATH-301',
    title: '行程追及一元一次方程典型题',
    content: '甲乙两车相距 180 千米，甲车速度 60km/h，乙车速度 40km/h，同向而行，求甲车追上乙车所需的时间？',
    options: ['A. 9 小时', 'B. 4.5 小时', 'C. 3 小时', 'D. 6 小时'],
    answer: 'A. 9 小时',
    analysis: '设所需时间为 x 小时。根据追及问题公式：(60 - 40)x = 180，20x = 180，解得 x = 9。选 A。',
    difficulty: '提升',
    type: '单选题',
  },
  {
    stage: '初中',
    subject: '数学',
    grade: '初二',
    textbook: '人教版',
    level1Name: '数与代数',
    level2Name: '实数与二次根式',
    level3Name: '无理数的判定与识别',
    level3Code: 'KP-MATH-303',
    title: '无理数概念与常见类型判断',
    content: '下列各数中属于无理数的是（ ）',
    options: ['A. π', 'B. √2', 'C. 1/3', 'D. 0.101001...'],
    answer: 'A, B, D',
    analysis: '无理数即无限不循环小数。π、√2 及 0.101001... 均为无理数；1/3 为有理数。故正确答案为 A, B, D。',
    difficulty: '提升',
    type: '多选题',
  },
  {
    stage: '初中',
    subject: '数学',
    grade: '初二',
    textbook: '人教版',
    level1Name: '图形与几何',
    level2Name: '勾股定理',
    level3Name: '直角三角形求边长',
    level3Code: 'KP-MATH-304',
    title: '勾股定理已知两直角边求斜边',
    content: '直角三角形两直角边长分别为 3 和 4，则该直角三角形斜边长为 ___。',
    options: [],
    answer: '5',
    analysis: '根据勾股定理斜边 c = √(a² + b²) = √(3² + 4²) = √25 = 5。',
    difficulty: '基础',
    type: '填空题',
  },
  {
    stage: '初中',
    subject: '数学',
    grade: '初三',
    textbook: '人教版',
    level1Name: '数与代数',
    level2Name: '一元二次方程',
    level3Name: '配方法与公式法解方程',
    level3Code: 'KP-MATH-305',
    title: '一元二次方程配方法解题与分步演算',
    content: '已知一元二次方程 x² - 6x + 5 = 0，请用配方法求该方程的解，并列出完整解答与演算步骤。',
    options: [],
    answer: 'x₁ = 1, x₂ = 5',
    analysis: '【分步解答与评分标准】\n1. 移项：x² - 6x = -5；\n2. 配方：两边同时加9得 (x - 3)² = 4；\n3. 开方：x - 3 = ±2；\n4. 得解：x₁ = 5，x₂ = 1。',
    difficulty: '压轴',
    type: '解答题',
  },
];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  knowledgePoints,
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onBatchImportQuestions,
  onAddKnowledgePoint,
  authorizedContentPackageNames,
  canCreateContentPackage = true,
}) => {
  const { state: masterDataState, getActiveTextbooks } = useMasterData();
  const location = useLocation();
  const navigate = useNavigate();
  const contentRoute = getContentRouteState(location.pathname);
  useEffect(() => {
    if (location.pathname === '/platform/content') {
      navigate(getContentRoutePath('resources', 'knowledge-points'), { replace: true });
    }
  }, [location.pathname, navigate]);
  const activeSubTab: 'contentPackages' | 'questions' | 'tree' = contentRoute.section === 'packages'
    ? 'contentPackages'
    : contentRoute.resource === 'knowledge-points'
      ? 'tree'
      : contentRoute.resource;
  const setActiveSubTab = (tab: 'contentPackages' | 'questions' | 'tree') => {
    if (tab === 'contentPackages') {
      navigate(getContentRoutePath('packages'));
      return;
    }
    navigate(getContentRoutePath('resources', tab === 'tree' ? 'knowledge-points' : tab));
  };

  // Content Packages Management State
  const [contentPackages, setContentPackages] = useState<ContentPackageItem[]>(initialContentPackages);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ContentPackageItem | null>(null);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [packageStageFilter, setPackageStageFilter] = useState('');

  const [packageForm, setPackageForm] = useState({
    name: '',
    code: '',
    subjectId: 'SUB-01',
    subject: '初中数学',
    stage: '初中',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Subjects Management State
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);
  const sharedSubjects = useMemo<SubjectItem[]>(() => {
    const activeStages = masterDataState.stages.filter((item) => item.status === 'active');
    return masterDataState.subjects
      .filter((item) => item.status === 'active')
      .flatMap((subject) => (subject.stageIds.length ? subject.stageIds : activeStages.map((stage) => stage.id)).map((stageId) => {
        const stage = activeStages.find((item) => item.id === stageId);
        if (!stage) return null;
        const existing = subjects.find((item) => item.stage === stage.name && item.name.includes(subject.name));
        const textbook = getActiveTextbooks(stageId)[0]?.name ?? existing?.textbook ?? '未配置';
        return {
          id: existing?.id ?? `${subject.id}-${stageId}`,
          code: existing?.code ?? `${subject.code}-${stage.code}`,
          name: subject.name,
          stage: stage.name,
          textbook,
          kpCount: existing?.kpCount ?? 0,
          questionCount: existing?.questionCount ?? 0,
          status: 'active' as const,
          sortOrder: subject.sortOrder,
        };
      }).filter((item): item is SubjectItem => item !== null));
  }, [getActiveTextbooks, masterDataState, subjects]);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [subjectStageFilter, setSubjectStageFilter] = useState('');

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    stage: '初中',
    textbook: '人教版',
    sortOrder: 1,
    status: 'active' as 'active' | 'inactive',
  });

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('数学');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKnowledgePointId, setSelectedKnowledgePointId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isKpModalOpen, setIsKpModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportOpen] = useState(false);
  const [isKpBatchModalOpen, setIsKpBatchModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // Batch import preview mode inside modal
  const [importTab, setImportTab] = useState<'upload' | 'preview'>('upload');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Knowledge Point Batch Import state
  const [kpImportTab, setKpImportTab] = useState<'upload' | 'preview'>('upload');
  const [kpImportNotice, setKpImportNotice] = useState<string | null>(null);

  // Question Form
  const [qForm, setQForm] = useState({
    title: '',
    content: '',
    options: ['', '', '', ''],
    answer: '',
    analysis: '',
    subject: '数学',
    stage: '初中',
    grade: '初一',
    textbook: '人教版',
    difficulty: '基础' as QuestionDifficulty,
    type: '单选题' as QuestionType,
    knowledgePointLevel3Id: 'KP-L3-01',
    status: 'active' as 'active' | 'inactive',
  });

  // KP Form
  const [kpForm, setKpForm] = useState({
    code: '',
    name: '',
    level: 3 as 1 | 2 | 3,
    subject: '数学',
    grade: '初一',
    textbook: '人教版',
    parentId: 'KP-L2-01',
  });

  // Tree expandable state
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => {
    return new Set(knowledgePoints.filter((kp) => kp.level < 3).map((kp) => kp.id));
  });
  const [treeSearchTerm, setTreeSearchTerm] = useState<string>('');
  const [treeSubjectFilter, setTreeSubjectFilter] = useState<string>('');
  const [treeViewMode, setTreeViewMode] = useState<'table' | 'tree'>('table');

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleToggleExpandCollapse = () => {
    const expandableNodes = knowledgePoints.filter((kp) => kp.level < 3);
    if (expandedNodeIds.size >= expandableNodes.length && expandableNodes.length > 0) {
      setExpandedNodeIds(new Set());
    } else {
      setExpandedNodeIds(new Set(expandableNodes.map((kp) => kp.id)));
    }
  };

  const handleExpandAllNodes = () => {
    setExpandedNodeIds(new Set(knowledgePoints.filter((kp) => kp.level < 3).map((kp) => kp.id)));
  };

  const handleCollapseAllNodes = () => {
    setExpandedNodeIds(new Set());
  };
  const level3Points = useMemo(() => {
    return knowledgePoints.filter((kp) => kp.level === 3 && kp.status === 'active');
  }, [knowledgePoints]);

  // Flattened Knowledge Points for Web Table View
  const flatKnowledgeRows = useMemo(() => {
    const rows: {
      id: string;
      l1Code: string;
      l1Name: string;
      l2Code: string;
      l2Name: string;
      l3Code: string;
      l3Name: string;
      l3Item?: KnowledgePointNode;
      l2Item?: KnowledgePointNode;
      l1Item?: KnowledgePointNode;
      subject: string;
      grade: string;
      textbook: string;
      boundCount: number;
    }[] = [];

    const l1Map = new Map<string, KnowledgePointNode>();
    const l2Map = new Map<string, KnowledgePointNode>();

    knowledgePoints.forEach((kp) => {
      if (kp.level === 1) l1Map.set(kp.id, kp);
      if (kp.level === 2) l2Map.set(kp.id, kp);
    });

    const handledL2Ids = new Set<string>();
    const handledL1Ids = new Set<string>();

    knowledgePoints.filter((kp) => kp.level === 3).forEach((l3) => {
      const l2 = l3.parentId ? l2Map.get(l3.parentId) : undefined;
      const l1 = l2 && l2.parentId ? l1Map.get(l2.parentId) : (l3.parentId ? l1Map.get(l3.parentId) : undefined);

      if (l2) handledL2Ids.add(l2.id);
      if (l1) handledL1Ids.add(l1.id);

      const boundQuestions = questions.filter(
        (q) => q.knowledgePointLevel3Id === l3.id && q.status === 'active'
      );

      rows.push({
        id: l3.id,
        l1Code: l1?.code || '-',
        l1Name: l1?.name || '未命名章',
        l2Code: l2?.code || '-',
        l2Name: l2?.name || '未命名节',
        l3Code: l3.code,
        l3Name: l3.name,
        l3Item: l3,
        l2Item: l2,
        l1Item: l1,
        subject: l3.subject,
        grade: l3.grade,
        textbook: l3.textbook,
        boundCount: boundQuestions.length,
      });
    });

    // L2 without L3
    knowledgePoints.filter((kp) => kp.level === 2 && !handledL2Ids.has(kp.id)).forEach((l2) => {
      const l1 = l2.parentId ? l1Map.get(l2.parentId) : undefined;
      if (l1) handledL1Ids.add(l1.id);

      rows.push({
        id: l2.id,
        l1Code: l1?.code || '-',
        l1Name: l1?.name || '一级模块',
        l2Code: l2.code,
        l2Name: l2.name,
        l3Code: '-',
        l3Name: '暂无关联知识点',
        l2Item: l2,
        l1Item: l1,
        subject: l2.subject,
        grade: l2.grade,
        textbook: l2.textbook,
        boundCount: 0,
      });
    });

    // L1 without L2
    knowledgePoints.filter((kp) => kp.level === 1 && !handledL1Ids.has(kp.id)).forEach((l1) => {
      rows.push({
        id: l1.id,
        l1Code: l1.code,
        l1Name: l1.name,
        l2Code: '-',
        l2Name: '暂无关联节',
        l3Code: '-',
        l3Name: '暂无关联知识点',
        l1Item: l1,
        subject: l1.subject,
        grade: l1.grade,
        textbook: l1.textbook,
        boundCount: 0,
      });
    });

    return rows;
  }, [knowledgePoints, questions]);

  const filteredFlatRows = useMemo(() => {
    return flatKnowledgeRows.filter((r) => {
      const matchesSubject = !treeSubjectFilter || r.subject === treeSubjectFilter;
      const term = treeSearchTerm.toLowerCase().trim();
      if (!term) return matchesSubject;

      const matchesL1 = r.l1Name.toLowerCase().includes(term) || r.l1Code.toLowerCase().includes(term);
      const matchesL2 = r.l2Name.toLowerCase().includes(term) || r.l2Code.toLowerCase().includes(term);
      const matchesL3 = r.l3Name.toLowerCase().includes(term) || r.l3Code.toLowerCase().includes(term);

      return matchesSubject && (matchesL1 || matchesL2 || matchesL3);
    });
  }, [flatKnowledgeRows, treeSubjectFilter, treeSearchTerm]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        !subjectSearchTerm ||
        s.name.includes(subjectSearchTerm) ||
        s.code.toLowerCase().includes(subjectSearchTerm.toLowerCase());
      const matchesStage = !subjectStageFilter || s.stage === subjectStageFilter;
      return matchesSearch && matchesStage;
    });
  }, [subjects, subjectSearchTerm, subjectStageFilter]);

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      code: `SUB-${Date.now().toString().slice(-4)}`,
      stage: '初中',
      textbook: '人教版',
      sortOrder: subjects.length + 1,
      status: 'active',
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectForm({
      name: sub.name,
      code: sub.code,
      stage: sub.stage,
      textbook: sub.textbook,
      sortOrder: sub.sortOrder,
      status: sub.status,
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;

    if (editingSubject) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === editingSubject.id
            ? {
                ...s,
                name: subjectForm.name,
                code: subjectForm.code,
                stage: subjectForm.stage,
                textbook: subjectForm.textbook,
                sortOrder: subjectForm.sortOrder,
                status: subjectForm.status,
              }
            : s
        )
      );
    } else {
      const newSub: SubjectItem = {
        id: `SUB-${Date.now().toString().slice(-5)}`,
        name: subjectForm.name,
        code: subjectForm.code || `SUB-${Date.now().toString().slice(-4)}`,
        stage: subjectForm.stage,
        textbook: subjectForm.textbook,
        kpCount: 0,
        questionCount: 0,
        status: subjectForm.status,
        sortOrder: subjectForm.sortOrder,
      };
      setSubjects((prev) => [...prev, newSub]);
    }
    setIsSubjectModalOpen(false);
  };

  const handleToggleSubjectStatus = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
      )
    );
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // Filtered Content Packages
  const scopedContentPackages = useMemo(
    () => authorizedContentPackageNames === undefined
      ? contentPackages
      : contentPackages.filter((pkg) => authorizedContentPackageNames.includes(pkg.name)),
    [contentPackages, authorizedContentPackageNames],
  );

  const filteredContentPackages = useMemo(() => {
    return scopedContentPackages.filter((pkg) => {
      const matchesSearch =
        !packageSearchTerm ||
        pkg.name.includes(packageSearchTerm) ||
        pkg.code.toLowerCase().includes(packageSearchTerm.toLowerCase());
      const matchesStage = !packageStageFilter || pkg.stage === packageStageFilter;
      return matchesSearch && matchesStage;
    });
  }, [scopedContentPackages, packageSearchTerm, packageStageFilter]);

  const handleOpenAddPackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      code: `CP-${Date.now().toString().slice(-4)}`,
      subjectId: 'SUB-01',
      subject: '初中数学',
      stage: '初中',
      description: '',
      status: 'active',
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: ContentPackageItem) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      code: pkg.code,
      subjectId: pkg.subjectId,
      subject: pkg.subject,
      stage: pkg.stage,
      description: pkg.description,
      status: pkg.status,
    });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim()) return;

    if (editingPackage) {
      setContentPackages((prev) =>
        prev.map((p) =>
          p.id === editingPackage.id
            ? {
                ...p,
                name: packageForm.name,
                code: packageForm.code,
                subjectId: packageForm.subjectId,
                subject: packageForm.subject,
                stage: packageForm.stage,
                description: packageForm.description,
                status: packageForm.status,
              }
            : p
        )
      );
    } else {
      const newPkg: ContentPackageItem = {
        id: `CP-${Date.now().toString().slice(-5)}`,
        name: packageForm.name,
        code: packageForm.code || `CP-${Date.now().toString().slice(-4)}`,
        subjectId: packageForm.subjectId,
        subject: packageForm.subject,
        stage: packageForm.stage,
        description: packageForm.description,
        kpCount: 0,
        questionCount: 0,
        status: packageForm.status,
      };
      setContentPackages((prev) => [...prev, newPkg]);
    }
    setIsPackageModalOpen(false);
  };

  const handleTogglePackageStatus = (id: string) => {
    setContentPackages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
      )
    );
  };

  const handleDeletePackage = (id: string) => {
    setContentPackages((prev) => prev.filter((p) => p.id !== id));
  };

  // Points without bound questions
  const noQuestionPoints = useMemo(() => {
    return level3Points.filter((kp) => {
      const boundCount = questions.filter(
        (q) => q.knowledgePointLevel3Id === kp.id && q.status === 'active'
      ).length;
      return boundCount === 0;
    });
  }, [level3Points, questions]);

  const isChoiceType = (type: string) => type === '单选题' || type === '多选题' || type === '选择题';

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return filterQuestions(questions, { searchTerm, knowledgePointId: selectedKnowledgePointId }).filter((q) => {
      const matchesSubject = !subjectFilter || q.subject === subjectFilter;
      const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
      const matchesType =
        !typeFilter ||
        q.type === typeFilter ||
        (typeFilter === '选择题' && isChoiceType(q.type)) ||
        (typeFilter === '单选题' && (q.type === '单选题' || q.type === '选择题'));
      return matchesSubject && matchesDifficulty && matchesType;
    });
  }, [questions, subjectFilter, difficultyFilter, typeFilter, searchTerm, selectedKnowledgePointId]);

  const handleViewBoundQuestions = (knowledgePointId: string) => {
    setSearchTerm('');
    const knowledgePoint = knowledgePoints.find((item) => item.id === knowledgePointId);
    if (knowledgePoint) setSubjectFilter(knowledgePoint.subject);
    setSelectedKnowledgePointId(knowledgePointId);
    setActiveSubTab('questions');
  };

  const handleOpenKnowledgePointImport = () => {
    setKpImportNotice(null);
    setIsKpBatchModalOpen(true);
    navigate(getContentRoutePath('resources', 'knowledge-points'));
  };

  const handleOpenKnowledgePointCreate = () => {
    setIsKpModalOpen(true);
    navigate(getContentRoutePath('resources', 'knowledge-points'));
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [subjectFilter, difficultyFilter, typeFilter, searchTerm, selectedKnowledgePointId, pageSize]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedQuestions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, safeCurrentPage, pageSize]);

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQForm({
      title: '',
      content: '',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      answer: 'A',
      analysis: '',
      subject: subjectFilter || '数学',
      stage: '初中',
      grade: '初一',
      textbook: '人教版',
      difficulty: '基础',
      type: '单选题',
      knowledgePointLevel3Id: level3Points[0]?.id || 'KP-L3-01',
      status: 'active',
    });
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
    setQForm({
      title: q.title,
      content: q.content,
      options: q.options || ['', '', '', ''],
      answer: q.answer,
      analysis: q.analysis,
      subject: q.subject,
      stage: q.stage,
      grade: q.grade,
      textbook: q.textbook,
      difficulty: q.difficulty,
      type: q.type || '单选题',
      knowledgePointLevel3Id: q.knowledgePointLevel3Id,
      status: q.status,
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const kp3 = level3Points.find((kp) => kp.id === qForm.knowledgePointLevel3Id);
    const kp2 = knowledgePoints.find((kp) => kp.id === kp3?.parentId);
    const kp1 = knowledgePoints.find((kp) => kp.id === kp2?.parentId);

    const pathName = kp3
      ? `${qForm.subject} > ${kp2?.name || '节'} > ${kp3.name}`
      : `${qForm.subject} > 知识点`;

    const finalTitle = qForm.title.trim() || qForm.content.slice(0, 30).trim() || '精选试题';

    if (editingQuestion) {
      onUpdateQuestion(editingQuestion.id, {
        title: finalTitle,
        content: qForm.content,
        options: isChoiceType(qForm.type) ? qForm.options : undefined,
        answer: qForm.answer,
        analysis: qForm.analysis,
        subject: qForm.subject,
        stage: qForm.stage,
        grade: qForm.grade,
        textbook: qForm.textbook,
        difficulty: qForm.difficulty,
        type: qForm.type,
        knowledgePointLevel1Id: kp1?.id || 'KP-L1-01',
        knowledgePointLevel2Id: kp2?.id || 'KP-L2-01',
        knowledgePointLevel3Id: qForm.knowledgePointLevel3Id,
        knowledgePointPathName: pathName,
        status: qForm.status,
      });
    } else {
      onAddQuestion({
        title: finalTitle,
        content: qForm.content,
        options: isChoiceType(qForm.type) ? qForm.options : undefined,
        answer: qForm.answer,
        analysis: qForm.analysis,
        subject: qForm.subject,
        stage: qForm.stage,
        grade: qForm.grade,
        textbook: qForm.textbook,
        difficulty: qForm.difficulty,
        type: qForm.type,
        knowledgePointLevel1Id: kp1?.id || 'KP-L1-01',
        knowledgePointLevel2Id: kp2?.id || 'KP-L2-01',
        knowledgePointLevel3Id: qForm.knowledgePointLevel3Id,
        knowledgePointPathName: pathName,
        status: qForm.status,
      });
    }

    setIsQuestionModalOpen(false);
  };

  const handleSaveKnowledgePoint = (e: React.FormEvent) => {
    e.preventDefault();
    onAddKnowledgePoint({
      code: kpForm.code || `KP-${Date.now().toString().slice(-6)}`,
      name: kpForm.name,
      level: kpForm.level,
      subject: kpForm.subject,
      grade: kpForm.grade,
      textbook: kpForm.textbook,
      parentId: kpForm.level > 1 ? kpForm.parentId : undefined,
      status: 'active',
    });
    setIsKpModalOpen(false);
  };

  // 模拟批量导入考点树示例结构
  const sampleKpBatchRows = [
    {
      subject: '数学',
      grade: '初一',
      textbook: '人教版',
      level1Code: 'KP-MATH-L1-03',
      level1Name: '函数及其图像',
      level2Code: 'KP-MATH-L2-05',
      level2Name: '一次函数与二元一次方程组',
      level3Code: 'KP-MATH-L3-12',
      level3Name: '一次函数图像交点与方程组求解',
    },
    {
      subject: '物理',
      grade: '初二',
      textbook: '人教版',
      level1Code: 'KP-PHYS-L1-02',
      level1Name: '能量与功',
      level2Code: 'KP-PHYS-L2-03',
      level2Name: '机械效率与动滑轮应用',
      level3Code: 'KP-PHYS-L3-08',
      level3Name: '滑轮组机械效率公式 η=W有/W总 计算',
    },
    {
      subject: '化学',
      grade: '初三',
      textbook: '人教版',
      level1Code: 'KP-CHEM-L1-02',
      level1Name: '身边的化学物质',
      level2Code: 'KP-CHEM-L2-04',
      level2Name: '金属与金属材料',
      level3Code: 'KP-CHEM-L3-10',
      level3Name: '金属活动性顺序表探究与置换反应',
    },
  ];

  const handleExecuteKpBatchImport = () => {
    sampleKpBatchRows.forEach((row) => {
      // 1. Level 1
      let l1 = knowledgePoints.find(
        (kp) => kp.level === 1 && kp.subject === row.subject && (kp.name === row.level1Name || kp.code === row.level1Code)
      );
      if (!l1) {
        onAddKnowledgePoint({
          code: row.level1Code,
          name: row.level1Name,
          level: 1,
          subject: row.subject,
          grade: row.grade,
          textbook: row.textbook,
          status: 'active',
        });
      }

      // 2. Level 2
      let l2 = knowledgePoints.find(
        (kp) => kp.level === 2 && kp.subject === row.subject && (kp.name === row.level2Name || kp.code === row.level2Code)
      );
      if (!l2) {
        onAddKnowledgePoint({
          code: row.level2Code,
          name: row.level2Name,
          level: 2,
          subject: row.subject,
          grade: row.grade,
          textbook: row.textbook,
          parentId: l1?.id || 'KP-L1-01',
          status: 'active',
        });
      }

      // 3. Level 3
      let l3 = knowledgePoints.find(
        (kp) => kp.level === 3 && kp.subject === row.subject && (kp.name === row.level3Name || kp.code === row.level3Code)
      );
      if (!l3) {
        onAddKnowledgePoint({
          code: row.level3Code,
          name: row.level3Name,
          level: 3,
          subject: row.subject,
          grade: row.grade,
          textbook: row.textbook,
          parentId: l2?.id || 'KP-L2-01',
          status: 'active',
        });
      }
    });

    setKpImportNotice(
      `成功批量导入内容层级！从 Excel 解析并自动关联：新增/构建 3 个章、3 个节和 3 个知识点，层级完整度 100%！`
    );
  };

  // 执行单表拆分为两张表的批量导入逻辑
  const handleExecuteSingleTableImport = (customRows?: SingleTableRowInput[]) => {
    const rowsToProcess = customRows || sampleSingleTableRows;
    const splitResult = splitSingleTableData(rowsToProcess, knowledgePoints, questions);
    
    onBatchImportQuestions(splitResult);
    setImportNotice(
      `成功导入！从 1 张单表中提取 ${splitResult.stats.totalRows} 行数据，后台自动解耦新增了 ${splitResult.stats.kpCreatedCount} 个章、节或知识点节点，以及 ${splitResult.stats.questionCreatedCount} 道精选题，关联全部就绪！`
    );
  };

  if (contentRoute.section === 'packages') {
    return (
      <div className="space-y-4">
        <div className="flex w-fit items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-2xs">
          <button type="button" onClick={() => navigate(getContentRoutePath('resources', 'knowledge-points'))} className="rounded-lg px-4 py-2 text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer">内容资源</button>
          <button type="button" className="rounded-lg bg-[#EAF7EF] px-4 py-2 text-[13px] font-bold text-[#0E7D3E]">内容包 ({scopedContentPackages.length})</button>
        </div>
        <ContentPackageManager
          subjects={sharedSubjects}
          onOpenResource={(resource) => navigate(getContentRoutePath('resources', resource))}
          knowledgePoints={knowledgePoints}
          onViewQuestions={handleViewBoundQuestions}
          onBatchImportKnowledgePoints={handleOpenKnowledgePointImport}
          onAddKnowledgePoint={handleOpenKnowledgePointCreate}
          authorizedPackageNames={authorizedContentPackageNames}
          canCreatePackage={canCreateContentPackage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('tree')}
          className="rounded-lg bg-[#EAF7EF] px-4 py-2 text-[13px] font-bold text-[#0E7D3E] cursor-pointer"
        >
          内容资源
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('contentPackages')}
          className="rounded-lg px-4 py-2 text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
        >
          内容包 ({scopedContentPackages.length})
        </button>
      </div>

      {/* Sub Navigation Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E8F0] pb-1 gap-3">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveSubTab('questions')}
            className={`pb-2 text-[13.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'questions'
                ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            精选题库 ({questions.length})
          </button>

          <button
            onClick={() => setActiveSubTab('tree')}
            className={`pb-2 text-[13.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'tree'
                ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            知识点 ({knowledgePoints.length})
          </button>

        </div>

        <div className="flex items-center gap-2 mb-1">
          {activeSubTab === 'contentPackages' ? (
            <button
              onClick={handleOpenAddPackage}
              className="flex items-center gap-1 bg-[#16B45B] text-white px-3 py-1 rounded-lg font-bold text-[12.5px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>新增内容包</span>
            </button>
          ) : activeSubTab === 'tree' ? (
            <>
              <button
                type="button"
                onClick={handleToggleExpandCollapse}
                className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-2.5 py-1 rounded-lg font-bold text-[12.5px] hover:bg-gray-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {expandedNodeIds.size >= knowledgePoints.filter((kp) => kp.level < 3).length && knowledgePoints.filter((kp) => kp.level < 3).length > 0
                    ? 'unfold_less'
                    : 'unfold_more'}
                </span>
                <span>
                  {expandedNodeIds.size >= knowledgePoints.filter((kp) => kp.level < 3).length && knowledgePoints.filter((kp) => kp.level < 3).length > 0
                    ? '全部折叠'
                    : '全部展开'}
                </span>
              </button>

              <button
                onClick={() => {
                  setKpImportNotice(null);
                  setIsKpBatchModalOpen(true);
                }}
                className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-2.5 py-1 rounded-lg font-bold text-[12.5px] hover:bg-gray-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>批量导入知识点</span>
              </button>

              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center gap-1 bg-[#F5B700] text-[#0F172A] px-2.5 py-1 rounded-lg font-bold text-[12.5px] hover:bg-[#E0A700] transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>补充试题</span>
              </button>

              <button
                onClick={() => setIsKpModalOpen(true)}
                className="flex items-center gap-1 bg-[#16B45B] text-white px-3 py-1 rounded-lg font-bold text-[12.5px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>新增章 / 节 / 知识点</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setImportNotice(null);
                  setIsBatchImportOpen(true);
                }}
                className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-2.5 py-1 rounded-lg font-bold text-[12.5px] hover:bg-gray-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">table_view</span>
                <span>批量导入</span>
              </button>

              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center gap-1 bg-[#16B45B] text-white px-3 py-1 rounded-lg font-bold text-[12.5px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>录入试题</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeSubTab === 'contentPackages' ? (
        <div className="space-y-4">
          {/* Package Filters Bar */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2 text-[#94A3B8] text-[18px]">search</span>
                <input
                  type="text"
                  value={packageSearchTerm}
                  onChange={(e) => setPackageSearchTerm(e.target.value)}
                  placeholder="搜索内容包名称或代码..."
                  className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-[13px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="w-36">
                <select
                  value={packageStageFilter}
                  onChange={(e) => setPackageStageFilter(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none cursor-pointer font-bold focus:border-[#16B45B]"
                >
                  <option value="">全部学段</option>
                  <option value="小学">小学</option>
                  <option value="初中">初中</option>
                  <option value="高中">高中</option>
                </select>
              </div>
            </div>

            <div className="text-[12px] text-[#64748B]">
              共 <strong className="text-[#0F172A]">{filteredContentPackages.length}</strong> 个内容包
            </div>
          </div>

          {/* Package Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                  <tr>
                    <th className="py-3 px-4">内容包名称</th>
                    <th className="py-3 px-4">内容包代码</th>
                    <th className="py-3 px-4">内容来源</th>
                    <th className="py-3 px-4 text-center">包含知识点</th>
                    <th className="py-3 px-4 text-center">包含试题</th>
                    <th className="py-3 px-4 text-center">状态</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                  {filteredContentPackages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                        <span className="material-symbols-outlined text-[36px] block mb-1">find_in_page</span>
                        暂无相关内容包数据
                      </td>
                    </tr>
                  ) : (
                    filteredContentPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#0F172A]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#E8F7EE] text-[#16B45B] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                            </div>
                            <div>
                              <div>{pkg.name}</div>
                              <div className="text-[11px] text-[#94A3B8] font-normal">{pkg.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[12px] text-[#64748B]">{pkg.code}</td>
                        <td className="py-3 px-4">
                          {(() => {
                            const sourceSubject = subjects.find((subject) => subject.id === pkg.subjectId);
                            return (
                              <div>
                                <div className="font-bold text-[#334155]">{sourceSubject?.name || pkg.subject}</div>
                                <div className="mt-1 text-[11px] text-[#94A3B8]">{sourceSubject?.stage || pkg.stage} · {sourceSubject?.textbook || '未配置版本'}</div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#0F172A]">{pkg.kpCount}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#16B45B]">{pkg.questionCount}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePackageStatus(pkg.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              pkg.status === 'active'
                                ? 'bg-[#E8F7EE] text-[#16B45B]'
                                : 'bg-[#F1F5F9] text-[#94A3B8]'
                            }`}
                          >
                            {pkg.status === 'active' ? '已上架' : '已停用'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="text-[#16B45B] hover:underline font-bold text-[12px] cursor-pointer"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="text-[#EF4444] hover:underline font-bold text-[12px] cursor-pointer"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'questions' ? (
        <div className="space-y-4">
          {/* Question Filters */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center gap-4 shadow-2xs">
            <div className="w-36">
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">学科筛选</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[13px] outline-none cursor-pointer focus:border-[#16B45B]"
              >
                <option value="">全部学科</option>
                <option value="数学">数学</option>
                <option value="物理">物理</option>
                <option value="化学">化学</option>
                <option value="生物">生物</option>
              </select>
            </div>

            <div className="w-36">
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">难度等级</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[13px] outline-none cursor-pointer font-bold focus:border-[#16B45B]"
              >
                <option value="">全部难度</option>
                <option value="基础">基础题</option>
                <option value="提升">提升题</option>
                <option value="压轴">压轴题</option>
              </select>
            </div>

            <div className="w-36">
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">题型</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[13px] outline-none cursor-pointer focus:border-[#16B45B]"
              >
                <option value="">全部题型</option>
                <option value="单选题">单选题</option>
                <option value="多选题">多选题</option>
                <option value="选择题">全部选择题</option>
                <option value="填空题">填空题</option>
                <option value="解答题">解答题</option>
                <option value="判断题">判断题</option>
                <option value="综合题">综合题</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">关键字查找</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSelectedKnowledgePointId('');
                  setSearchTerm(e.target.value);
                }}
                placeholder="搜索题干、解题解析或题目编号..."
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#16B45B]"
              />
            </div>
          </div>

          {selectedKnowledgePointId && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#BBE7CC] bg-[#F0FBF4] px-4 py-2.5 text-[12px]">
              <span className="text-[#0E7D3E]">正在查看知识点：<strong>{knowledgePoints.find((item) => item.id === selectedKnowledgePointId)?.name || selectedKnowledgePointId}</strong> 的关联题目</span>
              <button type="button" onClick={() => setSelectedKnowledgePointId('')} className="font-bold text-[#16B45B] hover:underline">查看全部题目</button>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#64748B]">
                <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2 block">
                  quiz
                </span>
                <p className="text-[14px] font-medium">暂无符合条件的精选题记录</p>
              </div>
            ) : (
              paginatedQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#16B45B] transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11.5px] font-bold font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#0F172A]">
                        {q.id}
                      </span>

                      <span
                        className={`text-[12px] font-bold px-2 py-0.5 rounded ${
                          q.difficulty === '基础'
                            ? 'bg-[#E8F7EE] text-[#16B45B]'
                            : q.difficulty === '提升'
                            ? 'bg-[#EFF6FF] text-[#2563EB]'
                            : 'bg-[#FEF2F2] text-[#DC2626]'
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      <span className="text-[12px] bg-[#E8F7EE] text-[#0E7D3E] px-2.5 py-0.5 rounded font-bold">
                        {q.subject} · {q.type}
                      </span>

                      <span className="text-[12px] text-[#64748B] font-mono">
                        {q.stage} / {q.grade} ({q.textbook})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="text-[12px] text-[#16B45B] font-bold hover:underline cursor-pointer"
                      >
                        编辑题目
                      </button>
                      <button
                        onClick={() =>
                          onUpdateQuestion(q.id, {
                            status: q.status === 'active' ? 'inactive' : 'active',
                          })
                        }
                        className={`text-[12px] font-bold cursor-pointer ${
                          q.status === 'active' ? 'text-gray-400 hover:text-red-500' : 'text-[#16B45B]'
                        }`}
                      >
                        {q.status === 'active' ? '停用' : '启用'}
                      </button>
                    </div>
                  </div>

                  {/* Title & Content */}
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-[15px]">{q.title}</h4>
                    <p className="text-[13.5px] text-[#0F172A] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-1.5 font-mono">
                      {q.content}
                    </p>

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[13px] text-[#334155]">
                        {q.options.map((opt, i) => (
                          <div key={i} className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Answer & Analysis */}
                  <div className="bg-[#E8F7EE]/60 border border-[#16B45B]/20 rounded-xl p-3 text-[13px] space-y-1">
                    <p className="font-bold text-[#0E7D3E]">正确答案：{q.answer}</p>
                    <p className="text-[#334155]">
                      <strong className="text-[#0F172A]">解析：</strong> {q.analysis}
                    </p>
                  </div>

                  {/* Knowledge Point Path & ID */}
                  <div className="text-[11.5px] text-[#64748B] flex items-center justify-between font-mono pt-1">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#16B45B]">link</span>
                      关联知识点：<strong className="text-[#0F172A]">{q.knowledgePointPathName}</strong>
                    </div>
                    <div className="text-[10.5px] text-[#94A3B8]">
                      知识点 ID: <span className="font-bold text-[#16B45B]">{q.knowledgePointLevel3Id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {filteredQuestions.length > 0 && (
            <div className="px-5 py-3 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs flex items-center justify-between text-[13px] text-[#64748B]">
              <div>共 {filteredQuestions.length} 条</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer text-[#94A3B8]"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                  ) {
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-[12.5px] font-bold flex items-center justify-center border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#E8F7EE] text-[#16B45B] border-[#16B45B]/20'
                            : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === safeCurrentPage - 2 && pageNum > 1) ||
                    (pageNum === safeCurrentPage + 2 && pageNum < totalPages)
                  ) {
                    return (
                      <span key={pageNum} className="w-7 h-7 flex items-center justify-center text-[#94A3B8] text-[12px]">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer text-[#94A3B8]"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="ml-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1 px-2 text-[12px] outline-none text-[#334155] cursor-pointer"
                >
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Knowledge Point Tree View */
        <div className="space-y-4">
          {/* Tree Search & Subject Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2 text-[#94A3B8] text-[18px]">search</span>
                <input
                  type="text"
                  value={treeSearchTerm}
                  onChange={(e) => setTreeSearchTerm(e.target.value)}
                  placeholder="搜索章、节、知识点名称或编码..."
                  className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-[13px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="w-36">
                <select
                  value={treeSubjectFilter}
                  onChange={(e) => setTreeSubjectFilter(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none cursor-pointer font-bold focus:border-[#16B45B]"
                >
                  <option value="">全部学科</option>
                  <option value="数学">数学</option>
                  <option value="物理">物理</option>
                  <option value="化学">化学</option>
                  <option value="生物">生物</option>
                </select>
              </div>
            </div>

            {/* Tree Summary Metrics & View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-3 text-[12px]">
              <div className="flex items-center gap-2 font-mono">
                <span className="bg-[#E8F7EE] text-[#0E7D3E] border border-[#16B45B]/20 px-2.5 py-1 rounded-lg font-bold">
                  知识点: {knowledgePoints.filter(kp => kp.level === 3).length} 个
                </span>
                <span className="bg-[#FFFBEB] text-[#D97706] border border-[#F5B700]/30 px-2.5 py-1 rounded-lg font-bold">
                  待补充试题: {noQuestionPoints.length} 个
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] p-0.5 rounded-xl font-bold ml-auto">
                <button
                  type="button"
                  onClick={() => setTreeViewMode('table')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer text-[12px] ${
                    treeViewMode === 'table'
                      ? 'bg-white text-[#16B45B] shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  平铺表格 (Web端推荐)
                </button>
                <button
                  type="button"
                  onClick={() => setTreeViewMode('tree')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer text-[12px] ${
                    treeViewMode === 'tree'
                      ? 'bg-white text-[#16B45B] shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  树状层级
                </button>
              </div>
            </div>
          </div>

          {/* Web Data Table View or Tree Card View */}
          {treeViewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[1180px] text-left border-collapse text-[13px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">学科</th>
                      <th className="px-5 py-3.5 font-bold">学段</th>
                      <th className="px-5 py-3.5 font-bold">章</th>
                      <th className="px-5 py-3.5 font-bold">节</th>
                      <th className="px-5 py-3.5 font-bold">知识点</th>
                      <th className="px-5 py-3.5 font-bold">教材版本</th>
                      <th className="px-5 py-3.5 font-bold">关联精选题</th>
                      <th className="px-5 py-3.5 font-bold text-right">快捷操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredFlatRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">
                          <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2 block">
                            search_off
                          </span>
                          <p>没有匹配的章、节或知识点</p>
                        </td>
                      </tr>
                    ) : (
                      filteredFlatRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-5 py-3.5 font-bold">{row.subject}</td>
                          <td className="px-5 py-3.5 whitespace-nowrap"><span className="rounded bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">{getEducationStage(row.grade)}</span></td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-[#0F172A]">{row.l1Name}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-[#0F172A]">{row.l2Name}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-[#0F172A]">{row.l3Name}</div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[#475569]">{row.textbook}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {row.l3Item ? (
                              <button
                                type="button"
                                onClick={() => row.l3Item && row.boundCount > 0 && handleViewBoundQuestions(row.l3Item.id)}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                                  row.boundCount > 0
                                    ? 'bg-[#E8F7EE] text-[#16B45B] cursor-pointer hover:bg-[#D6F2E1]'
                                    : 'bg-[#FFFBEB] text-[#D97706]'
                                }`}
                              >
                                {row.boundCount > 0 ? `已绑定 ${row.boundCount} 道` : '0 道 (待补充)'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#94A3B8] font-mono">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3 text-[12px] font-bold">
                              {row.l3Item && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQForm({
                                      title: `${row.l3Name}典型练习题`,
                                      content: '',
                                      options: ['A. ', 'B. ', 'C. ', 'D. '],
                                      answer: 'A',
                                      analysis: '',
                                      subject: row.l3Item!.subject,
                                      stage: '初中',
                                      grade: row.l3Item!.grade,
                                      textbook: row.l3Item!.textbook,
                                      difficulty: '基础',
                                      type: '单选题',
                                      knowledgePointLevel3Id: row.l3Item!.id,
                                      status: 'active',
                                    });
                                    setEditingQuestion(null);
                                    setIsQuestionModalOpen(true);
                                  }}
                                  className="text-[#16B45B] hover:underline cursor-pointer flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                  录入试题
                                </button>
                              )}
                              {row.boundCount > 0 && row.l3Item && (
                                <button
                                  type="button"
                                  onClick={() => handleViewBoundQuestions(row.l3Item!.id)}
                                  className="text-[#2563EB] hover:underline cursor-pointer"
                                >
                                  查看题目
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Hierarchical Expandable Tree Structure */
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
            {/* Filter and group by Level 1 */}
            {(() => {
              const l1Nodes = knowledgePoints.filter(
                (kp) =>
                  kp.level === 1 &&
                  (!treeSubjectFilter || kp.subject === treeSubjectFilter) &&
                  (!treeSearchTerm ||
                    kp.name.toLowerCase().includes(treeSearchTerm.toLowerCase()) ||
                    kp.code.toLowerCase().includes(treeSearchTerm.toLowerCase()) ||
                    knowledgePoints.some(
                      (child) =>
                        (child.parentId === kp.id ||
                          knowledgePoints.some((l3) => l3.parentId === child.id && l3.parentId === kp.id)) &&
                        (child.name.toLowerCase().includes(treeSearchTerm.toLowerCase()) ||
                          child.code.toLowerCase().includes(treeSearchTerm.toLowerCase()))
                    ))
              );

              if (l1Nodes.length === 0) {
                return (
                  <div className="p-8 text-center text-[#64748B]">
                    <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-1">
                      search_off
                    </span>
                    <p className="text-[13px]">没有匹配的章、节或知识点</p>
                  </div>
                );
              }

              return l1Nodes.map((l1) => {
                const isL1Expanded = expandedNodeIds.has(l1.id) || !!treeSearchTerm;
                const l2Children = knowledgePoints.filter(
                  (kp) => kp.level === 2 && kp.parentId === l1.id
                );

                return (
                  <div key={l1.id} className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                    {/* Level 1 Node Header */}
                    <div
                      className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 flex items-center justify-between hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                      onClick={() => toggleNodeExpand(l1.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          type="button"
                          className="w-6 h-6 rounded flex items-center justify-center text-[#64748B] hover:bg-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isL1Expanded ? 'expand_more' : 'chevron_right'}
                          </span>
                        </button>

                        <span className="material-symbols-outlined text-[#16B45B] text-[20px]">
                          folder
                        </span>

                        <span className="font-mono text-[11px] font-bold text-[#64748B]">
                          [{l1.code}]
                        </span>

                        <span className="font-bold text-[#0F172A] text-[14.5px]">
                          {l1.name}
                        </span>

                        <span className="text-[11px] bg-[#E8F7EE] text-[#0E7D3E] font-bold px-2 py-0.5 rounded font-mono">
                          {formatEducationMetadata(l1)}
                        </span>

                        <span className="text-[11px] text-[#94A3B8] font-mono ml-2">
                          (下含 {l2Children.length} 节)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setKpForm({
                              code: '',
                              name: '',
                              level: 2,
                              subject: l1.subject,
                              grade: l1.grade,
                              textbook: l1.textbook,
                              parentId: l1.id,
                            });
                            setIsKpModalOpen(true);
                          }}
                          className="text-[12px] font-bold text-[#16B45B] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          新增节
                        </button>
                      </div>
                    </div>

                    {/* Level 1 Expanded Content (Level 2 List) */}
                    {isL1Expanded && (
                      <div className="p-3 space-y-2.5 bg-white">
                        {l2Children.length === 0 ? (
                          <div className="text-[12px] text-[#94A3B8] p-2 pl-8 italic">
                            暂无节，点击上方按钮新增
                          </div>
                        ) : (
                          l2Children.map((l2) => {
                            const isL2Expanded = expandedNodeIds.has(l2.id) || !!treeSearchTerm;
                            const l3Children = knowledgePoints.filter(
                              (kp) => kp.level === 3 && kp.parentId === l2.id
                            );

                            return (
                              <div
                                key={l2.id}
                                className="border border-[#E2E8F0]/80 rounded-xl overflow-hidden ml-4"
                              >
                                {/* Level 2 Node Header */}
                                <div
                                  className="bg-[#FAFAFA] p-2.5 flex items-center justify-between border-b border-[#E2E8F0]/60 hover:bg-[#F1F5F9]/60 transition-colors cursor-pointer"
                                  onClick={() => toggleNodeExpand(l2.id)}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <button
                                      type="button"
                                      className="w-5 h-5 rounded flex items-center justify-center text-[#64748B]"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        {isL2Expanded ? 'expand_more' : 'chevron_right'}
                                      </span>
                                    </button>

                                    <span className="material-symbols-outlined text-[#2563EB] text-[18px]">
                                      folder_open
                                    </span>

                                    <span className="font-mono text-[11px] text-[#64748B]">
                                      [{l2.code}]
                                    </span>

                                    <span className="font-bold text-[#0F172A] text-[13.5px]">
                                      {l2.name}
                                    </span>

                                    <span className="text-[11px] text-[#94A3B8] font-mono">
                                      ({l3Children.length} 个知识点)
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setKpForm({
                                        code: '',
                                        name: '',
                                        level: 3,
                                        subject: l2.subject,
                                        grade: l2.grade,
                                        textbook: l2.textbook,
                                        parentId: l2.id,
                                      });
                                      setIsKpModalOpen(true);
                                    }}
                                    className="text-[11.5px] font-bold text-[#16B45B] hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                    新增知识点
                                  </button>
                                </div>

                                {/* Level 2 Expanded Content (Level 3 List) */}
                                {isL2Expanded && (
                                  <div className="p-2 space-y-2 bg-[#F8FAFC]/30">
                                    {l3Children.length === 0 ? (
                                      <div className="text-[12px] text-[#94A3B8] p-2 pl-6 italic">
                                        暂无知识点，点击“新增知识点”录入
                                      </div>
                                    ) : (
                                      l3Children.map((l3) => {
                                        const boundQuestions = questions.filter(
                                          (q) => q.knowledgePointLevel3Id === l3.id && q.status === 'active'
                                        );

                                        return (
                                          <div
                                            key={l3.id}
                                            className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:border-[#16B45B] transition-colors ml-4 shadow-2xs"
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <span className="material-symbols-outlined text-[#16B45B] text-[18px]">
                                                label
                                              </span>
                                              <span className="font-mono text-[11px] font-bold text-[#64748B]">
                                                [{l3.code}]
                                              </span>
                                              <span className="font-bold text-[#0F172A] text-[13px]">
                                                {l3.name}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                              <button
                                                type="button"
                                                onClick={() => boundQuestions.length > 0 && handleViewBoundQuestions(l3.id)}
                                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                                                  boundQuestions.length > 0
                                                    ? 'bg-[#E8F7EE] text-[#16B45B] cursor-pointer hover:bg-[#D6F2E1]'
                                                    : 'bg-[#FFFBEB] text-[#D97706]'
                                                }`}
                                              >
                                                已绑定 {boundQuestions.length} 道精选题
                                                {boundQuestions.length === 0 && ' (待补充)'}
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setQForm({
                                                    title: `${l3.name}典型练习题`,
                                                    content: '',
                                                    options: ['A. ', 'B. ', 'C. ', 'D. '],
                                                    answer: 'A',
                                                    analysis: '',
                                                    subject: l3.subject,
                                                    stage: '初中',
                                                    grade: l3.grade,
                                                    textbook: l3.textbook,
                                                    difficulty: '基础',
                                                    type: '单选题',
                                                    knowledgePointLevel3Id: l3.id,
                                                    status: 'active',
                                                  });
                                                  setEditingQuestion(null);
                                                  setIsQuestionModalOpen(true);
                                                }}
                                                className="text-[11.5px] font-bold text-[#16B45B] hover:underline cursor-pointer"
                                              >
                                                + 录入试题
                                              </button>

                                              {boundQuestions.length > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleViewBoundQuestions(l3.id)}
                                                  className="text-[11.5px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                                                >
                                                  查看题目
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    )}

      {/* Add / Edit Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                {editingQuestion ? '编辑精选题' : '录入新精选题'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  题目完整题干内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="请输入完整题目与已知条件..."
                  value={qForm.content}
                  onChange={(e) => setQForm({ ...qForm, content: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg p-2.5 text-[13px] font-mono outline-none focus:border-[#16B45B]"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">学科</label>
                  <SubjectSelect
                    value={qForm.subject}
                    onChange={(subject) => setQForm({ ...qForm, subject })}
                    valueMode="name"
                    emptyLabel="请选择学科"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    难度等级
                  </label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value as QuestionDifficulty })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] font-bold outline-none cursor-pointer"
                  >
                    <option value="基础">基础题</option>
                    <option value="提升">提升题</option>
                    <option value="压轴">压轴题</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">题型</label>
                  <select
                    value={qForm.type}
                    onChange={(e) => setQForm({ ...qForm, type: e.target.value as QuestionType })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
                  >
                    <option value="单选题">单选题 (默认)</option>
                    <option value="多选题">多选题</option>
                    <option value="填空题">填空题</option>
                    <option value="解答题">解答题</option>
                    <option value="判断题">判断题</option>
                    <option value="综合题">综合题</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  关联知识点 <span className="text-red-500">*</span>
                </label>
                <select
                  value={qForm.knowledgePointLevel3Id}
                  onChange={(e) => setQForm({ ...qForm, knowledgePointLevel3Id: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] font-bold text-[#16B45B] outline-none cursor-pointer"
                >
                  {level3Points.map((kp) => (
                    <option key={kp.id} value={kp.id}>
                      [{formatEducationMetadata(kp)}] {kp.name} ({kp.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Choice Options Editor or Non-Choice Type Instructions */}
              {isChoiceType(qForm.type) ? (
                <div className="space-y-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  {/* Choice Mode Switcher: Single vs Multi */}
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                    <span className="text-[12px] font-bold text-[#475569] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#16B45B]">tune</span>
                      选择题类型模式
                    </span>
                    <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setQForm({ ...qForm, type: '单选题' })}
                        className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all cursor-pointer ${
                          qForm.type === '单选题' || qForm.type === '选择题'
                            ? 'bg-[#16B45B] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        单选题 (默认)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQForm({ ...qForm, type: '多选题' })}
                        className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all cursor-pointer ${
                          qForm.type === '多选题'
                            ? 'bg-[#2563EB] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        多选题
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-[#475569] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#16B45B]">format_list_bulleted</span>
                      {qForm.type === '多选题' ? '多选题选项列表' : '单选题选项列表'} <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLetter = String.fromCharCode(65 + qForm.options.length);
                        setQForm({
                          ...qForm,
                          options: [...qForm.options, `${nextLetter}. `],
                        });
                      }}
                      className="text-[12px] font-bold text-[#16B45B] hover:text-[#0E7D3E] bg-[#E8F7EE] hover:bg-[#D3F2DF] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">add_circle</span>
                      增加选项
                    </button>
                  </div>

                  <div className="space-y-2">
                    {qForm.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const rawContent = opt.replace(new RegExp(`^${letter}[.\\s:]*`), '');

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 text-[13px] font-bold text-[#0F172A] text-center shrink-0">
                            {letter}.
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={`请输入选项 ${letter} 内容`}
                            value={rawContent}
                            onChange={(e) => {
                              const newOpts = [...qForm.options];
                              newOpts[idx] = `${letter}. ${e.target.value}`;
                              setQForm({ ...qForm, options: newOpts });
                            }}
                            className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#16B45B]"
                          />
                          {qForm.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = qForm.options
                                  .filter((_, i) => i !== idx)
                                  .map((o, i) => {
                                    const l = String.fromCharCode(65 + i);
                                    const clean = o.replace(/^[A-Z][.\s:]*/, '');
                                    return `${l}. ${clean}`;
                                  });
                                setQForm({ ...qForm, options: newOpts });
                              }}
                              className="text-[#94A3B8] hover:text-[#EF4444] cursor-pointer p-1 rounded hover:bg-[#F1F5F9]"
                              title="删除此选项"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : qForm.type === '填空题' ? (
                <div className="bg-[#E8F7EE] border border-[#16B45B]/30 rounded-xl p-3.5 text-[12.5px] text-[#0E7D3E] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#16B45B]">edit_note</span>
                    填空题录入说明：
                  </div>
                  <p className="text-[12px] text-[#334155]">
                    • 填空题无需维护选项列表。<br />
                    • 请在【完整题干】中使用 <code className="bg-white px-1.5 py-0.5 rounded font-bold text-[#16B45B]">___</code> (下划线) 标示填空位置。<br />
                    • 在【正确答案】中填写填空对应的标准数值或表达式（多个填空使用分号 <code className="bg-white px-1 rounded font-bold text-[#16B45B]">;</code> 隔开）。
                  </p>
                </div>
              ) : (
                <div className="bg-[#EFF6FF] border border-[#2563EB]/30 rounded-xl p-3.5 text-[12.5px] text-[#1E40AF] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#2563EB]">description</span>
                    {qForm.type}录入说明：
                  </div>
                  <p className="text-[12px] text-[#334155]">
                    • {qForm.type}无需维护选择选项列表。<br />
                    • 在【正确答案】中填写最终核心结论、结论结论值或得分要点。<br />
                    • 在【分步解题步骤与解析】中填写完整的计算推导步骤、定理依据与分步计分点。
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-bold text-[#475569]">
                    正确答案 <span className="text-red-500">*</span>
                  </label>
                  {qForm.type === '多选题' && (
                    <span className="text-[11px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                      多选题提示：可输入多个正确选项 (如：A, B, C)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder={
                    qForm.type === '多选题'
                      ? '如: A, B 或 A, B, D'
                      : qForm.type === '填空题'
                      ? '如: 5 或 x₁ = 1; x₂ = 5 (多空用分号隔开)'
                      : qForm.type === '解答题'
                      ? '如: x₁ = 1, x₂ = 5 或 见完整解答过程'
                      : qForm.type === '判断题'
                      ? '如: 正确 或 错误'
                      : '如: A 或 A. 9小时'
                  }
                  value={qForm.answer}
                  onChange={(e) => setQForm({ ...qForm, answer: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-bold text-[#16B45B] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  {qForm.type === '解答题' ? '分步解题步骤、演算推导与得分标准' : '解题步骤与解析'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={qForm.type === '解答题' ? 4 : 3}
                  required
                  placeholder={
                    qForm.type === '解答题'
                      ? '【分步解答】\n1. 移项：x² - 6x = -5\n2. 配方：(x - 3)² = 4\n3. 得解：x₁ = 5，x₂ = 1'
                      : '详细说明推导过程...'
                  }
                  value={qForm.analysis}
                  onChange={(e) => setQForm({ ...qForm, analysis: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg p-2.5 text-[13px] outline-none"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-lg text-[14px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                >
                  保存试题
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add KP Modal */}
      {isKpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                新增章 / 节 / 知识点
              </h3>
              <button
                onClick={() => setIsKpModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveKnowledgePoint} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">层级等级</label>
                <select
                  value={kpForm.level}
                  onChange={(e) => setKpForm({ ...kpForm, level: Number(e.target.value) as 1 | 2 | 3 })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none cursor-pointer"
                >
                  <option value={1}>章</option>
                  <option value={2}>节</option>
                  <option value={3}>知识点（可直接绑定试题）</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">{kpForm.level === 1 ? '章名称' : kpForm.level === 2 ? '节名称' : '知识点名称'}</label>
                <input
                  type="text"
                  required
                  placeholder="如：行程问题与追及方程"
                  value={kpForm.name}
                  onChange={(e) => setKpForm({ ...kpForm, name: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">学科</label>
                <SubjectSelect
                  value={kpForm.subject}
                  onChange={(subject) => setKpForm({ ...kpForm, subject })}
                  valueMode="name"
                  emptyLabel="请选择学科"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none cursor-pointer"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsKpModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-lg text-[14px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal: Single Table -> Dual Tables Split */}
      {isBatchImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#16B45B]">difference</span>
                  单表同行上传 ➔ 后台自动拆分存为两张关联表
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  上传者在 Excel 中只需维护一行数据（知识点+试题同行），后台存储时自动解耦为【知识点表】与【精选题库表】
                </p>
              </div>
              <button
                onClick={() => setIsBatchImportOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E2E8F0] gap-6 mb-4">
              <button
                onClick={() => setImportTab('upload')}
                className={`pb-2.5 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer ${
                  importTab === 'upload'
                    ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                选择 Excel 单表或一键测试
              </button>

              <button
                onClick={() => setImportTab('preview')}
                className={`pb-2.5 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer ${
                  importTab === 'preview'
                    ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">schema</span>
                1行数据拆分为双表原理展示
              </button>
            </div>

            {/* Notification alert */}
            {importNotice && (
              <div className="bg-[#E8F7EE] border border-[#16B45B]/30 rounded-xl p-3.5 mb-4 text-[13px] text-[#0E7D3E] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#16B45B]">check_circle</span>
                <span>{importNotice}</span>
              </div>
            )}

            {importTab === 'upload' ? (
              <div className="space-y-5">
                {/* Upload box */}
                <div className="border-2 border-dashed border-[#16B45B]/40 hover:border-[#16B45B] bg-[#F8FAFC] rounded-2xl p-8 text-center transition-all cursor-pointer group">
                  <div className="w-14 h-14 bg-[#E8F7EE] rounded-2xl flex items-center justify-center mx-auto text-[#16B45B] mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">upload_file</span>
                  </div>
                  <p className="font-bold text-[#0F172A] text-[15px]">拖拽 Excel (.xlsx) 题库表格文件至此处</p>
                  <p className="text-[12px] text-[#64748B] mt-1 max-w-md mx-auto">
                    单表模式要求：每一行分别填写【学段、学科、章、节、知识点】以及【题型、难度、完整题干、选项列表、正确答案、解题解析、前置知识点、题干图片、选项图片】
                  </p>

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleExecuteSingleTableImport();
                      }
                    }}
                    className="hidden"
                    id="qBatchImportInput"
                  />
                  <label
                    htmlFor="qBatchImportInput"
                    className="inline-block mt-4 px-5 py-2 bg-[#16B45B] text-white font-bold rounded-xl cursor-pointer hover:bg-[#139B4E] shadow-2xs text-[13px]"
                  >
                    选择 Excel 题库文件
                  </label>
                </div>

                <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                  <div className="flex items-center gap-2 font-bold text-[#1E40AF]"><span className="material-symbols-outlined">imagesmode</span>同一导入任务的图片压缩包</div>
                  <p className="mt-1 text-[12px] text-[#475569]">Excel 的“题干图片”“选项图片”填写压缩包内相对文件名；多个选项图片用“、”分隔。解析不导入图片。</p>
                  <input id="qBatchImageZipInput" type="file" accept=".zip" className="hidden" />
                  <label htmlFor="qBatchImageZipInput" className="mt-3 inline-block cursor-pointer rounded-xl border border-[#2563EB] bg-white px-4 py-2 text-[12px] font-bold text-[#1E40AF]">选择图片压缩包（可选）</label>
                </div>

                {/* Quick test sample import button */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#0F172A] text-[13.5px]">试用单表同行数据一键解耦入库</h5>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      自动读取 2 行包含考点与题目同行的示例数据，演示创建考点表节点及链接试题表
                    </p>
                  </div>
                  <button
                    onClick={() => handleExecuteSingleTableImport()}
                    className="px-4 py-2 bg-[#F5B700] text-[#0F172A] text-[13px] font-bold rounded-xl hover:bg-[#E0A700] cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    🚀 一键测试单表拆分导入
                  </button>
                </div>
              </div>
            ) : (
              /* Split demonstration view */
              <div className="space-y-4 text-[12.5px]">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">
                    示例：Excel 输入表格内容（包含考点 + 单选 / 多选 / 填空 / 解答题全题型规范）：
                  </span>
                  <span className="text-[11px] text-[#16B45B] bg-[#E8F7EE] px-2 py-0.5 rounded font-bold border border-[#16B45B]/20">
                    💡 填空/解答题选项列填 '-' 即可
                  </span>
                </div>
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl font-mono text-[11px] bg-white whitespace-nowrap">
                  <table className="w-full text-left divide-y divide-[#E2E8F0]">
                    <thead className="bg-[#F1F5F9]">
                      <tr>
                        <th className="p-2 border-r">学段</th>
                        <th className="p-2 border-r">学科</th>
                        <th className="p-2 border-r text-[#16B45B] font-bold">章</th>
                        <th className="p-2 border-r text-[#16B45B] font-bold">节</th>
                        <th className="p-2 border-r text-[#16B45B] font-bold">知识点</th>
                        <th className="p-2 border-r">题型</th>
                        <th className="p-2 border-r">难度</th>
                        <th className="p-2 border-r">完整题干</th>
                        <th className="p-2 border-r">前置知识点</th>
                        <th className="p-2 border-r">题干图片</th>
                        <th className="p-2 border-r">选项图片</th>
                        <th className="p-2 border-r text-[#16B45B] font-bold">选项列表 (选择题)</th>
                        <th className="p-2 border-r">正确答案</th>
                        <th className="p-2 text-[#2563EB] font-bold">解题步骤 / 详尽解析</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {sampleSingleTableRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="p-2 border-r whitespace-nowrap">
                            <span className="font-bold text-[#0F172A]">{row.stage}</span>
                          </td>
                          <td className="p-2 border-r font-bold text-[#0F172A]">{row.subject}</td>
                          <td className="p-2 border-r text-[#475569]">{row.level1Name}</td>
                          <td className="p-2 border-r text-[#475569]">{row.level2Name}</td>
                          <td className="p-2 border-r font-bold text-[#16B45B]">{row.level3Name}</td>
                          <td className="p-2 border-r font-medium text-[#0F172A]">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.type === '多选题'
                                ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                                : row.type === '单选题' || row.type === '选择题'
                                ? 'bg-[#E8F7EE] text-[#16B45B] border border-[#A7F3D0]'
                                : 'bg-[#F1F5F9] text-[#475569]'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="p-2 border-r">
                            <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] font-sans font-medium rounded text-[10px]">
                              {row.difficulty}
                            </span>
                          </td>
                          <td className="p-2 border-r max-w-[140px] truncate" title={row.content}>
                            {row.content}
                          </td>
                          <td className="p-2 border-r text-[#64748B]">完整三级路径；多个用；分隔</td>
                          <td className="p-2 border-r text-[#64748B]">stem/q{idx + 1}.png</td>
                          <td className="p-2 border-r text-[#64748B]">option/a.png、option/b.png</td>
                          <td className="p-2 border-r max-w-[160px] truncate text-[#0F172A]" title={row.options?.join(' | ') || '无选项'}>
                            {row.options && row.options.length > 0 ? (
                              <span className="font-sans text-[10.5px] text-[#16B45B] font-medium">
                                {row.options.join(' | ')}
                              </span>
                            ) : (
                              <span className="text-[#94A3B8]">-</span>
                            )}
                          </td>
                          <td className="p-2 border-r font-bold text-[#16B45B]">{row.answer}</td>
                          <td className="p-2 text-[#2563EB] font-medium max-w-[200px] truncate" title={row.analysis}>
                            {row.analysis}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center my-1 text-[#16B45B] font-bold flex-col items-center">
                  <span className="material-symbols-outlined text-[24px]">south</span>
                  <span className="text-[11px]">后台存储自动拆分为两张关联表</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Table A */}
                  <div className="border border-[#16B45B]/40 bg-[#E8F7EE]/30 p-3 rounded-xl space-y-2">
                    <div className="font-bold text-[#0E7D3E] flex items-center justify-between">
                      <span>1. 知识点表 (knowledgePoints)</span>
                      <span className="text-[10px] bg-[#16B45B] text-white px-2 py-0.5 rounded">考点结构</span>
                    </div>
                    <ul className="space-y-1 text-[11.5px] text-[#334155]">
                      <li>• <strong>ID:</strong> <code className="text-[#16B45B]">KP-MATH-301 ~ 304</code></li>
                      <li>• <strong>考点名称:</strong> 行程问题与追及方程 / 无理数判定 / 直角三角形...</li>
                      <li>• <strong>所属层级:</strong> 知识点（第三级）</li>
                      <li>• <strong>绑定路径:</strong> 初中 &gt; 数学 &gt; 数与代数 / 图形与几何...</li>
                    </ul>
                  </div>

                  {/* Table B */}
                  <div className="border border-[#2563EB]/40 bg-[#EFF6FF]/30 p-3 rounded-xl space-y-2">
                    <div className="font-bold text-[#1E40AF] flex items-center justify-between">
                      <span>2. 精选题库表 (questions)</span>
                      <span className="text-[10px] bg-[#2563EB] text-white px-2 py-0.5 rounded">试题与选项明细</span>
                    </div>
                    <ul className="space-y-1 text-[11.5px] text-[#334155]">
                      <li>• <strong>支持全类题型:</strong> 单选题、多选题、填空题、解答题、判断题、综合题等</li>
                      <li>• <strong>选择题选项:</strong> Excel 中写入 <code className="text-[#16B45B]">A. ... | B. ...</code> 自动解析提取为选项数组</li>
                      <li>• <strong>填空/解答题规范:</strong> 选项列留空或写 <code className="text-[#64748B]">-</code>；填空题在题干中写 <code className="text-[#16B45B]">___</code>，解答题在【解题解析】中写入分步解答与计分点</li>
                      <li>• <strong>关系关联:</strong> 自动以 <code className="font-bold text-[#16B45B]">knowledgePointLevel3Id</code> 映射绑定知识点</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 mt-4 flex justify-between items-center border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#64748B]">
                说明：通过此解耦方式，既降低了前台人员录入难度，又保证了后台题目与知识点的关系化查询处理。
              </span>
              <button
                onClick={() => setIsBatchImportOpen(false)}
                className="px-5 py-2 bg-[#0F172A] text-white font-bold rounded-xl text-[13px] hover:bg-[#1E293B] cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Knowledge Points Modal */}
      {isKpBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#16B45B]">account_tree</span>
                  批量导入章、节与知识点
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  通过 Excel 表格按【学科 ➔ 章 ➔ 节 ➔ 知识点】标准结构批量建立目录
                </p>
              </div>
              <button
                onClick={() => setIsKpBatchModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E2E8F0] gap-6 mb-4">
              <button
                onClick={() => setKpImportTab('upload')}
                className={`pb-2.5 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer ${
                  kpImportTab === 'upload'
                    ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                上传 Excel 考点表格
              </button>

              <button
                onClick={() => setKpImportTab('preview')}
                className={`pb-2.5 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer ${
                  kpImportTab === 'preview'
                    ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                章、节、知识点表结构规范说明
              </button>
            </div>

            {/* Notification */}
            {kpImportNotice && (
              <div className="bg-[#E8F7EE] border border-[#16B45B]/30 rounded-xl p-3.5 mb-4 text-[13px] text-[#0E7D3E] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#16B45B]">check_circle</span>
                <span>{kpImportNotice}</span>
              </div>
            )}

            {kpImportTab === 'upload' ? (
              <div className="space-y-5">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#16B45B]/40 hover:border-[#16B45B] bg-[#F8FAFC] rounded-2xl p-8 text-center transition-all cursor-pointer group">
                  <div className="w-14 h-14 bg-[#E8F7EE] rounded-2xl flex items-center justify-center mx-auto text-[#16B45B] mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">folder_zip</span>
                  </div>
                  <p className="font-bold text-[#0F172A] text-[15px]">拖拽 Excel (.xlsx) 知识点结构表至此处</p>
                  <p className="text-[12px] text-[#64748B] mt-1 max-w-md mx-auto">
                    规范包含：【学科、学段年级、教材版本、章编码/名称、节编码/名称、知识点编码/名称】
                  </p>

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleExecuteKpBatchImport();
                      }
                    }}
                    className="hidden"
                    id="kpBatchImportInput"
                  />
                  <label
                    htmlFor="kpBatchImportInput"
                    className="inline-block mt-4 px-5 py-2 bg-[#16B45B] text-white font-bold rounded-xl cursor-pointer hover:bg-[#139B4E] shadow-2xs text-[13px]"
                  >
                    选择考点 Excel 表格文件
                  </label>
                </div>

                {/* Quick Test Import */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#0F172A] text-[13.5px]">一键试用多学科章、节、知识点批量导入</h5>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      模拟解析包含数学、物理、化学 3 组完整的“章 ➔ 节 ➔ 知识点”数据
                    </p>
                  </div>
                  <button
                    onClick={() => handleExecuteKpBatchImport()}
                    className="px-4 py-2 bg-[#F5B700] text-[#0F172A] text-[13px] font-bold rounded-xl hover:bg-[#E0A700] cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    🚀 一键测试考点树批量导入
                  </button>
                </div>
              </div>
            ) : (
              /* Specification View */
              <div className="space-y-4 text-[12.5px]">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl font-bold text-[#0F172A]">
                  标准章、节、知识点表列名要求（遵照需求文档 9.0 规范）：
                </div>
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl font-mono text-[11px] bg-white">
                  <table className="w-full text-left divide-y divide-[#E2E8F0]">
                    <thead className="bg-[#F1F5F9]">
                      <tr>
                        <th className="p-2 border-r">所属学科</th>
                        <th className="p-2 border-r">一级编码及名称</th>
                        <th className="p-2 border-r">二级编码及名称</th>
                        <th className="p-2 border-r">知识点编码及名称</th>
                        <th className="p-2 border-r">适用年级</th>
                        <th className="p-2">教材版本</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      <tr>
                        <td className="p-2 border-r">数学</td>
                        <td className="p-2 border-r">KP-MATH-L1-01 数与代数</td>
                        <td className="p-2 border-r">KP-MATH-L2-02 二次方程</td>
                        <td className="p-2 border-r text-[#16B45B] font-bold">KP-MATH-L3-05 因式分解求根</td>
                        <td className="p-2 border-r">初一</td>
                        <td className="p-2">人教版</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r">物理</td>
                        <td className="p-2 border-r">KP-PHYS-L1-01 力学基础</td>
                        <td className="p-2 border-r">KP-PHYS-L2-01 压强与浮力</td>
                        <td className="p-2 border-r text-[#16B45B] font-bold">KP-PHYS-L3-01 液体内部压强 p=ρgh</td>
                        <td className="p-2 border-r">初二</td>
                        <td className="p-2">人教版</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11.5px] text-[#64748B]">
                  知识点是学生做题验证、错题打标和 AI 诊断图谱的最小归因单元，导入时系统将自动校验章、节、知识点的父子关系。
                </p>
              </div>
            )}

            <div className="pt-4 mt-4 flex justify-end border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsKpBatchModalOpen(false)}
                className="px-5 py-2 bg-[#0F172A] text-white font-bold rounded-xl text-[13px] hover:bg-[#1E293B] cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                {editingSubject ? '编辑学科' : '新增学科'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  学科名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="如：初中数学"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">学科代码</label>
                <input
                  type="text"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  placeholder="如：MATH-CZ"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">适用学段</label>
                  <StageSelect
                    value={subjectForm.stage}
                    onChange={(stage) => setSubjectForm({ ...subjectForm, stage })}
                    valueMode="name"
                    emptyLabel="请选择学段"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">默认教材</label>
                  <TextbookSelect
                    value={subjectForm.textbook}
                    onChange={(textbook) => setSubjectForm({ ...subjectForm, textbook })}
                    valueMode="name"
                    emptyLabel="请选择教材"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">排序号</label>
                  <input
                    type="number"
                    value={subjectForm.sortOrder}
                    onChange={(e) => setSubjectForm({ ...subjectForm, sortOrder: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">状态</label>
                  <select
                    value={subjectForm.status}
                    onChange={(e) => setSubjectForm({ ...subjectForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B] cursor-pointer"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-xs"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                {editingPackage ? '编辑内容包' : '新增内容包'}
              </h3>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  内容包名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="如：人教版初中数学全套内容包"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">内容包代码</label>
                <input
                  type="text"
                  value={packageForm.code}
                  onChange={(e) => setPackageForm({ ...packageForm, code: e.target.value })}
                  placeholder="如：CP-MATH-CZ"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">内容来源学科 <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={packageForm.subjectId}
                    onChange={(e) => {
                      const selectedSubject = subjects.find((subject) => subject.id === e.target.value);
                      if (!selectedSubject) return;
                      setPackageForm({
                        ...packageForm,
                        subjectId: selectedSubject.id,
                        subject: selectedSubject.name,
                        stage: selectedSubject.stage,
                      });
                    }}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B] cursor-pointer"
                  >
                    {subjects.filter((subject) => subject.status === 'active').map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} · {subject.stage} · {subject.textbook}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-[#64748B]">内容包自动引用该学科下已发布的知识点与题目；学段和版本由学科主数据统一提供。</p>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">说明描述</label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="填写简要说明..."
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">状态</label>
                <select
                  value={packageForm.status}
                  onChange={(e) => setPackageForm({ ...packageForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#16B45B] cursor-pointer"
                >
                  <option value="active">上架</option>
                  <option value="inactive">停用</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-xs"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
