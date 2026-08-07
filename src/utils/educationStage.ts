const EDUCATION_STAGE_BY_GRADE: Record<string, string> = {
  初一: '初中',
  初二: '初中',
  初三: '初中',
  高一: '高中',
  高二: '高中',
  高三: '高中',
};

export function getEducationStage(grade: string): string {
  return EDUCATION_STAGE_BY_GRADE[grade] ?? grade;
}

export function formatEducationMetadata({
  subject,
  grade,
  textbook,
}: {
  subject: string;
  grade: string;
  textbook: string;
}): string {
  return `${subject} · ${getEducationStage(grade)} · ${textbook}`;
}
