import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from './components/AppShell';
import { EncounterFormView } from './components/EncounterFormView';
import { HomeView } from './components/HomeView';
import { LoginScreen } from './components/LoginScreen';
import {
  EncounterSelectView,
  PatientHistoryView,
  PatientProfileView,
  ShareHistoryView,
} from './components/PatientProfileView';
import {
  PatientSearchView,
  PatientVerifyView,
  RegisterPatientView,
} from './components/PatientsView';
import {
  ReferralNoteView,
  ReferralOutcomeView,
  ReferralsListView,
  ReferPatientView,
} from './components/ReferralsView';
import {
  CaseNotificationView,
  DashboardsView,
  ReportsView,
  SurveillanceView,
} from './components/ReportsDashboardsView';
import { SplashScreen } from './components/SplashScreen';
import {
  CreatorAdminView,
  StaffManagementView,
  SyncMoreView,
} from './components/StaffAdminView';
import {
  NotificationsView,
  TaskDetailView,
  TasksView,
} from './components/TasksAndNotificationsView';
import {
  buildSummaryLines,
  createInitialState,
  DEFAULT_FACILITY_CONFIG,
  defaultPermissionsForRole,
  ENCOUNTER_FLAGS,
} from './data/initialData';
import {
  AccessPermissions,
  CareSyncState,
  EffectiveRole,
  Encounter,
  EncounterType,
  FacilityConfig,
  NotificationItem,
  ProfileTab,
  Referral,
  ScreenRoute,
  StaffStatus,
} from './types/caresync';
import { playAlertChime } from './utils/audio';
import {
  getInitialNetworkConnected,
  initNativeShell,
  readNativeStorage,
  removeNativeStorage,
  subscribeNativeBackButton,
  subscribeNetworkStatus,
  syncNativeStatusBar,
  writeNativeStorage,
} from './utils/mobile';

const STORAGE_KEY = 'makset_phc_state_v2';

const GATED_ROUTES: ScreenRoute[] = [
  'profile',
  'hist',
  'shr',
  'sel',
  'encounter',
  'ref',
];

