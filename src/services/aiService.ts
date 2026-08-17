import { categoryToDepartment, officers } from '@/data/mockData';
import type { AIAnalysis, ComplaintCategory, Severity } from '@/types';

interface KeywordRule {
  keywords: string[];
  category: ComplaintCategory;
}

const rules: KeywordRule[] = [
  {
    keywords: [
      'pothole', 'road', 'crack', 'broken road', 'loose gravel', 'highway', 'service road', 'surface',
      'road issue', 'गड्ढा', 'सडक', 'रस्ता', 'रस्त्यात', 'सडकाची', 'पथ', 'पट्टी', 'फोड'
    ],
    category: 'Road Issue',
  },
  {
    keywords: [
      'water', 'leakage', 'pipeline', 'pipe', 'tank', 'flooding', 'tap', 'seepage', 'water supply',
      'पाणी', 'पाण्याची', 'टँक', 'लीक', 'लीकेज', 'नल', 'नळ', 'पाणीसाठा', 'पाण्याचा', 'पाणीगळती'
    ],
    category: 'Water Leakage',
  },
  {
    keywords: [
      'garbage', 'trash', 'waste', 'bin', 'dump', 'collection', 'litter', 'rubbish', 'sanitation',
      'kachra', 'कचरा', 'सार', 'राख', 'डस्टबिन', 'कचऱ्याचे', 'गाळ', 'जंगल', 'स्वच्छता'
    ],
    category: 'Sanitation',
  },
  {
    keywords: [
      'streetlight', 'street light', 'light', 'pole', 'lamp', 'electrical', 'wiring', 'fuse', 'power',
      'स्ट्रीटलाइट', 'लाइट', 'बल्ब', 'विद्युत', 'वायरिंग', 'फ्यूज', 'बिजली'
    ],
    category: 'Electrical',
  },
  {
    keywords: [
      'drain', 'drainage', 'sewer', 'sewerage', 'overflow', 'manhole', 'cover', 'gutters', 'nalla',
      'नाली', 'नाल्या', 'गटार', 'ओव्हरफ्लो', 'मॅनहोल', 'मलनिस्सारण', 'सुविधा'
    ],
    category: 'Drainage',
  },
  {
    keywords: [
      'toilet', 'public sanitation', 'urinal', 'washroom', 'cleanliness', 'hygiene', 'public toilet',
      'शौचालय', 'स्वच्छता', 'उद्यान', 'तळघर', 'सार्वजनिक शौचालय', 'सार्वजनिक स्वच्छता'
    ],
    category: 'Public Sanitation',
  },
];

const criticalSignals = [
  'school', 'hospital', 'child', 'children', 'fell', 'fall', 'accident', 'danger', 'critical', 'emergency', 'serious',
  'विद्यालय', 'हॉस्पिटल', 'मुल', 'बाळ', 'अपघात', 'धोकादायक', 'गंभीर', 'आणीबाणी'
];
const highSignals = [
  'urgent', 'unsafe', 'danger', 'skid', 'slip', 'wasting', 'wasted', 'dark', 'night', 'elderly', 'women',
  'तात्काळ', 'असुरक्षित', 'रात', 'वृद्ध', 'महिला', 'तत्काळ', 'झळक', 'फिसर' 
];
const lowSignals = [
  'minor', 'small', 'slight', 'slow', 'sometimes', 'occasionally',
  'लहान', 'सामान्य', 'काही वेळा', 'कमी'
];

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function detectCategory(text: string): ComplaintCategory {
  const lower = normalizeText(text);
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => lower.includes(keyword.toLowerCase()))) {
      return rule.category;
    }
  }
  return 'Sanitation';
}

function detectSeverity(text: string): Severity {
  const lower = normalizeText(text);
  if (criticalSignals.some((signal) => lower.includes(signal.toLowerCase()))) return 'Critical';
  if (highSignals.some((signal) => lower.includes(signal.toLowerCase()))) return 'High';
  if (lowSignals.some((signal) => lower.includes(signal.toLowerCase()))) return 'Low';
  return 'Medium';
}

