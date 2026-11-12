import React, { useState } from 'react';
import { ArrowLeft, Activity, Volume2, Save } from 'lucide-react';
import { calculateOfflineTriage } from '@/utils/triageRules';
import { VitalsData } from '@/types';

interface DiagnosisProps {
  onBack: () => void;
}

export default function Diagnosis({ onBack }: DiagnosisProps) {
  const [issues, setIssues] = useState('');
  const [vitals, setVitals] = useState<VitalsData>({ temp: 37.0, bp_sys: 120, bp_dia: 80, spo2: 98 });
  const [verdict, setVerdict] = useState<{ tier: string; rule: string; llm: string } | null>(null);
  const [language, setLanguage] = useState('English');

  const runAlgorithm = () => {
    const result = calculateOfflineTriage(vitals);
    setVerdict({
      tier: result.tier,
      rule: result.triggeredRule,
      llm: 'Based on the systemic footprint algorithm and provided vitals, the patient requires immediate clinical evaluation for potential infection or hypertensive crisis.'
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] pb-20">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-black text-[var(--color-slate-dark)]">Diagnosis Engine</h1>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-slate-500">Medical Issues / Symptoms</label>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            className="w-full min-h-24 p-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[var(--color-emerald)] focus:outline-none"
            placeholder="Describe patient complaints..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-slate-500">Vitals Input</label>
          <div className="grid grid-cols-2 gap-3">
            {(['temp', 'bp_sys', 'bp_dia', 'spo2'] as const).map((key) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{key.replace('_', ' ')}</label>
                <input
                  type="number"
                  value={vitals[key]}
                  onChange={(e) => setVitals({ ...vitals, [key]: parseFloat(e.target.value) })}
                  className="w-full min-h-12 px-3 rounded-lg border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-[var(--color-emerald)] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button onClick={runAlgorithm} className="w-full min-h-14 bg-[var(--color-slate-dark)] text-white rounded-xl font-bold flex items-center justify-center gap-2">
          <Activity className="w-5 h-5" /> Run Systemic Footprint Algorithm
        </button>

        {verdict && (
          <div className="space-y-4 animate-in fade-in">
            <div className={`p-4 rounded-xl border-2 ${verdict.tier === 'RED' ? 'bg-red-50 border-[var(--color-crimson)]' : verdict.tier === 'AMBER' ? 'bg-amber-50 border-[var(--color-amber)]' : 'bg-emerald-50 border-[var(--color-emerald)]'}`}>
              <p className="text-xs font-black uppercase text-slate-500">Severity Tier</p>
              <p className="text-lg font-black text-[var(--color-slate-dark)]">{verdict.tier} - {verdict.rule}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <p className="text-xs font-black uppercase text-slate-500 mb-1">AI Verdict</p>
              <p className="text-sm font-medium text-slate-800">{verdict.llm}</p>
            </div>

            <div className="flex gap-3">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="flex-1 min-h-12 px-3 rounded-xl border border-slate-200 bg-white font-bold">
                <option>English</option>
                <option>Hausa</option>
                <option>Pidgin</option>
              </select>
              <button className="flex-1 min-h-12 bg-[var(--color-sky-blue)] text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4" /> Read Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
