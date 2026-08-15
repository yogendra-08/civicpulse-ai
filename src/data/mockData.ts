import type {
  Complaint,
  ComplaintCategory,
  Department,
  NotificationItem,
  Officer,
  Severity,
} from '@/types';

export const departments: Department[] = [
  { id: 'dept-roads', name: 'Roads & Infrastructure', head: 'Er. Rajesh Menon', color: '#f59e0b' },
  { id: 'dept-water', name: 'Water Works', head: 'Er. Sunita Pillai', color: '#3b82f6' },
  { id: 'dept-sanitation', name: 'Sanitation & Solid Waste', head: 'Dr. Anil Kulkarni', color: '#10b981' },
  { id: 'dept-electrical', name: 'Electrical & Street Lighting', head: 'Er. Meera Deshmukh', color: '#8b5cf6' },
  { id: 'dept-drainage', name: 'Drainage & Sewerage', head: 'Er. Vikram Naik', color: '#06b6d4' },
];

export const officers: Officer[] = [
  { id: 'off-1', name: 'Suresh Kamble', departmentId: 'dept-roads', ward: 'Ward 12', badge: 'R-2041' },
  { id: 'off-2', name: 'Priya Shinde', departmentId: 'dept-roads', ward: 'Ward 07', badge: 'R-2055' },
  { id: 'off-3', name: 'Mahesh Pawar', departmentId: 'dept-water', ward: 'Ward 04', badge: 'W-1120' },
  { id: 'off-4', name: 'Lata Joshi', departmentId: 'dept-water', ward: 'Ward 09', badge: 'W-1138' },
  { id: 'off-5', name: 'Imran Sheikh', departmentId: 'dept-sanitation', ward: 'Ward 02', badge: 'S-3301' },
  { id: 'off-6', name: 'Deepak More', departmentId: 'dept-sanitation', ward: 'Ward 15', badge: 'S-3322' },
  { id: 'off-7', name: 'Farhana Ansari', departmentId: 'dept-electrical', ward: 'Ward 06', badge: 'E-4410' },
  { id: 'off-8', name: 'Rohit Nair', departmentId: 'dept-electrical', ward: 'Ward 11', badge: 'E-4427' },
  { id: 'off-9', name: 'Kavita Rao', departmentId: 'dept-drainage', ward: 'Ward 03', badge: 'D-5502' },
  { id: 'off-10', name: 'Sandeep Yadav', departmentId: 'dept-drainage', ward: 'Ward 08', badge: 'D-5519' },
];

export const wards = [
  'Ward 01', 'Ward 02', 'Ward 03', 'Ward 04', 'Ward 05',
  'Ward 06', 'Ward 07', 'Ward 08', 'Ward 09', 'Ward 10',
  'Ward 11', 'Ward 12', 'Ward 13', 'Ward 14', 'Ward 15',
];

export const categoryToDepartment: Record<ComplaintCategory, string> = {
  'Road Issue': 'dept-roads',
  'Water Leakage': 'dept-water',
  Sanitation: 'dept-sanitation',
  Electrical: 'dept-electrical',
  Drainage: 'dept-drainage',
  'Public Sanitation': 'dept-sanitation',
};

const now = new Date('2026-08-14T09:00:00');
function daysAgo(n: number) {
  return new Date(now.getTime() - n * 86400000).toISOString();
}