function pickOfficer(departmentId: string): string {
  const pool = officers.filter((officer) => officer.departmentId === departmentId);
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? officers[0].id;
}

function buildSummary(title: string, description: string, category: ComplaintCategory, severity: Severity): string {
  const sev = severity === 'Critical' ? 'Critical priority — ' : severity === 'High' ? 'High priority — ' : '';
  const cleanDesc = description.replace(/\s+/g, ' ').trim();
  const excerpt = cleanDesc.length > 160 ? `${cleanDesc.slice(0, 160)}...` : cleanDesc;
  return `${sev}Citizen reports a ${category.toLowerCase()} issue: "${title}". ${excerpt}`;
}

function shouldUseFreeModel(): boolean {
  const provider = String(import.meta.env.VITE_USE_FREE_AI ?? '').toLowerCase();
  const model = String(import.meta.env.VITE_HF_MODEL ?? '').trim();
  return provider === 'true' || provider === '1' || Boolean(model);
}

async function fetchFreeModelClassification(input: string, labels: string[], kind: 'category' | 'severity'): Promise<string | null> {
  if (!shouldUseFreeModel()) return null;

  const model = String(import.meta.env.VITE_HF_MODEL ?? 'facebook/bart-large-mnli').trim();
  const token = String(import.meta.env.VITE_HF_TOKEN ?? '').trim();

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        inputs: input,
        parameters: { candidate_labels: labels },
      }),
    });

    if (!response.ok) {
      throw new Error(`HF ${kind} call failed: ${response.status}`);
    }

    const payload = await response.json();
    const results = Array.isArray(payload) ? payload : Array.isArray(payload?.[0]) ? payload[0] : [];
    const bestMatch = Array.isArray(results) ? results[0] : null;

    if (!bestMatch || typeof bestMatch.label !== 'string') {
      return null;
    }

    return bestMatch.label as string;
  } catch {
    return null;
  }
}

function getMappedCategory(value: string | null | undefined): ComplaintCategory | null {
  const candidate = String(value ?? '').trim();
  if (!candidate) return null;

  const normalized = normalizeText(candidate);
  const match = rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())));
  return match?.category ?? null;
}

function getMappedSeverity(value: string | null | undefined): Severity | null {
  const candidate = String(value ?? '').trim();
  if (!candidate) return null;

  const normalized = normalizeText(candidate);
  if (['critical', 'very high', 'urgent'].some((item) => normalized.includes(item))) return 'Critical';
  if (['high', 'danger', 'serious'].some((item) => normalized.includes(item))) return 'High';
  if (['low', 'minor', 'small'].some((item) => normalized.includes(item))) return 'Low';
  return 'Medium';
}

export const aiService = {
  async analyze(title: string, description: string): Promise<AIAnalysis> {
    const text = `${title} ${description}`.trim();
    const categoryName = await fetchFreeModelClassification(
      text,
      ['Road Issue', 'Water Leakage', 'Sanitation', 'Electrical', 'Drainage', 'Public Sanitation'],
      'category',
    );
    const severityName = await fetchFreeModelClassification(
      text,
      ['Low', 'Medium', 'High', 'Critical'],
      'severity',
    );

    const category = getMappedCategory(categoryName) ?? detectCategory(text) ?? 'Sanitation';
    const severity = getMappedSeverity(severityName) ?? detectSeverity(text) ?? 'Medium';
    const departmentId = categoryToDepartment[category];
    const officerId = pickOfficer(departmentId);
    const summary = buildSummary(title, description, category, severity);
    const confidenceValue = categoryName || severityName ? 0.92 : 0.84;

    return {
      category,
      severity,
      departmentId,
      officerId,
      summary,
      confidence: Number(confidenceValue.toFixed(2)),
    };
  },
  detectCategory,
  detectSeverity,
};
