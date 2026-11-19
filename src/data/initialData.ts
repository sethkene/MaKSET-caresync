import {
  AccessPermissions,
  CareSyncState,
  DashboardDataset,
  DashboardLevel,
  Encounter,
  EncounterType,
  Facility,
  FacilityConfig,
  Patient,
  Referral,
  StaffMember,
  SurveillanceSignal,
} from '../types/caresync';

export const DEFAULT_FACILITY_CONFIG: FacilityConfig = {
  configured: false,
  name: 'Primary Health Centre (Unconfigured)',
  type: 'PHC',
  lga: 'Katagum',
  stateName: 'Bauchi State',
  ward: 'Central Ward',
};

export const REGISTERED_FACILITIES: Facility[] = [
  { name: 'Chinade PHC', type: 'PHC', lga: 'Katagum', stateName: 'Bauchi State' },
  { name: 'Madara PHC', type: 'PHC', lga: 'Katagum', stateName: 'Bauchi State' },
  { name: 'Misau PHC', type: 'PHC', lga: 'Misau', stateName: 'Bauchi State' },
  { name: 'Azare General Hospital', type: 'Hospital', lga: 'Katagum', stateName: 'Bauchi State' },
  { name: 'Bauchi General Hospital', type: 'Hospital', lga: 'Bauchi', stateName: 'Bauchi State' },
];

export const ROLE_LABELS: Record<string, string> = {
  nurse: 'Nurse / CHEW',
  oc: 'Officer in Charge',
  asst: 'OC Assistant',
  lab: 'Lab Technician',
  pharm: 'Pharmacist',
  creator: 'Facility / System Admin',
};

export function defaultPermissionsForRole(
  role: StaffMember['role'] | 'creator'
): AccessPermissions {
  if (role === 'oc' || role === 'creator') {
    return {
      patients: true,
      clinicalEncounters: true,
      laboratory: true,
      pharmacy: true,
      referrals: true,
      reportsDashboards: true,
      manageStaff: true,
    };
  }
  if (role === 'nurse') {
    return {
      patients: true,
      clinicalEncounters: true,
      laboratory: false,
      pharmacy: false,
      referrals: true,
      reportsDashboards: true,
      manageStaff: false,
    };
  }
  if (role === 'lab') {
    return {
      patients: false,
      clinicalEncounters: false,
      laboratory: true,
      pharmacy: false,
      referrals: false,
      reportsDashboards: false,
      manageStaff: false,
    };
  }
  if (role === 'pharm') {
    return {
      patients: false,
      clinicalEncounters: false,
      laboratory: false,
      pharmacy: true,
      referrals: false,
      reportsDashboards: false,
      manageStaff: false,
    };
  }
  return {
    patients: false,
    clinicalEncounters: false,
    laboratory: false,
    pharmacy: false,
    referrals: false,
    reportsDashboards: false,
    manageStaff: true,
  };
}

export const LAB_TESTS = [
  'Malaria RDT',
  'Hb/PCV',
  'Urinalysis',
  'Blood glucose',
  'HIV screen',
  'Stool microscopy',
];

export const MEDICATIONS = [
  'Artemether-lumefantrine',
  'Paracetamol',
  'ORS + Zinc',
  'Amoxicillin',
  'Iron and folic acid',
];

export const IMMUNIZATION_SCHEDULE: [string, string[]][] = [
  ['At birth', ['BCG', 'OPV0', 'Hep B0']],
  ['6 weeks', ['OPV1', 'Penta1', 'PCV1', 'Rota1']],
  ['10 weeks', ['OPV2', 'Penta2', 'PCV2', 'Rota2']],
  ['14 weeks', ['OPV3', 'Penta3', 'PCV3', 'Rota3', 'IPV1']],
  ['5 to 7 months', ['Malaria vaccine 1', 'Malaria vaccine 2', 'Malaria vaccine 3']],
  ['6 months', ['Vitamin A (1st dose)']],
  ['9 months', ['Measles 1', 'Yellow fever', 'Men A', 'IPV2']],
  ['12 months', ['Vitamin A (2nd dose)']],
  ['15 months', ['Measles 2', 'Malaria vaccine 4']],
  ['Girls 9 to 14 years', ['HPV']],
];

