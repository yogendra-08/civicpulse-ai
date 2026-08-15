import { categoryToDepartment, officers } from '@/data/mockData';
import type { AIAnalysis, ComplaintCategory, Severity } from '@/types';

interface KeywordRule {
  keywords: string[];
  category: ComplaintCategory;
}

const rules: KeywordRule[] = [
  { keywords: ['pothole', 'road', 'crack', 'broken road', 'loose gravel', 'highway', 'service road', 'surface'], category: 'Road Issue' },
  { keywords: ['water', 'leakage', 'pipeline', 'pipe', 'tank', 'flooding', 'tap', 'seepage'], category: 'Water Leakage' },
  { keywords: ['garbage', 'trash', 'waste', 'bin', 'dump', 'collection', 'litter', 'rubbish'], category: 'Sanitation' },
  { keywords: ['streetlight', 'street light', 'light', 'pole', 'lamp', 'electrical', 'wiring', 'fuse'], category: 'Electrical' },
  { keywords: ['drain', 'drainage', 'sewer', 'sewerage', 'overflow', 'manhole', 'cover'], category: 'Drainage' },
  { keywords: ['toilet', 'public sanitation', 'urinal', 'washroom', 'cleanliness', 'hygiene'], category: 'Public Sanitation' },
];

const criticalSignals = ['school', 'hospital', 'child', 'children', 'fell', 'fall', 'accident', 'danger', 'critical', 'emergency', 'serious'];
const highSignals = ['urgent', 'unsafe', 'danger', 'skid', 'slip', 'wasting', 'wasted', 'dark', 'night', 'elderly', 'women'];
const lowSignals = ['minor', 'small', 'slight', 'slow', 'sometimes', 'occasionally'];

function detectCategory(text: string): ComplaintCategory {
  const lower = text.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.category;
  }
  return 'Sanitation';
}

function detectSeverity(text: string): Severity {
  const lower = text.toLowerCase();
  if (criticalSignals.some((s) => lower.includes(s))) return 'Critical';
  if (highSignals.some((s) => lower.includes(s))) return 'High';
  if (lowSignals.some((s) => lower.includes(s))) return 'Low';
  return 'Medium';
}

function pickOfficer(departmentId: string): string {
  const pool = officers.filter((o) => o.departmentId === departmentId);
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? officers[0].id;
}

function buildSummary(title: string, description: string, category: ComplaintCategory, severity: Severity): string {
  const sev = severity === 'Critical' ? 'Critical priority — ' : severity === 'High' ? 'High priority — ' : '';
  return `${sev}Citizen reports a ${category.toLowerCase()} issue: "${title}". ${description.slice(0, 160)}${description.length > 160 ? '...' : ''}`;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const aiService = {
  async analyze(title: string, description: string): Promise<AIAnalysis> {
    await delay(1400);
    const text = `${title} ${description}`;
    const category = detectCategory(text);
    const severity = detectSeverity(text);
    const departmentId = categoryToDepartment[category];
    const officerId = pickOfficer(departmentId);
    const summary = buildSummary(title, description, category, severity);
    const confidence = 0.82 + Math.random() * 0.16;
    return { category, severity, departmentId, officerId, summary, confidence: Math.round(confidence * 100) / 100 };
  },
  detectCategory,
  detectSeverity,
};
