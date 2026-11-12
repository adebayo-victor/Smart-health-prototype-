import React, { useState } from 'react';
import { ArrowLeft, Mic, Square, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';
import { TranslationResponse } from '@/types';
import CleanBox from '@/components/CleanBox';
import ConfirmationToggle from '@/components/ConfirmationToggle';
import Waveform from '@/components/Waveform';
import AudioPlayer from '@/components/AudioPlayer';

interface MedicalTranslatorProps {
  onBack: () => void;
  onRunDiagnosis: (data: TranslationResponse) => void;
  onAutoReferral: (data: TranslationResponse) => void;
}

export default function MedicalTranslator({ onBack, onRunDiagnosis, onAutoReferral }: MedicalTranslatorProps) {
  const { addEncounter } = useHealthStore();
  
  const [instruction, setInstruction] = useState('');
  const [isPlayingInstruction, setIsPlayingInstruction] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<TranslationResponse | null>(null);
  const [confirmations, setConfirmations] = useState({ dialect: false, statement: false, translation: false, vitals: false, conclusion: false });

  const handlePlayInstruction = () => {
    if (!instruction) return;
    setIsPlayingInstruction(true);
    setTimeout(() => setIsPlayingInstruction(false), 3000); // Mock TTS playback
  };

  const handleTranslate = () => {
    setIsProcessing(true);
    // Mock API call to Groq STT + LiteLLM
    setTimeout(() => {
      setExtractedData({
        dialect: 'Hausa',
        statement: 'Ina jin zazzabi da ciwon kai.',
        translation: 'I am experiencing fever and headache.',
        vitals: { temp: 38.8, bp_sys: 120, bp_dia: 80, spo2: 97 },
        conclusion: 'Patient presents with acute febrile illness. Monitor for malaria or viral infection.',
        source: 'Nigerian Standard Treatment Guidelines'
      });
      setIsProcessing(false);
    }, 2000);
  };

  const toggleConfirm = (key: keyof typeof confirmations) => {
    setConfirmations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!extractedData) return;
    await addEncounter({
      patientName: 'Unknown Patient',
      triageTier: 'GREEN',
      status: 'COMPLETED',
      vitals: extractedData.vitals,
      aiNotes: extractedData.conclusion,
      isConfirmed: Object.values(confirmations).every(Boolean),
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] pb-32">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-black text-[var(--color-slate-dark)]">Medical Translator</h1>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Step 1: Instruction */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-400">1. Worker Instruction</h2>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Please say your name and what brings you here..."
            className="w-full min-h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[var(--color-emerald)] focus:outline-none"
          />
          <button
            onClick={handlePlayInstruction}
            disabled={!instruction || isPlayingInstruction}
            className="w-full min-h-12 bg-[var(--color-sky-blue)] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            <Play className="w-4 h-4 fill-white" /> {isPlayingInstruction ? 'Playing in Hausa...' : 'Send & Play Instruction'}
          </button>
        </div>

        {/* Step 2: Record Patient */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-400">2. Patient Recording</h2>
          <Waveform isRecording={isRecording} />
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-full min-h-14 rounded-xl font-bold flex items-center justify-center gap-2 text-white ${isRecording ? 'bg-[var(--color-crimson)]' : 'bg-[var(--color-emerald)]'}`}
          >
            {isRecording ? <><Square className="w-4 h-4 fill-white" /> Stop Recording</> : <><Mic className="w-4 h-4" /> Record Patient</>}
          </button>
        </div>

        {/* Step 3: Translate & Extract */}
        {isRecording && (
          <button
            onClick={handleTranslate}
            className="w-full min-h-12 bg-slate-800 text-white rounded-xl font-bold"
          >
            Translate & Extract Data
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4 text-[var(--color-emerald)]">
            <Loader2 className="w-5 h-5 animate-spin" /> Processing with Groq & LiteLLM...
          </div>
        )}

        {extractedData && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xs font-black uppercase text-slate-400">3. Extracted Data (Confirm Accuracy)</h2>
            <div className="grid gap-3">
              <CleanBox label="Dialect" value={extractedData.dialect} />
              <ConfirmationToggle isConfirmed={confirmations.dialect} onToggle={() => toggleConfirm('dialect')} />
              
              <CleanBox label="Original Statement" value={extractedData.statement} />
              <ConfirmationToggle isConfirmed={confirmations.statement} onToggle={() => toggleConfirm('statement')} />

              <CleanBox label="Translation" value={extractedData.translation} />
              <ConfirmationToggle isConfirmed={confirmations.translation} onToggle={() => toggleConfirm('translation')} />

              <CleanBox label="Extracted Vitals" value={`Temp: ${extractedData.vitals.temp}°C, BP: ${extractedData.vitals.bp_sys}/${extractedData.vitals.bp_dia}`} />
              <ConfirmationToggle isConfirmed={confirmations.vitals} onToggle={() => toggleConfirm('vitals')} />

              <CleanBox label="Clinical Conclusion" value={extractedData.conclusion} isHighlighted />
              <ConfirmationToggle isConfirmed={confirmations.conclusion} onToggle={() => toggleConfirm('conclusion')} />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer Actions */}
      {extractedData && !isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-2 shadow-2xl">
          <button onClick={handleSave} className="flex-1 min-h-12 bg-[var(--color-amber)] text-white rounded-xl font-bold text-sm">Save Encounter</button>
          <button onClick={() => onRunDiagnosis(extractedData)} className="flex-1 min-h-12 bg-[var(--color-emerald)] text-white rounded-xl font-bold text-sm">Run Diagnosis</button>
          <button onClick={() => onAutoReferral(extractedData)} className="flex-1 min-h-12 bg-[var(--color-crimson)] text-white rounded-xl font-bold text-sm">Auto Referral</button>
        </div>
      )}
    </div>
  );
}
