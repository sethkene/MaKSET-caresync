export type StaffPosition = 'nurse' | 'oc' | 'asst' | 'lab' | 'pharm' | 'creator';
export type EffectiveRole = 'nurse' | 'lab' | 'pharm' | 'asst' | 'admin';
export type StaffStatus = 'Active' | 'Suspended' | 'Terminated' | 'Blocked';

export interface AccessPermissions {
  patients: boolean;
  clinicalEncounters: boolean;
  laboratory: boolean;
  pharmacy: boolean;
  referrals: boolean;
  reportsDashboards: boolean;
  manageStaff: boolean;
}

export type EncounterType =
  | 'OPD'
  | 'Inpatient'
  | 'ANC'
  | 'Labour/Delivery'
  | 'PNC'
  | 'Immunization'
  | 'Family Planning'
  | 'Growth and Nutrition';

export type ProfileTab = 'Summary' | 'History' | 'Services';
export type DashboardLevel = 'PHC' | 'Hospital' | 'LGA' | 'State' | 'FMOH' | 'NCDC';

export type ScreenRoute =
  | 'splash'
  | 'login'
  | 'home'
  | 'search'
  | 'register'
  | 'verify'
  | 'profile'
  | 'hist'
  | 'shr'
  | 'sel'
  | 'encounter'
  | 'tasks'
  | 'tdet'
  | 'notif'
  | 'ref'
  | 'note'
  | 'refs'
  | 'rfo'
  | 'reports'
  | 'dash'
  | 'surv'
  | 'cs'
  | 'more'
  | 'stf'
  | 'adm';

export interface Facility {
  name: string;
  type: 'PHC' | 'Hospital';
  lga: string;
  stateName?: string;
}

export interface FacilityConfig {
  configured: boolean;
  name: string;
  type: 'PHC' | 'Hospital';
  lga: string;
  stateName: string;
  ward: string;
}

export interface StaffMember {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: Exclude<StaffPosition, 'creator'>;
  fac: string;
  status: StaffStatus;
  permissions: AccessPermissions;
}

export interface Patient {
  id: string;
  uuid?: string;
  shortId?: string;
  shortIdStatus?: 'local-provisional' | 'confirmed';
  linkedMotherId?: string;
  name: string;
  sex: string;
  age: string;
  dob?: string;
  phone?: string;
  ward?: string;
  address?: string;
  allergies: string;
  bloodGroup: string;
  nin?: string;
  ninUpdatedAt?: string;
  ninUpdatedBy?: string;
  idVerified?: 'Verified' | 'Not verified';
  pin?: string;
}

export interface MedicationOrder {
  id: string;
  source: 'catalogue' | 'manual';
  drugName: string;
  strength?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  instructions?: string;
  recipient?: 'patient' | 'mother' | 'newborn';
  displayLabel: string;
}

export interface Encounter {
  uid: string;
  patientId: string;
  type: EncounterType;
  time: string;
  recordedBy: string;
  complaint: string;
  labs: string[];
  results: string[];
  diagnosis: string;
  diagnosisMethod: string;
  rx: string[];
  newbornRx?: string[];
  medicationOrders?: MedicationOrder[];
  rxStatus: string;
  outcome: string;
  notes: string;
  synced: boolean;
  status?: '' | 'open';
  stage?: 1 | 2;
  bypassReason?: string;
  extra?: Record<string, string>;
}

export interface LabTask {
  uid: string;
  patientId: string;
  patientName: string;
  tests: string;
  items: string[];
  encounterUid?: string;
  createdAt: string;
}

export interface PharmacyTask {
  uid: string;
  patientId: string;
  patientName: string;
  meds: string;
  items: string[];
  medicationOrders?: MedicationOrder[];
  encounterUid?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  from: string;
  to: string;
  reason: string;
  urgency: 'Emergency' | 'Urgent' | 'Routine';
  treatmentGiven: string;
  summaryLines: string[];
  status: 'Queued' | 'Delivered' | 'Accepted' | 'Completed';
  time: string;
  feedback: string;
  autoAcceptPrompted?: boolean;
  acceptedAt?: string;
}

export interface NotificationItem {
  uid: string;
  kind: 'lab' | 'ph' | 'ref';
  patientId: string;
  patientName: string;
  encounterUid?: string;
  text: string;
  read: boolean;
  time: string;
}

export interface ShareLogEntry {
  uid: string;
  patientName: string;
  channel: string;
  target: string;
  reason: string;
  time: string;
}

export interface CaseNotification {
  uid: string;
  patientName: string;
  patientId: string;
  disease: string;
  onsetDate: string;
  symptoms: string[];
  sampleTaken: string;
  notes: string;
  time: string;
  synced: boolean;
}

export interface SurveillanceSignal {
  disease: string;
  location: string;
  detail: string;
  status: 'Alert' | 'Watch' | 'Normal';
  threshold: string;
  affectedFacilities: string[];
  recommendedAction: string;
}

export interface DashboardDataset {
  title: string;
  subtitle: string;
  barTitle: string;
  bars: [string, number][];
  kpis: [string, string][];
  tableHeaders: string[];
  tableRows: string[][];
}

export interface CareSyncState {
  offline: boolean;
  pendingCount: number;
  syncedCount: number;
  lastSyncedLabel: string;
  muteSound: boolean;
  ninGateEnabled: boolean;
  facilityConfig: FacilityConfig;
  facilities: Facility[];
  position: StaffPosition;
  effectiveRole: EffectiveRole;
  activePermissions: AccessPermissions;
  staffName: string;
  staffId: string;
  activeFacility: string;
  assistantGranted: boolean;
  patients: Patient[];
  encounters: Encounter[];
  labQueue: LabTask[];
  pharmQueue: PharmacyTask[];
  referrals: Referral[];
  notifications: NotificationItem[];
  staffList: StaffMember[];
  shareLog: ShareLogEntry[];
  auditLog: string[];
  caseNotifications: CaseNotification[];
  verifiedPatients: Record<string, boolean>;
  emergencyOverrides: Record<string, string>;
}
