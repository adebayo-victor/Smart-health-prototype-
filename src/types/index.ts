export interface VitalsData {
  temp?: number;
  bp_sys?: number;
  bp_dia?: number;
  spo2?: number;
  heart_rate?: number;
}

export interface TranslationResponse {
  dialect: string;
  statement: string;
  translation: string;
  vitals: VitalsData;
  conclusion: string;
  source: string;
}

export type TriageTier = 'GREEN' | 'AMBER' | 'RED';
export type EncounterStatus = 'PENDING' | 'COMPLETED' | 'REFERRED';

export interface Encounter {
  id: string;
  patientName: string;
  age?: number;
  gender?: string;
  location?: string;
  transcriptionText?: string;
  aiNotes?: string;
  triageTier: TriageTier;
  status: EncounterStatus;
  timestamp: string;
  vitals: VitalsData;
  isConfirmed: boolean;
}

export interface HealthState {
  encounters: Encounter[];
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  addEncounter: (encounter: Omit<Encounter, 'id' | 'timestamp'>) => Promise<string>; // Returns ID
  updateEncounter: (id: string, updates: Partial<Encounter>) => Promise<void>;
}
