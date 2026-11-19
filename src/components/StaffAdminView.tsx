import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  Check,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { defaultPermissionsForRole, ROLE_LABELS } from '../data/initialData';
import {
  AccessPermissions,
  CareSyncState,
  FacilityConfig,
  ScreenRoute,
  StaffMember,
  StaffStatus,
} from '../types/caresync';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const PERMISSION_OPTIONS: { key: keyof AccessPermissions; label: string }[] = [
  { key: 'patients', label: 'Find & Register Patients' },
  { key: 'clinicalEncounters', label: 'Clinical Encounters (OPD, ANC, Imm)' },
  { key: 'laboratory', label: 'Laboratory Queue & Results' },
  { key: 'pharmacy', label: 'Pharmacy Queue & Dispensing' },
  { key: 'referrals', label: 'Referrals & Follow-Up' },
  { key: 'reportsDashboards', label: 'Reports, Dashboards & Surveillance' },
  { key: 'manageStaff', label: 'Staff Management' },
];

interface StaffManagementViewProps {
  state: CareSyncState;
  onSetStaffStatus: (staffId: string, status: StaffStatus) => void;
  onUpdateStaffPermissions: (staffId: string, permissions: AccessPermissions) => void;
  onEnrollStaff: (payload: {
    name: string;
    username: string;
    password: string;
    email: string;
    role: Exclude<StaffMember['role'], 'oc'>;
    permissions: AccessPermissions;
  }) => void;
  onToast: (msg: string) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  state,
  onSetStaffStatus,
  onUpdateStaffPermissions,
  onEnrollStaff,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('Nurse/CHEW');
  const [newPerms, setNewPerms] = useState<AccessPermissions>(() =>
    defaultPermissionsForRole('nurse')
  );
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const facilityStaff = state.staffList.filter((s) => s.fac === state.activeFacility);
  const countByRole = (r: StaffMember['role']) =>
    facilityStaff.filter((s) => s.role === r && s.status === 'Active').length;

  const canManageStaff =
    state.position === 'oc' ||
    state.position === 'creator' ||
    state.activePermissions.manageStaff;

  const handleRolePick = (rl: string) => {
    setRoleLabel(rl);
    const mappedRole: StaffMember['role'] = rl.includes('Lab')
      ? 'lab'
      : rl.includes('Pharm')
        ? 'pharm'
        : rl.toLowerCase().includes('assist')
          ? 'asst'
          : 'nurse';
    setNewPerms(defaultPermissionsForRole(mappedRole));
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('Enter the staff full name');
      return;
    }
    if (!password.trim()) {
      onToast('Set an initial password for this staff account');
      return;
    }
    const role: Exclude<StaffMember['role'], 'oc'> = roleLabel.includes('Lab')
      ? 'lab'
      : roleLabel.includes('Pharm')
        ? 'pharm'
        : roleLabel.toLowerCase().includes('assist')
          ? 'asst'
          : 'nurse';