export const ALL_VACCINES = IMMUNIZATION_SCHEDULE.flatMap((group) => group[1]);

export const ENCOUNTER_OUTCOMES: Record<EncounterType, string[]> = {
  OPD: ['Treated', 'Not treated', 'Admitted', 'Referred out'],
  Inpatient: ['Admitted', 'Discharged', 'Referred out', 'Died'],
  ANC: ['Routine follow-up', 'Referred', 'High-risk flagged'],
  'Labour/Delivery': ['Mother and baby well', 'Referred', 'Maternal complication'],
  PNC: ['Well', 'Referred'],
  'Family Planning': ['Method provided', 'Referred', 'Declined'],
  Immunization: ['Completed', 'Deferred'],
  'Growth and Nutrition': ['Counselled', 'Enrolled in nutrition programme', 'Referred'],
};

export const ENCOUNTER_FLAGS: Record<EncounterType, string> = {
  OPD: 'LDR',
  Inpatient: 'LDR',
  ANC: 'LR',
  'Labour/Delivery': 'DR',
  PNC: 'DR',
  'Family Planning': 'R',
  Immunization: '',
  'Growth and Nutrition': 'DR',
};

export const DASHBOARD_DATA: Record<DashboardLevel, DashboardDataset> = {
  PHC: {
    title: 'Active Facility',
    subtitle: 'Your facility · Local Government Area',
    barTitle: 'OPD attendance by week',
    bars: [
      ['W1', 42],
      ['W2', 55],
      ['W3', 48],
      ['W4', 70],
    ],
    kpis: [
      ['OPD this month', '215'],
      ['ANC visits', '38'],
      ['Immunizations', '64'],
      ['Referrals out', '2'],
    ],
    tableHeaders: ['Top diagnoses', 'Cases'],
    tableRows: [
      ['Malaria', '86'],
      ['Respiratory infection', '41'],
      ['Diarrhoea', '23'],
      ['Skin conditions', '19'],
    ],
  },
  Hospital: {
    title: 'Bauchi General Hospital',
    subtitle: 'Receiving facility · Secondary Referral Tier',
    barTitle: 'Referrals received by month',
    bars: [
      ['Jun', 38],
      ['Jul', 44],
      ['Aug', 41],
      ['Sep', 52],
      ['Oct', 57],
    ],
    kpis: [
      ['Referrals received', '57'],
      ['Admissions', '112'],
      ['Feedback sent', '49'],
      ['Avg. response', '3.2 h'],
    ],
    tableHeaders: ['Referring PHC', 'Received', 'Feedback'],
    tableRows: [
      ['Primary Health Centre', '14', '11'],
      ['Chinade PHC', '9', '9'],
      ['Madara PHC', '7', '5'],
    ],
  },
  LGA: {
    title: 'Katagum LGA',
    subtitle: '12 Primary Health Centres',
    barTitle: 'OPD (all PHCs) by month',
    bars: [
      ['Jun', 2100],
      ['Jul', 2250],
      ['Aug', 2310],
      ['Sep', 2400],
      ['Oct', 2480],
    ],
    kpis: [
      ['PHCs reporting', '11 of 12'],
      ['OPD, all PHCs', '2,480'],
      ['ANC 4+ coverage', '61%'],
      ['Penta3 coverage', '72%'],
    ],
    tableHeaders: ['PHC', 'OPD', 'Report'],
    tableRows: [
      ['Facility 1', '215', 'On time'],
      ['Chinade PHC', '198', 'On time'],
      ['Madara PHC', 'n/a', 'Late'],
    ],
  },
  State: {
    title: 'Bauchi State',
    subtitle: '20 Local Government Areas',
    barTitle: 'Reporting rate by month (%)',
    bars: [
      ['Jun', 88],
      ['Jul', 90],
      ['Aug', 92],
      ['Sep', 93],
      ['Oct', 94],
    ],
    kpis: [
      ['LGAs reporting', '19 of 20'],
      ['OPD, state', '31,420'],
      ['Facility deliveries', '4,310'],
      ['Reporting rate', '94%'],
    ],
    tableHeaders: ['LGA', 'OPD', 'Reporting'],
    tableRows: [
      ['Bauchi', '3,900', '97%'],
      ['Katagum', '2,480', '92%'],
      ['Misau', '1,720', '88%'],
    ],
  },
  FMOH: {
    title: 'Federal Ministry of Health',
    subtitle: 'National routine data (NHMIS / DHIS2)',
    barTitle: 'Penta3 coverage by quarter (%)',
    bars: [
      ['Q1', 68],
      ['Q2', 70],
      ['Q3', 72],
      ['Q4', 74],
    ],
    kpis: [
      ['States reporting', '36 + FCT'],
      ['OPD attendance', '4.2M'],
      ['Penta3 coverage', '74%'],
      ['Reporting rate', '91%'],
    ],
    tableHeaders: ['State', 'OPD', 'Reporting'],
    tableRows: [
      ['Bauchi', '31,420', '94%'],
      ['Kano', '58,100', '96%'],
      ['Lagos', '47,900', '98%'],
    ],
  },
  NCDC: {
    title: 'NCDC',
    subtitle: 'Surveillance and early warning',
    barTitle: 'Suspected case reports by week',
    bars: [
      ['W1', 14],
      ['W2', 18],
      ['W3', 27],
      ['W4', 41],
    ],
    kpis: [
      ['Active signals', '3'],
      ['Reports, 7 days', '128'],
      ['LGAs on alert', '2'],
      ['Under review', '1'],
    ],
    tableHeaders: ['Signal', 'Status'],
    tableRows: [
      ['Cholera, Katagum', 'Alert'],
      ['Measles, Misau', 'Watch'],
      ['Lassa fever', 'Normal'],
    ],
  },
};

