/**
 * Strict TypeScript interfaces for the 6-part Medical Translator AI response
 * and state machine types.
 */

export interface VitalsData {
  age?: number | null;
  gender?: string | null;
  bp_sys?: number | null;
  bp_dia?: number | null;
  spo2?: number | null;
  temp?: number | null;
  // Backwards compatibility aliases
  temperature_c?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  spo2_percent?: number | null;
  heart_rate_bpm?: number | null;
}

/**
 * 6-part AI clinical output strictly required by the design spec:
 * 1. Dialect
 * 2. Statement
 * 3. Translation
 * 4. Vitals
 * 5. Conclusion
 * 6. Source
 */
export interface SixPartAIResponse {
  dialect: string;
  statement: string;
  translation: string;
  vitals: VitalsData;
  conclusion: string;
  source: string;
}

export type MedicalTranslatorState =
  | 'idle'
  | 'recording'
  | 'processing_stt'
  | 'processing_llm'
  | 'reviewing';

export type TranslatorState =
  | 'idle'
  | 'playing_instruction'
  | 'recording'
  | 'processing'
  | 'reviewing'
  | 'completed';

export interface ConfirmedFields {
  dialect: boolean;
  statement: boolean;
  translation: boolean;
  vitals: boolean;
  conclusion: boolean;
  source: boolean;
}

export interface SavedEncounter {
  id: string;
  timestamp: string;
  data: SixPartAIResponse;
  confirmedFields: ConfirmedFields;
  status: 'SAVED' | 'DIAGNOSIS_PENDING' | 'REFERRED';
}
