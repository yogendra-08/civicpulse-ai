import { supabase } from './realAuthService';
import type { Complaint, ComplaintStatus, ComplaintCategory, Severity } from '@/types';
import { aiService } from './aiService';

export interface CreateComplaintData {
  title: string;
  description: string;
  location: string;
  ward: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateComplaintData {
  status?: ComplaintStatus;
  note?: string;
  resolutionDetails?: string;
}

type ResolutionPlan = {
  windowLabel: string;
  minDays: number;
  maxDays: number;
};

const categoryResolutionPlans: Record<ComplaintCategory, ResolutionPlan> = {
  'Road Issue': { windowLabel: '3-5 days', minDays: 3, maxDays: 5 },
  'Water Leakage': { windowLabel: '2-3 days', minDays: 2, maxDays: 3 },
  Sanitation: { windowLabel: '1-2 days', minDays: 1, maxDays: 2 },
  Electrical: { windowLabel: '2-4 days', minDays: 2, maxDays: 4 },
  Drainage: { windowLabel: '3-6 days', minDays: 3, maxDays: 6 },
  'Public Sanitation': { windowLabel: '1-3 days', minDays: 1, maxDays: 3 },
};

const toDbStatus = (status?: ComplaintStatus): string | undefined => {
  if (!status) return undefined;
  const map: Record<ComplaintStatus, string> = {
    Submitted: 'submitted',
    Assigned: 'assigned',
    'In Progress': 'in_progress',
    Resolved: 'resolved',
    Closed: 'closed',
    Overdue: 'overdue',
  };
  return map[status];
};

const toDbCategory = (category?: ComplaintCategory): string | undefined => {
  if (!category) return undefined;
  const map: Record<ComplaintCategory, string> = {
    'Road Issue': 'road_issue',
    'Water Leakage': 'water_leakage',
    Sanitation: 'sanitation',
    Electrical: 'electrical',
    Drainage: 'drainage',
    'Public Sanitation': 'public_sanitation',
  };
  return map[category];
};

const toDbSeverity = (severity?: Severity): string | undefined => {
  if (!severity) return undefined;
  const map: Record<Severity, string> = {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    Critical: 'critical',
  };
  return map[severity];
};

const fromDbStatus = (status: string): ComplaintStatus => {
  const map: Record<string, ComplaintStatus> = {
    submitted: 'Submitted',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    overdue: 'Overdue',
  };
  return map[status] ?? 'Submitted';
};

const fromDbCategory = (category: string): ComplaintCategory => {
  const map: Record<string, ComplaintCategory> = {
    road_issue: 'Road Issue',
    water_leakage: 'Water Leakage',
    sanitation: 'Sanitation',
    electrical: 'Electrical',
    drainage: 'Drainage',
    public_sanitation: 'Public Sanitation',
  };
  return map[category] ?? 'Sanitation';
};

const fromDbSeverity = (severity: string): Severity => {
  const map: Record<string, Severity> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return map[severity] ?? 'Medium';
};

const aiDepartmentIdToDbName: Record<string, string> = {
  'dept-roads': 'Roads & Infrastructure',
  'dept-water': 'Water Works',
  'dept-sanitation': 'Sanitation & Solid Waste',
  'dept-electrical': 'Electrical & Street Lighting',
  'dept-drainage': 'Drainage & Sewerage',
};

const complaintCategoryToDepartmentName: Record<ComplaintCategory, string> = {
  'Road Issue': 'Roads & Infrastructure',
  'Water Leakage': 'Water Works',
  Sanitation: 'Sanitation & Solid Waste',
  Electrical: 'Electrical & Street Lighting',
  Drainage: 'Drainage & Sewerage',
  'Public Sanitation': 'Sanitation & Solid Waste',
};

const resolveDepartmentNameForComplaint = (aiDepartmentId?: string, category?: ComplaintCategory): string => {
  if (aiDepartmentId && aiDepartmentIdToDbName[aiDepartmentId]) {
    return aiDepartmentIdToDbName[aiDepartmentId];
  }

  if (category && complaintCategoryToDepartmentName[category]) {
    return complaintCategoryToDepartmentName[category];
  }

  return 'Sanitation & Solid Waste';
};

type DbComplaintRow = {
  id: string;
  complaint_number?: string;
  title: string;
  description: string;
  location: string;
  ward: string;
  category: string;
  severity: string;
  status: string;
  citizen_id?: string;
  department_id?: string;
  assigned_officer_id?: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  expected_resolution_at?: string;
  resolution_window?: string;
  ai_category?: string;
  ai_severity?: string;
  ai_confidence?: number;
  ai_summary?: string;
  departments?: { id?: string; name?: string } | null;
  citizen_profiles?: { full_name?: string; phone?: string } | null;
  officers?: { badge_number?: string } | null;
};

const isFinalStatus = (status: ComplaintStatus) => status === 'Resolved' || status === 'Closed';

const calculateExpectedResolution = (category: ComplaintCategory, createdAtISO: string) => {
  const plan = categoryResolutionPlans[category] ?? categoryResolutionPlans.Sanitation;
  const expected = new Date(createdAtISO);
  expected.setDate(expected.getDate() + plan.maxDays);
  return {
    expectedResolutionAt: expected.toISOString(),
    resolutionWindow: plan.windowLabel,
  };
};

const generateComplaintNumber = () => {
  const year = new Date().getFullYear();
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 9000 + 1000).toString();
  return `CP-${year}-${stamp}${random}`;
};

