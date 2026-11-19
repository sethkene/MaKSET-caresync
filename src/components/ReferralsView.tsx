import React, { useState } from 'react';
import { BellRing, CheckCircle2, Clock, MessageSquare, Send } from 'lucide-react';
import { buildSummaryLines } from '../data/initialData';
import { CareSyncState, Patient, Referral } from '../types/caresync';

interface ReferPatientViewProps {
  state: CareSyncState;
  patient: Patient;
  onCreateReferral: (payload: {
    to: string;
    reason: string;
    urgency: 'Emergency' | 'Urgent' | 'Routine';
    treatmentGiven: string;
  }) => void;
  onToast: (msg: string) => void;
}

export const ReferPatientView: React.FC<ReferPatientViewProps> = ({
  state,
  patient,
  onCreateReferral,
  onToast,
}) => {
  const facilityOptions = state.facilities.filter((f) => f.name !== state.activeFacility);
  const [to, setTo] = useState(
    facilityOptions.find((f) => f.type === 'Hospital')?.name ||
      facilityOptions[0]?.name ||
      'Bauchi General Hospital'
  );
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'Emergency' | 'Urgent' | 'Routine'>('Urgent');
  const [treatmentGiven, setTreatmentGiven] = useState('');

  const summaryLines = buildSummaryLines(patient, state.encounters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      onToast('Enter the reason for referral');
      return;
    }
    onCreateReferral({
      to,
      reason: reason.trim(),
      urgency,
      treatmentGiven: treatmentGiven.trim() || 'None recorded',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Receiving facility (registered on MaKSET)
          </label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm"
          >
            {facilityOptions.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.type}, {f.lga})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
            MaKSET-registered receiving facilities support automated referral notification acceptance when prompted.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Reason for referral
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Severe malaria with persistent vomiting"
            className="w-full rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] p-3 text-sm"
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Urgency
          </div>
          <div className="flex gap-2">
            {(['Emergency', 'Urgent', 'Routine'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                className={`min-h-[42px] flex-1 rounded-xl border text-xs font-semibold ${
                  urgency === u
                    ? u === 'Emergency'
                      ? 'border-[#C62828] bg-[#C62828] text-white'
                      : 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Treatment already given
          </label>
          <input
            type="text"
            value={treatmentGiven}
            onChange={(e) => setTreatmentGiven(e.target.value)}
            placeholder="e.g. Artesunate IM, first dose"
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3.5 text-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4 space-y-1">
        <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
          Clinical summary sent automatically with referral
        </div>
        {summaryLines.map((line, i) => (
          <div key={i} className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
            {line}
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="inline-flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-6 py-3 text-sm font-bold text-white hover:bg-[#094D2B]"
      >
        <Send className="h-4 w-4" />
        Send referral to MaKSET facility
      </button>
    </form>
  );
};

interface ReferralNoteViewProps {
  referral: Referral;
  isRegisteredFacility: boolean;
  onPromptAutoAccept: (referralId: string) => void;
  onViewAllReferrals: () => void;
  onToast: (msg: string) => void;
}

export const ReferralNoteView: React.FC<ReferralNoteViewProps> = ({
  referral,
  isRegisteredFacility,
  onPromptAutoAccept,
  onViewAllReferrals,
  onToast,
}) => {
  const isAcceptedOrDone = referral.status === 'Accepted' || referral.status === 'Completed';

  return (
    <div className="space-y-5 max-w-2xl">
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border p-4 bg-white dark:bg-[#15221B] ${
          referral.status === 'Queued'
            ? 'border-amber-300 dark:border-amber-800'
            : 'border-[#0B5D34] dark:border-[#39C27A]'
        }`}
      >
        <div className="flex items-center gap-3">
          {referral.status === 'Queued' ? (
            <Clock className="h-5 w-5 text-[#8A5A00] dark:text-amber-300 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#0B5D34] dark:text-[#39C27A] shrink-0" />
          )}
          <div>
            <div className="font-display text-sm font-bold">
              {referral.status === 'Queued'
                ? 'Queued. Sends automatically when online'
                : referral.status === 'Accepted'
                  ? `Automatically accepted by ${referral.to}`
                  : referral.status === 'Completed'
                    ? `Completed at ${referral.to}`
                    : `Delivered to ${referral.to}`}
            </div>
            <div className="text-xs font-mono-tabular text-[#5D6E64] dark:text-[#98AEA1]">
              {referral.id} · {referral.time}
              {referral.acceptedAt ? ` · Accepted ${referral.acceptedAt}` : ''}
            </div>
          </div>
        </div>
      </div>

      {isRegisteredFacility && !isAcceptedOrDone && (
        <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#394A40] dark:text-[#C8DAD0]">
            <strong>{referral.to}</strong> is registered on MaKSET. Prompt the facility to trigger automatic referral notification acceptance.
          </div>
          <button
            type="button"
            onClick={() => onPromptAutoAccept(referral.id)}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-4 text-xs font-bold text-white hover:bg-[#094D2B] whitespace-nowrap shrink-0"
          >
            <BellRing className="h-4 w-4" />
            {referral.autoAcceptPrompted
              ? 'Auto-accept queued (offline)'
              : 'Prompt & Auto-Accept Referral'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
        <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans text-[#13221A] dark:text-[#EAF2ED]">
          {[
            'MAKSET REFERRAL NOTE',
            `From: ${referral.from}`,
            `To: ${referral.to}`,
            `Patient: ${referral.patientName} (${referral.patientId})`,
            `Reason: ${referral.reason}`,
            `Treatment given: ${referral.treatmentGiven}`,
            `Urgency: ${referral.urgency}`,
            `Status: ${referral.status}`,
            '',
            ...referral.summaryLines,
          ].join('\n')}
        </pre>
      </div>

      <div className="space-y-2.5">
        <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          Backup share if the receiving facility has low connectivity:
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onToast('WhatsApp share prepared with formatted referral note')}
            className="min-h-[44px] rounded-xl bg-[#1FA855] px-4 text-xs font-bold text-white hover:bg-[#198F47]"
          >
            Share via WhatsApp
          </button>
          <button
            type="button"
            onClick={() => onToast('SMS fallback prepared with concise referral note')}
            className="min-h-[44px] rounded-xl border border-[#0B5D34] text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
          >
            Share via SMS
          </button>
          <button
            type="button"
            onClick={onViewAllReferrals}
            className="min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] text-xs font-semibold"
          >
            View all referrals
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReferralsListViewProps {
  state: CareSyncState;
  onPromptAutoAccept: (referralId: string) => void;
  onViewNote: (referralId: string) => void;
}

export const ReferralsListView: React.FC<ReferralsListViewProps> = ({
  state,
  onPromptAutoAccept,
  onViewNote,
}) => {
  const outgoing = state.referrals.filter((r) => r.from === state.activeFacility);
  const registeredNames = new Set(state.facilities.map((f) => f.name));

  return (
    <div className="space-y-3 max-w-4xl">
      {outgoing.length === 0 ? (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6 text-center text-sm text-[#5D6E64] dark:text-[#98AEA1]">
          No referrals sent from {state.activeFacility} yet.
        </div>
      ) : (
        outgoing.map((r) => {
          const isRegistered = registeredNames.has(r.to);
          const canPromptAccept =
            isRegistered && (r.status === 'Delivered' || r.status === 'Queued');

          return (
            <div
              key={r.id}
              className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-bold">{r.patientName}</div>
                  <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                    To {r.to} · {r.urgency} · <span className="font-mono-tabular">{r.time}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold whitespace-nowrap shrink-0 ${
                    r.status === 'Completed' || r.status === 'Accepted'
                      ? 'text-[#0B5D34] dark:text-[#39C27A]'
                      : 'text-[#8A5A00] dark:text-amber-300'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-sm">{r.reason}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {r.feedback ? (
                  <div className="text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]">
                    Feedback: {r.feedback}
                  </div>
                ) : r.status === 'Accepted' ? (
                  <div className="text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]">
                    Notification accepted by {r.to}
                    {r.acceptedAt ? ` (${r.acceptedAt})` : ''}
                  </div>
                ) : (
                  <div className="text-xs text-[#6B7C72] dark:text-[#84998D]">
                    {r.autoAcceptPrompted
                      ? 'Auto-accept queued until online'
                      : `Awaiting acceptance from ${r.to}`}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {canPromptAccept && (
                    <button
                      type="button"
                      onClick={() => onPromptAutoAccept(r.id)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#0B5D34] px-3 text-xs font-bold text-white hover:bg-[#094D2B]"
                    >
                      <BellRing className="h-3.5 w-3.5" />
                      Prompt Auto-Accept
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewNote(r.id)}
                    className="min-h-[38px] rounded-lg border border-[#0B5D34] dark:border-[#39C27A] px-3 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]"
                  >
                    Open note
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

interface ReferralOutcomeViewProps {
  referral: Referral;
  onSubmitFeedback: (outcome: string, note: string) => void;
}

export const ReferralOutcomeView: React.FC<ReferralOutcomeViewProps> = ({
  referral,
  onSubmitFeedback,
}) => {
  const [outcome, setOutcome] = useState('Treated and discharged');
  const [note, setNote] = useState('');

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
        <div>
          <div className="font-display text-base font-bold">{referral.patientName}</div>
          <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
            Referred from {referral.from} · {referral.reason}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Outcome at receiving facility
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Treated and discharged',
              'Admitted',
              'Referred further',
              'Patient did not arrive',
            ].map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOutcome(o)}
                className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold ${
                  outcome === o
                    ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Feedback note
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional clinical feedback for referring PHC"
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3.5 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => onSubmitFeedback(outcome, note.trim())}
          className="inline-flex w-full sm:w-auto min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-6 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          <MessageSquare className="h-4 w-4" />
          Send feedback to {referral.from}
        </button>
      </div>
    </div>
  );
};
