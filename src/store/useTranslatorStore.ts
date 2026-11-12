import { create } from 'zustand';
import { ConfirmedFields, SavedEncounter, SixPartAIResponse } from '../types/translator.ts';

interface TranslatorStoreState {
  savedEncounters: SavedEncounter[];
  activeEncounter: SixPartAIResponse | null;
  activeEncounterConfirmed: ConfirmedFields | null;
  saveEncounter: (
    data: SixPartAIResponse,
    confirmed: ConfirmedFields,
    status?: 'SAVED' | 'DIAGNOSIS_PENDING' | 'REFERRED'
  ) => SavedEncounter;
  setActiveEncounter: (data: SixPartAIResponse | null, confirmed?: ConfirmedFields | null) => void;
  clearActiveEncounter: () => void;
}

const STORAGE_KEY = 'smarthealth_encounters_cache';

const loadSavedEncounters = (): SavedEncounter[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistEncounters = (encounters: SavedEncounter[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encounters));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
};

export const useTranslatorStore = create<TranslatorStoreState>((set, get) => ({
  savedEncounters: loadSavedEncounters(),
  activeEncounter: null,
  activeEncounterConfirmed: null,

  saveEncounter: (data, confirmed, status = 'SAVED') => {
    const newEncounter: SavedEncounter = {
      id: `enc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      data,
      confirmedFields: confirmed,
      status,
    };

    const updated = [newEncounter, ...get().savedEncounters];
    persistEncounters(updated);

    set({
      savedEncounters: updated,
      activeEncounter: data,
      activeEncounterConfirmed: confirmed,
    });

    return newEncounter;
  },

  setActiveEncounter: (data, confirmed = null) => {
    set({
      activeEncounter: data,
      activeEncounterConfirmed: confirmed,
    });
  },

  clearActiveEncounter: () => {
    set({
      activeEncounter: null,
      activeEncounterConfirmed: null,
    });
  },
}));
