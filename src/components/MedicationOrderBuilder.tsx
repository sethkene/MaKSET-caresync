import React, { useState } from 'react';
import { Pill, Plus, X } from 'lucide-react';
import { MEDICATIONS } from '../data/initialData';
import { MedicationOrder } from '../types/caresync';
import { formatMedicationDisplayLabel } from '../utils/patientIdentity';

const ROUTE_OPTIONS = [
  'Oral',
  'IM',
  'IV',
  'Topical',
  'Ophthalmic',
  'Rectal',
  'Inhaled',
  'Sublingual',
  'Other',
];

const FREQUENCY_OPTIONS = [
  'STAT (Single dose)',
  'OD (Once daily)',
  'BD (Twice daily)',
  'TDS (3× daily)',
  'QDS (4× daily)',
  'PRN (As needed)',
  'Other',
];

interface MedicationOrderBuilderProps {
  title?: string;
  subtitle?: string;
  recipient?: 'patient' | 'mother' | 'newborn';
  stagedOrders: MedicationOrder[];
  orderedLabels: string[];
  canSendToPharmacy?: boolean;
  sendButtonLabel?: string;
  onToggleCatalogueDrug: (drugName: string) => void;
  onAddManualOrder: (order: MedicationOrder) => void;
  onRemoveStagedOrder: (orderId: string) => void;
  onSendOrder: () => void;
  onToast: (msg: string) => void;
}

