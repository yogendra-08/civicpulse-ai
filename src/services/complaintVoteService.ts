const STORAGE_KEY = 'civicpulse.complaintVotes';

export interface ComplaintVoteSummary {
  upvotes: number;
  voters: string[];
}

type VoteStore = Record<string, ComplaintVoteSummary>;

function loadStore(): VoteStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as VoteStore;
  } catch {
    return {};
  }
}

function saveStore(store: VoteStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function ensureEntry(store: VoteStore, complaintId: string): ComplaintVoteSummary {
  if (!store[complaintId]) {
    store[complaintId] = { upvotes: 0, voters: [] };
  }
  return store[complaintId];
}

export const complaintVoteService = {
  getSummary(complaintId: string): ComplaintVoteSummary {
    const store = loadStore();
    return store[complaintId] ?? { upvotes: 0, voters: [] };
  },

  hasUpvoted(complaintId: string, userId?: string): boolean {
    if (!userId) return false;
    const summary = this.getSummary(complaintId);
    return summary.voters.includes(userId);
  },

  toggleUpvote(complaintId: string, userId: string): ComplaintVoteSummary {
    const store = loadStore();
    const entry = ensureEntry(store, complaintId);
    const index = entry.voters.indexOf(userId);

    if (index >= 0) {
      entry.voters.splice(index, 1);
      entry.upvotes = Math.max(0, entry.upvotes - 1);
    } else {
      entry.voters.push(userId);
      entry.upvotes += 1;
    }

    saveStore(store);
    return { ...entry, voters: [...entry.voters] };
  },
};
