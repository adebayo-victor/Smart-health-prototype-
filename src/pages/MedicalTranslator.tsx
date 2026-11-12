import React from 'react';
import { ArrowLeft, Mic, Square, Play, Loader2, AlertCircle } from 'lucide-react';
import { useMedicalTranslator } from '@/hooks/useMedicalTranslator';
import CleanBox from '@/components/CleanBox';
import ConfirmationToggle from '@/components/ConfirmationToggle';
import Waveform from '@/components/Waveform';

interface MedicalTranslatorProps {
  onBack: () => void;
  onRunDiagnosis: (data: any) => void;
  onAutoReferral: (data: any) => void;
}

export default function MedicalTranslator({ onBack, onRunDiagnosis, onAutoReferral }: MedicalTranslatorProps) {
  const {
    status, instruction, audioBlob, recordingDuration, extractedData, error, confirmations,
    setInstruction, playInstruction, startRecording, stopRecording, processTranslation, toggleConfirmation
  } = useMedicalTranslator();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            onClick={playInstruction}
            disabled={!instruction}
            className="w-full min-h-12 bg-[var(--color-sky-blue)] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            <Play className="w-4 h-4 fill-white" /> Play Instruction
          </button>
        </div>

        {/* Step 2: Record Patient */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-400">2. Patient Recording</h2>
          <Waveform isRecording={status === 'recording'} />
          
          {status === 'recording' ? (
            <div className="flex items-center justify-between text-sm font-bold text-[var(--color-crimson)] px-2">
              <span className="flex items-center gap-2"><span className="w-2 h-2 bg-[var(--color-crimson)] rounded-full animate-pulse" /> Recording...</span>
              <span>{formatTime(recordingDuration)}</span>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="w-full min-h-14 bg-[var(--color-emerald)] text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" /> Record Patient
            </button>
          )}

          {audioBlob && status !== 'recording' && (
            <button
              onClick={stopRecording} // Actually just resets UI, blob is already saved
              className="w-full min-h-12 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm"
            >
              Audio Captured ({(audioBlob.size / 1024).toFixed(1)} KB) - Tap to Re-record
            </button>
          )}
        </div>

        {/* Step 3: Translate & Extract */}
        {audioBlob && status !== 'recording' && status !== 'processing' && (
          <button
            onClick={processTranslation}
            className="w-full min-h-14 bg-[var(--color-slate-dark)] text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            Translate & Extract Data
          </button>
        )}

        {status === 'processing' && (
          <div className="flex items-center justify-center gap-2 py-6 text-[var(--color-emerald)] bg-emerald-50 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin" /> 
            <span className="font-bold">Transcribing (Groq) & Extracting (LiteLLM)...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" /> <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {/* Step 4: Extracted Data */}
        {extractedData && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xs font-black uppercase text-slate-400">3. Extracted
