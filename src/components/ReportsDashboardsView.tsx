import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Download,
  FileBarChart2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { DASHBOARD_DATA, SURVEILLANCE_SIGNALS } from '../data/initialData';
import {
  CareSyncState,
  DashboardLevel,
  Patient,
  ScreenRoute,
  SurveillanceSignal,
} from '../types/caresync';

interface ReportsViewProps {
  state: CareSyncState;
  onNavigate: (route: ScreenRoute) => void;
  onToast: (msg: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  state,
  onNavigate,
  onToast,
}) => {
  const opdTotal = 212 + state.pendingCount;
  const ancTotal = 38 + Math.max(0, state.encounters.filter((e) => e.type === 'ANC').length - 1);
  const immTotal =
    64 + Math.max(0, state.encounters.filter((e) => e.type === 'Immunization').length - 1);

  const exportSummary = () => {
    const csv = [
      'Indicator,Facility,Value',
      `OPD Attendances,${state.activeFacility},${opdTotal}`,
      `ANC Visits,${state.activeFacility},${ancTotal}`,
      `Immunizations,${state.activeFacility},${immTotal}`,
      `Referrals,${state.activeFacility},${state.referrals.length}`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'makset-phc-monthly-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
    onToast('Monthly NHMIS/LGA summary CSV downloaded');
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Monthly Automated Summary · {state.activeFacility}
            </h2>
            <p className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Derived automatically from recorded consultations, immunizations, and referrals
            </p>
          </div>
          <FileBarChart2 className="h-5 w-5 text-[#0B5D34] dark:text-[#39C27A]" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
            <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
              {opdTotal}
            </div>
            <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
              OPD attendances
            </div>
          </div>
          <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
            <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
              {ancTotal}
            </div>
            <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
              ANC visits
            </div>
          </div>
          <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
            <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
              {immTotal}
            </div>
            <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
              Immunizations
            </div>
          </div>
          <div className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-4">
            <div className="font-display text-3xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
              {state.referrals.length}
            </div>
            <div className="mt-1 text-xs font-medium text-[#5D6E64] dark:text-[#98AEA1]">
              Referrals
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4 text-xs font-medium text-[#0B5D34] dark:text-[#39C27A]">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>No manual tally re-entry required. Figures update automatically from clinical encounters.</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={exportSummary}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-4 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          <Download className="h-4 w-4" />
          Export monthly summary
        </button>
        <button
          type="button"
          onClick={() => onNavigate('dash')}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A]"
        >
          <BarChart3 className="h-4 w-4" />
          Open dashboards
        </button>
        <button
          type="button"
          onClick={() => onNavigate('surv')}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A]"
        >
          <Activity className="h-4 w-4" />
          Surveillance &amp; signals
        </button>
      </div>
    </div>
  );
};

interface DashboardsViewProps {
  offline: boolean;
  facilityName: string;
  facilityLga: string;
  facilityState: string;
  onNavigateSurveillance: () => void;
}

export const DashboardsView: React.FC<DashboardsViewProps> = ({
  offline,
  facilityName,
  facilityLga,
  facilityState,
  onNavigateSurveillance,
}) => {
  const [level, setLevel] = useState<DashboardLevel>('PHC');
  const raw = DASHBOARD_DATA[level];
  const data =
    level === 'PHC'
      ? {
          ...raw,
          title: facilityName,
          subtitle: `Your facility · ${facilityLga} LGA, ${facilityState}`,
        }
      : raw;
  const maxVal = Math.max(...data.bars.map(([, val]) => val), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DASHBOARD_DATA) as DashboardLevel[]).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setLevel(lvl)}
            className={`min-h-[40px] rounded-xl border px-4 text-xs font-bold transition ${
              level === lvl
                ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                : 'border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] hover:border-[#0B5D34]'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {offline && level !== 'PHC' && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-[#FFF3D6] dark:bg-[#2F250D] px-4 py-2.5 text-xs font-semibold text-[#7A5100] dark:text-amber-200">
          Offline. Showing aggregate {level} figures cached from the last sync.
        </div>
      )}

      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
        <h2 className="font-display text-lg font-bold">{data.title}</h2>
        <p className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          {data.subtitle} · Scoped to authorised geography
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.kpis.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-3.5"
            >
              <div className="font-display text-2xl font-extrabold text-[#0B5D34] dark:text-[#39C27A] tabular-nums">
                {value}
              </div>
              <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            {data.barTitle}
          </h3>
          <div className="mt-6 flex h-36 items-end gap-3">
            {data.bars.map(([label, value]) => {
              const pct = Math.max(8, Math.round((value / maxVal) * 100));
              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-bold tabular-nums text-[#5D6E64] dark:text-[#98AEA1]">
                    {value.toLocaleString()}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-[#0B5D34] dark:bg-[#2EB872] transition-all"
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
          <h3 className="mb-3 font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Breakdown Table
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D9E3DD] dark:border-[#24352B] text-[#5D6E64] dark:text-[#98AEA1]">
                  {data.tableHeaders.map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 font-semibold ${i > 0 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tableRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-[#EEF3F0] dark:border-[#223229] last:border-b-0"
                  >
                    {row.map((cell, cIdx) => {
                      const cls =
                        cell === 'Alert'
                          ? 'font-bold text-[#C62828] dark:text-rose-400'
                          : cell === 'Watch' || cell === 'Late'
                            ? 'font-bold text-[#8A5A00] dark:text-amber-300'
                            : cIdx > 0
                              ? 'tabular-nums font-medium'
                              : 'font-semibold';
                      return (
                        <td
                          key={cIdx}
                          className={`py-2.5 ${cIdx > 0 ? 'text-right' : ''} ${cls}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(level === 'NCDC' || level === 'State' || level === 'LGA') && (
        <button
          type="button"
          onClick={onNavigateSurveillance}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#0B5D34] px-5 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          <Activity className="h-4 w-4" />
          Review IDSR surveillance signals
        </button>
      )}
    </div>
  );
};

