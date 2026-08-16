export type Role = 'citizen' | 'officer' | 'admin';

export type ComplaintStatus = 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintCategory =
  | 'Road Issue'
  | 'Water Leakage'
  | 'Sanitation'
  | 'Electrical'
  | 'Drainage'
  | 'Public Sanitation';

export interface Department {
  id: string;
  name: string;
  head: string;
  color: string;
}

export interface Officer {
  id: string;
  name: string;
  departmentId: string;
  ward: string;
  badge: string;
}

export interface AIAnalysis {
  category: ComplaintCategory;
  severity: Severity;
  departmentId: string;
  officerId: string;
  summary: string;
  confidence: number;
}

export interface StatusUpdate {
  id: string;
  status: ComplaintStatus;
  note: string;
  at: string;
  by: string;
};

export interface Complaint {
  id: string;
  complaint_number?: string;
  title: string;
  description: string;
  location: string;
  ward: string;
  imageUrl?: string;
  category: ComplaintCategory;
  severity: Severity;
  departmentId?: string;
  officerId?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  citizenId?: string;
  citizenName?: string;
  departmentName?: string;
  officerName?: string;
  ai?: AIAnalysis;
  timeline?: StatusUpdate[];
}

export interface CitizenUser {
  id: string;
  name: string;
  email: string;
  ward: string;
  phone: string;
  address?: string;
  joinedAt: string;
}

export interface OfficerUser {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  ward: string;
  badge: string;
  rank: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  municipality: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  type: 'status' | 'assignment' | 'system' | 'alert';
}

export type AuthUser =
  | ({ role: 'citizen' } & CitizenUser)
  | ({ role: 'officer' } & OfficerUser)
  | ({ role: 'admin' } & AdminUser);
