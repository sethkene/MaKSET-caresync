import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Mic,
  Pill,
  Syringe,
} from 'lucide-react';
import {
  ALL_VACCINES,
  ENCOUNTER_FLAGS,
  ENCOUNTER_OUTCOMES,
  IMMUNIZATION_SCHEDULE,
  LAB_TESTS,
  MEDICATIONS,
} from '../data/initialData';
import { CareSyncState, Encounter, EncounterType, Patient } from '../types/caresync';

interface EncounterFormViewProps {
  state: CareSyncState;
  patient: Patient;
  draft: Encounter;
  onUpdateDraft: (next: Encounter) => void;
  onSendLabOrder: (tests: string[], updatedDraft: Encounter) => void;
  onSendPharmacyOrder: (meds: string[], updatedDraft: Encounter) => void;
  onSaveAndWaitForLab: (updatedDraft: Encounter) => void;
  onCompleteEncounter: (finalDraft: Encounter) => void;
  onBackHome: () => void;
  onToast: (msg: string) => void;
}

export const EncounterFormView: React.FC<EncounterFormViewProps> = ({
  state,
  patient,
  draft,
  onUpdateDraft,
  onSendLabOrder,
  onSendPharmacyOrder,
  onSaveAndWaitForLab,
  onCompleteEncounter,
  onBackHome,
  onToast,
}) => {
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [otherMed, setOtherMed] = useState('');
  const [bypassModal, setBypassModal] = useState<'rx' | 'save' | null>(null);
  const [bypassReasonInput, setBypassReasonInput] = useState('');

  const flags = ENCOUNTER_FLAGS[draft.type] || 'LDR';
  const hasLabSection = flags.includes('L');
  const hasDxSection = flags.includes('D');
  const hasRxSection = flags.includes('R');

  const pendingLabsForDraft = state.labQueue.filter(
    (item) => item.encounterUid === draft.uid
  );
  const isWaitingForLab =
    hasLabSection && draft.labs.length > 0 && pendingLabsForDraft.length > 0 && !draft.bypassReason;

  // Previous vaccines given to this patient
  const priorVaccines = useMemo(() => {
    const map: Record<string, string> = {};
    state.encounters
      .filter((e) => e.patientId === patient.id && e.type === 'Immunization')
      .forEach((e) => {
        ALL_VACCINES.forEach((v) => {
          if (e.extra?.[v] === 'Received') {
            map[v] = e.time.split(',')[0];
          }
        });
      });
    return map;
  }, [patient.id, state.encounters]);

  // Previous visit card
  const latestVisit = useMemo(
    () =>
      state.encounters
        .filter((e) => e.patientId === patient.id && e.uid !== draft.uid)
        .slice(-1)[0],
    [draft.uid, patient.id, state.encounters]
  );

  const extra = draft.extra || {};
  const setExtra = (key: string, value: string) => {
    onUpdateDraft({
      ...draft,
      extra: {
        ...extra,
        [key]: value,
      },
    });
  };

  const toggleExtraMulti = (key: string, option: string) => {
    const current = (extra[key] || '')
      .split(', ')
      .map((s) => s.trim())
      .filter(Boolean);
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    setExtra(key, next.join(', '));
  };

  const renderSingleChips = (key: string, options: string[], defaultValue?: string) => {
    const val = extra[key] ?? defaultValue ?? '';
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = val === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setExtra(key, active ? '' : opt)}
              className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold transition ${
                active
                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                  : 'border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] hover:border-[#0B5D34]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMultiChips = (key: string, options: string[]) => {
    const current = (extra[key] || '')
      .split(', ')
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = current.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleExtraMulti(key, opt)}
              className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold transition ${
                active
                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                  : 'border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] hover:border-[#0B5D34]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  };

  // Waiting Screen for Stage 1 Lab Pending
  if (isWaitingForLab && draft.status === 'open') {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#15221B] p-5 space-y-2">
          <div className="flex items-center gap-2 font-display text-base font-bold text-[#8A5A00] dark:text-amber-300">
            <Clock className="h-5 w-5" />
            Waiting for lab results
          </div>
          <div className="text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            <strong>Complaint:</strong> {draft.complaint || 'Recorded'}
          </div>
          <div className="text-sm text-[#5D6E64] dark:text-[#98AEA1]">
            <strong>Ordered:</strong> {draft.labs.join(', ')}
          </div>
          <div className="text-sm font-semibold text-[#8A5A00] dark:text-amber-300">
            Awaiting: {pendingLabsForDraft.map((t) => t.tests).join(', ')}
          </div>
        </div>

        <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4 text-sm text-[#0B5D34] dark:text-[#39C27A]">
          You will be notified via the top bell icon as soon as the laboratory submits results. You can attend to another patient while waiting.
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="w-full sm:w-auto min-h-[46px] rounded-xl bg-[#0B5D34] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#094D2B]"
        >
          Back to home
        </button>
      </div>
    );
  }

  const stage = hasLabSection ? draft.stage || 1 : 2;

  const handleSendWait = () => {
    if (!draft.complaint.trim()) {
      onToast('Enter the complaint or clinical findings first');
      return;
    }
    if (selectedLabs.length === 0 && draft.labs.length === 0) {
      onToast('Select at least one test to send to lab');
      return;
    }
    let nextDraft = draft;
    if (selectedLabs.length > 0) {
      const mergedLabs = Array.from(new Set([...draft.labs, ...selectedLabs]));
      nextDraft = { ...draft, labs: mergedLabs, status: 'open', stage: 1 };
      onSendLabOrder(selectedLabs, nextDraft);
      setSelectedLabs([]);
    }
    onSaveAndWaitForLab(nextDraft);
  };

  const handleProceedWithoutLab = () => {
    if (!draft.complaint.trim()) {
      onToast('Enter the complaint or clinical findings first');
      return;
    }
    if (selectedLabs.length > 0) {
      onToast('Tap Send lab order and wait, or clear the selected tests');
      return;
    }
    onUpdateDraft({ ...draft, stage: 2 });
  };

  const handleTriggerPharmacy = (draftWithBypass?: Encounter) => {
    const activeDraft = draftWithBypass || draft;
    const itemsToSend = [...selectedMeds];
    if (otherMed.trim()) itemsToSend.push(otherMed.trim());
    if (itemsToSend.length === 0) {
      onToast('Select at least one medicine first');
      return;
    }
    if (hasDxSection && !activeDraft.diagnosis.trim()) {
      onToast('Enter the diagnosis before sending to pharmacy');
      return;
    }
    if (pendingLabsForDraft.length > 0 && !activeDraft.bypassReason) {
      setBypassModal('rx');
      return;
    }
    const mergedRx = Array.from(new Set([...activeDraft.rx, ...itemsToSend]));
    const updated = { ...activeDraft, rx: mergedRx };
    onSendPharmacyOrder(itemsToSend, updated);
    setSelectedMeds([]);
    setOtherMed('');
  };

  const handleCompleteClick = (draftWithBypass?: Encounter) => {
    const activeDraft = draftWithBypass || draft;
    if (selectedLabs.length > 0) {
      onToast('Tap Send lab order for the selected tests first');
      return;
    }
    if (selectedMeds.length > 0 || otherMed.trim()) {
      onToast('Tap Send pharmacy order for the selected medicines first');
      return;
    }
    if (
      (activeDraft.type === 'OPD' || activeDraft.type === 'Inpatient') &&
      !activeDraft.diagnosis.trim()
    ) {
      onToast('Enter the diagnosis before completing');
      return;
    }
    if (pendingLabsForDraft.length > 0 && !activeDraft.bypassReason) {
      setBypassModal('save');
      return;
    }
    onCompleteEncounter({
      ...activeDraft,
      status: '',
      synced: false,
    });
  };

  const confirmBypass = () => {
    if (!bypassReasonInput.trim()) {
      onToast('Give a reason to bypass lab results');
      return;
    }
    const updated: Encounter = {
      ...draft,
      bypassReason: bypassReasonInput.trim(),
    };
    onUpdateDraft(updated);
    const mode = bypassModal;
    setBypassModal(null);
    setBypassReasonInput('');
    if (mode === 'rx') {
      handleTriggerPharmacy(updated);
    } else if (mode === 'save') {
      handleCompleteClick(updated);
    }
  };

  const renderTypeSpecificFields = (t: EncounterType) => {
    if (t === 'ANC') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Antenatal Assessment
            </h3>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Visit number
              </div>
              {renderSingleChips('Visit', ['1', '2', '3', '4', '5', '6', '7', '8'])}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Gestation (weeks)
                </label>
                <input
                  type="text"
                  value={extra['Gestation'] || ''}
                  onChange={(e) => setExtra('Gestation', e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Blood pressure
                </label>
                <input
                  type="text"
                  value={extra['BP'] || ''}
                  onChange={(e) => setExtra('BP', e.target.value)}
                  placeholder="e.g. 110/70"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Weight (kg)
                </label>
                <input
                  type="text"
                  value={extra['Weight'] || ''}
                  onChange={(e) => setExtra('Weight', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Fundal height (cm)
                </label>
                <input
                  type="text"
                  value={extra['Fundal height'] || ''}
                  onChange={(e) => setExtra('Fundal height', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Fetal heart
              </div>
              {renderSingleChips('Fetal heart', ['Present', 'Absent'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Presentation
              </div>
              {renderSingleChips('Presentation', ['Cephalic', 'Breech', 'Other'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Urine protein
              </div>
              {renderSingleChips('Urine protein', ['Negative', 'Positive'])}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              ANC Interventions
            </h3>
            {renderMultiChips('Given', [
              'IPTp-SP',
              'Td vaccine',
              'ITN',
              'Iron and folic acid',
              'Deworming',
              'Birth plan counselling',
            ])}
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Danger signs
              </div>
              {renderMultiChips('Danger signs', [
                'None',
                'Bleeding',
                'Severe headache',
                'Swelling',
                'Fever',
                'Reduced fetal movement',
              ])}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Next visit
              </label>
              <input
                type="date"
                value={extra['Next visit'] || ''}
                onChange={(e) => setExtra('Next visit', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
          </div>
        </div>
      );
    }

    if (t === 'Family Planning') {
      return (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Family Planning
          </h3>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Client type
            </div>
            {renderSingleChips('Client type', ['New acceptor', 'Revisit', 'Switching method'])}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Pregnancy ruled out
            </div>
            {renderSingleChips('Pregnancy ruled out', ['Yes', 'No'])}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Method
            </div>
            {renderSingleChips('Method', [
              'Pills',
              'Injectable (DMPA-SC)',
              'Implant',
              'IUD',
              'Condoms',
              'Natural methods',
              'Emergency contraception',
              'Permanent method (refer)',
            ])}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Blood pressure
              </label>
              <input
                type="text"
                value={extra['BP'] || ''}
                onChange={(e) => setExtra('BP', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Weight (kg)
              </label>
              <input
                type="text"
                value={extra['Weight'] || ''}
                onChange={(e) => setExtra('Weight', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Counselling done
            </div>
            {renderMultiChips('Counselling', [
              'Method options',
              'Side effects',
              'Return signs',
              'Dual protection',
            ])}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Next appointment
            </label>
            <input
              type="date"
              value={extra['Next appointment'] || ''}
              onChange={(e) => setExtra('Next appointment', e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
            />
          </div>
        </div>
      );
    }

    if (t === 'Labour/Delivery') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Labour &amp; Delivery
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Onset of labour (time)
                </label>
                <input
                  type="text"
                  value={extra['Onset'] || ''}
                  onChange={(e) => setExtra('Onset', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Cervical dilatation on admission (cm)
                </label>
                <input
                  type="text"
                  value={extra['Dilatation'] || ''}
                  onChange={(e) => setExtra('Dilatation', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Fetal heart rate (bpm)
                </label>
                <input
                  type="text"
                  value={extra['FHR'] || ''}
                  onChange={(e) => setExtra('FHR', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Delivery time
                </label>
                <input
                  type="text"
                  value={extra['Delivery time'] || ''}
                  onChange={(e) => setExtra('Delivery time', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Partograph
              </div>
              {renderSingleChips('Partograph', ['Started', 'Not started'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Mode of delivery
              </div>
              {renderSingleChips('Mode of delivery', [
                'Spontaneous vaginal',
                'Assisted vaginal',
                'Referred for caesarean',
              ])}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Third Stage &amp; Mother
            </h3>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Active management (oxytocin)
              </div>
              {renderSingleChips('AMTSL', ['Done', 'Not done'])}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Estimated blood loss (ml)
              </label>
              <input
                type="text"
                value={extra['Blood loss'] || ''}
                onChange={(e) => setExtra('Blood loss', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Perineal tear
              </div>
              {renderSingleChips('Perineal tear', [
                'None',
                '1st degree',
                '2nd degree',
                '3rd or 4th (refer)',
              ])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Complications
              </div>
              {renderMultiChips('Complications', [
                'None',
                'Haemorrhage',
                'Pre-eclampsia or eclampsia',
                'Prolonged labour',
                'Retained placenta',
              ])}
            </div>
          </div>

          <div className="rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#F7FAF8] dark:bg-[#152A1F] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Newborn (Live birth automatically creates a linked newborn patient record)
            </h3>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Outcome
              </div>
              {renderSingleChips('Newborn outcome', ['Live birth', 'Stillbirth'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Sex
              </div>
              {renderSingleChips('Newborn sex', ['Female', 'Male'])}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Birth weight (kg)
                </label>
                <input
                  type="text"
                  value={extra['Birth weight'] || ''}
                  onChange={(e) => setExtra('Birth weight', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Apgar score (1 min / 5 min)
                </label>
                <input
                  type="text"
                  value={extra['Apgar'] || ''}
                  onChange={(e) => setExtra('Apgar', e.target.value)}
                  placeholder="e.g. 8 / 9"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Immediate newborn care
              </div>
              {renderMultiChips('Newborn care', [
                'Dried and warmed',
                'Skin-to-skin',
                'Early breastfeeding',
                'Cord care',
                'BCG, OPV0, Hep B0 given',
              ])}
            </div>
          </div>
        </div>
      );
    }

    if (t === 'PNC') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Postnatal Assessment
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Days since delivery
                </label>
                <input
                  type="text"
                  value={extra['Days since delivery'] || ''}
                  onChange={(e) => setExtra('Days since delivery', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Blood pressure
                </label>
                <input
                  type="text"
                  value={extra['BP'] || ''}
                  onChange={(e) => setExtra('BP', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Temperature (°C)
                </label>
                <input
                  type="text"
                  value={extra['Temperature'] || ''}
                  onChange={(e) => setExtra('Temperature', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Vaginal bleeding
              </div>
              {renderSingleChips('Bleeding', ['Normal', 'Heavy'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Uterus
              </div>
              {renderSingleChips('Uterus', ['Well contracted', 'Not well contracted'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Breastfeeding
              </div>
              {renderSingleChips('Breastfeeding', ['Exclusive', 'Difficulty', 'Not breastfeeding'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Family planning counselling
              </div>
              {renderSingleChips('FP counselling', ['Done', 'Not done'])}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Newborn Check
            </h3>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Cord
              </div>
              {renderSingleChips('Cord', ['Clean and dry', 'Infected'])}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Jaundice
              </div>
              {renderSingleChips('Jaundice', ['None', 'Present'])}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Weight (kg)
              </label>
              <input
                type="text"
                value={extra['Newborn weight'] || ''}
                onChange={(e) => setExtra('Newborn weight', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Danger signs
              </div>
              {renderMultiChips('Newborn danger signs', [
                'None',
                'Fever',
                'Poor feeding',
                'Fast breathing',
                'Convulsions',
              ])}
            </div>
          </div>
        </div>
      );
    }

    if (t === 'Inpatient') {
      return (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Admission &amp; Ward Care
          </h3>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Ward
            </div>
            {renderSingleChips('Ward', ['Male', 'Female', 'Maternity', 'Children'])}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Reason for admission
            </label>
            <input
              type="text"
              value={extra['Admission reason'] || ''}
              onChange={(e) => setExtra('Admission reason', e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Vital signs
            </label>
            <input
              type="text"
              value={extra['Vitals'] || ''}
              onChange={(e) => setExtra('Vitals', e.target.value)}
              placeholder="Temp, pulse, BP, resp. rate"
              className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Progress note
            </label>
            <textarea
              rows={2}
              value={extra['Progress'] || ''}
              onChange={(e) => setExtra('Progress', e.target.value)}
              className="w-full rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] p-3 text-sm"
            />
          </div>
        </div>
      );
    }

    if (t === 'Growth and Nutrition') {
      return (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Growth &amp; Nutrition
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Weight (kg)
              </label>
              <input
                type="text"
                value={extra['Weight'] || ''}
                onChange={(e) => setExtra('Weight', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Height or length (cm)
              </label>
              <input
                type="text"
                value={extra['Height'] || ''}
                onChange={(e) => setExtra('Height', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                MUAC (cm)
              </label>
              <input
                type="text"
                value={extra['MUAC'] || ''}
                onChange={(e) => setExtra('MUAC', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              MUAC colour
            </div>
            {renderSingleChips('MUAC colour', ['Green', 'Yellow', 'Red'])}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Oedema
            </div>
            {renderSingleChips('Oedema', ['None', 'Present'])}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Nutrition status
            </div>
            {renderSingleChips('Nutrition status', [
              'Normal',
              'Moderate acute malnutrition',
              'Severe acute malnutrition',
            ])}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Intervention
            </div>
            {renderMultiChips('Intervention', [
              'Counselling',
              'RUTF given',
              'Deworming',
              'Referred to stabilisation centre',
            ])}
          </div>
        </div>
      );
    }

    if (t === 'Immunization') {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4 text-xs font-medium text-[#0B5D34] dark:text-[#39C27A]">
            <Syringe className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Tap Received or Not received for each vaccine. Earlier doses show their date automatically from the patient record. Confirm against the current NPHCDA schedule.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {IMMUNIZATION_SCHEDULE.map(([ageStage, vaccines]) => (
              <div
                key={ageStage}
                className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4 space-y-3"
              >
                <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
                  {ageStage}
                </h3>
                <div className="space-y-2.5">
                  {vaccines.map((vaccine) => {
                    const currentVal =
                      extra[vaccine] ?? (priorVaccines[vaccine] ? 'Received' : '');
                    return (
                      <div
                        key={vaccine}
                        className="flex items-center justify-between gap-2 border-b border-[#EEF3F0] dark:border-[#223229] pb-2 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <div className="text-xs font-bold">{vaccine}</div>
                          {priorVaccines[vaccine] && (
                            <div className="text-[11px] text-[#5D6E64] dark:text-[#98AEA1]">
                              Given {priorVaccines[vaccine]}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {(['Received', 'Not received'] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                setExtra(vaccine, currentVal === status ? '' : status)
                              }
                              className={`min-h-[34px] rounded-lg border px-2.5 text-[11px] font-semibold transition ${
                                currentVal === status
                                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                                  : 'border-[#D9E3DD] dark:border-[#26382E]'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Safety &amp; Follow-up
            </h3>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Adverse event after immunization (AEFI)
              </div>
              {renderSingleChips('AEFI', ['None', 'Mild', 'Serious (report)'])}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                Next appointment
              </label>
              <input
                type="date"
                value={extra['Next appointment'] || ''}
                onChange={(e) => setExtra('Next appointment', e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3 text-sm font-mono-tabular"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Lab results card if any labs ordered */}
      {hasLabSection && draft.labs.length > 0 && (
        <div
          className={`rounded-2xl border p-4 bg-white dark:bg-[#15221B] ${
            pendingLabsForDraft.length > 0
              ? 'border-amber-300 dark:border-amber-800'
              : 'border-[#0B5D34] dark:border-[#39C27A]'
          }`}
        >
          <div className="flex items-center gap-2 font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            <FlaskConical className="h-4 w-4" />
            Lab Results
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {draft.results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A] shrink-0" />
                <span className={r.includes('Positive') ? 'font-bold text-[#C62828] dark:text-rose-400' : ''}>
                  {r}
                </span>
              </div>
            ))}
            {pendingLabsForDraft.length > 0 ? (
              <div className="text-xs font-semibold text-[#8A5A00] dark:text-amber-300">
                Awaiting lab: {pendingLabsForDraft.map((t) => t.tests).join(', ')}
              </div>
            ) : (
              <div className="text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A]">
                All results are back. Enter the diagnosis and treatment below.
              </div>
            )}
            {draft.bypassReason && (
              <div className="text-xs font-bold text-[#C62828] dark:text-rose-400">
                Lab result bypassed — Reason: {draft.bypassReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous visit & timestamp */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-4">
          <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
            Previous Visit
          </div>
          {latestVisit ? (
            <div className="mt-1 text-xs text-[#394A40] dark:text-[#C8DAD0]">
              <strong>
                {latestVisit.type} · {latestVisit.time}
              </strong>
              {latestVisit.diagnosis ? ` — ${latestVisit.diagnosis}` : ''}
              {latestVisit.rx.length ? ` · Rx: ${latestVisit.rx.join(', ')}` : ''}
            </div>
          ) : (
            <div className="mt-1 text-xs text-[#394A40] dark:text-[#C8DAD0]">
              First visit. No previous history on record.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4">
          <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0B5D34] dark:text-[#39C27A]">
            Encounter Time
          </div>
          <div className="mt-1 text-xs font-mono-tabular text-[#5D6E64] dark:text-[#98AEA1]">
            {draft.time} · recorded automatically
          </div>
        </div>
      </div>

      {/* Complaint and findings (all except Immunization) */}
      {draft.type !== 'Immunization' && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            {draft.type === 'ANC' ? 'Gestation & Clinical Findings' : 'Complaint & Findings'}
          </h3>
          <textarea
            rows={3}
            value={draft.complaint}
            onChange={(e) => onUpdateDraft({ ...draft, complaint: e.target.value })}
            placeholder="Enter complaint and clinical findings"
            className="w-full rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] p-3 text-sm outline-none focus:border-[#0B5D34]"
          />
          <button
            type="button"
            onClick={() => {
              const sampleNote =
                draft.type === 'ANC'
                  ? 'ANC routine check; fetal movements normal, no oedema.'
                  : 'Fever and headache for 3 days.';
              onUpdateDraft({
                ...draft,
                complaint: draft.complaint ? `${draft.complaint} ${sampleNote}` : sampleNote,
              });
              onToast('Voice dictation sample inserted. Review before saving.');
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-3.5 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC]"
          >
            <Mic className="h-4 w-4" />
            Dictate findings
          </button>
        </div>
      )}

      {/* Specialized fields */}
      {renderTypeSpecificFields(draft.type)}

      {/* Stage 1: Investigations */}
      {hasLabSection && stage === 1 && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            Stage 1 — Investigations Available at this PHC
          </h3>
          <div className="flex flex-wrap gap-2">
            {LAB_TESTS.map((test) => {
              const on = selectedLabs.includes(test);
              return (
                <button
                  key={test}
                  type="button"
                  onClick={() =>
                    setSelectedLabs((prev) =>
                      prev.includes(test) ? prev.filter((x) => x !== test) : [...prev, test]
                    )
                  }
                  className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold transition ${
                    on
                      ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                      : 'border-[#D9E3DD] dark:border-[#26382E]'
                  }`}
                >
                  {test}
                </button>
              );
            })}
          </div>
          {draft.labs.length > 0 && (
            <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Already ordered: {draft.labs.join(', ')}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={handleSendWait}
              className="min-h-[46px] flex-1 rounded-xl bg-[#0B5D34] px-4 text-sm font-bold text-white hover:bg-[#094D2B]"
            >
              Send lab order and wait for results
            </button>
            <button
              type="button"
              onClick={handleProceedWithoutLab}
              className="min-h-[46px] flex-1 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A]"
            >
              No investigation needed. Continue to diagnosis
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Diagnosis, Medication & Outcome */}
      {stage === 2 && (
        <>
          {hasDxSection && (
            <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
              <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
                Diagnosis
              </h3>
              <input
                type="text"
                value={draft.diagnosis}
                onChange={(e) => onUpdateDraft({ ...draft, diagnosis: e.target.value })}
                placeholder="Enter diagnosis (e.g. Uncomplicated malaria)"
                className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
              />
              <div>
                <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Diagnosis method
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Confirmed by laboratory', 'Clinical diagnosis'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onUpdateDraft({ ...draft, diagnosisMethod: m })}
                      className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold ${
                        draft.diagnosisMethod === m
                          ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                          : 'border-[#D9E3DD] dark:border-[#26382E]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasRxSection && (
            <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
                <Pill className="h-4 w-4" />
                Medication &amp; Treatment
              </div>
              <div className="flex flex-wrap gap-2">
                {MEDICATIONS.map((med) => {
                  const on = selectedMeds.includes(med);
                  return (
                    <button
                      key={med}
                      type="button"
                      onClick={() =>
                        setSelectedMeds((prev) =>
                          prev.includes(med) ? prev.filter((x) => x !== med) : [...prev, med]
                        )
                      }
                      className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold ${
                        on
                          ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                          : 'border-[#D9E3DD] dark:border-[#26382E]'
                      }`}
                    >
                      {med}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Other treatment or advice (optional)
                </label>
                <input
                  type="text"
                  value={otherMed}
                  onChange={(e) => setOtherMed(e.target.value)}
                  placeholder="Enter custom prescription or advice"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3.5 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTriggerPharmacy()}
                  className="min-h-[42px] rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC]"
                >
                  Send pharmacy order
                </button>
                {draft.rx.length > 0 && (
                  <span className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                    Ordered: {draft.rx.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
              Outcome
            </h3>
            <div className="flex flex-wrap gap-2">
              {(ENCOUNTER_OUTCOMES[draft.type] || ENCOUNTER_OUTCOMES.OPD).map((out) => (
                <button
                  key={out}
                  type="button"
                  onClick={() => onUpdateDraft({ ...draft, outcome: out })}
                  className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold ${
                    draft.outcome === out
                      ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                      : 'border-[#D9E3DD] dark:border-[#26382E]'
                  }`}
                >
                  {out}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCompleteClick()}
            className="w-full sm:w-auto min-h-[48px] rounded-xl bg-[#0B5D34] px-8 py-3 text-sm font-bold text-white hover:bg-[#094D2B]"
          >
            Complete {draft.type} encounter
          </button>
        </>
      )}

      {/* Lab Bypass Guard Modal */}
      {bypassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#15221B] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 font-display text-lg font-bold text-[#C62828] dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Lab result still pending
            </div>
            <p className="text-xs leading-relaxed text-[#5D6E64] dark:text-[#98AEA1]">
              Treating before laboratory results return can lead to missed or incorrect treatment. Bypass only when waiting could harm the patient (such as an emergency). Your reason is permanently logged in the patient history.
            </p>
            <input
              type="text"
              value={bypassReasonInput}
              onChange={(e) => setBypassReasonInput(e.target.value)}
              placeholder="Reason for bypass (required)"
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm"
            />
            <div className="space-y-2">
              <button
                type="button"
                onClick={confirmBypass}
                className="w-full min-h-[44px] rounded-xl bg-[#C62828] px-4 text-sm font-bold text-white hover:bg-[#A61E1E]"
              >
                Bypass lab result
              </button>
              <button
                type="button"
                onClick={() => {
                  const mode = bypassModal;
                  setBypassModal(null);
                  if (mode === 'save') {
                    onSaveAndWaitForLab({ ...draft, status: 'open', stage: 1 });
                  }
                }}
                className="w-full min-h-[44px] rounded-xl border border-[#0B5D34] text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A]"
              >
                {bypassModal === 'save' ? 'Save and wait for the result' : 'Wait for the result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