    const cleanUser =
      username.trim() ||
      name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    onEnrollStaff({
      name: name.trim(),
      username: cleanUser,
      password: password.trim(),
      email: email.trim().toLowerCase() || `${cleanUser}@makset.phc`,
      role,
      permissions: newPerms,
    });
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Nurses / CHEWs', 'nurse'],
            ['Lab Technicians', 'lab'],
            ['Pharmacists', 'pharm'],
            ['OC Assistants', 'asst'],
          ] as [string, StaffMember['role']][]
        ).map(([label, role]) => (
          <div
            key={role}
            className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4"
          >
            <div className="font-display text-2xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
              {countByRole(role)}
            </div>
            <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {facilityStaff.map((s) => {
          const canEditThis =
            (state.position === 'oc' && s.role !== 'oc') ||
            (state.activePermissions.manageStaff && s.role !== 'oc' && s.id !== state.staffId);
          const isEditing = editingStaffId === s.id;
          const activePermCount = Object.values(s.permissions).filter(Boolean).length;

          return (
            <div
              key={s.id}
              className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6F3EC] dark:bg-[#1B3326] font-display text-xs font-bold text-[#0B5D34] dark:text-[#39C27A]">
                    {getInitials(s.name)}
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold">{s.name}</div>
                    <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                      {ROLE_LABELS[s.role]} ·{' '}
                      <span className="font-mono-tabular">{s.id}</span> ·{' '}
                      <span className="font-mono-tabular">@{s.username}</span> ·{' '}
                      {activePermCount} module{activePermCount === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold mr-1 ${
                      s.status === 'Active'
                        ? 'text-[#0B5D34] dark:text-[#39C27A]'
                        : 'text-[#C62828] dark:text-rose-400'
                    }`}
                  >
                    {s.status}
                  </span>
                  {canEditThis && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingStaffId(isEditing ? null : s.id)}
                        className="min-h-[38px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-3 text-xs font-semibold hover:border-[#0B5D34]"
                      >
                        {isEditing ? 'Done' : 'Access Control'}
                      </button>
                      {s.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => onSetStaffStatus(s.id, 'Suspended')}
                          className="min-h-[38px] rounded-xl border border-[#0B5D34] px-3 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
                        >
                          Suspend
                        </button>
                      )}
                      {s.status === 'Suspended' && (
                        <button
                          type="button"
                          onClick={() => onSetStaffStatus(s.id, 'Active')}
                          className="min-h-[38px] rounded-xl border border-[#0B5D34] px-3 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
                        >
                          Restore
                        </button>
                      )}
                      {(s.status === 'Active' || s.status === 'Suspended') && (
                        <button
                          type="button"
                          onClick={() => onSetStaffStatus(s.id, 'Terminated')}
                          className="min-h-[38px] rounded-xl bg-[#C62828] px-3 text-xs font-bold text-white"
                        >
                          Terminate
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-[#EEF3F0] dark:border-[#223229] pt-3">
                  <div className="mb-2 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]">
                    OC Access Control Permissions for {s.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_OPTIONS.map(({ key, label }) => {
                      const enabled = s.permissions[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            onUpdateStaffPermissions(s.id, {
                              ...s.permissions,
                              [key]: !enabled,
                            })
                          }
                          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                            enabled
                              ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                              : 'border-[#D9E3DD] dark:border-[#26382E]'
                          }`}
                        >
                          {enabled && <Check className="h-3.5 w-3.5" />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canManageStaff && (
        <form
          onSubmit={handleEnroll}
          className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4"
        >
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            <UserPlus className="h-4 w-4" />
            Enrol New Staff &amp; Assign Access Control
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maryam Suleiman"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Username (for login)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. maryam"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maryam@makset.phc"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Initial Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set staff password"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Role Preset
            </div>
            <div className="flex flex-wrap gap-2">
              {['Nurse/CHEW', 'Lab technician', 'Pharmacy', 'OC assistant'].map((rl) => (
                <button
                  key={rl}
                  type="button"
                  onClick={() => handleRolePick(rl)}
                  className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold ${
                    roleLabel === rl
                      ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                      : 'border-[#D9E3DD] dark:border-[#26382E]'
                  }`}
                >
                  {rl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0B5D34] dark:text-[#39C27A]" />
              Access Control Permissions (Determined by Officer in Charge)
            </div>
            <div className="flex flex-wrap gap-2">
              {PERMISSION_OPTIONS.map(({ key, label }) => {
                const enabled = newPerms[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setNewPerms((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                      enabled
                        ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                        : 'border-[#D9E3DD] dark:border-[#26382E]'
                    }`}
                  >
                    {enabled && <Check className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[46px] rounded-xl bg-[#0B5D34] px-6 text-sm font-bold text-white hover:bg-[#094D2B]"
          >
            Enrol staff &amp; save access control
          </button>
        </form>
      )}
    </div>
  );
};

interface CreatorAdminViewProps {
  state: CareSyncState;
  onSaveFacilityConfig: (config: Omit<FacilityConfig, 'configured'>) => void;
  onSetStaffStatus: (staffId: string, status: StaffStatus) => void;
  onToast: (msg: string) => void;
}

export const CreatorAdminView: React.FC<CreatorAdminViewProps> = ({
  state,
  onSaveFacilityConfig,
  onSetStaffStatus,
  onToast,
}) => {
  const [facName, setFacName] = useState(
    state.facilityConfig.configured ? state.facilityConfig.name : ''
  );
  const [facType, setFacType] = useState<'PHC' | 'Hospital'>(state.facilityConfig.type);
  const [facLga, setFacLga] = useState(state.facilityConfig.lga);
  const [facState, setFacState] = useState(state.facilityConfig.stateName);
  const [facWard, setFacWard] = useState(state.facilityConfig.ward);

  const allFacilityNames = Array.from(
    new Set([state.facilityConfig.name, ...state.facilities.map((f) => f.name)])
  );
  const [selectedFac, setSelectedFac] = useState(allFacilityNames[0]);

  const facStaff = state.staffList.filter((s) => s.fac === selectedFac);
  const activeCount = facStaff.filter((s) => s.status === 'Active').length;

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) {
      onToast('Enter the facility name');
      return;
    }
    onSaveFacilityConfig({
      name: facName.trim(),
      type: facType,
      lga: facLga.trim() || 'Katagum',
      stateName: facState.trim() || 'Bauchi State',
      ward: facWard.trim() || 'Central Ward',
    });
    setSelectedFac(facName.trim());
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form
        onSubmit={handleSaveFacility}
        className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4"
      >
        <div className="flex items-center gap-2 font-display text-base font-bold text-[#0B5D34] dark:text-[#39C27A]">
          <Building2 className="h-5 w-5" />
          Active Facility Setup (Admin Configuration)
        </div>
        <p className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          Determine the facility name, tier, LGA, and State bound to this MaKSET installation.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Facility Name
            </label>
            <input
              type="text"
              value={facName}
              onChange={(e) => setFacName(e.target.value)}
              placeholder="e.g. Kafin Madaki Primary Health Centre"
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Facility Type
            </label>
            <select
              value={facType}
              onChange={(e) => setFacType(e.target.value as 'PHC' | 'Hospital')}
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
            >
              <option value="PHC">PHC</option>
              <option value="Hospital">Hospital</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              LGA
            </label>
            <input
              type="text"
              value={facLga}
              onChange={(e) => setFacLga(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              State
            </label>
            <input
              type="text"
              value={facState}
              onChange={(e) => setFacState(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Ward
            </label>
            <input
              type="text"
              value={facWard}
              onChange={(e) => setFacWard(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="min-h-[44px] rounded-xl bg-[#0B5D34] px-5 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          Apply Facility Setup
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {allFacilityNames.map((fName) => (
            <button
              key={fName}
              type="button"
              onClick={() => setSelectedFac(fName)}
              className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold transition ${
                selectedFac === fName
                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                  : 'border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B]'
              }`}
            >
              {fName}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4">
          <div className="font-display text-base font-bold">{selectedFac}</div>
          <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
            {activeCount} active of {facStaff.length} staff. Block the Officer in Charge or any staff account to revoke application access immediately.
          </div>
        </div>

        <div className="space-y-2.5">
          {facStaff.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6F3EC] dark:bg-[#1B3326] font-display text-xs font-bold text-[#0B5D34] dark:text-[#39C27A]">
                  {getInitials(s.name)}
                </div>
                <div>
                  <div className="font-display text-sm font-bold">{s.name}</div>
                  <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                    {ROLE_LABELS[s.role]} · <span className="font-mono-tabular">{s.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    s.status === 'Active'
                      ? 'text-[#0B5D34] dark:text-[#39C27A]'
                      : 'text-[#C62828] dark:text-rose-400'
                  }`}
                >
                  {s.status}
                </span>
                {s.status === 'Active' ? (
                  <button
                    type="button"
                    onClick={() => onSetStaffStatus(s.id, 'Blocked')}
                    className="min-h-[38px] rounded-xl bg-[#C62828] px-3.5 text-xs font-bold text-white"
                  >
                    Block access
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetStaffStatus(s.id, 'Active')}
                    className="min-h-[38px] rounded-xl border border-[#0B5D34] px-3.5 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
                  >
                    Restore access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SyncMoreViewProps {
  state: CareSyncState;
  onSyncNow: () => void;
  onNavigate: (route: ScreenRoute) => void;
  onResetDemoData: () => void;
  onLogout: () => void;
}

export const SyncMoreView: React.FC<SyncMoreViewProps> = ({
  state,
  onSyncNow,
  onNavigate,
  onResetDemoData,
  onLogout,
}) => {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Device Sync Status
          </h2>
          <span
            className={`text-xs font-bold ${
              state.offline
                ? 'text-[#8A5A00] dark:text-amber-300'
                : 'text-[#0B5D34] dark:text-[#39C27A]'
            }`}
          >
            {state.offline ? 'Offline (No connectivity)' : 'Online (Connected)'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
            <div className="font-display text-3xl font-extrabold text-[#8A5A00] dark:text-amber-300 tabular-nums">
              {state.pendingCount}
            </div>
            <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Pending records
            </div>
          </div>
          <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
            <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
              {state.syncedCount}
            </div>
            <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Synced records
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onSyncNow}
          className="mt-4 inline-flex w-full sm:w-auto min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-6 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          <RefreshCw className="h-4 w-4" />
          Sync now
        </button>
      </div>

      {(state.activePermissions.reportsDashboards ||
        state.activePermissions.manageStaff ||
        state.position === 'oc') && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(state.activePermissions.manageStaff || state.position === 'oc') && (
            <button
              type="button"
              onClick={() => onNavigate('stf')}
              className="flex min-h-[54px] items-center justify-between rounded-2xl border border-[#0B5D34] dark:border-[#39C27A] bg-[#E6F3EC] dark:bg-[#1B3326] px-4 text-left font-semibold text-sm text-[#0B5D34] dark:text-[#39C27A]"
            >
              <span className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 shrink-0" />
                Staff &amp; Access Control
              </span>
              <span>›</span>
            </button>
          )}
          {state.activePermissions.reportsDashboards && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('dash')}
                className="flex min-h-[54px] items-center justify-between rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] px-4 text-left font-semibold text-sm hover:border-[#0B5D34]"
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
                  Open Dashboards (6 Tiers)
                </span>
                <span className="text-[#0B5D34]">›</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('surv')}
                className="flex min-h-[54px] items-center justify-between rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] px-4 text-left font-semibold text-sm hover:border-[#0B5D34]"
              >
                <span className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
                  Surveillance &amp; Signals
                </span>
                <span className="text-[#0B5D34]">›</span>
              </button>
            </>
          )}
        </div>
      )}

      {state.auditLog.length > 0 && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-2">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Access Audit Log
          </h3>
          {state.auditLog.slice(0, 8).map((entry, idx) => (
            <div
              key={idx}
              className="border-b border-[#EEF3F0] dark:border-[#223229] pb-1.5 text-xs text-[#5D6E64] dark:text-[#98AEA1] last:border-b-0 last:pb-0"
            >
              {entry}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onResetDemoData}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-4 text-xs font-semibold hover:border-[#0B5D34]"
        >
          <RotateCcw className="h-4 w-4" />
          Reset local data
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-[#15221B] px-4 text-xs font-bold text-[#C62828] dark:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
};