export const SURVEILLANCE_SIGNALS: SurveillanceSignal[] = [
  {
    disease: 'Suspected cholera',
    location: 'Katagum LGA',
    detail: '6 cases in 3 days',
    status: 'Alert',
    threshold: '5+ acute watery diarrhoea cases within 72h in a single ward',
    affectedFacilities: ['Chinade PHC', 'Madara PHC'],
    recommendedAction: 'Collect stool swabs for RDT/culture, notify LGA DSNO, activate ORT corner.',
  },
  {
    disease: 'Measles',
    location: 'Misau LGA',
    detail: '4 cases this week',
    status: 'Watch',
    threshold: '3–4 suspected febrile rash cases within 7 days',
    affectedFacilities: ['Misau PHC'],
    recommendedAction: 'Verify immunization status, isolate suspect cases, monitor contacts.',
  },
  {
    disease: 'Lassa fever',
    location: 'Bauchi State',
    detail: '0 cases',
    status: 'Normal',
    threshold: '1 confirmed or 2 linked suspected VHF cases',
    affectedFacilities: ['None'],
    recommendedAction: 'Maintain routine IPC screening at triage.',
  },
  {
    disease: 'Meningitis',
    location: 'Bauchi State',
    detail: '1 case',
    status: 'Normal',
    threshold: '3 cases per 100,000 population per week',
    affectedFacilities: ['Azare General Hospital'],
    recommendedAction: 'Routine weekly IDSR tallying.',
  },
  {
    disease: 'Acute flaccid paralysis',
    location: 'Bauchi State',
    detail: '0 cases',
    status: 'Normal',
    threshold: 'Any child under 15 with sudden onset flaccid paralysis',
    affectedFacilities: ['None'],
    recommendedAction: 'Continue active community & clinic AFP screening.',
  },
];

const initialPatients: Patient[] = [
  {
    id: 'MAK-002431',
    name: 'Amina Musa',
    sex: 'Female',
    age: '28 years',
    dob: '1997-04-12',
    phone: '0803 412 8891',
    ward: 'Bauchi / Katagum / Central',
    address: 'Unguwar Nasarawa',
    allergies: 'Penicillin allergy',
    bloodGroup: 'O+',
    nin: '10203040501',
    idVerified: 'Verified',
    pin: '1234',
  },
  {
    id: 'MAK-002377',
    name: 'Ibrahim Sani',
    sex: 'Male',
    age: '4 years',
    dob: '2021-02-19',
    phone: '0806 219 4401',
    ward: 'Bauchi / Katagum / Central',
    address: 'Kofar Kudu',
    allergies: '',
    bloodGroup: 'A+',
    nin: '20304050612',
    idVerified: 'Verified',
    pin: '1234',
  },
  {
    id: 'MAK-002402',
    name: 'Zainab Bello',
    sex: 'Female',
    age: '31 years',
    dob: '1994-08-05',
    phone: '0809 774 3012',
    ward: 'Bauchi / Katagum / Central',
    address: 'Behind Central Market',
    allergies: '',
    bloodGroup: 'B+',
    nin: '30405060723',
    idVerified: 'Verified',
    pin: '1234',
  },
];

