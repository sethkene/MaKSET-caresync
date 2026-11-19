import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  QrCode,
  Search,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react';
import { CareSyncState, Patient } from '../types/caresync';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function maskNin(nin?: string): string {
  return nin ? `•••••••${nin.slice(-4)}` : 'No NIN yet (temporary ID)';
}

interface PatientSearchViewProps {
  state: CareSyncState;
  query: string;
  onQueryChange: (q: string) => void;
  onSelectPatient: (patientId: string) => void;
  onRegisterNew: () => void;
}

export const PatientSearchView: React.FC<PatientSearchViewProps> = ({
  state,
  query,
  onQueryChange,
  onSelectPatient,
  onRegisterNew,
}) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.patients;
    return state.patients.filter((p) =>
      `${p.name} ${p.id} ${p.nin || ''} ${p.phone || ''}`.toLowerCase().includes(q)
    );
  }, [query, state.patients]);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7C72]" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by name, Patient ID, phone, or NIN"
              className="w-full min-h-[46px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#F7FAF8] dark:bg-[#192820] pl-10 pr-4 text-sm outline-none focus:border-[#0B5D34] dark:focus:border-[#39C27A]"
            />
          </div>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] px-4 py-2.5 text-sm font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] dark:hover:bg-[#1B3326] whitespace-nowrap shrink-0"
          >
            <QrCode className="h-4 w-4" />
            Scan Patient QR
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          <span>
            {query.trim()
              ? `${results.length} matching ${results.length === 1 ? 'patient' : 'patients'} on this device`
              : `Patients indexed on this device (${state.patients.length})`}
          </span>
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#CBD7CF] dark:border-[#2C4235] p-6 text-center">
              <p className="text-sm font-medium text-[#5D6E64] dark:text-[#98AEA1]">
                No matching patient record found on this device.
              </p>
              <button
                type="button"
                onClick={onRegisterNew}
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B5D34] px-4 py-2 text-sm font-bold text-white hover:bg-[#094D2B]"
              >
                <UserPlus className="h-4 w-4" />
                Register as New Patient
              </button>
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p.id)}
                className="flex w-full min-h-[68px] items-center justify-between gap-3 rounded-xl border border-[#E3ECE6] dark:border-[#24352B] bg-[#FAFDFB] dark:bg-[#192820] p-3.5 text-left hover:border-[#0B5D34] dark:hover:border-[#39C27A] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6F3EC] dark:bg-[#1B3326] font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
                    {getInitials(p.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-bold text-[#13221A] dark:text-[#EAF2ED]">
                      {p.name}
                    </div>
                    <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
                      {p.sex} · {p.age} ·{' '}
                      <span className="font-mono-tabular">
                        {state.ninGateEnabled ? `NIN ${maskNin(p.nin)}` : p.id}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] whitespace-nowrap shrink-0">
                  Open ›
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {state.activePermissions.patients && (
        <button
          type="button"
          onClick={onRegisterNew}
          className="inline-flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B5D34] px-6 py-3 text-sm font-bold text-white hover:bg-[#094D2B] whitespace-nowrap"
        >
          <UserPlus className="h-4 w-4" />
          Register New Patient
        </button>
      )}

      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Scan Patient QR Card</h3>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                aria-label="Close scanner"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Point the device camera at a MaKSET patient card QR code, or select a sample QR card below to simulate scan:
            </p>
            <div className="mt-4 space-y-2">
              {state.patients.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setQrModalOpen(false);
                    onSelectPatient(p.id);
                  }}
                  className="flex w-full min-h-[48px] items-center justify-between rounded-xl border border-[#D9E3DD] dark:border-[#24352B] px-3.5 py-2.5 text-left hover:border-[#0B5D34]"
                >
                  <div>
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="text-xs font-mono-tabular text-[#5D6E64] dark:text-[#98AEA1]">
                      QR Payload: {p.id}
                    </div>
                  </div>
                  <QrCode className="h-5 w-5 text-[#0B5D34] dark:text-[#39C27A]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RegisterPatientViewProps {
  existingPatients: Patient[];
  ninGateEnabled: boolean;
  onSavePatient: (patient: Omit<Patient, 'id'>) => void;
  onSelectExisting: (patientId: string) => void;
  onToast: (msg: string) => void;
}