export const MedicationOrderBuilder: React.FC<MedicationOrderBuilderProps> = ({
  title = 'Medication & Treatment',
  subtitle,
  recipient = 'patient',
  stagedOrders,
  orderedLabels,
  canSendToPharmacy = true,
  sendButtonLabel = 'Send pharmacy order',
  onToggleCatalogueDrug,
  onAddManualOrder,
  onRemoveStagedOrder,
  onSendOrder,
  onToast,
}) => {
  const [manualOpen, setManualOpen] = useState(false);
  const [drugName, setDrugName] = useState('');
  const [strength, setStrength] = useState('');
  const [dose, setDose] = useState('');
  const [route, setRoute] = useState('Oral');
  const [customRoute, setCustomRoute] = useState('');
  const [frequency, setFrequency] = useState('BD (Twice daily)');
  const [customFrequency, setCustomFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState('');

  const resetManualFields = () => {
    setDrugName('');
    setStrength('');
    setDose('');
    setRoute('Oral');
    setCustomRoute('');
    setFrequency('BD (Twice daily)');
    setCustomFrequency('');
    setDuration('');
    setQuantity('');
    setInstructions('');
    setFormError('');
  };

  const handleAddManual = () => {
    const cleanName = drugName.trim();
    const cleanDose = dose.trim();
    const resolvedRoute = (route === 'Other' ? customRoute : route).trim();
    const resolvedFrequency = (frequency === 'Other' ? customFrequency : frequency).trim();

    if (!cleanName) {
      const msg = 'Enter the drug name before adding a manual medication order.';
      setFormError(msg);
      onToast(msg);
      return;
    }
    if (!cleanDose) {
      const msg = 'Enter the dose (e.g. 1 tablet, 5 ml) for the manual medication order.';
      setFormError(msg);
      onToast(msg);
      return;
    }
    if (!resolvedRoute) {
      const msg = 'Specify the route of administration.';
      setFormError(msg);
      onToast(msg);
      return;
    }
    if (!resolvedFrequency) {
      const msg = 'Specify the dosing frequency.';
      setFormError(msg);
      onToast(msg);
      return;
    }

    const baseOrder: Omit<MedicationOrder, 'id' | 'displayLabel'> = {
      source: 'manual',
      drugName: cleanName,
      strength: strength.trim() || undefined,
      dose: cleanDose,
      route: resolvedRoute,
      frequency: resolvedFrequency,
      duration: duration.trim() || undefined,
      quantity: quantity.trim() || undefined,
      instructions: instructions.trim() || undefined,
      recipient,
    };

    const order: MedicationOrder = {
      ...baseOrder,
      id: `med-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      displayLabel: formatMedicationDisplayLabel(baseOrder),
    };

    onAddManualOrder(order);
    resetManualFields();
    setManualOpen(false);
    onToast(`Added manual drug "${cleanName}" to pending medication order.`);
  };

  return (
    <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
          <Pill className="h-4 w-4" />
          <span>{title}</span>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-[#5D6E64] dark:text-[#98AEA1]">{subtitle}</p>
        )}
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
          Facility drug catalogue
        </div>
        <div className="flex flex-wrap gap-2">
          {MEDICATIONS.map((med) => {
            const on = stagedOrders.some(
              (o) => o.source === 'catalogue' && o.drugName === med
            );
            return (
              <button
                key={med}
                type="button"
                onClick={() => onToggleCatalogueDrug(med)}
                className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold transition ${
                  on
                    ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] hover:border-[#0B5D34]'
                }`}
              >
                {med}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => {
            setManualOpen((prev) => !prev);
            setFormError('');
          }}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-3.5 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326]"
        >
          <Plus className="h-3.5 w-3.5" />
          {manualOpen ? 'Hide manual drug entry' : 'Add a drug manually (Drug not listed?)'}
        </button>
      </div>

      {manualOpen && (
        <div className="rounded-xl border border-[#C6DED0] dark:border-[#254434] bg-[#F7FAF8] dark:bg-[#192820] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-display text-xs font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Manual Drug Entry (Not permanently added to facility catalogue)
            </div>
          </div>

          {formError && (
            <div className="rounded-lg border border-rose-300 dark:border-rose-800 bg-[#FDE4E4] dark:bg-[#381B1B] px-3 py-2 text-xs font-semibold text-[#C62828] dark:text-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Drug name *
              </label>
              <input
                type="text"
                value={drugName}
                onChange={(e) => {
                  setDrugName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g. Cefuroxime, Vitamin K1"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Strength / concentration (where applicable)
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 250 mg, 1 mg/0.5 ml"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Dose *
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => {
                  setDose(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g. 1 tablet, 5 ml, 1 mg"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Route of administration *
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              >
                {ROUTE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {route === 'Other' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Specify route *
                </label>
                <input
                  type="text"
                  value={customRoute}
                  onChange={(e) => setCustomRoute(e.target.value)}
                  placeholder="Enter route of administration"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Frequency *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {frequency === 'Other' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Specify frequency *
                </label>
                <input
                  type="text"
                  value={customFrequency}
                  onChange={(e) => setCustomFrequency(e.target.value)}
                  placeholder="e.g. Every 8 hours"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Duration (where applicable)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 5 days"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Quantity (where applicable)
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10 tablets, 1 vial"
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Additional instructions or remarks
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Give after feeding; monitor temperature"
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3 text-sm outline-none focus:border-[#0B5D34]"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddManual}
              className="min-h-[40px] rounded-xl bg-[#0B5D34] px-4 text-xs font-bold text-white hover:bg-[#094D2B]"
            >
              Add manual drug to order
            </button>
            <button
              type="button"
              onClick={() => {
                resetManualFields();
                setManualOpen(false);
              }}
              className="min-h-[40px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] px-3.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stagedOrders.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Ready to send to pharmacy ({stagedOrders.length})
          </div>
          <div className="space-y-1.5">
            {stagedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      order.source === 'manual'
                        ? 'bg-amber-100 text-[#7A5100] dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-[#E6F3EC] text-[#0B5D34] dark:bg-[#1B3326] dark:text-[#39C27A]'
                    }`}
                  >
                    {order.source === 'manual' ? 'Manual' : 'Catalogue'}
                  </span>
                  <span className="font-medium text-[#13221A] dark:text-[#EAF2ED] break-words">
                    {order.displayLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveStagedOrder(order.id)}
                  aria-label={`Remove ${order.drugName}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#5D6E64] hover:bg-[#E6F3EC] hover:text-[#C62828]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canSendToPharmacy && (
          <button
            type="button"
            onClick={onSendOrder}
            className="min-h-[42px] rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326]"
          >
            {sendButtonLabel}
          </button>
        )}
        {orderedLabels.length > 0 && (
          <span className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
            Ordered: {orderedLabels.join('; ')}
          </span>
        )}
      </div>
    </div>
  );
};
