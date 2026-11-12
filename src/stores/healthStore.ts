import { create } from 'zustand';
import { openDB, DBSchema } from 'idb';
import { Encounter, HealthState } from '@/types';

interface EncounterDB extends DBSchema {
  encounters: {
    key: string;
    value: Encounter;
  };
}

const initDB = async () => {
  return openDB<EncounterDB>('smarthealth-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('encounters')) {
        db.createObjectStore('encounters', { keyPath: 'id' });
      }
    },
  });
};

export const useHealthStore = create<HealthState>((set, get) => ({
  encounters: [],
  isOnline: navigator.onLine,

  setIsOnline: (online) => set({ isOnline: online }),

  loadEncounters: async () => {
    const db = await initDB();
    const allEncounters = await db.getAll('encounters');
    // Sort by timestamp descending
    allEncounters.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    set({ encounters: allEncounters });
  },

  addEncounter: async (newEncounter) => {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const encounter: Encounter = { ...newEncounter, id, timestamp };
    
    const db = await initDB();
    await db.put('encounters', encounter);
    
    set((state) => ({
      encounters: [encounter, ...state.encounters],
    }));
  },

  updateEncounter: async (id, updates) => {
    const db = await initDB();
    const existing = await db.get('encounters', id);
    if (existing) {
      const updated = { ...existing, ...updates };
      await db.put('encounters', updated);
      
      set((state) => ({
        encounters: state.encounters.map((e) => (e.id === id ? updated : e)),
      }));
    }
  },

  getEncounterById: (id) => {
    return get().encounters.find((e) => e.id === id);
  },
}));

// Load encounters on store initialization
useHealthStore.getState().loadEncounters();

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useHealthStore.getState().setIsOnline(true));
  window.addEventListener('offline', () => useHealthStore.getState().setIsOnline(false));
}
