import React from 'react';
import { ArrowLeft, Mic, Square, Play, Loader2, AlertCircle } from 'lucide-react';
import { useMedicalTranslator } from '@/hooks/useMedicalTranslator';
import { useHealthStore } from '@/store/healthStore';
import CleanBox from '@/components/CleanBox';
import ConfirmationToggle from '@/components/ConfirmationToggle';
import Waveform from '@/components/Waveform';

interface Props { onBack: () => void; onRunDiagnosis: (id: string) => void; onAutoReferral: (id: string) => void; }

export default function MedicalTranslator({ onBack, onRunDiagnosis, onAutoReferral }: Props) {
  const { addEncounter } = useHealthStore();
  const hook = useMedicalTranslator();

  const handleSaveAndProceed = async (action: 'diagnosis' | 'referral') => {
    if (!hook.extractedData) return;
    const id = await addEncounter({
      patientName: 'Unknown Patient', triageTier: 'GREEN', status: 'PENDING',
      vitals: hook.extractedData.vitals, aiNotes: hook.extractedData.conclusion,
      isConfirmed: Object.values(hook.confirmations).every(Boolean)
    });
    if (action === 'diagnosis') onRunDiagnosis(id); else onAutoReferral(id);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] pb-32">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-black text-[var(--color-slate-dark)]">Medical Translator</h1>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-400">1. Worker Instruction</h2>
          <input value={hook.instruction} onChange={(e) => hook.setInstruction(e.target.value)} placeholder="e.g., Please say your name and what brings you here..." className="w-full min-h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[var(--color-emerald)] focus:outline-none" />
          <button onClick={hook.playInstruction} disabled={!hook.instruction} className="w-full min-h-12 bg-[var(--color-sky-blue)] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"><Play className="w-4 h-4 fill-white" /> Play Instruction</button>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-400">2. Patient Recording</h2>
          <Waveform isRecording={hook.status === 'recording'} />
          {hook.status === 'recording' ? (
            <div className="flex items-center justify-between text-sm font-bold text-[var(--color-crimson)] px-2"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-[var(--color-crimson)] rounded-full animate-pulse" /> Recording...</span><span>{Math.floor(hook.recordingDuration/60).toString().padStart(2,'0')}:{(hook.recordingDuration%60).toString().padStart(2,'0')}</span></div>
          ) : (
            <button onClick={hook.startRecording} className="w-full min-h-14 bg-[var(--color-emerald)] text-white rounded-xl font-bold flex items-center justify-center gap-2"><Mic className="w-4 h-4" /> Record Patient</button>
          )}
          {hook.audioBlob && hook.status !== 'recording' && <button onClick={hook.startRecording} className="w-full min-h-12 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">Audio Captured ({(hook.audioBlob.size / 1024).toFixed(1)} KB) - Tap to Re-record</button>}
        </div>

        {hook.audioBlob && hook.status !== 'recording' && hook.status !== 'processing' && (
          <button onClick={hook.processTranslation} className="w-full min-h-14 bg-[var(--color-slate-dark)] text-white rounded-xl font-bold flex items-center justify-center gap-2">Translate & Extract Data</button>
        )}

        {hook.status === 'processing' && <div className="flex items-center justify-center gap-2 py-6 text-[var(--color-emerald)] bg-emerald-50 rounded-xl"><Loader2 className="w-5 h-5 animate-spin" /><span className="font-bold">Transcribing (Groq) & Extracting (LiteLLM)...</span></div>}
        {hook.error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /><span className="font-bold text-sm">{hook.error}</span></div>}

        {hook.extractedData && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xs font-black uppercase text-slate-400">3. Extracted Data (Confirm Accuracy)</h2>
            <div className="grid gap-3">
              <CleanBox label="Dialect" value={hook.extractedData.dialect} />
              <ConfirmationToggle isConfirmed={hook.confirmations.dialect} onToggle={() => hook.toggleConfirmation('dialect')} />
              <CleanBox label="Original Statement" value={hook.extractedData.statement} />
              <ConfirmationToggle isConfirmed={hook.confirmations.statement} onToggle={() => hook.toggleConfirmation('statement')} />
              <CleanBox label="Translation" value={hook.extractedData.translation} />
              <ConfirmationToggle isConfirmed={hook.confirmations.translation} onToggle={() => hook.toggleConfirmation('translation')} />
              <CleanBox label="Extracted Vitals" value={`Temp: ${hook.extractedData.vitals.temp}°C, BP: ${hook.extractedData.vitals.bp_sys}/${hook.extractedData.vitals.bp_dia}`} />
              <ConfirmationToggle isConfirmed={hook.confirmations.vitals} onToggle={() => hook.toggleConfirmation('vitals')} />
              <CleanBox label="Clinical Conclusion" value={hook.extractedData.conclusion} isHighlighted />
              <ConfirmationToggle isConfirmed={hook.confirmations.conclusion} onToggle={() => hook.toggleConfirmation('conclusion')} />
            </div>
          </div>
        )}
      </div>

      {hook.extractedData && hook.status === 'reviewing' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-2 shadow-2xl">
          <button onClick={onBack} className="flex-1 min-h-12 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">Save & Exit</button>
          <button onClick={() => handleSaveAndProceed('diagnosis')} className="flex-1 min-h-12 bg-[var(--color-emerald)] text-white rounded-xl font-bold text-sm">Run Diagnosis</button>
          <button onClick={() => handleSaveAndProceed('referral')} className="flex-1 min-h-12 bg-[var(--color-crimson)] text-white rounded-xl font-bold text-sm">Auto Referral</button>
        </div>
      )}
    </div>
  );
}