export const complaints: Complaint[] = [
  {
    id: 'CP-2026-0421',
    title: 'Large pothole near bus stop on MG Road',
    description:
      'There is a large pothole near the bus stop on MG Road, opposite the Hanuman Temple. It has been there for over two weeks and is causing two-wheelers to skid. One rider fell yesterday. Please fix urgently.',
    location: 'MG Road, near Hanuman Temple, Ward 12',
    ward: 'Ward 12',
    category: 'Road Issue',
    severity: 'High',
    departmentId: 'dept-roads',
    officerId: 'off-1',
    status: 'In Progress',
    createdAt: daysAgo(2),
    citizenId: 'cit-1',
    citizenName: 'Aarav Sharma',
    ai: {
      category: 'Road Issue',
      severity: 'High',
      departmentId: 'dept-roads',
      officerId: 'off-1',
      summary:
        'Citizen reports a large pothole on MG Road near the bus stop causing a safety hazard to two-wheeler riders, with a recent fall incident. Urgent road repair required.',
      confidence: 0.94,
    },
    timeline: [
      { id: 't1', status: 'Assigned', note: 'Auto-assigned to Roads & Infrastructure dept by AI engine.', at: daysAgo(2), by: 'CivicPulse AI' },
      { id: 't2', status: 'In Progress', note: 'Inspected site. Repair crew scheduled for tomorrow.', at: daysAgo(1), by: 'Suresh Kamble' },
    ],
  },
  {
    id: 'CP-2026-0420',
    title: 'Garbage piling up in lane behind market',
    description:
      'Garbage has been piling up in the lane behind the vegetable market for a week. It smells terrible and there are mosquitoes. Children in the area are falling sick.',
    location: 'Lane 3, behind Vegetable Market, Ward 02',
    ward: 'Ward 02',
    category: 'Sanitation',
    severity: 'Medium',
    departmentId: 'dept-sanitation',
    officerId: 'off-5',
    status: 'Assigned',
    createdAt: daysAgo(1),
    citizenId: 'cit-1',
    citizenName: 'Aarav Sharma',
    ai: {
      category: 'Sanitation',
      severity: 'Medium',
      departmentId: 'dept-sanitation',
      officerId: 'off-5',
      summary:
        'Accumulated garbage in a residential lane behind the market over a week, with reported health impact on children. Requires immediate clearance and fumigation.',
      confidence: 0.91,
    },
    timeline: [
      { id: 't3', status: 'Assigned', note: 'Auto-assigned to Sanitation & Solid Waste dept.', at: daysAgo(1), by: 'CivicPulse AI' },
    ],
  },
  {
    id: 'CP-2026-0418',
    title: 'Water leakage from main pipeline on Station Road',
    description:
      'There is continuous water leakage from the main pipeline on Station Road near the post office. Water is flowing onto the road for three days now. Lots of water is being wasted.',
    location: 'Station Road, near Post Office, Ward 04',
    ward: 'Ward 04',
    category: 'Water Leakage',
    severity: 'High',
    departmentId: 'dept-water',
    officerId: 'off-3',
    status: 'Resolved',
    createdAt: daysAgo(9),
    citizenId: 'cit-1',
    citizenName: 'Aarav Sharma',
    ai: {
      category: 'Water Leakage',
      severity: 'High',
      departmentId: 'dept-water',
      officerId: 'off-3',
      summary:
        'Continuous leakage from a main water pipeline on Station Road causing water wastage and road flooding over three days. Priority repair needed.',
      confidence: 0.96,
    },
    timeline: [
      { id: 't4', status: 'Assigned', note: 'Auto-assigned to Water Works dept.', at: daysAgo(9), by: 'CivicPulse AI' },
      { id: 't5', status: 'In Progress', note: 'Pipeline section identified, valve shut for repair.', at: daysAgo(7), by: 'Mahesh Pawar' },
      { id: 't6', status: 'Resolved', note: 'Pipeline replaced and tested. Road surface restored.', at: daysAgo(5), by: 'Mahesh Pawar' },
    ],
  },
  {
    id: 'CP-2026-0415',
    title: 'Streetlight not working on entire street',
    description:
      'The streetlight in front of house numbers 14 to 22 on Park Avenue has not been working for 10 days. It is completely dark at night and unsafe for women and elderly.',
    location: 'Park Avenue, Houses 14-22, Ward 06',
    ward: 'Ward 06',
    category: 'Electrical',
    severity: 'Medium',
    departmentId: 'dept-electrical',
    officerId: 'off-7',
    status: 'In Progress',
    createdAt: daysAgo(4),
    citizenId: 'cit-2',
    citizenName: 'Neha Verma',
    ai: {
      category: 'Electrical',
      severity: 'Medium',
      departmentId: 'dept-electrical',
      officerId: 'off-7',
      summary:
        'Non-functional streetlight on Park Avenue affecting multiple houses for 10 days, creating unsafe nighttime conditions. Requires electrical repair.',
      confidence: 0.89,
    },
    timeline: [
      { id: 't7', status: 'Assigned', note: 'Auto-assigned to Electrical & Street Lighting dept.', at: daysAgo(4), by: 'CivicPulse AI' },
      { id: 't8', status: 'In Progress', note: 'Faulty wiring identified. Replacement fixture ordered.', at: daysAgo(2), by: 'Farhana Ansari' },
    ],
  },
  {
    id: 'CP-2026-0412',
    title: 'Drainage overflow near school',
    description:
      'The drain near the government primary school is overflowing and dirty water is on the road. Children have to walk through it. This is a serious health hazard.',
    location: 'School Road, near Govt Primary School, Ward 03',
    ward: 'Ward 03',
    category: 'Drainage',
    severity: 'Critical',
    departmentId: 'dept-drainage',
    officerId: 'off-9',
    status: 'Assigned',
    createdAt: daysAgo(1),
    citizenId: 'cit-3',
    citizenName: 'Mohammed Iqbal',
    ai: {
      category: 'Drainage',
      severity: 'Critical',
      departmentId: 'dept-drainage',
      officerId: 'off-9',
      summary:
        'Overflowing drainage near a primary school creating a serious public health hazard for schoolchildren. Critical priority — immediate desilting and repair required.',
      confidence: 0.97,
    },
    timeline: [
      { id: 't9', status: 'Assigned', note: 'Critical severity flagged. Auto-assigned to Drainage & Sewerage dept.', at: daysAgo(1), by: 'CivicPulse AI' },
    ],
  },
  {
    id: 'CP-2026-0409',
    title: 'Broken road surface after rain',
    description:
      'After last week rain, the road surface on 1st Cross has broken badly with cracks and loose gravel. Vehicles are getting damaged.',
    location: '1st Cross, Indira Nagar, Ward 07',
    ward: 'Ward 07',
    category: 'Road Issue',
    severity: 'Medium',
    departmentId: 'dept-roads',
    officerId: 'off-2',
    status: 'Resolved',
    createdAt: daysAgo(18),
    citizenId: 'cit-2',
    citizenName: 'Neha Verma',
    ai: {
      category: 'Road Issue',
      severity: 'Medium',
      departmentId: 'dept-roads',
      officerId: 'off-2',
      summary:
        'Post-monsoon road surface damage on 1st Cross with cracks and loose gravel causing vehicle damage. Requires resurfacing.',
      confidence: 0.88,
    },
    timeline: [
      { id: 't10', status: 'Assigned', note: 'Auto-assigned to Roads & Infrastructure dept.', at: daysAgo(18), by: 'CivicPulse AI' },
      { id: 't11', status: 'In Progress', note: 'Site surveyed. Hot-mix patchwork scheduled.', at: daysAgo(15), by: 'Priya Shinde' },
      { id: 't12', status: 'Resolved', note: 'Patchwork completed and compacted.', at: daysAgo(12), by: 'Priya Shinde' },
    ],
  },
  {
    id: 'CP-2026-0407',
    title: 'Public toilet near park not cleaned',
    description:
      'The public toilet near Central Park is very dirty and not cleaned for many days. There is no water supply inside and it is unusable. Women and children cannot use it.',
    location: 'Central Park Gate 2, Ward 15',
    ward: 'Ward 15',
    category: 'Public Sanitation',
    severity: 'High',
    departmentId: 'dept-sanitation',
    officerId: 'off-6',
    status: 'In Progress',
    createdAt: daysAgo(3),
    citizenId: 'cit-3',
    citizenName: 'Mohammed Iqbal',
    ai: {
      category: 'Public Sanitation',
      severity: 'High',
      departmentId: 'dept-sanitation',
      officerId: 'off-6',
      summary:
        'Uncleaned public toilet near Central Park with no water supply, unusable for women and children. Requires urgent cleaning and water restoration.',
      confidence: 0.93,
    },
    timeline: [
      { id: 't13', status: 'Assigned', note: 'Auto-assigned to Sanitation & Solid Waste dept.', at: daysAgo(3), by: 'CivicPulse AI' },
      { id: 't14', status: 'In Progress', note: 'Cleaning crew dispatched. Water tanker requested.', at: daysAgo(1), by: 'Deepak More' },
    ],
  },
  {
    id: 'CP-2026-0405',
    title: 'Streetlight pole leaning dangerously',
    description:
      'A streetlight pole on Lake View Road is leaning at a dangerous angle after a vehicle hit it. It may fall on pedestrians or vehicles any time.',
    location: 'Lake View Road, near Junction 4, Ward 11',
    ward: 'Ward 11',
    category: 'Electrical',
    severity: 'Critical',
    departmentId: 'dept-electrical',
    officerId: 'off-8',
    status: 'Assigned',
    createdAt: daysAgo(0),
    citizenId: 'cit-4',
    citizenName: 'Fatima Begum',
    ai: {
      category: 'Electrical',
      severity: 'Critical',
      departmentId: 'dept-electrical',
      officerId: 'off-8',
      summary:
        'Dangerously leaning streetlight pole after vehicle collision posing immediate fall risk to pedestrians and vehicles. Critical — emergency straightening/replacement required.',
      confidence: 0.95,
    },
    timeline: [
      { id: 't15', status: 'Assigned', note: 'Critical severity flagged. Emergency crew notified.', at: daysAgo(0), by: 'CivicPulse AI' },
    ],
  },
  {
    id: 'CP-2026-0401',
    title: 'Water leakage inside apartment compound',
    description:
      'There is a water leakage from the underground tank inside our apartment compound. Water is pooling and damaging the foundation.',
    location: 'Sunrise Apartments, Compound, Ward 09',
    ward: 'Ward 09',
    category: 'Water Leakage',
    severity: 'Low',
    departmentId: 'dept-water',
    officerId: 'off-4',
    status: 'Resolved',
    createdAt: daysAgo(22),
    citizenId: 'cit-4',
    citizenName: 'Fatima Begum',
    ai: {
      category: 'Water Leakage',
      severity: 'Low',
      departmentId: 'dept-water',
      officerId: 'off-4',
      summary:
        'Underground tank water leakage within apartment compound causing foundation damage. Requires inspection and sealing.',
      confidence: 0.86,
    },
    timeline: [
      { id: 't16', status: 'Assigned', note: 'Auto-assigned to Water Works dept.', at: daysAgo(22), by: 'CivicPulse AI' },
      { id: 't17', status: 'In Progress', note: 'Leak located. Sealant applied.', at: daysAgo(19), by: 'Lata Joshi' },
      { id: 't18', status: 'Resolved', note: 'Tank sealed and pressure tested. No further leakage.', at: daysAgo(16), by: 'Lata Joshi' },
    ],
  },
  {
    id: 'CP-2026-0398',
    title: 'Garbage not collected for one week',
    description:
      'Our street garbage has not been collected for a full week. Bins are overflowing and dogs are scattering waste everywhere.',
    location: 'Tulsi Marg, Ward 15',
    ward: 'Ward 15',
    category: 'Sanitation',
    severity: 'Medium',
    departmentId: 'dept-sanitation',
    officerId: 'off-6',
    status: 'Resolved',
    createdAt: daysAgo(14),
    citizenId: 'cit-2',
    citizenName: 'Neha Verma',
    ai: {
      category: 'Sanitation',
      severity: 'Medium',
      departmentId: 'dept-sanitation',
      officerId: 'off-6',
      summary:
        'Uncollected street garbage for a week with overflowing bins and scattered waste. Requires collection route adjustment.',
      confidence: 0.9,
    },
    timeline: [
      { id: 't19', status: 'Assigned', note: 'Auto-assigned to Sanitation & Solid Waste dept.', at: daysAgo(14), by: 'CivicPulse AI' },
      { id: 't20', status: 'In Progress', note: 'Collection vehicle rerouted to ward.', at: daysAgo(12), by: 'Deepak More' },
      { id: 't21', status: 'Resolved', note: 'Bins cleared. Daily collection schedule restored.', at: daysAgo(10), by: 'Deepak More' },
    ],
  },
  {
    id: 'CP-2026-0395',
    title: 'Potholes on highway service road',
    description:
      'Multiple potholes on the service road parallel to the highway near the toll plaza. Traffic is slowing and bikes are slipping.',
    location: 'Highway Service Road, near Toll Plaza, Ward 08',
    ward: 'Ward 08',
    category: 'Road Issue',
    severity: 'High',
    departmentId: 'dept-roads',
    officerId: 'off-2',
    status: 'In Progress',
    createdAt: daysAgo(5),
    citizenId: 'cit-3',
    citizenName: 'Mohammed Iqbal',
    ai: {
      category: 'Road Issue',
      severity: 'High',
      departmentId: 'dept-roads',
      officerId: 'off-2',
      summary:
        'Multiple potholes on highway service road causing traffic slowdown and two-wheeler skidding risk. Requires urgent patching.',
      confidence: 0.92,
    },
    timeline: [
      { id: 't22', status: 'Assigned', note: 'Auto-assigned to Roads & Infrastructure dept.', at: daysAgo(5), by: 'CivicPulse AI' },
      { id: 't23', status: 'In Progress', note: 'Potholes marked. Patching crew scheduled.', at: daysAgo(3), by: 'Priya Shinde' },
    ],
  },
  {
    id: 'CP-2026-0390',
    title: 'Drain cover missing on main road',
    description:
      'A drain cover on the main road near the hospital is missing. It is a deep open drain and very dangerous at night.',
    location: 'Hospital Road, Ward 03',
    ward: 'Ward 03',
    category: 'Drainage',
    severity: 'High',
    departmentId: 'dept-drainage',
    officerId: 'off-9',
    status: 'Resolved',
    createdAt: daysAgo(20),
    citizenId: 'cit-4',
    citizenName: 'Fatima Begum',
    ai: {
      category: 'Drainage',
      severity: 'High',
      departmentId: 'dept-drainage',
      officerId: 'off-9',
      summary:
        'Missing drain cover on Hospital Road exposing a deep open drain, dangerous at night. Requires immediate cover replacement.',
      confidence: 0.91,
    },
    timeline: [
      { id: 't24', status: 'Assigned', note: 'Auto-assigned to Drainage & Sewerage dept.', at: daysAgo(20), by: 'CivicPulse AI' },
      { id: 't25', status: 'In Progress', note: 'Temporary barricade placed. New cover ordered.', at: daysAgo(17), by: 'Kavita Rao' },
      { id: 't26', status: 'Resolved', note: 'New RCC cover installed and secured.', at: daysAgo(14), by: 'Kavita Rao' },
    ],
  },
];