function nowTimeLabel(): string {
  return `Today, ${new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function loadSavedState(): CareSyncState {
  const base = createInitialState();
  const liveOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CareSyncState>;
      return {
        ...base,
        ...parsed,
        offline: liveOffline,
        facilityConfig: parsed.facilityConfig || base.facilityConfig,
        facilities: parsed.facilities || base.facilities,
        activePermissions: parsed.activePermissions || base.activePermissions,
      };
    }
  } catch {
    // Ignore storage read failures
  }
  return { ...base, offline: liveOffline };
}

export default function App() {
  const [state, setState] = useState<CareSyncState>(loadSavedState);

  const [darkMode, setDarkMode] = useState(false);
  const [stack, setStack] = useState<ScreenRoute[]>(['splash']);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    state.patients[0]?.id || 'MAK-002431'
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>('Summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftEncounter, setDraftEncounter] = useState<Encounter | null>(null);
  const [activeTask, setActiveTask] = useState<{ kind: 'lab' | 'ph'; uid: string } | null>(
    null
  );
  const [activeReferralId, setActiveReferralId] = useState<string>(
    state.referrals[0]?.id || ''
  );
  const [pendingNextRoute, setPendingNextRoute] = useState<ScreenRoute | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const hydratedNativeRef = useRef(false);
  const stackRef = useRef<ScreenRoute[]>(stack);
  const offlineRef = useRef(state.offline);

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  useEffect(() => {
    offlineRef.current = state.offline;
  }, [state.offline]);

  useEffect(() => {
    let active = true;
    initNativeShell(false);
    readNativeStorage(STORAGE_KEY).then((raw) => {
      if (!active) return;
      hydratedNativeRef.current = true;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<CareSyncState>;
          const base = createInitialState();
          setState((prev) => ({
            ...base,
            ...parsed,
            offline: prev.offline,
            facilityConfig: parsed.facilityConfig || base.facilityConfig,
            facilities: parsed.facilities || base.facilities,
            activePermissions: parsed.activePermissions || base.activePermissions,
          }));
        } catch {
          // Ignore malformed native storage
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore storage write failures
    }
    if (hydratedNativeRef.current) {
      writeNativeStorage(STORAGE_KEY, serialized);
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    syncNativeStatusBar(darkMode);
  }, [darkMode]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const performSync = useCallback(
    (customMessage?: string) => {
      let autoAcceptedCount = 0;
      setState((prev) => {
        const registeredNames = new Set(prev.facilities.map((f) => f.name));
        const newNotifications: NotificationItem[] = [];

        const nextReferrals = prev.referrals.map((r) => {
          const isRegistered = registeredNames.has(r.to);
          if (
            isRegistered &&
            r.autoAcceptPrompted &&
            (r.status === 'Queued' || r.status === 'Delivered')
          ) {
            autoAcceptedCount += 1;
            const stamp = nowTimeLabel();
            newNotifications.push({
              uid: `notif-auto-${r.id}-${Date.now()}`,
              kind: 'ref',
              patientId: r.patientId,
              patientName: r.patientName,
              text: `Referral notification automatically accepted by ${r.to}`,
              read: false,
              time: stamp,
            });
            return {
              ...r,
              status: 'Accepted' as const,
              acceptedAt: r.acceptedAt || stamp,
            };
          }
          if (r.status === 'Queued') {
            return { ...r, status: 'Delivered' as const };
          }
          return r;
        });

        return {
          ...prev,
          offline: false,
          syncedCount: prev.syncedCount + prev.pendingCount,
          pendingCount: 0,
          lastSyncedLabel: nowTimeLabel(),
          encounters: prev.encounters.map((e) => ({ ...e, synced: true })),
          referrals: nextReferrals,
          caseNotifications: prev.caseNotifications.map((c) => ({ ...c, synced: true })),
          notifications: [...newNotifications, ...prev.notifications],
        };
      });

      if (autoAcceptedCount > 0) {
        playAlertChime(state.muteSound);
        showToast(
          `All records synced. ${autoAcceptedCount} queued referral(s) automatically accepted.`
        );
      } else {
        showToast(customMessage || 'All records synced');
      }
    },
    [showToast, state.muteSound]
  );

  // Automatic real-connectivity offline/online detection (Capacitor Network + Web)
  useEffect(() => {
    let mounted = true;
    getInitialNetworkConnected().then((connected) => {
      if (!mounted) return;
      setState((prev) => ({ ...prev, offline: !connected }));
    });

    const unsubscribe = subscribeNetworkStatus((connected) => {
      if (!mounted) return;
      if (connected) {
        const wasOffline = offlineRef.current;
        setState((prev) => ({ ...prev, offline: false }));
        if (wasOffline) {
          showToast('Internet connection restored. Syncing pending records…');
          window.setTimeout(() => {
            performSync('Connection restored. All pending records synced.');
          }, 900);
        }
      } else {
        setState((prev) => ({ ...prev, offline: true }));
        showToast('Network connection lost. Working offline safely on this device.');
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [performSync, showToast]);

  // Android hardware back button handling
  useEffect(() => {
    return subscribeNativeBackButton(() => {
      if (stackRef.current.length > 1) {
        setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
        return true;
      }
      return false;
    });
  }, []);

  const currentScreen = stack[stack.length - 1] || 'splash';

  const currentPatient = useMemo(
    () => state.patients.find((p) => p.id === selectedPatientId) || state.patients[0],
    [selectedPatientId, state.patients]
  );

  const unreadNotifications = useMemo(() => {
    const pendingLabUids = new Set(
      state.labQueue.map((l) => l.encounterUid).filter(Boolean)
    );
    const readyCount = state.encounters.filter(
      (e) => e.status === 'open' && !pendingLabUids.has(e.uid)
    ).length;
    const otherUnread = state.notifications.filter(
      (n) => !n.read && !(n.kind === 'lab' && readyCount > 0 && n.encounterUid)
    ).length;
    return readyCount + otherUnread;
  }, [state.encounters, state.labQueue, state.notifications]);

  const taskBadgeCount = useMemo(() => {
    const perms = state.activePermissions;
    if (perms.laboratory && !perms.clinicalEncounters && !perms.pharmacy) {
      return state.labQueue.length;
    }
    if (perms.pharmacy && !perms.clinicalEncounters && !perms.laboratory) {
      return state.pharmQueue.length;
    }
    if (perms.laboratory || perms.pharmacy || perms.clinicalEncounters) {
      return state.labQueue.length + state.pharmQueue.length;
    }
    return 0;
  }, [state.activePermissions, state.labQueue.length, state.pharmQueue.length]);

  const navigate = useCallback(
    (route: ScreenRoute, reset = false, overridePatientId?: string) => {
      const perms = state.activePermissions;

      if (route !== 'login' && route !== 'splash' && route !== 'home' && route !== 'more') {
        if (state.position === 'creator') {
          if (route !== 'adm') {
            showToast('Admin view is scoped to facility setup & staff governance');
            return;
          }
        } else {
          if (
            ['search', 'register', 'verify', 'profile', 'hist', 'shr'].includes(route) &&
            !perms.patients
          ) {
            showToast('Patient module not enabled. Contact your Officer in Charge.');
            return;
          }
          if (['sel', 'encounter'].includes(route) && !perms.clinicalEncounters) {
            showToast('Clinical encounter access not enabled. Contact your Officer in Charge.');
            return;
          }
          if (
            ['tasks', 'tdet'].includes(route) &&
            !perms.laboratory &&
            !perms.pharmacy &&
            !perms.clinicalEncounters
          ) {
            showToast('Laboratory / Pharmacy access not enabled for your account.');
            return;
          }
          if (['ref', 'note', 'refs', 'rfo'].includes(route) && !perms.referrals) {
            showToast('Referrals module not enabled. Contact your Officer in Charge.');
            return;
          }
          if (['reports', 'dash', 'surv', 'cs'].includes(route) && !perms.reportsDashboards) {
            showToast('Reports & Dashboards access not enabled for your account.');
            return;
          }
          if (route === 'stf' && state.position !== 'oc' && !perms.manageStaff) {
            showToast('Staff management is restricted to the Officer in Charge.');
            return;
          }
          if (route === 'adm') {
            showToast('Restricted to Facility / System Admin.');
            return;
          }
        }
      }

      const targetPid = overridePatientId || selectedPatientId;
      if (
        state.ninGateEnabled &&
        GATED_ROUTES.includes(route) &&
        perms.clinicalEncounters &&
        !state.verifiedPatients[targetPid]
      ) {
        setPendingNextRoute(route);
        setStack((prev) => (reset ? ['home', 'verify'] : [...prev, 'verify']));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (route === 'sel') {
        setDraftEncounter(null);
      }

      setStack((prev) => (reset ? [route] : [...prev, route]));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [
      selectedPatientId,
      showToast,
      state.activePermissions,
      state.ninGateEnabled,
      state.position,
      state.verifiedPatients,
    ]
  );

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleSyncNow = useCallback(() => {
    if (state.offline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setState((prev) => ({ ...prev, offline: true }));
      showToast('No internet connection detected. Records remain queued on this device.');
      return;
    }
    performSync();
  }, [performSync, showToast, state.offline]);

  const handleConfigureFacility = useCallback(
    (payload: {
      adminUsername: string;
      adminPassword: string;
      name: string;
      type: 'PHC' | 'Hospital';
      lga: string;
      stateName: string;
      ward: string;
    }): boolean => {
      const cleanName = payload.name.trim();
      if (!cleanName) {
        showToast('Enter a valid facility name');
        return false;
      }

      const actor = payload.adminUsername.trim() || 'Admin';

      const nextConfig: FacilityConfig = {
        configured: true,
        name: cleanName,
        type: payload.type,
        lga: payload.lga.trim() || 'Katagum',
        stateName: payload.stateName.trim() || 'Bauchi State',
        ward: payload.ward.trim() || 'Central Ward',
      };

      setState((prev) => {
        const oldName = prev.facilityConfig.name;
        const shouldMigrate = (fac: string) =>
          fac === oldName || fac === DEFAULT_FACILITY_CONFIG.name;

        return {
          ...prev,
          facilityConfig: nextConfig,
          activeFacility: shouldMigrate(prev.activeFacility) ? cleanName : prev.activeFacility,
          staffList: prev.staffList.map((s) =>
            shouldMigrate(s.fac) ? { ...s, fac: cleanName } : s
          ),
          referrals: prev.referrals.map((r) =>
            shouldMigrate(r.from) ? { ...r, from: cleanName } : r
          ),
          auditLog: [
            `${actor} configured facility as ${cleanName} (${nextConfig.type}, ${nextConfig.lga})`,
            ...prev.auditLog,
          ],
        };
      });

      showToast(`Facility setup saved: ${cleanName}`);
      return true;
    },
    [showToast]
  );

  const handleAdminSaveFacilityConfig = useCallback(
    (config: Omit<FacilityConfig, 'configured'>) => {
      const cleanName = config.name.trim();
      if (!cleanName) {
        showToast('Enter a valid facility name');
        return;
      }
      const nextConfig: FacilityConfig = {
        configured: true,
        name: cleanName,
        type: config.type,
        lga: config.lga,
        stateName: config.stateName,
        ward: config.ward,
      };
      setState((prev) => {
        const oldName = prev.facilityConfig.name;
        const shouldMigrate = (fac: string) =>
          fac === oldName || fac === DEFAULT_FACILITY_CONFIG.name;
        return {
          ...prev,
          facilityConfig: nextConfig,
          activeFacility: shouldMigrate(prev.activeFacility) ? cleanName : prev.activeFacility,
          staffList: prev.staffList.map((s) =>
            shouldMigrate(s.fac) ? { ...s, fac: cleanName } : s
          ),
          referrals: prev.referrals.map((r) =>
            shouldMigrate(r.from) ? { ...r, from: cleanName } : r
          ),
          auditLog: [`Admin updated facility configuration to ${cleanName}`, ...prev.auditLog],
        };
      });
      showToast(`Active facility set to ${cleanName}`);
    },
    [showToast]
  );

  const handleSignIn = useCallback(
    (username: string, password: string) => {
      const u = username.trim();
      const p = password.trim();
      if (!u || !p) {
        showToast('Enter your username or staff ID and password');
        return;
      }

      const q = u.toLowerCase();

      // Check enrolled staff first so OC-determined permissions and Active/Suspended status apply
      const matched = state.staffList.find(
        (s) =>
          s.username.toLowerCase() === q ||
          s.id.toLowerCase() === q ||
          s.email.toLowerCase() === q ||
          s.name.toLowerCase() === q
      );

      if (matched) {
        if (matched.status !== 'Active') {
          if (matched.status === 'Blocked') {
            showToast('Access blocked by the administrator.');
          } else if (matched.status === 'Terminated') {
            showToast('Your access has been terminated. Contact your Officer in Charge.');
          } else {
            showToast('Your access is suspended. Contact your Officer in Charge.');
          }
          return;
        }

        const effectiveRole: EffectiveRole =
          matched.role === 'lab' && !matched.permissions.clinicalEncounters
            ? 'lab'
            : matched.role === 'pharm' && !matched.permissions.clinicalEncounters
              ? 'pharm'
              : matched.role === 'asst' &&
                  !matched.permissions.clinicalEncounters &&
                  !matched.permissions.patients
                ? 'asst'
                : 'nurse';

        setState((prev) => ({
          ...prev,
          position: matched.role,
          effectiveRole,
          activePermissions: matched.permissions,
          staffName: matched.name,
          staffId: matched.id,
          activeFacility: matched.fac,
          verifiedPatients: {},
          emergencyOverrides: {},
        }));
        setStack(['home']);
        return;
      }

      // Admin login check (any password accepted until backend is connected)
      if (q === 'admin' || q === 'adm-0001' || q === 'dev-0001' || q.includes('admin') || q.includes('creator')) {
        setState((prev) => ({
          ...prev,
          position: 'creator',
          effectiveRole: 'admin',
          activePermissions: defaultPermissionsForRole('creator'),
          staffName: u,
          staffId: 'ADM-0001',
          activeFacility: prev.facilityConfig.name,
          verifiedPatients: {},
          emergencyOverrides: {},
        }));
        setStack(['home']);
        return;
      }

      // Allow any custom username/ID and password until backend auth is connected
      const customRole =
        q.includes('lab')
          ? 'lab'
          : q.includes('pharm')
            ? 'pharm'
            : q.includes('assist')
              ? 'asst'
              : q.includes('nurse') || q.includes('chew')
                ? 'nurse'
                : 'oc';

      const effectiveRole: EffectiveRole =
        customRole === 'lab'
          ? 'lab'
          : customRole === 'pharm'
            ? 'pharm'
            : customRole === 'asst'
              ? 'asst'
              : 'nurse';

      setState((prev) => ({
        ...prev,
        position: customRole,
        effectiveRole,
        activePermissions: defaultPermissionsForRole(customRole),
        staffName: u,
        staffId: u.toUpperCase().slice(0, 12),
        activeFacility: prev.facilityConfig.name,
        verifiedPatients: {},
        emergencyOverrides: {},
      }));
      setStack(['home']);
    },
    [showToast, state.staffList]
  );

  const handleLogout = useCallback(() => {
    setDraftEncounter(null);
    setStack(['login']);
  }, []);

  const handlePromptAutoAccept = useCallback(
    (referralId: string) => {
      const ref = state.referrals.find((r) => r.id === referralId);
      if (!ref) return;
      const isRegistered = state.facilities.some((f) => f.name === ref.to);
      if (!isRegistered) {
        showToast(`${ref.to} is not registered on MaKSET.`);
        return;
      }

      if (state.offline) {
        setState((prev) => ({
          ...prev,
          referrals: prev.referrals.map((r) =>
            r.id === referralId ? { ...r, autoAcceptPrompted: true } : r
          ),
        }));
        showToast('Offline: Auto-accept prompt queued and will trigger when online.');
        return;
      }

      const stamp = nowTimeLabel();
      setState((prev) => ({
        ...prev,
        referrals: prev.referrals.map((r) =>
          r.id === referralId
            ? {
                ...r,
                status: 'Accepted',
                autoAcceptPrompted: true,
                acceptedAt: stamp,
              }
            : r
        ),
        notifications: [
          {
            uid: `notif-auto-${Date.now()}`,
            kind: 'ref',
            patientId: ref.patientId,
            patientName: ref.patientName,
            text: `Referral notification automatically accepted by ${ref.to}`,
            read: false,
            time: stamp,
          },
          ...prev.notifications,
        ],
      }));
      playAlertChime(state.muteSound);
      showToast(`Referral notification automatically accepted by ${ref.to}`);
    },
    [showToast, state.facilities, state.muteSound, state.offline, state.referrals]
  );

  const handleStartEncounterType = useCallback(
    (type: EncounterType) => {
      const hasLab = (ENCOUNTER_FLAGS[type] || 'LDR').includes('L');
      const newDraft: Encounter = {
        uid: `enc-${Date.now()}`,
        patientId: currentPatient.id,
        type,
        time: nowTimeLabel(),
        recordedBy: state.staffName,
        complaint: '',
        labs: [],
        results: [],
        diagnosis: '',
        diagnosisMethod: 'Confirmed by laboratory',
        rx: [],
        rxStatus: '',
        outcome: '',
        notes: '',
        synced: !state.offline,
        status: '',
        stage: hasLab ? 1 : 2,
        extra: {},
      };
      setDraftEncounter(newDraft);
      navigate('encounter');
    },
    [currentPatient.id, navigate, state.offline, state.staffName]
  );

  const handleSendLabOrder = useCallback(
    (tests: string[], updatedDraft: Encounter) => {
      setDraftEncounter(updatedDraft);
      setState((prev) => {
        const exists = prev.encounters.some((e) => e.uid === updatedDraft.uid);
        const nextEncounters = exists
          ? prev.encounters.map((e) => (e.uid === updatedDraft.uid ? updatedDraft : e))
          : [...prev.encounters, updatedDraft];
        return {
          ...prev,
          encounters: nextEncounters,
          labQueue: [
            {
              uid: `lab-${Date.now()}`,
              patientId: currentPatient.id,
              patientName: currentPatient.name,
              tests: tests.join(', '),
              items: tests,
              encounterUid: updatedDraft.uid,
              createdAt: nowTimeLabel(),
            },
            ...prev.labQueue,
          ],
          pendingCount: prev.pendingCount + 1,
        };
      });
      showToast('Lab order sent. The laboratory is alerted.');
    },
    [currentPatient.id, currentPatient.name, showToast]
  );

  const handleSaveAndWaitForLab = useCallback(
    (updatedDraft: Encounter) => {
      const openRecord: Encounter = {
        ...updatedDraft,
        status: 'open',
        stage: 1,
        synced: false,
      };
      setState((prev) => {
        const exists = prev.encounters.some((e) => e.uid === openRecord.uid);
        const nextEncounters = exists
          ? prev.encounters.map((e) => (e.uid === openRecord.uid ? openRecord : e))
          : [...prev.encounters, openRecord];
        return {
          ...prev,
          encounters: nextEncounters,
          pendingCount: prev.pendingCount + 1,
        };
      });
      setDraftEncounter(null);
      showToast('Encounter saved. You will be notified when lab results arrive.');
      setStack(['home']);
    },
    [showToast]
  );

  const handleSendPharmacyOrder = useCallback(
    (meds: string[], updatedDraft: Encounter) => {
      setDraftEncounter(updatedDraft);
      setState((prev) => {
        const exists = prev.encounters.some((e) => e.uid === updatedDraft.uid);
        const nextEncounters = exists
          ? prev.encounters.map((e) => (e.uid === updatedDraft.uid ? updatedDraft : e))
          : [...prev.encounters, updatedDraft];
        return {
          ...prev,
          encounters: nextEncounters,
          pharmQueue: [
            {
              uid: `ph-${Date.now()}`,
              patientId: currentPatient.id,
              patientName: currentPatient.name,
              meds: meds.join(', '),
              items: meds,
              encounterUid: updatedDraft.uid,
              createdAt: nowTimeLabel(),
            },
            ...prev.pharmQueue,
          ],
          pendingCount: prev.pendingCount + 1,
        };
      });
      showToast('Prescription sent to pharmacy. Pharmacy is alerted.');
    },
    [currentPatient.id, currentPatient.name, showToast]
  );

  const handleCompleteEncounter = useCallback(
    (finalDraft: Encounter) => {
      let toastMsg = state.offline
        ? 'Saved offline on this device. Will sync when online.'
        : 'Encounter saved and synced.';
      const isLiveBirth =
        finalDraft.type === 'Labour/Delivery' &&
        finalDraft.extra?.['Newborn outcome'] === 'Live birth';

      setState((prev) => {
        const nextPatients = [...prev.patients];
        if (isLiveBirth) {
          nextPatients.push({
            id: `MAK-0024${prev.patients.length + 11}`,
            name: `Baby of ${currentPatient.name}`,
            sex: finalDraft.extra?.['Newborn sex'] || 'Unknown',
            age: '0 days',
            allergies: '',
            bloodGroup: 'Newborn',
            ward: currentPatient.ward,
            address: currentPatient.address,
            pin: '1234',
          });
        }
        const recordToSave: Encounter = {
          ...finalDraft,
          synced: !prev.offline,
        };
        const exists = prev.encounters.some((e) => e.uid === recordToSave.uid);
        const nextEncounters = exists
          ? prev.encounters.map((e) => (e.uid === recordToSave.uid ? recordToSave : e))
          : [...prev.encounters, recordToSave];

        return {
          ...prev,
          patients: nextPatients,
          encounters: nextEncounters,
          pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
          syncedCount: prev.offline ? prev.syncedCount : prev.syncedCount + 1,
        };
      });

      if (isLiveBirth) {
        toastMsg = 'Saved. A linked newborn patient record was created.';
      }
      setDraftEncounter(null);
      setProfileTab('History');
      showToast(toastMsg);
      setStack(['home', 'search', 'profile']);
    },
    [currentPatient.address, currentPatient.name, currentPatient.ward, showToast, state.offline]
  );

  const handleTaskSubmit = useCallback(
    (entries: string[]) => {
      if (!activeTask) return;
      const isLab = activeTask.kind === 'lab';

      setState((prev) => {
        const task = isLab
          ? prev.labQueue.find((t) => t.uid === activeTask.uid)
          : prev.pharmQueue.find((t) => t.uid === activeTask.uid);
        if (!task) return prev;

        const nextEncounters = prev.encounters.map((e) => {
          if (e.uid !== task.encounterUid) return e;
          if (isLab) {
            return {
              ...e,
              results: [...e.results, ...entries],
              synced: !prev.offline,
            };
          }
          return {
            ...e,
            rxStatus: e.rxStatus ? `${e.rxStatus}; ${entries.join('; ')}` : entries.join('; '),
            synced: !prev.offline,
          };
        });

        const nextNotifications = [
          {
            uid: `notif-${Date.now()}`,
            kind: isLab ? ('lab' as const) : ('ph' as const),
            patientId: task.patientId,
            patientName: task.patientName,
            encounterUid: task.encounterUid,
            text: `${isLab ? 'Result' : 'Pharmacy'}: ${entries.join('; ')}`,
            read: false,
            time: nowTimeLabel(),
          },
          ...prev.notifications,
        ];

        return {
          ...prev,
          encounters: nextEncounters,
          notifications: nextNotifications,
          labQueue: isLab
            ? prev.labQueue.filter((t) => t.uid !== activeTask.uid)
            : prev.labQueue,
          pharmQueue: !isLab
            ? prev.pharmQueue.filter((t) => t.uid !== activeTask.uid)
            : prev.pharmQueue,
          pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
          syncedCount: prev.offline ? prev.syncedCount : prev.syncedCount + 1,
        };
      });

      playAlertChime(state.muteSound);
      showToast(
        isLab
          ? 'Lab results sent. The clinician has been notified.'
          : 'Dispensing status recorded. The clinician has been notified.'
      );
      setActiveTask(null);
      goBack();
    },
    [activeTask, goBack, showToast, state.muteSound]
  );

  const handleOpenReadyEncounter = useCallback(
    (encounterUid: string) => {
      const enc = state.encounters.find((e) => e.uid === encounterUid);
      if (!enc) return;
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.encounterUid === encounterUid ? { ...n, read: true } : n
        ),
      }));
      setSelectedPatientId(enc.patientId);
      setDraftEncounter({ ...enc, stage: 2 });
      navigate('encounter', false, enc.patientId);
    },
    [navigate, state.encounters]
  );

  const handleOpenNotification = useCallback(
    (uid: string) => {
      const notif = state.notifications.find((n) => n.uid === uid);
      if (!notif) return;
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.uid === uid ? { ...n, read: true } : n
        ),
      }));
      setSelectedPatientId(notif.patientId);
      const enc = state.encounters.find((e) => e.uid === notif.encounterUid);
      if (enc && enc.status === 'open' && notif.kind === 'lab') {
        setDraftEncounter({ ...enc, stage: 2 });
        navigate('encounter', false, notif.patientId);
      } else {
        setProfileTab('History');
        navigate('profile', false, notif.patientId);
      }
    },
    [navigate, state.encounters, state.notifications]
  );

  if (currentScreen === 'splash') {
    return <SplashScreen onContinue={() => setStack(['login'])} />;
  }

  if (currentScreen === 'login') {
    return (
      <>
        <LoginScreen
          darkMode={darkMode}
          facilityConfig={state.facilityConfig}
          onToggleDark={() => setDarkMode((d) => !d)}
          onSignIn={handleSignIn}
          onConfigureFacility={handleConfigureFacility}
          onToast={showToast}
        />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-md w-[calc(100%-2rem)] rounded-xl bg-[#13221A] px-4 py-3 text-center text-sm font-medium text-white shadow-xl">
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  const headerMeta: Record<ScreenRoute, { title: string; subtitle?: string }> = {
    splash: { title: 'MaKSET' },
    login: { title: 'Sign In' },
    home: {
      title: 'MaKSET',
      subtitle: state.activeFacility,
    },
    search: { title: 'Find or Register Patient', subtitle: 'Local device index' },
    register: { title: 'Register Patient', subtitle: 'Capture identity once' },
    verify: { title: 'Verify Patient', subtitle: 'Patient must be present' },
    profile: { title: currentPatient.name, subtitle: `Patient ID: ${currentPatient.id}` },
    hist: { title: 'Patient History', subtitle: `${currentPatient.name} · ${currentPatient.id}` },
    shr: { title: 'Share History', subtitle: `${currentPatient.name} · ${currentPatient.id}` },
    sel: { title: 'New Encounter', subtitle: currentPatient.name },
    encounter: {
      title: `${draftEncounter?.type || 'Clinical'} Encounter`,
      subtitle: `${currentPatient.name} · ${currentPatient.id}`,
    },
    tasks: {
      title: 'Tasks',
      subtitle:
        state.effectiveRole === 'lab'
          ? 'Lab investigations waiting'
          : state.effectiveRole === 'pharm'
            ? 'Prescriptions to dispense'
            : 'Work inbox',
    },
    tdet: {
      title: activeTask?.kind === 'lab' ? 'Enter Results' : 'Dispense Medicines',
      subtitle:
        (activeTask?.kind === 'lab'
          ? state.labQueue.find((t) => t.uid === activeTask?.uid)?.patientName
          : state.pharmQueue.find((t) => t.uid === activeTask?.uid)?.patientName) || '',
    },
    notif: { title: 'Notifications', subtitle: 'Lab, pharmacy & referral updates' },
    ref: { title: 'Refer Patient', subtitle: currentPatient.name },
    note: { title: 'Referral Note', subtitle: currentPatient.name },
    refs: { title: 'Referrals', subtitle: `Sent from ${state.activeFacility}` },
    rfo: { title: 'Referral Outcome', subtitle: 'Send feedback to referring PHC' },
    reports: { title: 'Reports', subtitle: 'Automated monthly facility summary' },
    dash: { title: 'Dashboards', subtitle: '6-tier health system view (illustrative)' },
    surv: { title: 'Surveillance', subtitle: 'IDSR early-warning signals' },
    cs: { title: 'Case Notification', subtitle: `${currentPatient.name} · ${currentPatient.id}` },
    more: { title: 'Sync & Settings', subtitle: state.activeFacility },
    stf: { title: 'Staff & Access Control', subtitle: state.activeFacility },
    adm: { title: 'Facility Setup & Governance', subtitle: 'Admin configuration' },
  };

  const { title, subtitle } = headerMeta[currentScreen];
  const activeReferral =
    state.referrals.find((r) => r.id === activeReferralId) || state.referrals[0];
  const isRegisteredReferralDest = activeReferral
    ? state.facilities.some((f) => f.name === activeReferral.to)
    : false;

  return (
    <AppShell
      state={state}
      currentScreen={currentScreen}
      title={title}
      subtitle={subtitle}
      canGoBack={stack.length > 1}
      darkMode={darkMode}
      unreadNotifications={unreadNotifications}
      taskBadgeCount={taskBadgeCount}
      toastMessage={toastMessage}
      onBack={goBack}
      onNavigate={(r, reset) => navigate(r, reset)}
      onSyncNow={handleSyncNow}
      onToggleMute={() => {
        setState((prev) => ({ ...prev, muteSound: !prev.muteSound }));
        showToast(state.muteSound ? 'Alert sound enabled' : 'Alert sound muted');
      }}
      onToggleNinGate={() => {
        setState((prev) => ({ ...prev, ninGateEnabled: !prev.ninGateEnabled }));
        showToast(
          !state.ninGateEnabled
            ? 'NIN biometric verification gate enabled'
            : 'NIN biometric verification gate disabled'
        );
      }}
      onToggleDark={() => setDarkMode((d) => !d)}
      onSwitchFacilityDemo={() => {
        const allFacs = [state.facilityConfig.name, ...state.facilities.map((f) => f.name)];
        const idx = allFacs.indexOf(state.activeFacility);
        const nextFac = allFacs[(idx + 1) % allFacs.length];
        setState((prev) => ({ ...prev, activeFacility: nextFac }));
        showToast(`Viewing facility: ${nextFac}`);
        setStack(['home']);
      }}
      onLogout={handleLogout}
      onToast={showToast}
    >
      {currentScreen === 'home' && (
        <HomeView
          state={state}
          onNavigate={(r, reset) => navigate(r, reset)}
          onSelectService={() => navigate('search')}
          onAcceptReferral={(refId) => {
            const ref = state.referrals.find((r) => r.id === refId);
            if (!ref) return;
            const stamp = nowTimeLabel();
            setState((prev) => ({
              ...prev,
              referrals: prev.referrals.map((r) =>
                r.id === refId ? { ...r, status: 'Accepted', acceptedAt: stamp } : r
              ),
              notifications: [
                {
                  uid: `notif-${Date.now()}`,
                  kind: 'ref',
                  patientId: ref.patientId,
                  patientName: ref.patientName,
                  text: `Referral accepted by ${ref.to}`,
                  read: false,
                  time: stamp,
                },
                ...prev.notifications,
              ],
            }));
            showToast(`Accepted. ${ref.from} is notified.`);
          }}
          onOpenReferralOutcome={(refId) => {
            setActiveReferralId(refId);
            navigate('rfo');
          }}
          onLogout={handleLogout}
          onToast={showToast}
        />
      )}

      {currentScreen === 'search' && (
        <PatientSearchView
          state={state}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelectPatient={(pid) => {
            setSelectedPatientId(pid);
            setProfileTab('Summary');
            navigate('profile', false, pid);
          }}
          onRegisterNew={() => navigate('register')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterPatientView
          existingPatients={state.patients}
          ninGateEnabled={state.ninGateEnabled}
          onSavePatient={(patientData) => {
            const newId = `MAK-0024${state.patients.length + 11}`;
            const newPatient: CareSyncState['patients'][number] = {
              ...patientData,
              id: newId,
            };
            setState((prev) => ({
              ...prev,
              patients: [...prev.patients, newPatient],
              verifiedPatients: { ...prev.verifiedPatients, [newId]: true },
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
              syncedCount: prev.offline ? prev.syncedCount : prev.syncedCount + 1,
              auditLog: [
                `${prev.staffName} registered ${newPatient.name}${
                  newPatient.nin ? '' : ' (temporary ID)'
                }`,
                ...prev.auditLog,
              ],
            }));
            setSelectedPatientId(newId);
            setProfileTab('Summary');
            showToast(
              state.offline
                ? 'Patient saved offline on this device. Pending sync.'
                : 'Patient registered and synced.'
            );
            setStack(['home', 'search', 'profile']);
          }}
          onSelectExisting={(pid) => {
            setSelectedPatientId(pid);
            setProfileTab('Summary');
            navigate('profile', false, pid);
          }}
          onToast={showToast}
        />
      )}

      {currentScreen === 'verify' && (
        <PatientVerifyView
          patient={currentPatient}
          offline={state.offline}
          onVerified={(method, emergencyReason) => {
            setState((prev) => ({
              ...prev,
              verifiedPatients: { ...prev.verifiedPatients, [currentPatient.id]: true },
              emergencyOverrides: emergencyReason
                ? { ...prev.emergencyOverrides, [currentPatient.id]: emergencyReason }
                : prev.emergencyOverrides,
              auditLog: [
                `${emergencyReason ? 'EMERGENCY override: ' : ''}${prev.staffName} opened ${
                  currentPatient.name
                } (${method})${emergencyReason ? `. Reason: ${emergencyReason}` : ''}`,
                ...prev.auditLog,
              ],
            }));
            showToast(
              emergencyReason ? 'Emergency access granted and logged.' : 'Identity confirmed'
            );
            const target = pendingNextRoute || 'profile';
            setPendingNextRoute(null);
            setStack((prev) => [...prev.slice(0, -1), target]);
          }}
          onToast={showToast}
        />
      )}

      {currentScreen === 'profile' && (
        <PatientProfileView
          state={state}
          patient={currentPatient}
          activeTab={profileTab}
          onTabChange={setProfileTab}
          onNavigate={(r) => navigate(r)}
          onContinueEncounter={handleOpenReadyEncounter}
        />
      )}

      {currentScreen === 'hist' && (
        <PatientHistoryView
          state={state}
          patient={currentPatient}
          onStartEncounter={() => navigate('sel')}
          onShareHistory={() => navigate('shr')}
          onContinueEncounter={handleOpenReadyEncounter}
        />
      )}

      {currentScreen === 'shr' && (
        <ShareHistoryView
          state={state}
          patient={currentPatient}
          onShare={(channel, target, reason) => {
            setState((prev) => ({
              ...prev,
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
              syncedCount: prev.offline ? prev.syncedCount : prev.syncedCount + 1,
              shareLog: [
                {
                  uid: `shr-${Date.now()}`,
                  patientName: currentPatient.name,
                  channel,
                  target,
                  reason,
                  time: nowTimeLabel(),
                },
                ...prev.shareLog,
              ],
            }));
            showToast(`Shared by ${channel}. Recorded in the audit log.`);
          }}
        />
      )}

      {currentScreen === 'sel' && (
        <EncounterSelectView
          state={state}
          patient={currentPatient}
          onSelectType={handleStartEncounterType}
          onViewHistory={() => navigate('hist')}
        />
      )}

      {currentScreen === 'encounter' && draftEncounter && (
        <EncounterFormView
          state={state}
          patient={currentPatient}
          draft={draftEncounter}
          onUpdateDraft={setDraftEncounter}
          onSendLabOrder={handleSendLabOrder}
          onSendPharmacyOrder={handleSendPharmacyOrder}
          onSaveAndWaitForLab={handleSaveAndWaitForLab}
          onCompleteEncounter={handleCompleteEncounter}
          onBackHome={() => setStack(['home'])}
          onToast={showToast}
        />
      )}

      {currentScreen === 'tasks' && (
        <TasksView
          state={state}
          onOpenLabTask={(uid) => {
            setActiveTask({ kind: 'lab', uid });
            navigate('tdet');
          }}
          onOpenPharmTask={(uid) => {
            setActiveTask({ kind: 'ph', uid });
            navigate('tdet');
          }}
        />
      )}

      {currentScreen === 'tdet' && activeTask && (
        <TaskDetailView
          kind={activeTask.kind}
          patientName={
            (activeTask.kind === 'lab'
              ? state.labQueue.find((t) => t.uid === activeTask.uid)?.patientName
              : state.pharmQueue.find((t) => t.uid === activeTask.uid)?.patientName) ||
            'Patient'
          }
          items={
            (activeTask.kind === 'lab'
              ? state.labQueue.find((t) => t.uid === activeTask.uid)?.items
              : state.pharmQueue.find((t) => t.uid === activeTask.uid)?.items) || []
          }
          onSubmit={handleTaskSubmit}
          onToast={showToast}
        />
      )}

      {currentScreen === 'notif' && (
        <NotificationsView
          state={state}
          onOpenReadyEncounter={handleOpenReadyEncounter}
          onOpenNotification={handleOpenNotification}
        />
      )}

      {currentScreen === 'ref' && (
        <ReferPatientView
          state={state}
          patient={currentPatient}
          onCreateReferral={({ to, reason, urgency, treatmentGiven }) => {
            const newRef: Referral = {
              id: `REF-${1001 + state.referrals.length}`,
              patientId: currentPatient.id,
              patientName: currentPatient.name,
              from: state.activeFacility,
              to,
              reason,
              urgency,
              treatmentGiven,
              summaryLines: buildSummaryLines(currentPatient, state.encounters),
              status: state.offline ? 'Queued' : 'Delivered',
              time: nowTimeLabel(),
              feedback: '',
            };
            setState((prev) => ({
              ...prev,
              referrals: [newRef, ...prev.referrals],
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
              syncedCount: prev.offline ? prev.syncedCount : prev.syncedCount + 1,
            }));
            setActiveReferralId(newRef.id);
            showToast(
              state.offline
                ? 'Saved offline. Referral will send automatically when online.'
                : `Referral delivered to ${to}. Prompt auto-accept if immediate confirmation is needed.`
            );
            navigate('note');
          }}
          onToast={showToast}
        />
      )}

      {currentScreen === 'note' && activeReferral && (
        <ReferralNoteView
          referral={activeReferral}
          isRegisteredFacility={isRegisteredReferralDest}
          onPromptAutoAccept={handlePromptAutoAccept}
          onViewAllReferrals={() => navigate('refs', true)}
          onToast={showToast}
        />
      )}

      {currentScreen === 'refs' && (
        <ReferralsListView
          state={state}
          onPromptAutoAccept={handlePromptAutoAccept}
          onViewNote={(id) => {
            setActiveReferralId(id);
            navigate('note');
          }}
        />
      )}

      {currentScreen === 'rfo' && activeReferral && (
        <ReferralOutcomeView
          referral={activeReferral}
          onSubmitFeedback={(outcome, note) => {
            const fbText = note ? `${outcome}: ${note}` : outcome;
            setState((prev) => ({
              ...prev,
              referrals: prev.referrals.map((r) =>
                r.id === activeReferral.id ? { ...r, status: 'Completed', feedback: fbText } : r
              ),
              notifications: [
                {
                  uid: `notif-${Date.now()}`,
                  kind: 'ref',
                  patientId: activeReferral.patientId,
                  patientName: activeReferral.patientName,
                  text: `Referral feedback from ${activeReferral.to}: ${fbText}`,
                  read: false,
                  time: nowTimeLabel(),
                },
                ...prev.notifications,
              ],
            }));
            showToast(`Feedback sent to ${activeReferral.from}`);
            goBack();
          }}
        />
      )}

      {currentScreen === 'reports' && (
        <ReportsView
          state={state}
          onNavigate={(r) => navigate(r)}
          onToast={showToast}
        />
      )}

      {currentScreen === 'dash' && (
        <DashboardsView
          offline={state.offline}
          facilityName={state.facilityConfig.name}
          facilityLga={state.facilityConfig.lga}
          facilityState={state.facilityConfig.stateName}
          onNavigateSurveillance={() => navigate('surv')}
        />
      )}

      {currentScreen === 'surv' && (
        <SurveillanceView state={state} onNotifyCase={() => navigate('cs')} />
      )}

      {currentScreen === 'cs' && (
        <CaseNotificationView
          patient={currentPatient}
          onSubmitCase={({ disease, onsetDate, symptoms, sampleTaken, notes }) => {
            setState((prev) => ({
              ...prev,
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
              syncedCount: prev.offline ? prev.syncedCount : prev.syncedCount + 1,
              caseNotifications: [
                {
                  uid: `cn-${Date.now()}`,
                  patientId: currentPatient.id,
                  patientName: currentPatient.name,
                  disease,
                  onsetDate,
                  symptoms,
                  sampleTaken,
                  notes,
                  time: nowTimeLabel(),
                  synced: !prev.offline,
                },
                ...prev.caseNotifications,
              ],
            }));
            showToast(
              state.offline
                ? 'Case notification saved offline. Reaches LGA surveillance officer when online.'
                : 'Case notification sent to LGA surveillance officer.'
            );
            goBack();
          }}
        />
      )}

      {currentScreen === 'more' && (
        <SyncMoreView
          state={state}
          onSyncNow={handleSyncNow}
          onNavigate={(r) => navigate(r)}
          onResetDemoData={() => {
            window.localStorage.removeItem(STORAGE_KEY);
            removeNativeStorage(STORAGE_KEY);
            const fresh = createInitialState();
            setState(fresh);
            setSelectedPatientId(fresh.patients[0].id);
            setDraftEncounter(null);
            setStack(['home']);
            showToast('Local data restored to initial state');
          }}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'stf' && (
        <StaffManagementView
          state={state}
          onSetStaffStatus={(staffId: string, status: StaffStatus) => {
            setState((prev) => ({
              ...prev,
              staffList: prev.staffList.map((s) =>
                s.id === staffId ? { ...s, status } : s
              ),
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
            }));
            const target = state.staffList.find((s) => s.id === staffId);
            showToast(`${target?.name || 'Staff'}: ${status}`);
          }}
          onUpdateStaffPermissions={(staffId: string, permissions: AccessPermissions) => {
            setState((prev) => ({
              ...prev,
              staffList: prev.staffList.map((s) =>
                s.id === staffId ? { ...s, permissions } : s
              ),
              activePermissions:
                prev.staffId === staffId ? permissions : prev.activePermissions,
              auditLog: [
                `${prev.staffName} updated access control permissions for ${
                  prev.staffList.find((s) => s.id === staffId)?.name || staffId
                }`,
                ...prev.auditLog,
              ],
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
            }));
            showToast('Access control permissions updated');
          }}
          onEnrollStaff={({ name, username, password, email, role, permissions }) => {
            const prefix = { nurse: 'NRS', lab: 'LAB', pharm: 'PHM', asst: 'AST' }[role];
            const id = `${prefix}-${1000 + state.staffList.length}`;
            setState((prev) => ({
              ...prev,
              staffList: [
                ...prev.staffList,
                {
                  id,
                  username,
                  password,
                  name,
                  email,
                  role,
                  fac: prev.facilityConfig.name,
                  status: 'Active',
                  permissions,
                },
              ],
              auditLog: [
                `${prev.staffName} enrolled ${name} (@${username}, ${id}) with custom access control`,
                ...prev.auditLog,
              ],
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
            }));
            showToast(`${name} enrolled (${id}). Username: ${username}`);
          }}
          onToast={showToast}
        />
      )}

      {currentScreen === 'adm' && (
        <CreatorAdminView
          state={state}
          onSaveFacilityConfig={handleAdminSaveFacilityConfig}
          onSetStaffStatus={(staffId: string, status: StaffStatus) => {
            setState((prev) => ({
              ...prev,
              staffList: prev.staffList.map((s) =>
                s.id === staffId ? { ...s, status } : s
              ),
              pendingCount: prev.offline ? prev.pendingCount + 1 : prev.pendingCount,
            }));
            const target = state.staffList.find((s) => s.id === staffId);
            showToast(`${target?.name || 'Account'}: ${status}`);
          }}
          onToast={showToast}
        />
      )}
    </AppShell>
  );
}
