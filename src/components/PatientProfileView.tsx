import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Baby,
  Calendar,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  HeartHandshake,
  History,
  Pencil,
  Pill,
  Printer,
  Scale,
  Share2,
  Stethoscope,
  Syringe,
  X,
} from 'lucide-react';
import {
  CareSyncState,
  Encounter,
  EncounterType,
  Patient,
  ProfileTab,
  ScreenRoute,
} from '../types/caresync';
import {
  getDisplayPatientId,
  isValidNin,
  maskNin,
  normalizeNin,
} from '../utils/patientIdentity';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export const EncounterCard: React.FC<{
  encounter: Encounter;
  pendingLabCount: number;
  onContinue?: () => void;
}> = ({ encounter, pendingLabCount, onContinue }) => {
  const statusLabel =
    encounter.status === 'open'
      ? pendingLabCount > 0
        ? 'Awaiting lab'
        : 'Results ready'
      : encounter.synced
        ? 'Synced'
        : 'Pending sync';

  const statusTone =
    encounter.status === 'open'
      ? pendingLabCount > 0
        ? 'text-[#8A5A00] dark:text-amber-300'
        : 'text-[#0B5D34] dark:text-[#39C27A]'
      : encounter.synced
        ? 'text-[#0B5D34] dark:text-[#39C27A]'
        : 'text-[#8A5A00] dark:text-amber-300';

  return (
    <div
      className={`rounded-2xl border p-4 bg-white dark:bg-[#15221B] ${
        encounter.status === 'open'
          ? 'border-[#0B5D34] dark:border-[#39C27A]'
          : 'border-[#D9E3DD] dark:border-[#24352B]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-sm font-bold text-[#13221A] dark:text-[#EAF2ED]">
            {encounter.type} · <span className="font-mono-tabular font-medium">{encounter.time}</span>
          </div>
        </div>
        <span className={`text-xs font-bold whitespace-nowrap shrink-0 ${statusTone}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
        {encounter.complaint && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">Complaint:</span>{' '}
            {encounter.complaint}
          </div>
        )}
        {encounter.extra &&
          Object.entries(encounter.extra).map(([k, v]) => (
            <div key={k}>
              <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">{k}:</span> {v}
            </div>
          ))}
        {encounter.labs.length > 0 && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">
              Investigations:
            </span>{' '}
            {encounter.labs.join(', ')}
          </div>
        )}
        {encounter.labs.length > 0 && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">Results:</span>{' '}
            {encounter.results.length ? encounter.results.join('; ') : 'Pending'}
          </div>
        )}
        {encounter.diagnosis && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">Diagnosis:</span>{' '}
            {encounter.diagnosis}
            {encounter.diagnosisMethod ? ` (${encounter.diagnosisMethod})` : ''}
          </div>
        )}
        {encounter.rx.length > 0 && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">
              {encounter.type === 'Labour/Delivery' ? 'Maternal Medication:' : 'Medication:'}
            </span>{' '}
            {encounter.rx.join('; ')} · {encounter.rxStatus || 'awaiting pharmacy'}
          </div>
        )}
        {encounter.newbornRx && encounter.newbornRx.length > 0 && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">
              Newborn Medication:
            </span>{' '}
            {encounter.newbornRx.join('; ')} · {encounter.rxStatus || 'awaiting pharmacy'}
          </div>
        )}
        {encounter.outcome && (
          <div>
            <span className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">Outcome:</span>{' '}
            {encounter.outcome}
          </div>
        )}
        {encounter.bypassReason && (
          <div className="font-semibold text-[#C62828] dark:text-rose-400">
            Lab result bypassed — Reason: {encounter.bypassReason}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EBF1ED] dark:border-[#24352B] pt-2.5 text-xs text-[#6B7C72] dark:text-[#84998D]">
        <span>Recorded by {encounter.recordedBy}</span>
        {encounter.status === 'open' && onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="min-h-[36px] rounded-lg border border-[#0B5D34] dark:border-[#39C27A] px-3 py-1 text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326]"
          >
            Continue encounter
          </button>
        )}
      </div>
    </div>
  );
};