export const RegisterPatientView: React.FC<RegisterPatientViewProps> = ({
  existingPatients,
  ninGateEnabled,
  onSavePatient,
  onSelectExisting,
  onToast,
}) => {
  const [firstName, setFirstName] = useState('Hauwa');
  const [surname, setSurname] = useState('Garba');
  const [sex, setSex] = useState<'Female' | 'Male'>('Female');
  const [dob, setDob] = useState('1998-03-14');
  const [phone, setPhone] = useState('0803 555 0142');
  const [ward, setWard] = useState('Bauchi / Katagum / Azare');
  const [address, setAddress] = useState('Behind the central market');
  const [allergies, setAllergies] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Optional NIMC / NIN capture
  const [nin, setNin] = useState('');
  const [noNinYet, setNoNinYet] = useState(false);
  const [pin, setPin] = useState('');
  const [nimcVerified, setNimcVerified] = useState(false);
  const [verifyingNimc, setVerifyingNimc] = useState(false);
  const [biometricConsent, setBiometricConsent] = useState(false);

  const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
  const potentialDuplicate = useMemo(() => {
    if (!fullName) return null;
    const normName = fullName.toLowerCase();
    const normPhone = phone.replace(/\s+/g, '');
    return (
      existingPatients.find(
        (p) =>
          p.name.toLowerCase() === normName ||
          (normPhone.length >= 8 && (p.phone || '').replace(/\s+/g, '') === normPhone)
      ) || null
    );
  }, [existingPatients, fullName, phone]);

  const computeAge = (dateStr: string): string => {
    if (!dateStr) return 'Unknown age';
    const birth = new Date(dateStr);
    if (Number.isNaN(birth.getTime())) return 'Unknown age';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1;
    if (years <= 0) {
      const months = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + m);
      return months <= 0 ? 'Newborn' : `${months} months`;
    }
    return `${years} years`;
  };

  const handleNimcScan = () => {
    if (nin.trim().length !== 11) {
      onToast('Enter the 11-digit NIN first');
      return;
    }
    setVerifyingNimc(true);
    window.setTimeout(() => {
      setVerifyingNimc(false);
      setNimcVerified(true);
      onToast('Verified with NIMC (simulated)');
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !surname.trim()) {
      onToast('Enter both first name and surname');
      return;
    }
    if (ninGateEnabled && !noNinYet && nin.trim().length !== 11) {
      onToast('Enter the 11-digit NIN or choose No NIN yet');
      return;
    }

    onSavePatient({
      name: fullName,
      sex,
      dob,
      age: computeAge(dob),
      phone: phone.trim(),
      ward,
      address: address.trim(),
      allergies: allergies.trim(),
      bloodGroup,
      nin: noNinYet ? '' : nin.trim() || undefined,
      idVerified: nimcVerified && !noNinYet ? 'Verified' : 'Not verified',
      pin: pin.trim() || '1234',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Surname
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Sex
            </div>
            <div className="flex gap-2">
              {(['Female', 'Male'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSex(option)}
                  className={`min-h-[44px] flex-1 rounded-xl border px-3 text-sm font-semibold transition ${
                    sex === option
                      ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                      : 'border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] hover:border-[#0B5D34]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Date of birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34] font-mono-tabular"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34] font-mono-tabular"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Blood group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
            >
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              State / LGA / Ward
            </label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
            >
              <option value="Bauchi / Katagum / Azare">Bauchi / Katagum / Azare</option>
              <option value="Bauchi / Katagum / Chinade">Bauchi / Katagum / Chinade</option>
              <option value="Bauchi / Katagum / Madara">Bauchi / Katagum / Madara</option>
              <option value="Bauchi / Misau / Misau">Bauchi / Misau / Misau</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Known allergies (optional)
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin allergy"
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
            Residential address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm outline-none focus:border-[#0B5D34]"
          />
        </div>
      </div>

      {ninGateEnabled && (
        <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
          <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
            National ID (NIN) &amp; Verification
          </h3>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              NIN (11 digits)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              disabled={noNinYet}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
              placeholder="11-digit NIN"
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm font-mono-tabular outline-none focus:border-[#0B5D34] disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNoNinYet((v) => !v)}
              className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold transition ${
                noNinYet
                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                  : 'border-[#D9E3DD] dark:border-[#26382E] bg-[#F7FAF8] dark:bg-[#192820]'
              }`}
            >
              No NIN yet, use a temporary ID
            </button>

            <button
              type="button"
              onClick={handleNimcScan}
              disabled={noNinYet || verifyingNimc}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#0B5D34] px-3.5 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC] disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              {verifyingNimc
                ? 'Scanning…'
                : nimcVerified
                  ? '✓ Verified with NIMC (simulated)'
                  : 'Scan thumb and verify with NIMC'}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
              Patient PIN for later visits (4 digits)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 4821 (defaults to 1234)"
              className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm font-mono-tabular outline-none focus:border-[#0B5D34]"
            />
          </div>

          <button
            type="button"
            onClick={() => setBiometricConsent((v) => !v)}
            className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-left text-xs font-semibold transition ${
              biometricConsent
                ? 'border-[#0B5D34] bg-[#E6F3EC] text-[#0B5D34] dark:bg-[#1B3326] dark:text-[#39C27A]'
                : 'border-[#D9E3DD] dark:border-[#26382E]'
            }`}
          >
            {biometricConsent ? '✓ ' : ''}Patient consents to saving an encrypted fingerprint template (pending NIMC/NDPA)
          </button>
        </div>
      )}

      {potentialDuplicate ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-[#FFF3D6] dark:bg-[#2F250D] p-4 text-xs text-[#7A5100] dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Possible duplicate found on device:</strong> {potentialDuplicate.name} (
              {potentialDuplicate.id}). Avoid creating duplicate records unless this is a distinct person.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectExisting(potentialDuplicate.id)}
            className="min-h-[38px] rounded-lg bg-[#7A5100] px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap shrink-0"
          >
            Open Existing
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F] p-3.5 text-xs font-medium text-[#0B5D34] dark:text-[#39C27A]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Local duplicate check passed on this device before saving.</span>
        </div>
      )}

      <button
        type="submit"
        className="w-full sm:w-auto min-h-[48px] rounded-xl bg-[#0B5D34] px-8 py-3 text-sm font-bold text-white hover:bg-[#094D2B] transition"
      >
        Save patient
      </button>
    </form>
  );
};

interface PatientVerifyViewProps {
  patient: Patient;
  offline: boolean;
  onVerified: (method: string, emergencyReason?: string) => void;
  onToast: (msg: string) => void;
}

export const PatientVerifyView: React.FC<PatientVerifyViewProps> = ({
  patient,
  offline,
  onVerified,
  onToast,
}) => {
  const [conn, setConn] = useState<'USB cable' | 'Bluetooth'>('USB cable');
  const [finger, setFinger] = useState('Right thumb');
  const [simResult, setSimResult] = useState<'Match' | 'No match'>('Match');
  const [scanning, setScanning] = useState(false);
  const [scanFailMsg, setScanFailMsg] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');

  const startThumbScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanFailMsg('');
    window.setTimeout(() => {
      setScanning(false);
      if (simResult === 'Match') {
        onVerified(`thumb scan, ${finger}`);
      } else {
        setScanFailMsg(
          'No match. Clean the scanner and thumb, then try another finger or use another verification method below.'
        );
      }
    }, 1200);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3 rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6F3EC] dark:bg-[#1B3326] font-display font-bold text-[#0B5D34] dark:text-[#39C27A]">
          {getInitials(patient.name)}
        </div>
        <div>
          <div className="font-display text-base font-bold">{patient.name}</div>
          <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1] font-mono-tabular">
            NIN {maskNin(patient.nin)} · {patient.id}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
          1. Connect the scanner
        </h3>
        <div className="flex gap-2">
          {(['USB cable', 'Bluetooth'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConn(c)}
              className={`min-h-[42px] flex-1 rounded-xl border text-xs font-semibold ${
                conn === c
                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                  : 'border-[#D9E3DD] dark:border-[#26382E]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          Scanner connected ({conn}, simulated)
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 text-center space-y-4">
        <h3 className="text-left font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
          2. Scan the patient thumb
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {['Right thumb', 'Left thumb', 'Right index', 'Left index'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFinger(f)}
              className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold ${
                finger === f
                  ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                  : 'border-[#D9E3DD] dark:border-[#26382E]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={startThumbScan}
          className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 transition ${
            scanFailMsg
              ? 'border-[#C62828] text-[#C62828]'
              : 'border-[#0B5D34] text-[#0B5D34] dark:border-[#39C27A] dark:text-[#39C27A]'
          }`}
        >
          <Fingerprint className="h-12 w-12" />
        </button>

        <div className="text-sm font-bold">
          {scanning ? 'Scanning… hold still' : 'Tap icon, then place thumb on scanner'}
        </div>
        {scanFailMsg && (
          <div className="text-xs font-semibold text-[#C62828] dark:text-rose-400">
            {scanFailMsg}
          </div>
        )}

        <div className="pt-2 border-t border-[#E3ECE6] dark:border-[#24352B]">
          <div className="mb-2 text-xs text-[#5D6E64] dark:text-[#98AEA1]">
            Prototype test simulation outcome
          </div>
          <div className="flex justify-center gap-2">
            {(['Match', 'No match'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSimResult(s)}
                className={`min-h-[36px] rounded-xl border px-4 text-xs font-semibold ${
                  simResult === s
                    ? 'border-[#0B5D34] bg-[#0B5D34] text-white'
                    : 'border-[#D9E3DD] dark:border-[#26382E]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-5 space-y-3">
        <h3 className="font-display text-sm font-bold text-[#0B5D34] dark:text-[#39C27A]">
          Other ways to confirm
        </h3>
        <div className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          Patient PIN (demo PIN: <span className="font-mono-tabular">{patient.pin || '1234'}</span>)
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="4-digit PIN"
            className="flex-1 min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm font-mono-tabular"
          />
          <button
            type="button"
            onClick={() => {
              if (pinInput === (patient.pin || '1234')) {
                onVerified('patient PIN');
              } else {
                onToast('Wrong PIN');
              }
            }}
            className="min-h-[44px] rounded-xl bg-[#0B5D34] px-5 text-sm font-bold text-white whitespace-nowrap shrink-0"
          >
            Confirm
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
          <button
            type="button"
            onClick={() => onVerified('QR card')}
            className="min-h-[44px] rounded-xl border border-[#0B5D34] px-4 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC]"
          >
            Scan patient QR card
          </button>
          <button
            type="button"
            onClick={() => {
              if (offline) {
                onToast('Needs internet. Use PIN or QR card offline.');
                return;
              }
              onToast('Verification code sent to patient phone (simulated)');
              window.setTimeout(() => onVerified('SMS code'), 900);
            }}
            className="min-h-[44px] rounded-xl border border-[#0B5D34] px-4 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#E6F3EC]"
          >
            Code by SMS (needs internet)
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#15221B] p-5 space-y-3">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-[#C62828] dark:text-rose-400">
          <ShieldAlert className="h-4 w-4" />
          Emergency Access Override
        </div>
        <p className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
          Only when the patient cannot be verified (e.g. unconscious). Access is logged and flagged on the record.
        </p>
        <input
          type="text"
          value={emergencyReason}
          onChange={(e) => setEmergencyReason(e.target.value)}
          placeholder="Reason for emergency access (required)"
          className="w-full min-h-[44px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#192820] px-3.5 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (!emergencyReason.trim()) {
              onToast('Give a reason for emergency access');
              return;
            }
            onVerified('emergency override', emergencyReason.trim());
          }}
          className="w-full min-h-[44px] rounded-xl bg-[#C62828] px-4 text-sm font-bold text-white hover:bg-[#A61E1E]"
        >
          Open record in emergency
        </button>
      </div>
    </div>
  );
};
