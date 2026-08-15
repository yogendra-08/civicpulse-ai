import { complaints as seed } from '@/data/mockData';
import type { Complaint, ComplaintStatus } from '@/types';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let store: Complaint[] = seed.map((c) => ({ ...c }));

export const complaintService = {
  async list(): Promise<Complaint[]> {
    await delay(400);
    return [...store];
  },

  async listByCitizen(citizenId: string): Promise<Complaint[]> {
    await delay(350);
    return store.filter((c) => c.citizenId === citizenId);
  },

  async listByOfficer(officerId: string): Promise<Complaint[]> {
    await delay(350);
    return store.filter((c) => c.officerId === officerId);
  },

  async get(id: string): Promise<Complaint | undefined> {
    await delay(250);
    return store.find((c) => c.id === id);
  },

  async create(complaint: Complaint): Promise<Complaint> {
    await delay(300);
    store = [complaint, ...store];
    return complaint;
  },

  async updateStatus(
    id: string,
    status: ComplaintStatus,
    note: string,
    by: string,
  ): Promise<Complaint | undefined> {
    await delay(500);
    store = store.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        status,
        timeline: [
          ...c.timeline,
          { id: `t-${Date.now()}`, status, note, by, at: new Date().toISOString() },
        ],
      };
    });
    return store.find((c) => c.id === id);
  },

  nextId(): string {
    const n = 422 + (store.length - 12) + 1;
    return `CP-2026-${String(n).padStart(4, '0')}`;
  },
};