const initialEncounters: Encounter[] = [
  {
    uid: 'enc-seed-1',
    patientId: 'MAK-002431',
    type: 'ANC',
    time: '02 Apr 2025, 09:10',
    recordedBy: 'Nurse Amina',
    complaint: 'ANC visit 3, 24 weeks. BP 110/70',
    labs: ['Hb/PCV'],
    results: ['Hb/PCV: 10.8 g/dL'],
    diagnosis: 'Normal pregnancy progress',
    diagnosisMethod: 'Clinical diagnosis',
    rx: ['Iron and folic acid', 'IPTp-SP dose 2'],
    rxStatus: 'dispensed in full',
    outcome: 'Routine follow-up',
    notes: '',
    synced: true,
  },
  {
    uid: 'enc-seed-2',
    patientId: 'MAK-002431',
    type: 'OPD',
    time: '15 May 2025, 10:20',
    recordedBy: 'Nurse Amina',
    complaint: 'Fever and headache for 3 days',
    labs: ['Malaria RDT'],
    results: ['Malaria RDT: Positive'],
    diagnosis: 'Uncomplicated malaria',
    diagnosisMethod: 'Confirmed by laboratory',
    rx: ['Artemether-lumefantrine', 'Paracetamol'],
    rxStatus: 'dispensed in full',
    outcome: 'Treated',
    notes: '',
    synced: true,
  },
  {
    uid: 'enc-seed-3',
    patientId: 'MAK-002377',
    type: 'Immunization',
    time: '20 Mar 2022, 10:00',
    recordedBy: 'Nurse Amina',
    complaint: '',
    labs: [],
    results: [],
    diagnosis: '',
    diagnosisMethod: '',
    rx: [],
    rxStatus: '',
    outcome: 'Completed',
    notes: '',
    synced: true,
    extra: {
      BCG: 'Received',
      OPV0: 'Received',
      'Hep B0': 'Received',
      OPV1: 'Received',
      Penta1: 'Received',
      PCV1: 'Received',
      Rota1: 'Received',
      OPV2: 'Received',
      Penta2: 'Received',
      PCV2: 'Received',
      Rota2: 'Received',
    },
  },
];

export function buildSummaryLines(patient: Patient, encounters: Encounter[]): string[] {
  const lines = [`${patient.name}, ${patient.sex}, ${patient.age}`];
  if (patient.allergies) {
    lines.push(`Allergy: ${patient.allergies}`);
  }
  encounters
    .filter((e) => e.patientId === patient.id)
    .slice(-3)
    .reverse()
    .forEach((e) => {
      let line = `${e.time} · ${e.type}`;
      if (e.diagnosis) line += `: ${e.diagnosis}`;
      if (e.results.length) line += ` (Labs: ${e.results.join('; ')})`;
      if (e.rx.length) line += ` | Meds: ${e.rx.join(', ')}`;
      lines.push(line);
    });
  return lines;
}

