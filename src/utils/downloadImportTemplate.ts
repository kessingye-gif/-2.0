import { importTemplates, type ImportTemplateKey } from '../config/importTemplates';

export const downloadImportTemplate = (templateKey: ImportTemplateKey) => {
  const { fileName, headers, exampleRows } = importTemplates[templateKey];
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = [headers, ...exampleRows].map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