interface SurveillanceViewProps {
  state: CareSyncState;
  onNotifyCase: () => void;
}

export const SurveillanceView: React.FC<SurveillanceViewProps> = ({
  state,
  onNotifyCase,
}) => {
  const [activeSignal, setActiveSignal] = useState<SurveillanceSignal | null>(null);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4 text-xs font-medium text-[#0B5D34] dark:text-[#39C27A]">
        IDSR signals are statistical indicators for review by authorised public-health officers. The application never declares an outbreak automatically.
      </div>

      <div className="space-y-3">
        {SURVEILLANCE_SIGNALS.map((sig) => (
          <button
            key={sig.disease}
            type="button"
            onClick={() => setActiveSignal(sig)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-left hover:border-[#0B5D34] transition"
          >
            <div>
              <div className="font-display text-sm font-bold">{sig.disease}</div>
              <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                {sig.location} · {sig.detail}
              </div>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wide whitespace-nowrap shrink-0 ${
                sig.status === 'Alert'
                  ? 'text-[#C62828] dark:text-rose-400'
                  : sig.status === 'Watch'
                    ? 'text-[#8A5A00] dark:text-amber-300'
                    : 'text-[#0B5D34] dark:text-[#39C27A]'
              }`}
            >
              {sig.status} ›
            </span>
          </button>
        ))}
      </div>

      {state.caseNotifications.length > 0 && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-2.5">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Submitted Case Notifications ({state.caseNotifications.length})
          </h3>
          {state.caseNotifications.map((cn) => (
            <div
              key={cn.uid}
              className="flex items-center justify-between border-b border-[#EEF3F0] dark:border-[#223229] pb-2 text-xs last:border-b-0 last:pb-0"
            >
              <div>
                <strong>{cn.disease}</strong> · {cn.patientName} ({cn.symptoms.join(', ') || 'Reported'})
              </div>
              <span className="font-semibold text-[#8A5A00] dark:text-amber-300">
                {cn.synced ? 'Synced' : 'Queued'}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onNotifyCase}
        className="inline-flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-6 text-sm font-bold text-white hover:bg-[#094D2B]"
      >
        <ShieldAlert className="h-4 w-4" />
        Notify a suspected case
      </button>

      {activeSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D9E3DD] bg-white dark:bg-[#15221B] p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{activeSignal.disease}</h3>
              <button
                type="button"
                onClick={() => setActiveSignal(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              {activeSignal.location} · {activeSignal.detail} ({activeSignal.status})
            </div>
            <div className="space-y-2 rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#F7FAF8] dark:bg-[#192820] p-3.5 text-xs">
              <div>
                <strong>Threshold:</strong> {activeSignal.threshold}
              </div>
              <div>
                <strong>Affected PHCs:</strong> {activeSignal.affectedFacilities.join(', ')}
              </div>
              <div>
                <strong>Action:</strong> {activeSignal.recommendedAction}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CaseNotificationViewProps {
  patient: Patient;
  onSubmitCase: (payload: {
    disease: string;
    onsetDate: string;
    symptoms: string[];
    sampleTaken: string;
    notes: string;
  }) => void;
}

export const CaseNotificationView: React.FC<CaseNotificationViewProps> = ({
  patient,
  onSubmitCase,
}) => {
  const [disease, setDisease] = useState('Cholera');
  const [onsetDate, setOnsetDate] = useState('2026-10-27');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [sampleTaken, setSampleTaken] = useState('No');
  const [notes, setNotes] = useState('');

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
        <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          Patient context: <strong className="text-[#13221A] dark:text-[#EAF2ED]">{patient.name}</strong> ({patient.id})
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Suspected notifiable disease
          </label>
          <select
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm"
          >
            {[
              'Cholera',
              'Measles',
              'Lassa fever',
              'Meningitis',
              'Acute flaccid paralysis',
            ].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Date of onset
          </label>
          <input
            type="date"
            value={onsetDate}
            onChange={(e) => setOnsetDate(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm font-mono-tabular"
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Signs &amp; symptoms
          </div>
          <div className="flex flex-wrap gap-2">
            {['Fever', 'Watery diarrhoea', 'Vomiting', 'Rash', 'Stiff neck', 'Bleeding'].map(
              (sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold ${
                    symptoms.includes(sym)
                      ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                      : 'border-[#D9E3DD] dark:border-[#26382E]'
                  }`}
                >
                  {sym}
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Laboratory sample taken
          </div>
          <div className="flex gap-2">
            {['No', 'Yes'].map((ans) => (
              <button
                key={ans}
                type="button"
                onClick={() => setSampleTaken(ans)}
                className={`min-h-[40px] flex-1 rounded-xl border text-xs font-semibold ${
                  sampleTaken === ans
                    ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {ans}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] p-3 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            onSubmitCase({ disease, onsetDate, symptoms, sampleTaken, notes: notes.trim() })
          }
          className="w-full min-h-[46px] rounded-xl bg-[#0B5D34] px-5 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          Submit case notification
        </button>
      </div>
    </div>
  );
};