const initialStaffList: StaffMember[] = [
  {
    id: 'OC-0001',
    username: 'halima',
    password: 'password',
    name: 'Dr. Halima Yusuf',
    email: 'halima@makset.phc',
    role: 'oc',
    fac: DEFAULT_FACILITY_CONFIG.name,
    status: 'Active',
    permissions: defaultPermissionsForRole('oc'),
  },
  {
    id: 'AST-0002',
    username: 'ibrahim',
    password: 'password',
    name: 'Ibrahim Danladi',
    email: 'ibrahim@makset.phc',
    role: 'asst',
    fac: DEFAULT_FACILITY_CONFIG.name,
    status: 'Active',
    permissions: defaultPermissionsForRole('asst'),
  },
  {
    id: 'NRS-0142',
    username: 'amina',
    password: 'password',
    name: 'Nurse Amina',
    email: 'amina@makset.phc',
    role: 'nurse',
    fac: DEFAULT_FACILITY_CONFIG.name,
    status: 'Active',
    permissions: defaultPermissionsForRole('nurse'),
  },
  {
    id: 'LAB-0031',
    username: 'musa',
    password: 'password',
    name: 'Lab Technician Musa',
    email: 'musa@makset.phc',
    role: 'lab',
    fac: DEFAULT_FACILITY_CONFIG.name,
    status: 'Active',
    permissions: defaultPermissionsForRole('lab'),
  },
  {
    id: 'PHM-0017',
    username: 'hauwa',
    password: 'password',
    name: 'Pharmacist Hauwa',
    email: 'hauwa@makset.phc',
    role: 'pharm',
    fac: DEFAULT_FACILITY_CONFIG.name,
    status: 'Active',
    permissions: defaultPermissionsForRole('pharm'),
  },
  ...REGISTERED_FACILITIES.map((f, idx) => ({
    id: `OC-1${idx + 1}`,
    username: `oc${idx + 1}`,
    password: 'password',
    name: `Officer in Charge, ${f.name}`,
    email: `oc${idx + 1}@makset.ng`,
    role: 'oc' as const,
    fac: f.name,
    status: 'Active' as const,
    permissions: defaultPermissionsForRole('oc'),
  })),
];

const initialReferrals: Referral[] = [
  {
    id: 'REF-1001',
    patientId: 'MAK-002402',
    patientName: 'Zainab Bello',
    from: DEFAULT_FACILITY_CONFIG.name,
    to: 'Bauchi General Hospital',
    reason: 'Severe malaria with persistent vomiting',
    urgency: 'Urgent',
    treatmentGiven: 'Artesunate IM, first dose',
    summaryLines: buildSummaryLines(initialPatients[2], initialEncounters),
    status: 'Delivered',
    time: 'Today, 08:15',
    feedback: '',
  },
  {
    id: 'REF-1002',
    patientId: 'MAK-002377',
    patientName: 'Ibrahim Sani',
    from: DEFAULT_FACILITY_CONFIG.name,
    to: 'Azare General Hospital',
    reason: 'Persistent fever for review',
    urgency: 'Routine',
    treatmentGiven: 'Paracetamol',
    summaryLines: buildSummaryLines(initialPatients[1], initialEncounters),
    status: 'Delivered',
    time: 'Yesterday, 15:40',
    feedback: '',
  },
];

export function createInitialState(): CareSyncState {
  const onlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return {
    offline: !onlineNow,
    pendingCount: 3,
    syncedCount: 41,
    lastSyncedLabel: 'Today, 8:40 AM',
    muteSound: false,
    ninGateEnabled: false,
    facilityConfig: { ...DEFAULT_FACILITY_CONFIG },
    facilities: [...REGISTERED_FACILITIES],
    position: 'nurse',
    effectiveRole: 'nurse',
    activePermissions: defaultPermissionsForRole('nurse'),
    staffName: 'Nurse Amina',
    staffId: 'NRS-0142',
    activeFacility: DEFAULT_FACILITY_CONFIG.name,
    assistantGranted: false,
    patients: initialPatients,
    encounters: initialEncounters,
    labQueue: [
      {
        uid: 'lab-seed-1',
        patientId: 'MAK-002431',
        patientName: 'Amina Musa',
        tests: 'Malaria RDT, Hb/PCV',
        items: ['Malaria RDT', 'Hb/PCV'],
        createdAt: 'Today, 09:15',
      },
      {
        uid: 'lab-seed-2',
        patientId: 'MAK-002402',
        patientName: 'Zainab Bello',
        tests: 'Urinalysis',
        items: ['Urinalysis'],
        createdAt: 'Today, 09:28',
      },
    ],
    pharmQueue: [
      {
        uid: 'ph-seed-1',
        patientId: 'MAK-002377',
        patientName: 'Ibrahim Sani',
        meds: 'Artemether-lumefantrine ×1',
        items: ['Artemether-lumefantrine ×1'],
        createdAt: 'Today, 09:10',
      },
    ],
    referrals: initialReferrals,
    notifications: [],
    staffList: initialStaffList,
    shareLog: [],
    auditLog: [],
    caseNotifications: [],
    verifiedPatients: {},
    emergencyOverrides: {},
  };
}
