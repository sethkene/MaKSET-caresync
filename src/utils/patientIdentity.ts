import { MedicationOrder, Patient } from '../types/caresync';

export function generatePatientUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateMaksetPatientId(uuid = generatePatientUuid()): string {
  return uuid;
}

/**
 * Generates a unique 5-digit numeric MaKSET Patient ID against known local patient records.
 * Marked as `local-provisional` because true cross-device and cross-facility global uniqueness
 * must be enforced by the Supabase backend (e.g. unique index / server sequence reconciliation).
 */
export function generateShortPatientId(
  existingPatients: Pick<Patient, 'id' | 'shortId'>[]
): string {
  const usedIds = new Set<string>();
  for (const p of existingPatients) {
    if (p.shortId && /^\d{5}$/.test(p.shortId)) {
      usedIds.add(p.shortId);
    }
    const legacyMatch = p.id.match(/(\d{5})$/);
    if (legacyMatch) {
      usedIds.add(legacyMatch[1]);
    }
  }

  const randomFiveDigits = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return String(10000 + (buf[0] % 90000));
    }
    return String(10000 + Math.floor(Math.random() * 90000));
  };

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = randomFiveDigits();
    if (!usedIds.has(candidate)) {
      return candidate;
    }
  }

  for (let n = 10000; n <= 99999; n += 1) {
    const candidate = String(n);
    if (!usedIds.has(candidate)) {
      return candidate;
    }
  }

  for (let n = 0; n <= 9999; n += 1) {
    const candidate = String(n).padStart(5, '0');
    if (!usedIds.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to allocate a unique 5-digit local patient ID');
}

export function createNewPatientIdentifiers(
  existingPatients: Pick<Patient, 'id' | 'shortId'>[]
): {
  id: string;
  uuid: string;
  shortId: string;
  shortIdStatus: 'local-provisional';
} {
  const uuid = generatePatientUuid();
  const shortId = generateShortPatientId(existingPatients);
  return {
    id: uuid,
    uuid,
    shortId,
    shortIdStatus: 'local-provisional',
  };
}

export function getDisplayPatientId(
  patient?: Pick<Patient, 'id' | 'shortId'> | null
): string {
  if (!patient) return '';
  if (patient.shortId && /^\d{5}$/.test(patient.shortId)) {
    return patient.shortId;
  }
  return patient.id;
}

export function formatMedicationDisplayLabel(
  order: Omit<MedicationOrder, 'id' | 'displayLabel'>
): string {
  const prefix = order.recipient === 'newborn' ? '[Newborn] ' : '';
  if (order.source === 'catalogue') {
    return `${prefix}${order.drugName}`;
  }
  const titleParts = [order.drugName.trim()];
  if (order.strength?.trim()) titleParts.push(order.strength.trim());
  const scheduleParts = [order.dose?.trim(), order.route?.trim(), order.frequency?.trim()].filter(
    Boolean
  );
  if (order.duration?.trim()) scheduleParts.push(`× ${order.duration.trim()}`);
  const detailParts: string[] = [];
  if (scheduleParts.length) detailParts.push(scheduleParts.join(', '));
  if (order.quantity?.trim()) detailParts.push(`Qty: ${order.quantity.trim()}`);
  if (order.instructions?.trim()) detailParts.push(order.instructions.trim());
  const summary = detailParts.length
    ? `${titleParts.join(' ')} (${detailParts.join(' · ')})`
    : titleParts.join(' ');
  return `${prefix}${summary} [Manual]`;
}

export function normalizeNin(input?: string): string {
  return (input || '').replace(/\D/g, '').slice(0, 11);
}

export function isValidNin(nin?: string): boolean {
  return /^\d{11}$/.test((nin || '').trim());
}

export function maskNin(nin?: string): string {
  const clean = normalizeNin(nin);
  if (!clean) return 'Not provided';
  if (clean.length <= 4) return '•••••••';
  return `•••••••${clean.slice(-4)}`;
}
