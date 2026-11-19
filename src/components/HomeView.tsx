import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Baby,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  HeartHandshake,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
  Syringe,
  UserPlus,
  Users,
} from 'lucide-react';
import { CareSyncState, ScreenRoute } from '../types/caresync';

interface HomeViewProps {
  state: CareSyncState;
  onNavigate: (route: ScreenRoute, reset?: boolean) => void;
  onSelectService: (service: string) => void;
  onAcceptReferral: (referralId: string) => void;
  onOpenReferralOutcome: (referralId: string) => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onNavigate,
  onSelectService,
  onAcceptReferral,
  onOpenReferralOutcome,
  onLogout,
  onToast,
}) => {
  const perms = state.activePermissions;
  const homeFacilityName = state.facilityConfig.name;

  // System / Facility Admin Dashboard Home
  if (state.position === 'creator') {
    const activeStaff = state.staffList.filter((s) => s.status === 'Active').length;
    const inactiveStaff = state.staffList.length - activeStaff;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6">
          <h2 className="font-display text-2xl font-bold text-[#13221A] dark:text-[#EAF2ED]">
            Good morning, {state.staffName}
          </h2>
          <p className="mt-1 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            Facility configuration &amp; overall governance across registered MaKSET facilities
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
              <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
                {state.facilities.length + (state.facilityConfig.configured ? 1 : 0)}
              </div>
              <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
                Registered facilities
              </div>
            </div>
            <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
              <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
                {activeStaff}
              </div>
              <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
                Active staff accounts
              </div>
            </div>
            <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
              <div className="font-display text-3xl font-extrabold text-[#C62828] dark:text-rose-400 tabular-nums">
                {inactiveStaff}
              </div>
              <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
                Suspended / Blocked
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('adm')}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#0B5D34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#094D2B] whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="h-4 w-4" />
              Facility Setup, In-Charges &amp; Staff
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-5 py-2.5 text-sm font-semibold text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23] whitespace-nowrap shrink-0"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Receiving Facility View when switched
  if (state.activeFacility !== homeFacilityName) {
    const incoming = state.referrals.filter(
      (r) => r.to === state.activeFacility && r.status !== 'Queued'
    );
    const queuedOffline = state.referrals.filter(
      (r) => r.to === state.activeFacility && r.status === 'Queued'
    ).length;

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
          <div>
            <h2 className="font-display text-xl font-bold">
              Incoming Referrals ({incoming.length})
            </h2>
            <p className="text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              Receiving Facility · {state.activeFacility}
            </p>
          </div>

          {queuedOffline > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-[#FFF3D6] dark:bg-[#2F250D] p-3 text-xs font-medium text-[#7A5100] dark:text-amber-200">
              {queuedOffline} additional referral(s) waiting for sender connectivity.
            </div>
          )}

          <div className="mt-4 space-y-3">
            {incoming.length === 0 ? (
              <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] p-6 text-center text-sm text-[#5D6E64] dark:text-[#98AEA1]">
                No referrals received at {state.activeFacility} yet.
              </div>
            ) : (
              incoming.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl border p-4 ${
                    r.status === 'Delivered'
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/10'
                      : 'border-[#D9E3DD] dark:border-[#24352B] bg-[#F9FBFA] dark:bg-[#192820]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-base font-bold">{r.patientName}</div>
                      <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                        From {r.from} · {r.time} · {r.id}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${
                        r.urgency === 'Emergency'
                          ? 'text-[#C62828] dark:text-rose-400'
                          : 'text-[#0B5D34] dark:text-[#39C27A]'
                      }`}
                    >
                      {r.urgency}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Reason:</span> {r.reason}
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                    {r.summaryLines.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>

                  <div className="mt-3">
                    {r.status === 'Delivered' && (
                      <button
                        type="button"
                        onClick={() => onAcceptReferral(r.id)}
                        className="inline-flex min-h-[42px] items-center rounded-xl bg-[#0B5D34] px-4 py-2 text-xs font-bold text-white hover:bg-[#094D2B]"
                      >
                        Accept referral
                      </button>
                    )}
                    {r.status === 'Accepted' && (
                      <button
                        type="button"
                        onClick={() => onOpenReferralOutcome(r.id)}
                        className="inline-flex min-h-[42px] items-center rounded-xl bg-[#0B5D34] px-4 py-2 text-xs font-bold text-white hover:bg-[#094D2B]"
                      >
                        Record outcome &amp; send feedback
                      </button>
                    )}
                    {r.status === 'Completed' && (
                      <div className="text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]">
                        Completed: {r.feedback}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Lab / Pharmacy / Staff-Only view if staff does NOT have patient/clinical access
  if (!perms.patients && !perms.clinicalEncounters) {
    if (perms.manageStaff && !perms.laboratory && !perms.pharmacy) {
      return (
        <div className="space-y-5 max-w-2xl">
          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6">
            <h2 className="font-display text-2xl font-bold">Good morning, {state.staffName}</h2>
            <p className="mt-1 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              {state.activeFacility} · Staff Administration Access
            </p>
            <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-[#FFF3D6] dark:bg-[#2F250D] p-4 text-sm text-[#7A5100] dark:text-amber-200">
              Your Officer in Charge configured your account for Staff &amp; Access administration.
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('stf')}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#0B5D34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#094D2B]"
              >
                <Users className="h-4 w-4" />
                Staff &amp; Access
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-5 py-2.5 text-sm font-semibold"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      );
    }

    const showLab = perms.laboratory;
    const showPharm = perms.pharmacy;
    const queueCount =
      (showLab ? state.labQueue.length : 0) + (showPharm ? state.pharmQueue.length : 0);

    return (
      <div className="space-y-5 max-w-2xl">
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6">
          <h2 className="font-display text-2xl font-bold">Good morning, {state.staffName}</h2>
          <p className="mt-1 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            {showLab && showPharm
              ? 'Laboratory & Pharmacy'
              : showLab
                ? 'Laboratory Unit'
                : 'Pharmacy Dispensary'}{' '}
            · {state.activeFacility}
          </p>

          <button
            type="button"
            onClick={() => onNavigate('tasks', true)}
            className="mt-6 flex w-full min-h-[84px] items-center justify-between rounded-2xl bg-[#0B5D34] p-5 text-left text-white hover:bg-[#094D2B] transition"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                {showLab ? (
                  <FlaskConical className="h-6 w-6" />
                ) : (
                  <Pill className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="font-display text-lg font-bold">
                  {showLab && showPharm
                    ? 'Lab & Pharmacy Work Queue'
                    : showLab
                      ? 'Lab Investigations Queue'
                      : 'Prescriptions to Dispense'}
                </div>
                <div className="text-xs text-emerald-100/85">
                  {queueCount > 0
                    ? `${queueCount} patient ${queueCount === 1 ? 'order' : 'orders'} waiting`
                    : 'All orders completed'}
                </div>
              </div>
            </div>
            <div className="font-display text-3xl font-extrabold tabular-nums">
              {queueCount}
            </div>
          </button>

          {queueCount > 0 ? (
            <button
              type="button"
              onClick={() => onNavigate('tasks', true)}
              className="mt-4 flex w-full min-h-[46px] items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDE4E4] dark:bg-[#381B1B] px-4 py-3 text-sm font-semibold text-[#C62828] dark:text-rose-200"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{queueCount} waiting. Tap to open work inbox.</span>
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] px-4 py-3 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              <CheckCircle2 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
              <span>No tasks waiting in your queue.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Clinical & Full Access Home (permission-gated)
  const pendingFollowUpRefs = state.referrals.filter(
    (r) => r.from === state.activeFacility && r.status !== 'Completed'
  ).length;
  const openLabWaits = state.encounters.filter((e) => e.status === 'open').length;

  const services = [
    { name: 'OPD', icon: Stethoscope, desc: 'Outpatient consultation', allowed: perms.clinicalEncounters },
    { name: 'ANC', icon: HeartHandshake, desc: 'Antenatal clinic', allowed: perms.clinicalEncounters },
    { name: 'Child Health', icon: Baby, desc: 'Growth & nutrition', allowed: perms.clinicalEncounters },
    { name: 'Immunization', icon: Syringe, desc: 'NPHCDA schedule', allowed: perms.clinicalEncounters },
    {
      name: 'Laboratory',
      icon: FlaskConical,
      desc: `${state.labQueue.length} pending`,
      allowed: perms.laboratory || perms.clinicalEncounters,
    },
    {
      name: 'Referrals',
      icon: ArrowUpRight,
      desc: `${pendingFollowUpRefs} active`,
      allowed: perms.referrals,
    },
  ].filter((s) => s.allowed);

  return (
    <div className="space-y-4">
      <div className="px-0.5">
        <h2 className="font-display text-lg sm:text-xl font-bold leading-snug text-[#13221A] dark:text-[#EAF2ED]">
          Good morning, {state.staffName}
        </h2>
        <p className="text-xs sm:text-sm text-[#5D6E64] dark:text-[#98AEA1]">
          {state.activeFacility} · {state.facilityConfig.lga} LGA, {state.facilityConfig.stateName}
        </p>
      </div>

      {perms.patients && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="flex min-h-[92px] items-center gap-4 rounded-2xl bg-[#0B5D34] p-5 text-left text-white shadow-xs hover:bg-[#094D2B] active:scale-[0.99] transition"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">Find Patient</div>
              <div className="text-xs text-emerald-100/85">
                Search on device by name, ID, NIN or QR
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-[#0B5D34] bg-white dark:bg-[#15221B] dark:border-[#39C27A] p-5 text-left text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326] active:scale-[0.99] transition"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326]">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">Register Patient</div>
              <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                Capture identity once with local duplicate check
              </div>
            </div>
          </button>
        </div>
      )}

      {services.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[#5D6E64] dark:text-[#98AEA1]">
              Services
            </h3>
            <span className="text-xs text-[#5D6E64] dark:text-[#98AEA1] tabular-nums">
              {state.patients.length} patients on device
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <button
                  key={svc.name}
                  type="button"
                  onClick={() => {
                    if (svc.name === 'Laboratory') {
                      onNavigate('tasks', true);
                    } else if (svc.name === 'Referrals') {
                      onNavigate('refs');
                    } else {
                      onToast('Select a patient to start ' + svc.name);
                      onSelectService(svc.name);
                    }
                  }}
                  className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-center hover:border-[#0B5D34] dark:hover:border-[#39C27A] transition"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold text-[#13221A] dark:text-[#EAF2ED]">
                    {svc.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#6B7C72] dark:text-[#84998D]">
                    {svc.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {perms.referrals && (
          <button
            type="button"
            onClick={() => onNavigate('refs')}
            className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDE4E4] dark:bg-[#381B1B] px-4 py-3 text-left text-sm font-semibold text-[#C62828] dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition"
          >
            <span className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>
                {pendingFollowUpRefs}{' '}
                {pendingFollowUpRefs === 1 ? 'referral needs' : 'referrals need'} follow-up
              </span>
            </span>
            <span className="text-xs font-bold underline whitespace-nowrap shrink-0">View</span>
          </button>
        )}

        {(perms.clinicalEncounters || perms.laboratory || perms.pharmacy) && (
          <button
            type="button"
            onClick={() =>
              onNavigate(openLabWaits > 0 ? 'notif' : 'tasks', openLabWaits === 0)
            }
            className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] px-4 py-3 text-left text-sm font-semibold text-[#13221A] dark:text-[#EAF2ED] hover:border-[#0B5D34] transition"
          >
            <span className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-[#0B5D34] dark:text-[#39C27A] shrink-0" />
              <span>
                {state.labQueue.length} lab &amp; {state.pharmQueue.length} pharmacy tasks ·{' '}
                {openLabWaits} open consultations
              </span>
            </span>
            <span className="text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] whitespace-nowrap shrink-0">
              Open
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