const normalizeComplaintTiming = async (row: DbComplaintRow): Promise<DbComplaintRow> => {
  if (!row.expected_resolution_at) return row;
  const currentStatus = fromDbStatus(row.status);
  if (isFinalStatus(currentStatus)) return row;
  if (new Date(row.expected_resolution_at).getTime() >= Date.now()) return row;

  if (row.status === 'overdue') return row;

  const { data } = await supabase
    .from('complaints')
    .update({ status: 'overdue', updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .select('*')
    .single();

  return (data as DbComplaintRow) ?? { ...row, status: 'overdue' };
};

const looksLikeMissingResolutionColumns = (message?: string) =>
  !!message && (
    message.includes("expected_resolution_at") ||
    message.includes("resolution_window") ||
    message.includes("schema cache")
  );

export function mapDbComplaint(row: DbComplaintRow): Complaint {
  return {
    id: row.id,
    complaint_number: row.complaint_number,
    title: row.title,
    description: row.description,
    location: row.location,
    ward: row.ward,
    category: fromDbCategory(row.category),
    severity: fromDbSeverity(row.severity),
    status: fromDbStatus(row.status),
    citizenId: row.citizen_id,
    departmentId: row.department_id,
    officerId: row.assigned_officer_id,
    departmentName: row.departments?.name,
    officerName: row.officers?.badge_number,
    citizenName: row.citizen_profiles?.full_name,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    expectedResolutionAt: row.expected_resolution_at,
    resolutionWindow: row.resolution_window,
    ai: row.ai_category
      ? {
          category: fromDbCategory(row.ai_category),
          severity: fromDbSeverity(row.ai_severity ?? row.severity),
          departmentId: row.department_id ?? '',
          officerId: row.assigned_officer_id ?? '',
          summary: row.ai_summary ?? '',
          confidence: row.ai_confidence ?? 0,
        }
      : undefined,
  };
}

export const realComplaintService = {
  // Create new complaint
  async createComplaint(userId: string, data: CreateComplaintData): Promise<{ complaint: Complaint | null; error: string | null }> {
    try {
      // Check if user can file complaint (rate limiting)
      const { data: canFile, error: rateLimitError } = await supabase
        .rpc('can_file_complaint', { p_user_id: userId });

      if (rateLimitError) {
        return { complaint: null, error: rateLimitError.message };
      }

      if (!canFile) {
        return { complaint: null, error: 'You have reached the daily complaint limit. Please try again tomorrow.' };
      }

      // Get AI analysis
      const aiAnalysis = await aiService.analyze(data.title, data.description);

      const dbCategory = toDbCategory(aiAnalysis.category) || 'sanitation';
      const dbSeverity = toDbSeverity(aiAnalysis.severity) || 'medium';
      const timing = calculateExpectedResolution(aiAnalysis.category, new Date().toISOString());

      // Get department ID from AI classification or complaint category.
      // The AI layer returns mock department ids like "dept-roads", which do not match
      // the real department rows in Supabase. We must resolve to the actual database name.
      const departmentName = resolveDepartmentNameForComplaint(aiAnalysis.departmentId, aiAnalysis.category);
      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('name', departmentName)
        .single();

      // Create complaint (retry on complaint_number unique constraint conflicts)
      let complaint: any = null;
      let insertError: any = null;
      const maxAttempts = 4;
      const fullPayload = {
        complaint_number: generateComplaintNumber(),
        citizen_id: userId,
        title: data.title,
        description: data.description,
        location: data.location,
        ward: data.ward,
        category: dbCategory,
        severity: dbSeverity,
        status: 'submitted',
        department_id: department?.id,
        image_url: data.imageUrl,
        ai_category: dbCategory,
        ai_severity: dbSeverity,
        ai_confidence: aiAnalysis.confidence,
        ai_summary: aiAnalysis.summary,
        latitude: data.latitude,
        longitude: data.longitude,
        expected_resolution_at: timing.expectedResolutionAt,
        resolution_window: timing.resolutionWindow,
      };
      const fallbackPayload = {
        complaint_number: generateComplaintNumber(),
        citizen_id: userId,
        title: data.title,
        description: data.description,
        location: data.location,
        ward: data.ward,
        category: dbCategory,
        severity: dbSeverity,
        status: 'submitted',
        department_id: department?.id,
        image_url: data.imageUrl,
        ai_category: dbCategory,
        ai_severity: dbSeverity,
        ai_confidence: aiAnalysis.confidence,
        ai_summary: aiAnalysis.summary,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const payload = attempt === 1 ? fullPayload : { ...fullPayload, complaint_number: generateComplaintNumber() };
        const res = await supabase
          .from('complaints')
          .insert(payload)
          .select()
          .single();

        complaint = res.data as any;
        insertError = res.error;

        if (!insertError) break;

        const msg = (insertError && insertError.message) || '';
        if (looksLikeMissingResolutionColumns(msg)) {
          const fallbackWithNumber = { ...fallbackPayload, complaint_number: generateComplaintNumber() };
          const fallback = await supabase
            .from('complaints')
            .insert(fallbackWithNumber)
            .select()
            .single();
          complaint = fallback.data as any;
          insertError = fallback.error;
          if (!insertError) break;
        }
        // Postgres unique violation code 23505, or specific complaint_number key
        if (msg.includes('complaints_complaint_number_key') || insertError.code === '23505') {
          if (attempt < maxAttempts) {
            // small backoff before retrying
            await new Promise((r) => setTimeout(r, 150 * attempt));
            continue;
          }
        }

        // Non-unique-error or exhausted attempts
        break;
      }

      if (insertError) {
        return { complaint: null, error: insertError.message };
      }

      // Auto-assign if enabled
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'complaint_auto_assign')
        .single();

      if (settings?.value === 'true' && department?.id) {
        const { data: officerId } = await supabase
          .rpc('assign_complaint_to_officer', {
            p_complaint_id: complaint.id,
            p_department_id: department.id,
            p_ward: data.ward,
          });

        // Notify officer if assigned
        if (officerId) {
          await supabase.rpc('notify_officer_assignment', {
            p_complaint_id: complaint.id,
            p_officer_id: officerId,
          });
        }
      }

      // Add initial timeline entry
      await supabase.from('complaint_timeline').insert({
        complaint_id: complaint.id,
        status: 'submitted',
        note: 'Complaint submitted by citizen',
        performed_by: userId,
        performed_by_role: 'citizen',
      });

      return { complaint: mapDbComplaint(complaint as DbComplaintRow), error: null };
    } catch (error) {
      return { 
        complaint: null, 
        error: error instanceof Error ? error.message : 'Failed to create complaint' 
      };
    }
  },

  // Get complaint by ID
  async getComplaintById(complaintId: string): Promise<{ complaint: Complaint | null; error: string | null }> {
    try {
      const baseSelect = `
          *,
          departments (*),
          officers (*),
          citizen_profiles (full_name, phone)
        `;
      let { data: complaint, error } = await supabase
        .from('complaints')
        .select(baseSelect)
        .eq('id', complaintId)
        .single();

      if (error && looksLikeMissingResolutionColumns(error.message)) {
        const retry = await supabase
          .from('complaints')
          .select('*, departments (*), officers (*), citizen_profiles (full_name, phone)')
          .eq('id', complaintId)
          .single();
        complaint = retry.data;
        error = retry.error;
      }

      if (error) {
        return { complaint: null, error: error.message };
      }

      // Get timeline
      const { data: timeline } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      const normalizedComplaint = await normalizeComplaintTiming(complaint as DbComplaintRow);

      return {
        complaint: {
          ...mapDbComplaint(normalizedComplaint),
          timeline: (timeline || []).map((t) => ({
            id: t.id,
            status: fromDbStatus(t.status),
            note: t.note || '',
            at: t.created_at,
            by: t.performed_by ? 'Officer' : 'System',
          })),
        },
        error: null,
      };
    } catch (error) {
      return { 
        complaint: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch complaint' 
      };
    }
  },

  // Get citizen's complaints
  async getCitizenComplaints(userId: string, limit = 20, offset = 0): Promise<{ complaints: Complaint[]; error: string | null }> {
    try {
      let { data: complaints, error } = await supabase
        .from('complaints')
        .select(`
          *,
          departments (id, name)
        `)
        .eq('citizen_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error && looksLikeMissingResolutionColumns(error.message)) {
        const retry = await supabase
          .from('complaints')
          .select('*, departments (id, name)')
          .eq('citizen_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        complaints = retry.data;
        error = retry.error;
      }

      if (error) {
        return { complaints: [], error: error.message };
      }

      return {
        complaints: await Promise.all((complaints || []).map(async (row) => mapDbComplaint(await normalizeComplaintTiming(row as DbComplaintRow)))),
        error: null,
      };
    } catch (error) {
      return { 
        complaints: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch complaints' 
      };
    }
  },

  // Get officer's assigned complaints
  async getOfficerComplaints(officerRecordId: string, status?: ComplaintStatus): Promise<{ complaints: Complaint[]; error: string | null }> {
    try {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          departments (id, name),
          citizen_profiles (full_name, phone)
        `)
        .eq('assigned_officer_id', officerRecordId);

      if (status) {
        query = query.eq('status', toDbStatus(status) || status);
      }

      let { data: complaints, error } = await query
        .order('created_at', { ascending: false });

      if (error && looksLikeMissingResolutionColumns(error.message)) {
        const retryQuery = supabase
          .from('complaints')
          .select(`
            *,
            departments (id, name),
            citizen_profiles (full_name, phone)
          `)
          .eq('assigned_officer_id', officerRecordId);
        const retry = await retryQuery.order('created_at', { ascending: false });
        complaints = retry.data;
        error = retry.error;
      }

      if (error) {
        return { complaints: [], error: error.message };
      }

      return {
        complaints: await Promise.all((complaints || []).map(async (row) => mapDbComplaint(await normalizeComplaintTiming(row as DbComplaintRow)))),
        error: null,
      };
    } catch (error) {
      return { 
        complaints: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch complaints' 
      };
    }
  },

  // Update complaint status (for officers)
  async updateComplaintStatus(
    complaintId: string, 
    userId: string, 
    data: UpdateComplaintData
  ): Promise<{ complaint: Complaint | null; error: string | null }> {
    try {
      const updateData: Record<string, string | number | boolean | null> = {
        updated_at: new Date().toISOString(),
      };

      if (data.status) {
        const dbStatus = toDbStatus(data.status) || data.status;
        updateData.status = dbStatus;

        if (dbStatus === 'resolved') {
          updateData.resolved_at = new Date().toISOString();
        }
      }

      const { data: complaint, error: updateError } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId)
        .select()
        .single();

      if (updateError) {
        return { complaint: null, error: updateError.message };
      }

      // Add timeline entry
      if (data.status) {
        const dbStatus = toDbStatus(data.status) || data.status;

        await supabase.from('complaint_timeline').insert({
          complaint_id: complaintId,
          status: dbStatus,
          note: data.note || `Status updated to ${data.status}`,
          performed_by: userId,
          performed_by_role: 'officer',
        });

        await supabase.rpc('notify_status_change', {
          p_complaint_id: complaintId,
          p_new_status: dbStatus,
        });
      }

      return { complaint: mapDbComplaint(await normalizeComplaintTiming(complaint as DbComplaintRow)), error: null };
    } catch (error) {
      return { 
        complaint: null, 
        error: error instanceof Error ? error.message : 'Failed to update complaint' 
      };
    }
  },

  // Get all complaints (for admin)
  async getAllComplaints(filters?: {
    status?: ComplaintStatus;
    severity?: Severity;
    category?: ComplaintCategory;
    departmentId?: string;
    ward?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ complaints: Complaint[]; error: string | null }> {
    try {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          departments (*),
          officers (*),
          citizen_profiles (full_name, phone)
        `);

      if (filters?.status) {
        query = query.eq('status', toDbStatus(filters.status) || filters.status);
      }
      if (filters?.severity) {
        query = query.eq('severity', toDbSeverity(filters.severity) || filters.severity);
      }
      if (filters?.category) {
        query = query.eq('category', toDbCategory(filters.category) || filters.category);
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.ward) {
        query = query.eq('ward', filters.ward);
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      let { data: complaints, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error && looksLikeMissingResolutionColumns(error.message)) {
        const retry = await supabase
          .from('complaints')
          .select(`
            *,
            departments (*),
            officers (*),
            citizen_profiles (full_name, phone)
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        complaints = retry.data;
        error = retry.error;
      }

      if (error) {
        return { complaints: [], error: error.message };
      }

      return {
        complaints: await Promise.all((complaints || []).map(async (row) => mapDbComplaint(await normalizeComplaintTiming(row as DbComplaintRow)))),
        error: null,
      };
    } catch (error) {
      return { 
        complaints: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch complaints' 
      };
    }
  },

  // Get complaint statistics
  async getStatistics(): Promise<{ 
    total: number; 
    resolved: number; 
    inProgress: number; 
    assigned: number; 
    submitted: number; 
    avgResolutionTime: number; 
    resolutionRate: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_complaint_statistics')
        .single();

      if (error) {
        return { 
          total: 0, resolved: 0, inProgress: 0, assigned: 0, submitted: 0, 
          avgResolutionTime: 0, resolutionRate: 0, 
          error: error.message 
        };
      }

      const stats = (data as Record<string, number> | null) ?? {};

      return {
        total: stats.total_complaints || 0,
        resolved: stats.resolved_complaints || 0,
        inProgress: stats.in_progress_complaints || 0,
        assigned: stats.assigned_complaints || 0,
        submitted: stats.submitted_complaints || 0,
        avgResolutionTime: stats.avg_resolution_time || 0,
        resolutionRate: stats.resolution_rate || 0,
        error: null,
      };
    } catch (error) {
      return { 
        total: 0, resolved: 0, inProgress: 0, assigned: 0, submitted: 0, 
        avgResolutionTime: 0, resolutionRate: 0, 
        error: error instanceof Error ? error.message : 'Failed to fetch statistics' 
      };
    }
  },

  // Get department statistics
  async getDepartmentStatistics(): Promise<{ 
    departments: Array<{ id: string; name: string; total: number; resolved: number; avgResolutionTime: number }>; 
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_department_statistics');

      if (error) {
        return { departments: [], error: error.message };
      }

      type DepartmentStatRow = {
        department_id: string;
        department_name: string;
        total_complaints: number;
        resolved_complaints: number;
        avg_resolution_time: number;
      };

      const departments = (data || []).map((d: DepartmentStatRow) => ({
        id: d.department_id,
        name: d.department_name,
        total: d.total_complaints,
        resolved: d.resolved_complaints,
        avgResolutionTime: d.avg_resolution_time,
      }));

      return { departments, error: null };
    } catch (error) {
      return { 
        departments: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch department statistics' 
      };
    }
  },

  // Get category statistics
  async getCategoryStatistics(): Promise<{ 
    categories: Array<{ category: ComplaintCategory; count: number; percentage: number }>; 
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_category_statistics');

      if (error) {
        return { categories: [], error: error.message };
      }

      return { categories: data || [], error: null };
    } catch (error) {
      return { 
        categories: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch category statistics' 
      };
    }
  },

  // Get severity statistics
  async getSeverityStatistics(): Promise<{ 
    severities: Array<{ severity: Severity; count: number; percentage: number }>; 
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_severity_statistics');

      if (error) {
        return { severities: [], error: error.message };
      }

      return { severities: data || [], error: null };
    } catch (error) {
      return { 
        severities: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch severity statistics' 
      };
    }
  },

  // Get ward statistics
  async getWardStatistics(limit = 10): Promise<{ 
    wards: Array<{ ward: string; count: number }>; 
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_ward_statistics', { p_limit: limit });

      if (error) {
        return { wards: [], error: error.message };
      }

      return { wards: data || [], error: null };
    } catch (error) {
      return { 
        wards: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch ward statistics' 
      };
    }
  },

  // Get monthly trend data
  async getMonthlyTrend(months = 6): Promise<{ 
    trends: Array<{ month: string; year: number; complaints: number; resolved: number }>; 
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_monthly_trend', { p_months: months });

      if (error) {
        return { trends: [], error: error.message };
      }

      return { trends: data || [], error: null };
    } catch (error) {
      return { 
        trends: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch monthly trends' 
      };
    }
  },
};