interface PatientProfileViewProps {
  state: CareSyncState;
  patient: Patient;
  activeTab: ProfileTab;
  canEditNin: boolean;
  onTabChange: (tab: ProfileTab) => void;
  onNavigate: (route: ScreenRoute) => void;
  onContinueEncounter: (encounterUid: string) => void;
  onUpdatePatientNin: (patientId: string, nin: string) => boolean;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  state,
  patient,
  activeTab,
  canEditNin,
  onTabChange,
  onNavigate,
  onContinueEncounter,
  onUpdatePatientNin,
}) => {
  const [showFullNin, setShowFullNin] = useState(false);
  const [editingNin, setEditingNin] = useState(false);
  const [ninInput, setNinInput] = useState('');

  useEffect(() => {
    setShowFullNin(false);
    setEditingNin(false);
    setNinInput(patient.nin || '');
  }, [patient.id, patient.nin]);

  const patientEncounters = state.encounters
    .filter((e) => e.patientId === patient.id)
    .slice()
    .reverse();
  const latest = patientEncounters[0];
  const pendingLabs = state.labQueue.filter((t) => t.patientId === patient.id).length;
  const activeReferrals = state.referrals.filter((r) => r.patientId === patient.id);
  const emergencyReason = state.emergencyOverrides[patient.id];
  const cleanNinInput = normalizeNin(ninInput);

  const handleOpenNinEditor = () => {
    setNinInput(patient.nin || '');
    setEditingNin(true);
  };

  const handleSaveNin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNin(cleanNinInput)) {
      onUpdatePatientNin(patient.id, cleanNinInput);
      return;
    }
    const ok = onUpdatePatientNin(patient.id, cleanNinInput);
    if (ok) {
      setEditingNin(false);
      setShowFullNin(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E6F3EC] dark:bg-[#1B3326] font-display text-lg font-bold text-[#0B5D34] dark:text-[#39C27A]">
              {getInitials(patient.name)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-[#13221A] dark:text-[#EAF2ED]">
                {patient.name}
              </h2>
              <div className="mt-0.5 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
                {patient.sex} · {patient.age} · Blood group {patient.bloodGroup} · MaKSET ID:{' '}
                <span className="font-mono-tabular font-bold text-[#0B5D34] dark:text-[#39C27A]">
                  {getDisplayPatientId(patient)}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                <span>
                  NIN:{' '}
                  <span className="font-mono-tabular font-semibold text-[#13221A] dark:text-[#EAF2ED]">
                    {patient.nin
                      ? showFullNin && canEditNin
                        ? patient.nin
                        : maskNin(patient.nin)
                      : 'Not provided'}
                  </span>
                </span>
                {patient.nin && canEditNin && (
                  <button
                    type="button"
                    onClick={() => setShowFullNin((prev) => !prev)}
                    aria-label={showFullNin ? 'Hide NIN' : 'Show NIN'}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-[#D9E3DD] dark:border-[#26382E] px-2 py-0.5 text-[11px] font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326]"
                  >
                    {showFullNin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showFullNin ? 'Hide' : 'Show'}
                  </button>
                )}
                {canEditNin && !editingNin && (
                  <button
                    type="button"
                    onClick={handleOpenNinEditor}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-[#D9E3DD] dark:border-[#26382E] px-2.5 py-0.5 text-[11px] font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326]"
                  >
                    <Pencil className="h-3 w-3" />
                    {patient.nin ? 'Update NIN' : 'Add NIN'}
                  </button>
                )}
                {state.ninGateEnabled && (
                  <span className="font-semibold text-[#0B5D34] dark:text-[#39C27A]">
                    ·{' '}
                    {patient.idVerified === 'Verified'
                      ? 'Identity verified (NIMC)'
                      : 'Identity not verified'}
                  </span>
                )}
              </div>
              {patient.ninUpdatedAt && (
                <div className="mt-0.5 text-[11px] text-[#6B7C72] dark:text-[#84998D]">
                  NIN updated {patient.ninUpdatedAt}
                  {patient.ninUpdatedBy ? ` by ${patient.ninUpdatedBy}` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('sel')}
              className="min-h-[44px] rounded-xl bg-[#0B5D34] px-4 py-2 text-sm font-bold text-white hover:bg-[#094D2B] whitespace-nowrap shrink-0"
            >
              Start New Encounter
            </button>
            <button
              type="button"
              onClick={() => onNavigate('hist')}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-3.5 py-2 text-sm font-semibold hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23] whitespace-nowrap shrink-0"
            >
              <History className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
              Patient History
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shr')}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-3.5 py-2 text-sm font-semibold hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23] whitespace-nowrap shrink-0"
            >
              <Share2 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
              Share History
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ref')}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-3.5 py-2 text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326] whitespace-nowrap shrink-0"
            >
              <ArrowUpRight className="h-4 w-4" />
              Refer Patient
            </button>
          </div>
        </div>

        {editingNin && canEditNin && (
          <form
            onSubmit={handleSaveNin}
            className="mt-4 rounded-xl border border-[#C6DED0] dark:border-[#254434] bg-[#F7FAF8] dark:bg-[#192820] p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="profile-nin-input"
                className="font-display text-xs font-bold text-[#0B5D34] dark:text-[#39C27A]"
              >
                {patient.nin ? 'Update Patient NIN (11 digits)' : 'Add Patient NIN (11 digits)'}
              </label>
              <span
                className={`text-xs font-mono-tabular font-semibold ${
                  cleanNinInput.length === 11
                    ? 'text-[#0B5D34] dark:text-[#39C27A]'
                    : 'text-[#8A5A00] dark:text-amber-300'
                }`}
              >
                {cleanNinInput.length}/11 digits
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="profile-nin-input"
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={ninInput}
                onChange={(e) => setNinInput(normalizeNin(e.target.value))}
                placeholder="Enter 11-digit NIN"
                className="flex-1 min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3.5 text-sm font-mono-tabular outline-none focus:border-[#0B5D34]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="min-h-[42px] rounded-xl bg-[#0B5D34] px-4 text-xs font-bold text-white hover:bg-[#094D2B] whitespace-nowrap"
                >
                  Save NIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNin(false);
                    setNinInput(patient.nin || '');
                  }}
                  className="min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-3.5 text-xs font-semibold hover:bg-white dark:hover:bg-[#15221B]"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#5D6E64] dark:text-[#98AEA1]">
              Stored with masked privacy protection on the patient profile. External NIMC verification remains inactive pending formal authorization.
            </p>
          </form>
        )}

        {patient.allergies && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDE4E4] dark:bg-[#381B1B] px-4 py-2.5 text-sm font-bold text-[#C62828] dark:text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Allergy alert: {patient.allergies}</span>
          </div>
        )}

        {emergencyReason && (
          <div className="mt-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-[#FFF3D6] dark:bg-[#2F250D] px-4 py-2.5 text-xs font-semibold text-[#7A5100] dark:text-amber-200">
            Opened by emergency override (Reason: {emergencyReason}). Verify patient identity as soon as possible.
          </div>
        )}
      </div>

      <div className="flex border-b border-[#D9E3DD] dark:border-[#24352B]">
        {(['Summary', 'History', 'Services'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`min-h-[44px] flex-1 sm:flex-none sm:px-6 text-sm font-semibold border-b-2 transition ${
              activeTab === tab
                ? 'border-[#0B5D34] text-[#0B5D34] dark:border-[#39C27A] dark:text-[#39C27A]'
                : 'border-transparent text-[#5D6E64] dark:text-[#98AEA1] hover:text-[#13221A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Summary' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate('hist')}
            className="flex items-start gap-3.5 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-left hover:border-[#0B5D34] transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Recent encounter</div>
              <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                {latest ? `${latest.time} · ${latest.type}` : 'No encounters recorded yet'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('hist')}
            className="flex items-start gap-3.5 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-left hover:border-[#0B5D34] transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Medications</div>
              <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                {latest && latest.rx.length ? latest.rx.join(', ') : 'None recorded'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('hist')}
            className="flex items-start gap-3.5 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-left hover:border-[#0B5D34] transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Laboratory</div>
              <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                {pendingLabs ? `${pendingLabs} investigation(s) pending` : 'No pending results'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('hist')}
            className="flex items-start gap-3.5 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-left hover:border-[#0B5D34] transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Maternal &amp; Child Care</div>
              <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                {patientEncounters.find((e) => e.type === 'ANC')?.complaint ||
                  'Tap to inspect full longitudinal history'}
              </div>
            </div>
          </button>
        </div>
      )}

      {activeTab === 'History' && (
        <div className="space-y-3">
          {patientEncounters.length === 0 ? (
            <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6 text-center text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              No previous encounters yet.
            </div>
          ) : (
            patientEncounters.map((enc) => (
              <EncounterCard
                key={enc.uid}
                encounter={enc}
                pendingLabCount={state.labQueue.filter((l) => l.encounterUid === enc.uid).length}
                onContinue={
                  enc.status === 'open' ? () => onContinueEncounter(enc.uid) : undefined
                }
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'Services' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
            <h3 className="font-display text-sm font-bold">Immunization</h3>
            <p className="mt-1 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Schedule loads from approved NPHCDA master data and preserves prior received doses.
            </p>
          </div>
          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
            <h3 className="font-display text-sm font-bold">Referrals</h3>
            <p className="mt-1 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              {activeReferrals.length
                ? `${activeReferrals.length} referral(s): ${activeReferrals[0].to} (${activeReferrals[0].status})`
                : 'None active'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface PatientHistoryViewProps {
  state: CareSyncState;
  patient: Patient;
  onStartEncounter: () => void;
  onShareHistory: () => void;
  onContinueEncounter: (uid: string) => void;
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({
  state,
  patient,
  onStartEncounter,
  onShareHistory,
  onContinueEncounter,
}) => {
  const encounters = state.encounters
    .filter((e) => e.patientId === patient.id)
    .slice()
    .reverse();
  const latest = encounters[0];

  return (
    <div className="space-y-5 max-w-4xl">
      {patient.allergies && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDE4E4] dark:bg-[#381B1B] px-4 py-3 text-sm font-bold text-[#C62828] dark:text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{patient.allergies}</span>
        </div>
      )}

      <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-5">
        <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
          Most Recent Visit Summary
        </div>
        {latest ? (
          <div className="mt-2 space-y-1 text-sm">
            <div className="font-bold">
              {latest.type} · {latest.time}
            </div>
            {latest.diagnosis && (
              <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
                Diagnosis: {latest.diagnosis}
              </div>
            )}
            {latest.rx.length > 0 && (
              <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
                Treatment: {latest.rx.join(', ')}
              </div>
            )}
            <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
              Outcome: {latest.outcome || 'Not recorded'}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm font-medium">
            First visit. No previous history on record.
          </div>
        )}
      </div>

      <div className="space-y-3">
        {encounters.map((enc) => (
          <EncounterCard
            key={enc.uid}
            encounter={enc}
            pendingLabCount={state.labQueue.filter((l) => l.encounterUid === enc.uid).length}
            onContinue={enc.status === 'open' ? () => onContinueEncounter(enc.uid) : undefined}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStartEncounter}
          className="min-h-[46px] rounded-xl bg-[#0B5D34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          Start New Encounter
        </button>
        <button
          type="button"
          onClick={onShareHistory}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-5 py-2.5 text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A]"
        >
          <Share2 className="h-4 w-4" />
          Share this history
        </button>
      </div>
    </div>
  );
};

interface ShareHistoryViewProps {
  state: CareSyncState;
  patient: Patient;
  onShare: (channel: string, target: string, reason: string) => void;
}

export const ShareHistoryView: React.FC<ShareHistoryViewProps> = ({
  state,
  patient,
  onShare,
}) => {
  const facilityOptions = state.facilities
    .filter((f) => f.name !== state.activeFacility)
    .map((f) => f.name);
  const [target, setTarget] = useState(facilityOptions[0] || 'Bauchi General Hospital');
  const [contact, setContact] = useState('');
  const [reason, setReason] = useState('Referral');
  const [included, setIncluded] = useState<string[]>([
    'Allergies',
    'Diagnoses',
    'Medications',
    'Lab results',
    'Immunization',
    'ANC summary',
  ]);
  const [consent, setConsent] = useState('Given verbally');
  const [printOpen, setPrintOpen] = useState(false);

  const patientEncounters = state.encounters.filter((e) => e.patientId === patient.id);

  const toggleSection = (sec: string) => {
    setIncluded((prev) =>
      prev.includes(sec) ? prev.filter((item) => item !== sec) : [...prev, sec]
    );
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4">
        <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
          Summary to be shared
        </div>
        {patient.allergies && (
          <div className="mt-1.5 text-xs font-semibold text-[#C62828] dark:text-rose-300">
            Allergy: {patient.allergies}
          </div>
        )}
        <div className="mt-1.5 space-y-1 text-xs text-[#394A40] dark:text-[#C8DAD0]">
          {patientEncounters.length === 0 ? (
            <div>No encounters to share yet.</div>
          ) : (
            patientEncounters.map((e) => (
              <div key={e.uid}>
                {e.time} · {e.type}: {e.diagnosis || 'Recorded'} ·{' '}
                {e.rx.join(', ') || 'no medication'}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Send to
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm"
          >
            {facilityOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Private doctor or clinic">Private doctor or clinic</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Recipient phone or email (optional, for WhatsApp or SMS)
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. 0803 000 0000 or doctor@hospital.ng"
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm"
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Reason
          </div>
          <div className="flex flex-wrap gap-2">
            {['Referral', 'Transfer of care', 'Second opinion'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold ${
                  reason === r
                    ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Include sections
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Allergies',
              'Diagnoses',
              'Medications',
              'Lab results',
              'Immunization',
              'ANC summary',
            ].map((sec) => {
              const on = included.includes(sec);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => toggleSection(sec)}
                  className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold ${
                    on
                      ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                      : 'border-[#D9E3DD] dark:border-[#26382E]'
                  }`}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Patient consent
          </div>
          <div className="flex flex-wrap gap-2">
            {['Given verbally', 'Given in writing'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConsent(c)}
                className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold ${
                  consent === c
                    ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => onShare('secure link', target, reason)}
            className="w-full min-h-[46px] rounded-xl bg-[#0B5D34] px-4 text-sm font-bold text-white hover:bg-[#094D2B]"
          >
            Share via secure link
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onShare('WhatsApp', target, reason)}
              className="min-h-[44px] rounded-xl border border-[#0B5D34] text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => onShare('SMS', target, reason)}
              className="min-h-[44px] rounded-xl border border-[#0B5D34] text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => {
                onShare('print', target, reason);
                setPrintOpen(true);
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#0B5D34] text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>
      </div>

      {state.shareLog.length > 0 && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Sharing Audit Log
          </h3>
          <div className="mt-2.5 space-y-2">
            {state.shareLog.map((item) => (
              <div
                key={item.uid}
                className="flex items-center justify-between border-b border-[#EBF1ED] dark:border-[#24352B] pb-2 text-xs last:border-b-0 last:pb-0"
              >
                <span className="font-medium">
                  {item.patientName} shared via {item.channel} to {item.target} ({item.reason})
                </span>
                <span className="text-[#5D6E64] dark:text-[#98AEA1] font-mono-tabular">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {printOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D9E3DD] bg-white dark:bg-[#15221B] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Printable Clinical Summary</h3>
              <button
                type="button"
                onClick={() => setPrintOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <pre className="max-h-72 overflow-y-auto rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4 text-xs leading-relaxed whitespace-pre-wrap">
              {[
                `MAKSET — CLINICAL SUMMARY`,
                `Facility: ${state.activeFacility}`,
                `Patient: ${patient.name} (MaKSET ID: ${getDisplayPatientId(patient)})`,
                `Demographics: ${patient.sex}, ${patient.age}, Blood Group ${patient.bloodGroup}`,
                `Recipient: ${target} (${reason}) · Consent: ${consent}`,
                `Included Sections: ${included.join(', ')}`,
                patient.allergies ? `ALLERGY: ${patient.allergies}` : 'Allergies: None recorded',
                '',
                ...patientEncounters.map(
                  (e) =>
                    `${e.time} · ${e.type}\n  Dx: ${e.diagnosis || 'N/A'}\n  Labs: ${e.results.join('; ') || 'None'}\n  Rx: ${e.rx.join('; ') || 'None'}${e.newbornRx?.length ? `\n  Newborn Rx: ${e.newbornRx.join('; ')}` : ''}\n  Outcome: ${e.outcome || 'N/A'}`
                ),
              ].join('\n')}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="min-h-[42px] rounded-xl bg-[#0B5D34] px-4 text-xs font-bold text-white"
              >
                Print Summary
              </button>
              <button
                type="button"
                onClick={() => setPrintOpen(false)}
                className="min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-4 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EncounterSelectViewProps {
  state: CareSyncState;
  patient: Patient;
  onSelectType: (type: EncounterType) => void;
  onViewHistory: () => void;
}

export const EncounterSelectView: React.FC<EncounterSelectViewProps> = ({
  state,
  patient,
  onSelectType,
  onViewHistory,
}) => {
  const latest = state.encounters.filter((e) => e.patientId === patient.id).slice(-1)[0];

  const encounterTypes: {
    type: EncounterType;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { type: 'OPD', label: 'OPD Consultation', icon: Stethoscope },
    { type: 'Inpatient', label: 'Inpatient / Ward', icon: Activity },
    { type: 'ANC', label: 'ANC', icon: HeartHandshake },
    { type: 'Labour/Delivery', label: 'Labour / Delivery', icon: Baby },
    { type: 'PNC', label: 'PNC', icon: FileText },
    { type: 'Immunization', label: 'Immunization', icon: Syringe },
    { type: 'Family Planning', label: 'Family Planning', icon: Calendar },
    { type: 'Growth and Nutrition', label: 'Growth & Nutrition', icon: Scale },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
              Review before you start
            </div>
            {latest ? (
              <div className="mt-1.5 space-y-0.5 text-sm">
                <div className="font-bold">
                  {latest.type} · {latest.time}
                </div>
                {latest.diagnosis && (
                  <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
                    Diagnosis: {latest.diagnosis}
                  </div>
                )}
                {latest.rx.length > 0 && (
                  <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
                    Treatment: {latest.rx.join(', ')}
                  </div>
                )}
                <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
                  Outcome: {latest.outcome || 'Not recorded'}
                  {patient.allergies ? ` · Allergy: ${patient.allergies}` : ''}
                </div>
              </div>
            ) : (
              <div className="mt-1.5 text-sm font-medium">
                First visit. No previous history on record.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onViewHistory}
            className="min-h-[42px] rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 py-2 text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] hover:bg-white/60 whitespace-nowrap shrink-0"
          >
            View full history
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
          Choose the encounter type for <strong>{patient.name}</strong>. This links directly to the same patient record.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {encounterTypes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onSelectType(item.type)}
                className="flex min-h-[108px] flex-col items-center justify-center rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-center hover:border-[#0B5D34] dark:hover:border-[#39C27A] transition"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold text-[#13221A] dark:text-[#EAF2ED]">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
