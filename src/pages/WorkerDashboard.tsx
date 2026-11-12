import React from 'react';
import { Languages, Stethoscope, Activity, QrCode, Wifi, WifiOff, Clock, ChevronRight } from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';

interface WorkerDashboardProps {
  onNavigate: (page: 'translator' | 'diagnosis' | 'triage' | 'referral') => void;
  onViewEncounter: (id: string) => void;
}

export default function WorkerDashboard({ onNavigate, onViewEncounter }: WorkerDashboardProps) {
  const { encounters, isOnline } = useHealthStore();

  const widgets = [
    { id: 'translator', label: 'Medical Translator', sub: 'Translate patient speech', icon: Languages, color: 'text-[var(--color-emerald)]', bg: 'bg-emerald-50' },
    { id: 'diagnosis', label: 'Diagnosis', sub: 'Run clinical diagnosis', icon: Stethoscope, color: 'text-[var(--color-sky-blue)]', bg: 'bg-sky-50' },
    { id: 'triage', label: 'Offline Triage Settler', sub: 'Check vitals thresholds', icon: Activity, color: 'text-[var(--color-amber)]', bg: 'bg-amber-50' },
    { id: 'referral', label: 'Referral Pass', sub: 'Generate referral QR', icon: QrCode, color: 'text-[var(--color-crimson)]', bg: 'bg-crimson-50' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] pb-20">
      {/* Header */}
      <div className="bg-white p-6 pb-8 rounded-b-3xl shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-black text-[var(--color-slate-dark)]">Welcome, CHEW Amina</h1>
            <p className="text-xs text-slate-500 mt-1">ID: 4092 • Odeda Primary Healthcare Centre</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-sky-50 text-[var(--color-sky-blue)]' : 'bg-slate-100 text-slate-500'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 space-y-8">
        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-sm font-bold text-[var(--color-slate-dark)] mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {widgets.map((w) => (
              <button
                key={w.id}
                onClick={() => onNavigate(w.id as any)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-3 min-h-[100px] hover:shadow-md transition"
              >
                <div className={`w-10 h-10 rounded-xl ${w.bg} flex items-center justify-center`}>
                  <w.icon className={`w-5 h-5 ${w.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[var(--color-slate-dark)] leading-tight">{w.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{w.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Previous Encounters */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-[var(--color-slate-dark)]">Recent field encounters</h2>
            <button className="text-xs font-bold text-[var(--color-emerald)]">View all</button>
          </div>
          <div className="space-y-2">
            {encounters.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No encounters yet.</p>
            ) : (
              encounters.slice(0, 4).map((enc) => (
                <button
                  key={enc.id}
                  onClick={() => onViewEncounter(enc.id)}
                  className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[var(--color-slate-dark)] truncate">Patient #{enc.id.slice(0, 4)}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${
                        enc.triageTier === 'RED' ? 'bg-[var(--color-crimson)]' : enc.triageTier === 'AMBER' ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-emerald)]'
                      }`}>
                        Tier {enc.triageTier === 'RED' ? '3' : enc.triageTier === 'AMBER' ? '2' : '1'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{enc.patientName} • {enc.aiNotes || 'Pending notes'}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(enc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
