import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Clock,
  FlaskConical,
  Pill,
} from 'lucide-react';
import { CareSyncState, MedicationOrder } from '../types/caresync';

interface TasksViewProps {
  state: CareSyncState;
  onOpenLabTask: (uid: string) => void;
  onOpenPharmTask: (uid: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  state,
  onOpenLabTask,
  onOpenPharmTask,
}) => {
  const showLab = state.effectiveRole !== 'pharm';
  const showPharm = state.effectiveRole !== 'lab';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {showLab && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#0B5D34] dark:text-[#39C27A]">
              <FlaskConical className="h-4 w-4" />
              Laboratory Queue ({state.labQueue.length})
            </h2>
          </div>

          {state.labQueue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#CBD7CF] dark:border-[#2C4235] p-6 text-center text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              Nothing waiting in the laboratory queue.
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.labQueue.map((item) => (
                <button
                  key={item.uid}
                  type="button"
                  onClick={() => onOpenLabTask(item.uid)}
                  className="flex w-full min-h-[68px] items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/15 p-3.5 text-left hover:border-[#0B5D34] transition"
                >
                  <div className="min-w-0">
                    <div className="font-display text-sm font-bold text-[#13221A] dark:text-[#EAF2ED]">
                      {item.patientName}
                    </div>
                    <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                      {item.tests} · <span className="font-mono-tabular">{item.createdAt}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#C62828] dark:text-rose-400 whitespace-nowrap shrink-0">
                    New ›
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showPharm && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#0B5D34] dark:text-[#39C27A]">
              <Pill className="h-4 w-4" />
              Pharmacy Queue ({state.pharmQueue.length})
            </h2>
          </div>

          {state.pharmQueue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#CBD7CF] dark:border-[#2C4235] p-6 text-center text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              Nothing waiting in the pharmacy queue.
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.pharmQueue.map((item) => {
                const hasManual = item.medicationOrders?.some((m) => m.source === 'manual');
                return (
                  <button
                    key={item.uid}
                    type="button"
                    onClick={() => onOpenPharmTask(item.uid)}
                    className="flex w-full min-h-[68px] items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/15 p-3.5 text-left hover:border-[#0B5D34] transition"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-[#13221A] dark:text-[#EAF2ED]">
                          {item.patientName}
                        </span>
                        {hasManual && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#7A5100] dark:bg-amber-950/60 dark:text-amber-300">
                            Manual Rx
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                        {item.meds} · <span className="font-mono-tabular">{item.createdAt}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#C62828] dark:text-rose-400 whitespace-nowrap shrink-0">
                      New ›
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface TaskDetailViewProps {
  kind: 'lab' | 'ph';
  patientName: string;
  items: string[];
  medicationOrders?: MedicationOrder[];
  onSubmit: (entries: string[]) => void;
  onToast: (msg: string) => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  kind,
  patientName,
  items,
  medicationOrders,
  onSubmit,
  onToast,
}) => {
  const isLab = kind === 'lab';
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  const options = isLab
    ? ['Negative', 'Positive']
    : ['Fully dispensed', 'Partially dispensed', 'Not available'];

  const handleComplete = () => {
    const out: string[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const st = statuses[i] || '';
      const val = (comments[i] || '').trim();
      if (!st && !(isLab && val)) {
        onToast(isLab ? 'Enter a result for every test' : 'Set a status for every medicine');
        return;
      }
      if (isLab) {
        out.push(`${items[i]}: ${st || 'Recorded'}${val ? ` (${val})` : ''}`);
      } else {
        out.push(`${items[i]}: ${st}`);
      }
    }
    onSubmit(out);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="text-sm text-[#5D6E64] dark:text-[#98AEA1]">
        Patient: <strong className="text-[#13221A] dark:text-[#EAF2ED]">{patientName}</strong>
      </div>

      {items.map((item, idx) => {
        const order = !isLab ? medicationOrders?.[idx] : undefined;
        return (
          <div
            key={`${item}-${idx}`}
            className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-display text-base font-bold">
                {order ? order.drugName : item}
              </div>
              {order && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {order.recipient === 'newborn' && (
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                      Newborn
                    </span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      order.source === 'manual'
                        ? 'bg-amber-100 text-[#7A5100] dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-[#E6F3EC] text-[#0B5D34] dark:bg-[#1B3326] dark:text-[#39C27A]'
                    }`}
                  >
                    {order.source === 'manual' ? 'Manual entry' : 'Catalogue'}
                  </span>
                </div>
              )}
            </div>
            {order && order.source === 'manual' && (
              <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#FAFDFB] dark:bg-[#192820] p-3 text-xs text-[#5D6E64] dark:text-[#98AEA1] sm:grid-cols-2">
                {order.strength && (
                  <div>
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Strength:</strong>{' '}
                    {order.strength}
                  </div>
                )}
                {order.dose && (
                  <div>
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Dose:</strong>{' '}
                    {order.dose}
                  </div>
                )}
                {order.route && (
                  <div>
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Route:</strong>{' '}
                    {order.route}
                  </div>
                )}
                {order.frequency && (
                  <div>
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Frequency:</strong>{' '}
                    {order.frequency}
                  </div>
                )}
                {order.duration && (
                  <div>
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Duration:</strong>{' '}
                    {order.duration}
                  </div>
                )}
                {order.quantity && (
                  <div>
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Quantity:</strong>{' '}
                    {order.quantity}
                  </div>
                )}
                {order.instructions && (
                  <div className="sm:col-span-2">
                    <strong className="text-[#13221A] dark:text-[#EAF2ED]">Instructions:</strong>{' '}
                    {order.instructions}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              {isLab ? 'Result' : 'Dispensing Status'}
            </div>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStatuses((prev) => ({ ...prev, [idx]: opt }))}
                className={`min-h-[42px] rounded-xl border px-4 text-xs font-semibold transition ${
                  statuses[idx] === opt
                    ? opt === 'Positive'
                      ? 'border-[#C62828] bg-[#C62828] text-white'
                      : 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {isLab && (
            <input
              type="text"
              value={comments[idx] || ''}
              onChange={(e) => setComments((prev) => ({ ...prev, [idx]: e.target.value }))}
              placeholder="Value or comment (e.g. Hb 10.8 g/dL)"
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3.5 text-sm"
            />
          )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleComplete}
        className="w-full sm:w-auto min-h-[48px] rounded-xl bg-[#0B5D34] px-8 py-3 text-sm font-bold text-white hover:bg-[#094D2B]"
      >
        {isLab ? 'Send results to clinician' : 'Complete dispensing'}
      </button>
    </div>
  );
};

interface NotificationsViewProps {
  state: CareSyncState;
  onOpenReadyEncounter: (encounterUid: string) => void;
  onOpenNotification: (notificationUid: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  state,
  onOpenReadyEncounter,
  onOpenNotification,
}) => {
  const pendingLabUids = new Set(state.labQueue.map((l) => l.encounterUid).filter(Boolean));
  const readyEncounters = state.encounters.filter(
    (e) => e.status === 'open' && !pendingLabUids.has(e.uid)
  );
  const waitingEncounters = state.encounters.filter(
    (e) => e.status === 'open' && pendingLabUids.has(e.uid)
  );
  const otherNotifications = state.notifications.filter(
    (n) => !(n.kind === 'lab' && readyEncounters.some((e) => e.uid === n.encounterUid))
  );

  const patientName = (pid: string) =>
    state.patients.find((p) => p.id === pid)?.name || pid;

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="space-y-2.5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
          Results Ready ({readyEncounters.length})
        </h2>
        {readyEncounters.length === 0 ? (
          <div className="rounded-xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            No completed lab results awaiting review.
          </div>
        ) : (
          readyEncounters.map((enc) => (
            <button
              key={enc.uid}
              type="button"
              onClick={() => onOpenReadyEncounter(enc.uid)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#15221B] p-4 text-left hover:border-[#0B5D34] transition"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold">{patientName(enc.patientId)}</div>
                  <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                    {enc.type} · Result ready
                  </div>
                  <div className="mt-1 text-xs font-medium text-[#13221A] dark:text-[#EAF2ED]">
                    {enc.results.join('; ')}
                  </div>
                  <div className="mt-1 text-xs font-bold text-[#0B5D34] dark:text-[#39C27A]">
                    Tap to continue Stage 2 diagnosis &amp; treatment
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] shrink-0">
                Open ›
              </span>
            </button>
          ))
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#5D6E64] dark:text-[#98AEA1]">
          Waiting for the Lab ({waitingEncounters.length})
        </h2>
        {waitingEncounters.length === 0 ? (
          <div className="rounded-xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            None waiting.
          </div>
        ) : (
          waitingEncounters.map((enc) => (
            <div
              key={enc.uid}
              className="flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-[#15221B] p-4"
            >
              <Clock className="h-5 w-5 text-[#8A5A00] dark:text-amber-300 shrink-0" />
              <div>
                <div className="font-display text-sm font-bold">{patientName(enc.patientId)}</div>
                <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                  {enc.type} · awaiting{' '}
                  {state.labQueue
                    .filter((t) => t.encounterUid === enc.uid)
                    .map((t) => t.tests)
                    .join(', ')}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#5D6E64] dark:text-[#98AEA1]">
          Pharmacy &amp; Referral Updates ({otherNotifications.length})
        </h2>
        {otherNotifications.length === 0 ? (
          <div className="rounded-xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            No updates yet.
          </div>
        ) : (
          otherNotifications.map((n) => (
            <button
              key={n.uid}
              type="button"
              onClick={() => onOpenNotification(n.uid)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left bg-white dark:bg-[#15221B] ${
                n.read
                  ? 'border-[#D9E3DD] dark:border-[#24352B]'
                  : 'border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3EC] dark:bg-[#1B3326] text-[#0B5D34] dark:text-[#39C27A]">
                {n.kind === 'ref' ? (
                  <ArrowLeftRight className="h-5 w-5" />
                ) : n.kind === 'lab' ? (
                  <FlaskConical className="h-5 w-5" />
                ) : (
                  <Pill className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold">{n.patientName}</div>
                <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">{n.text}</div>
              </div>
              <span className="text-xs font-mono-tabular text-[#6B7C72] shrink-0">{n.time}</span>
            </button>
          ))
        )}
      </section>
    </div>
  );
};
