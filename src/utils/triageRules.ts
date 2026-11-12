import { VitalsData, TriageTier } from '@/types';

export interface TriageResult {
  tier: TriageTier;
  triggeredRule: string;
}

export function calculateOfflineTriage(vitals: VitalsData): TriageResult {
  const { temp, bp_sys, bp_dia, spo2 } = vitals;

  // RED Tier Checks
  if (temp !== undefined && temp > 39.5) return { tier: 'RED', triggeredRule: 'Critical Hyperthermia (Temp > 39.5°C)' };
  if (bp_sys !== undefined && bp_sys > 160) return { tier: 'RED', triggeredRule: 'Severe Systolic Hypertension (Sys BP > 160)' };
  if (bp_dia !== undefined && bp_dia > 100) return { tier: 'RED', triggeredRule: 'Severe Diastolic Hypertension (Dia BP > 100)' };
  if (spo2 !== undefined && spo2 < 90) return { tier: 'RED', triggeredRule: 'Critical Hypoxemia (SpO2 < 90%)' };

  // AMBER Tier Checks
  if (temp !== undefined && temp > 38.5) return { tier: 'AMBER', triggeredRule: 'High Fever (Temp > 38.5°C)' };
  if (bp_sys !== undefined && bp_sys > 140) return { tier: 'AMBER', triggeredRule: 'Elevated Systolic BP (Sys BP > 140)' };
  if (bp_dia !== undefined && bp_dia > 90) return { tier: 'AMBER', triggeredRule: 'Elevated Diastolic BP (Dia BP > 90)' };

  // GREEN Tier
  return { tier: 'GREEN', triggeredRule: 'All recorded vitals within stable physiological ranges' };
}
