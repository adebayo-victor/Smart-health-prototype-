import { create } from 'zustand';
import { openDB, DBSchema } from 'idb';
import { Encounter, HealthState } from '@/types';

interface EncounterDB extends DBSchema {
  encounters: { key: string; value: Encounter; }
}

const initDB = async () => openDB<EncounterDB>('smarthealth-db', 1, {
  upgrade(db) { if (!db.objectStoreNames.contains('encounters')) db.createObjectStore('encounters', { keyPath: 'id' }); }
});

export const useHealthStore = create<HealthState>((set, get) => ({
  encounters: [],
  isOnline: navigator.onLine,
  setIsOnline: (online) => set({ isOnline: online }),
  
  addEncounter: async (newEncounter) => {
    const id = crypto.randomUUID();
    const encounter: Encounter = { ...newEncounter, id, timestamp: new Date().toISOString() };
    const db = await initDB();
    await db.put('encounters', encounter);
    set((state) => ({ encounters: [encounter, ...state.encounters] }));
    return id;
  },

  updateEncounter: async (id, updates) => {
    const db = await initDB();
    const existing = await db.get('encounters', id);
    if (existing) {
      const updated = { ...existing, ...updates };
      await db.put('encounters', updated);
      set((state) => ({ encounters: state.encounters.map((e) => (e.id === id ? updated : e)) }));
    }
  },
}));

// Load on init
useHealthStore.getState().encounters.length === 0 && initDB().then(db => db.getAll('encounters')).then(all => set({ encounters: all.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) }));
window.addEventListener('online', () => useHealthStore.getState().setIsOnline(true));
window.addEventListener('offline', () => useHealthStore.getState().setIsOnline(false));