export const notifications: NotificationItem[] = [
  { id: 'n1', title: 'Status Updated', body: 'Complaint CP-2026-0418 (Water Leakage) has been resolved.', at: daysAgo(5), read: false, type: 'status' },
  { id: 'n2', title: 'New Assignment', body: 'Complaint CP-2026-0420 assigned to Sanitation dept.', at: daysAgo(1), read: false, type: 'assignment' },
  { id: 'n3', title: 'Critical Alert', body: 'Critical severity complaint CP-2026-0412 near a school.', at: daysAgo(1), read: false, type: 'alert' },
  { id: 'n4', title: 'System Notice', body: 'Monthly resolution report is ready to view.', at: daysAgo(2), read: true, type: 'system' },
];

export const severityColor: Record<Severity, string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

export const statusColor: Record<string, string> = {
  Assigned: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-saffron-100 text-saffron-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
};

export const categoryColor: Record<ComplaintCategory, string> = {
  'Road Issue': '#f59e0b',
  'Water Leakage': '#3b82f6',
  Sanitation: '#10b981',
  Electrical: '#8b5cf6',
  Drainage: '#06b6d4',
  'Public Sanitation': '#14b8a6',
};

export const categoryIcon: Record<ComplaintCategory, string> = {
  'Road Issue': 'Construction',
  'Water Leakage': 'Droplets',
  Sanitation: 'Trash2',
  Electrical: 'Lightbulb',
  Drainage: 'Waves',
  'Public Sanitation': 'SprayCan',
};
