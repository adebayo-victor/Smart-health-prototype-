import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus, QrCode, Send } from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';

export default function Referral() {
  const { encounters } = useHealthStore();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [manualName, setManualName] = useState('');
  const [condition, setCondition] = useState('');
  const [generated, setGenerated] = useState(false);

  const filtered = encounters.filter(e => e.patientName.toLowerCase().includes(search.toLowerCase()));

  const handleGenerate = () => {
    setGenerated(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] pb-20">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-black text-[var(--color-slate-dark)]">Referral Pass</h1>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {!generated ? (
          <>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Search className="w-4 h-4" /> Search Previous Clients</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-[var(--color-emerald)] focus:outline-none"
                placeholder="Type patient name..."
              />
              {search && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {filtered.map(enc => (
                    <button
                      key={enc.id}
                      onClick={() => { setSelectedPatient(enc); setSearch(''); }}
                      className="w-full p-3 text-left border-b border-slate-100 last:border-0 hover:bg-slate-50 flex justify-between"
                    >
                      <span className="font-bold text-sm">{enc.patientName}</span>
                      <span className="text-xs text-slate-500">{enc.triageTier}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="p-4 bg-emerald-50 border border-[var(--color-emerald)] rounded-xl">
                <p className="text-xs font-bold text-[var(--color-emerald)] uppercase">Selected Patient</p>
                <p className="font-black text-lg">{selectedPatient.patientName}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Manual Entry Fallback</label>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Patient Name"
                className="w-full min-h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold"
              />
              <textarea
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Summary of patient's condition..."
                className="w-full min-h-24 p-4 rounded-xl border border-slate-200 bg-white text-sm"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedPatient && !manualName}
              className="w-full min-h-14 bg-[var(--color-crimson)] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              <QrCode className="w-5 h-5" /> Generate & Send Code
            </button>
          </>
        ) : (
          <div className="text-center space-y-6 py-10 animate-in zoom-in">
            <div className="w-64 h-64 mx-auto bg-white p-4 rounded-2xl border-4 border-[var(--color-slate-dark)] flex items-center justify-center">
              <QrCode className="w-48 h-48 text-[var(--color-slate-dark)]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Referral Code</p>
              <p className="text-2xl font-black text-[var(--color-slate-dark)]">#REF-{Date.now().toString().slice(-6)}</p>
            </div>
            <button className="w-full min-h-14 bg-[var(--color-amber)] text-white rounded-xl font-bold flex items-center justify-center gap-2">
              <Send className="w-5 h-5" /> Sent via Offline SMS
            </button>
            <button onClick={() => setGenerated(false)} className="text-sm font-bold text-slate-500 underline">Create Another</button>
          </div>
        )}
      </div>
    </div>
  );
}
