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

      // Map AI category to database enum
      const categoryMapping: Record<string, ComplaintCategory> = {
        'Road Issue': 'road_issue',
        'Water Leakage': 'water_leakage',
        'Sanitation': 'sanitation',
        'Electrical': 'electrical',
        'Drainage': 'drainage',
        'Public Sanitation': 'public_sanitation',
      };

      const dbCategory = categoryMapping[aiAnalysis.category] || 'sanitation';

      // Map AI severity to database enum
      const severityMapping: Record<string, Severity> = {
        'Critical': 'critical',
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low',
      };

      const dbSeverity = severityMapping[aiAnalysis.severity] || 'medium';

      // Get department ID from category
      const { data: department } = await supabase
        .from('departments')
        .select('id')
        .eq('name', aiAnalysis.departmentId ? 
          ['Roads & Infrastructure', 'Water Works', 'Sanitation & Solid Waste', 'Electrical & Street Lighting', 'Drainage & Sewerage']
            .find(dept => dept.toLowerCase().includes(aiAnalysis.departmentId?.toLowerCase() || '')) || 'Sanitation & Solid Waste'
          : 'Sanitation & Solid Waste')
        .single();

      // Create complaint
      const { data: complaint, error: insertError } = await supabase
        .from('complaints')
        .insert({
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
        })
        .select()
        .single();

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

      return { complaint: complaint as Complaint, error: null };
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
      const { data: complaint, error } = await supabase
        .from('complaints')
        .select(`
          *,
          departments (*),
          officers (*),
          citizen_profiles (full_name, phone)
        `)
        .eq('id', complaintId)
        .single();

      if (error) {
        return { complaint: null, error: error.message };
      }

      // Get timeline
      const { data: timeline } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      return { 
        complaint: { 
          ...complaint, 
          timeline: timeline || [],
          citizenName: complaint.citizen_profiles?.full_name,
          departmentName: complaint.departments?.name,
          officerName: complaint.officers?.badge_number,
        } as Complaint, 
        error: null 
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
      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('citizen_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { complaints: [], error: error.message };
      }

      return { complaints: (complaints || []) as Complaint[], error: null };
    } catch (error) {
      return { 
        complaints: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch complaints' 
      };
    }
  },

  // Get officer's assigned complaints
  async getOfficerComplaints(officerId: string, status?: ComplaintStatus): Promise<{ complaints: Complaint[]; error: string | null }> {
    try {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          citizen_profiles (full_name, phone)
        `)
        .eq('assigned_officer_id', officerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: complaints, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        return { complaints: [], error: error.message };
      }

      const formattedComplaints = (complaints || []).map((c: any) => ({
        ...c,
        citizenName: c.citizen_profiles?.full_name,
      })) as Complaint[];

      return { complaints: formattedComplaints, error: null };
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
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.status) {
        updateData.status = data.status;
        
        if (data.status === 'resolved') {
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
        await supabase.from('complaint_timeline').insert({
          complaint_id: complaintId,
          status: data.status,
          note: data.note || `Status updated to ${data.status}`,
          performed_by: userId,
          performed_by_role: 'officer',
        });

        // Notify citizen about status change
        await supabase.rpc('notify_status_change', {
          p_complaint_id: complaintId,
          p_new_status: data.status,
        });
      }

      return { complaint: complaint as Complaint, error: null };
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
        query = query.eq('status', filters.status);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.ward) {
        query = query.eq('ward', filters.ward);
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const { data: complaints, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { complaints: [], error: error.message };
      }

      const formattedComplaints = (complaints || []).map((c: any) => ({
        ...c,
        citizenName: c.citizen_profiles?.full_name,
        departmentName: c.departments?.name,
        officerName: c.officers?.badge_number,
      })) as Complaint[];

      return { complaints: formattedComplaints, error: null };
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

      return {
        total: data.total_complaints || 0,
        resolved: data.resolved_complaints || 0,
        inProgress: data.in_progress_complaints || 0,
        assigned: data.assigned_complaints || 0,
        submitted: data.submitted_complaints || 0,
        avgResolutionTime: data.avg_resolution_time || 0,
        resolutionRate: data.resolution_rate || 0,
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

      const departments = (data || []).map((d: any) => ({
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
