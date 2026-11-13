import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateOfflineTriage } from '@/utils/triageRules';
import { VitalsData } from '@/types';

export default function OfflineTriage() {
  const [vitals, setVitals] = useState<VitalsData>({});
  const [result, setResult] = useState<{ tier: string; rule: string } | null>(null);
  useEffect(() => { setResult(Object.values(vitals).some(v => v !== undefined) ? calculateOfflineTriage(vitals) : null); }, [vitals]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)]">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-black text-[var(--color-slate-dark)]">Offline Triage Settler</h1>
      </div>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {(['temp', 'bp_sys', 'bp_dia', 'spo2'] as const).map((key) => (
            <div key={key} className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">{key.replace('_', ' ')}</label>
              <input type="number" value={vitals[key] || ''} onChange={(e) => setVitals({ ...vitals, [key]: parseFloat(e.target.value) })} className="w-full min-h-12 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xl font-black text-center focus:ring-2 focus:ring-[var(--color-emerald)] focus:outline-none" placeholder="0" />
            </div>
          ))}
        </div>
        {result && (
          <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 animate-fade-in ${result.tier === 'RED' ? 'bg-red-50 border-[var(--color-crimson)]' : result.tier === 'AMBER' ? 'bg-amber-50 border-[var(--color-amber)]' : 'bg-emerald-50 border-[var(--color-emerald)]'}`}>
            {result.tier === 'GREEN' ? <CheckCircle2 className="w-10 h-10 text-[var(--color-emerald)]" /> : <AlertTriangle className="w-10 h-10 text-[var(--color-crimson)]" />}
            <div>
              <p className="text-2xl font-black text-[var(--color-slate-dark)]">{result.tier} TIER</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{result.rule}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
