import React, { useState } from 'react';
import {
  ArrowLeft,
  Mic,
  Square,
  Volume2,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  BookmarkCheck,
  Share2,
  Languages,
  Check,
  Loader2,
  BookOpen,
  Activity,
  ClipboardList,
  User,
  HeartPulse,
  Upload,
  Play,
  FileAudio,
  Key,
  Zap,
} from 'lucide-react';
import { SixPartAIResponse } from '../types/translator.ts';
import { useMedicalTranslator } from '../hooks/useMedicalTranslator.ts';

export interface MedicalTranslatorProps {
  onBack?: () => void;
  onSaveEncounter?: (data: SixPartAIResponse) => void;
  onRunDiagnosis?: (data: SixPartAIResponse) => void;
  onAutoReferral?: (data: SixPartAIResponse) => void;
}

export default function MedicalTranslator({
  onBack,
  onSaveEncounter,
  onRunDiagnosis,
  onAutoReferral,
}: MedicalTranslatorProps) {
  const {
    // State machine: idle, recording, processing_stt, processing_llm, reviewing
    state,
    isRecording,
    isProcessingSTT,
    isProcessingLLM,

    // Instruction & Audio TTS (Groq Orpheus & Edge-TTS)
    instructionText,
    setInstructionText,
    targetDialect,
    setTargetDialect,
    ttsEngine,
    setTtsEngine,
    ttsVoice,
    setTtsVoice,
    groqApiKey,
    setGroqApiKey,
    isPlayingAudio,
    audioProgress,
    translatedInstruction,
    playInstruction,
    pauseInstruction,
    selectedModel,
    setSelectedModel,
    availableModels,

    // Patient Recording & Scenarios
    recordingSeconds,
    audioBlob,
    audioPreviewUrl,
    handleAudioFileUpload,
    hasRecordedAudio,
    patientTextOverride,
    setPatientTextOverride,
    loadSampleScenario,
    startRecording,
    stopRecording,

    // 6-Part Clean Boxes & AI Processing
    cleanBoxesData,
    confirmedFields,
    isAllConfirmed,
    toggleConfirmation,
    confirmAll,
    processAudioTranslation,

    // Actions
    saveEncounter,
    prepareDiagnosis,
    prepareReferral,
    resetAll,
    errorMessage,
    clearError,
  } = useMedicalTranslator();

  const [showKeySettings, setShowKeySettings] = useState(false);
  const [tempGroqKey, setTempGroqKey] = useState(groqApiKey);

  const presetInstructions = [
    'State your name, age, and current symptoms.',
    'How many days have you had this fever or pain?',
    'Are you taking any medications or traditional herbs?',
  ];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // State badge label mapping
  const getStateBadge = () => {
    switch (state) {
      case 'recording':
        return { label: 'RECORDING', color: 'bg-rose-100 text-rose-700' };
      case 'processing_stt':
        return { label: 'SPEECH STT', color: 'bg-sky-100 text-sky-800' };
      case 'processing_llm':
        return { label: 'LITELLM 6-PART', color: 'bg-amber-100 text-amber-800' };
      case 'reviewing':
        return { label: 'CONFIRMATION', color: 'bg-emerald-100 text-emerald-800' };
      default:
        return { label: 'READY', color: 'bg-slate-100 text-slate-700' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="relative min-h-screen w-full bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] flex flex-col items-center pb-32 select-none overflow-y-auto">
      {/* 1. Header with Status Pill and Model Indicator */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.25]" />
          </button>

          <div className="text-center">
            <h1 className="text-base font-black tracking-tight text-[var(--color-slate-dark)]">
              Medical Translator
            </h1>
            <span className="text-[11px] font-semibold text-[var(--color-emerald)] flex items-center justify-center gap-1">
              <Languages className="w-3 h-3" />
              <span>LiteLLM Clinical Gateway</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="max-w-md mx-auto mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>LLM Model:</span>
          </span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-100 font-mono text-[10.5px] font-bold text-slate-800 px-2 py-1 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[240px] truncate"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto px-4 pt-4 space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Notice</p>
                <p className="text-[11px] leading-relaxed text-red-800 break-words">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 p-1 font-bold text-sm cursor-pointer"
              title="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Worker Instructions (Play Instruction) */}
        {/* Section 1: Worker Instructions (Groq Orpheus & Edge TTS) */}
        <section
          aria-labelledby="section-worker-instruction"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs"
        >
          {/* Header & Dialect Selector */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[var(--color-emerald)] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h2
                  id="section-worker-instruction"
                  className="text-sm font-bold text-[var(--color-slate-dark)] leading-tight"
                >
                  Worker Prompt & Voice TTS
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  {ttsEngine === 'groq' ? 'Groq Orpheus Ultra-Fast Speech' : 'Edge-TTS Nigerian Neural'}
                </p>
              </div>
            </div>

            {/* Dialect Selector */}
            <select
              value={targetDialect}
              onChange={(e) => setTargetDialect(e.target.value)}
              className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Hausa">Hausa (Arewa)</option>
              <option value="Yoruba">Yorùbá (South-West)</option>
              <option value="Igbo">Igbo (South-East)</option>
              <option value="Nigerian Pidgin">Nigerian Pidgin</option>
            </select>
          </div>

          {/* TTS Engine & Voice Selector Controls */}
          <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">TTS Engine:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTtsEngine('groq')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      ttsEngine === 'groq'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Groq Orpheus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtsEngine('edge')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      ttsEngine === 'edge'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Edge-TTS</span>
                  </button>
                </div>
              </div>

              {/* Voice Persona Dropdown for Groq */}
              {ttsEngine === 'groq' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Voice:</span>
                  <select
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="text-[11px] font-bold bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="autumn">Autumn (Default)</option>
                    <option value="diana">Diana (Empathetic)</option>
                    <option value="hannah">Hannah (Gentle)</option>
                    <option value="austin">Austin (Clear)</option>
                    <option value="daniel">Daniel (Direct)</option>
                    <option value="troy">Troy (Warm)</option>
                  </select>
                </div>
              )}

              {/* Key Config Button */}
              <button
                type="button"
                onClick={() => setShowKeySettings(!showKeySettings)}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                  groqApiKey
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Configure Groq API Key"
              >
                <Key className="w-3 h-3" />
                <span>{groqApiKey ? 'Key Saved' : 'Groq Key'}</span>
                {groqApiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            </div>

            {/* Expandable Groq Key Input */}
            {showKeySettings && (
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5 animate-in fade-in duration-150">
                <label className="text-[10.5px] font-bold text-slate-600">
                  Groq API Key (starts with <code className="text-emerald-700">gsk_...</code>):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={tempGroqKey}
                    onChange={(e) => setTempGroqKey(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setGroqApiKey(tempGroqKey.trim());
                      setShowKeySettings(false);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  {groqApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setGroqApiKey('');
                        setTempGroqKey('');
                      }}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Used for Whisper Large v3 STT and Orpheus TTS. If left blank, server defaults and Edge-TTS will be used.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="instruction-input" className="block text-xs font-semibold text-slate-500">
              Type instruction to translate & speak aloud to patient:
            </label>
            <textarea
              id="instruction-input"
              rows={2}
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              placeholder="e.g., Please say your name, age, and describe your symptoms..."
              className="w-full p-3 text-sm font-medium text-[var(--color-slate-dark)] bg-slate-50/70 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[var(--color-emerald)] focus:ring-3 focus:ring-emerald-500/15 transition-all resize-none"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3.5">
            {presetInstructions.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInstructionText(preset)}
                className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1 rounded-md transition-colors text-left truncate max-w-full cursor-pointer"
              >
                "{preset}"
              </button>
            ))}
          </div>

          {/* Send & Play Button */}
          <button
            type="button"
            onClick={() => playInstruction()}
            disabled={isPlayingAudio || !instructionText.trim()}
            className="w-full min-h-12 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-700/30"
          >
            {isPlayingAudio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Playing {targetDialect} Speech ({ttsEngine === 'groq' ? `Groq ${ttsVoice}` : 'Edge-TTS'})...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Send & Play {targetDialect} ({ttsEngine === 'groq' ? `Groq ${ttsVoice}` : 'Edge-TTS'}) Audio
                </span>
              </>
            )}
          </button>

          {/* Audio Player UI with Translated Dialect Text */}
          {(isPlayingAudio || audioProgress > 0 || translatedInstruction) && (
            <div className="mt-3.5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => (isPlayingAudio ? pauseInstruction() : playInstruction())}
                  className="w-10 h-10 rounded-lg bg-[var(--color-emerald)] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
                  title={isPlayingAudio ? 'Pause' : 'Play audio'}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1">
                    <span className="flex items-center gap-1 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{targetDialect} Voice ({translatedInstruction?.engine || (ttsEngine === 'groq' ? `Groq Orpheus (${ttsVoice})` : 'Edge-TTS')})</span>
                    </span>
                    <span className="text-[11px] shrink-0 font-mono">
                      {isPlayingAudio ? 'Speaking...' : 'Ready'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-emerald)] transition-all duration-200"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => playInstruction()}
                  className="p-2 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Spoken Dialect Text Box */}
              {translatedInstruction && (
                <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200/80 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    <span>Spoken {translatedInstruction.dialect}:</span>
                    <span className="text-emerald-700 font-medium font-mono text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">
                      {translatedInstruction.engine}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 italic leading-relaxed">
                    "{translatedInstruction.translatedText}"
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Patient Recording */}
        <section
          aria-labelledby="section-patient-recording"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-center"
        >
          <div className="flex items-center gap-2 mb-4 text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[var(--color-emerald)] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h2
              id="section-patient-recording"
              className="text-sm font-bold text-[var(--color-slate-dark)]"
            >
              Patient Voice Recording
            </h2>
          </div>

          {!isRecording ? (
            <div className="flex flex-col items-center py-2 space-y-3">
              {/* Primary: Record Patient Microphone Button */}
              <button
                type="button"
                onClick={startRecording}
                className="w-full min-h-14 px-6 py-4 rounded-xl bg-[var(--color-emerald)] hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-md shadow-emerald-700/25 transition-all flex items-center justify-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
              >
                <Mic className="w-6 h-6 stroke-[2.25]" />
                <span>Record Patient ({targetDialect})</span>
              </button>

              {/* Secondary Options: Audio File Upload */}
              <div className="w-full flex items-center justify-between gap-2">
                <label
                  htmlFor="patient-audio-file"
                  className="flex-1 min-h-11 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload Audio File</span>
                </label>
                <input
                  id="patient-audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAudioFileUpload(file);
                  }}
                  className="hidden"
                />
              </div>

              {/* Fast Clinical Scenario Presets */}
              <div className="w-full text-left pt-1">
                <span className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Or Test Field Clinical Scenario:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadSampleScenario('fever')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[11px] font-bold text-slate-800">🩺 Hausa Fever</span>
                    <span className="text-[10px] text-slate-500">Amina, 34 • 38.6°C</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleScenario('maternal')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[11px] font-bold text-slate-800">🤰 Yoruba BP</span>
                    <span className="text-[10px] text-slate-500">Folake, 28 • 145/95</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleScenario('respiratory')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[11px] font-bold text-slate-800">👶 Pidgin Chest</span>
                    <span className="text-[10px] text-slate-500">Emeka, 45 • Dyspnea</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 px-4 bg-red-50/60 border border-red-200 rounded-xl flex flex-col items-center">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-3">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping inline-block" />
                <span>Recording in progress...</span>
                <span className="font-mono text-base ml-2 bg-white px-2.5 py-0.5 rounded border border-rose-200 text-rose-700">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>

              {/* Pulsing frequency visualizer simulation */}
              <div className="flex items-center gap-1.5 h-8 my-2">
                {[40, 75, 90, 60, 100, 80, 45, 95, 70, 30].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Stop Recording Button */}
              <button
                type="button"
                onClick={stopRecording}
                className="mt-3 w-full min-h-12 px-6 py-3 rounded-xl bg-[var(--color-crimson)] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/40"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Recording</span>
              </button>
            </div>
          )}

          {hasRecordedAudio && !isRecording && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-emerald)]" />
                  <span>Audio Ready ({formatTimer(recordingSeconds || 12)})</span>
                </span>
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-xs text-[var(--color-emerald)] font-bold hover:underline cursor-pointer"
                >
                  Re-record
                </button>
              </div>

              {/* Audio playback preview */}
              {audioPreviewUrl && (
                <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <FileAudio className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Listen to Patient Recording</span>
                  </div>
                  <audio controls src={audioPreviewUrl} className="w-full h-8" />
                </div>
              )}

              {/* Statement transcript preview/edit */}
              <div className="space-y-1">
                <label htmlFor="patient-statement-editor" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Verbatim Patient Statement:
                </label>
                <textarea
                  id="patient-statement-editor"
                  rows={2}
                  value={patientTextOverride}
                  onChange={(e) => setPatientTextOverride(e.target.value)}
                  placeholder={`e.g., Sannu likita, ina fama da zazzabi da ciwon kai...`}
                  className="w-full p-2.5 text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* Section 3 & 4: Translation & 6-Part Clean Boxes with Confirmations */}
        {hasRecordedAudio && (
          <section
            aria-labelledby="section-clean-boxes"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[var(--color-emerald)] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h2
                  id="section-clean-boxes"
                  className="text-sm font-bold text-[var(--color-slate-dark)]"
                >
                  6-Part AI Clinical Extraction (LiteLLM)
                </h2>
              </div>

              {cleanBoxesData && (
                <button
                  type="button"
                  onClick={confirmAll}
                  className="text-xs font-semibold text-[var(--color-emerald)] hover:underline cursor-pointer"
                >
                  Confirm all
                </button>
              )}
            </div>

            {!cleanBoxesData ? (
              <button
                type="button"
                onClick={() => processAudioTranslation()}
                disabled={isProcessingSTT || isProcessingLLM}
                className="w-full min-h-14 px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-700/30"
              >
                {isProcessingSTT ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                    <span>Transcribing via Whisper STT...</span>
                  </>
                ) : isProcessingLLM ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span>Extracting 6-Part JSON via LiteLLM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Translate & Extract 6-Part Clinical Data</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4 pt-1">
                {/* Clean Box 1: Dialect */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <Languages className="w-3.5 h-3.5 text-slate-400" />
                        <span>1. Dialect</span>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-slate-dark)]">
                        {cleanBoxesData.dialect}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleConfirmation('dialect')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        confirmedFields.dialect
                          ? 'bg-emerald-50 text-[var(--color-emerald)] border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          confirmedFields.dialect
                            ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {confirmedFields.dialect && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px]">Tick to confirm accuracy</span>
                    </button>
                  </div>
                </div>

                {/* Clean Box 2: Statement (Raw verbatim text) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Mic className="w-3.5 h-3.5 text-slate-400" />
                      <span>2. Statement (Raw Audio Transcription)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleConfirmation('statement')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        confirmedFields.statement
                          ? 'bg-emerald-50 text-[var(--color-emerald)] border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          confirmedFields.statement
                            ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {confirmedFields.statement && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px]">Tick to confirm accuracy</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed italic">
                    "{cleanBoxesData.statement}"
                  </p>
                </div>

                {/* Clean Box 3: Translation (Standardized English) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                      <span>3. Translation (Standardized English)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleConfirmation('translation')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        confirmedFields.translation
                          ? 'bg-emerald-50 text-[var(--color-emerald)] border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          confirmedFields.translation
                            ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {confirmedFields.translation && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px]">Tick to confirm accuracy</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[var(--color-slate-dark)] bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/60 leading-relaxed">
                    {cleanBoxesData.translation}
                  </p>
                </div>

                {/* Clean Box 4: Vitals ({age, gender, bp_sys, bp_dia, spo2, temp}) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      <span>4. Vitals (Parsed Numerical Values)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleConfirmation('vitals')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        confirmedFields.vitals
                          ? 'bg-emerald-50 text-[var(--color-emerald)] border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          confirmedFields.vitals
                            ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {confirmedFields.vitals && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px]">Tick to confirm accuracy</span>
                    </button>
                  </div>

                  {/* Vitals Grid with demographic metadata and clinical thresholds */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="block text-[10px] font-bold text-slate-500">AGE</span>
                      <span className="text-sm font-black text-slate-900">
                        {cleanBoxesData.vitals.age ?? '--'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="block text-[10px] font-bold text-slate-500">GENDER</span>
                      <span className="text-sm font-black text-slate-900">
                        {cleanBoxesData.vitals.gender ?? '--'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="block text-[10px] font-bold text-slate-500">BP (SYS/DIA)</span>
                      <span className="text-sm font-black text-slate-900">
                        {cleanBoxesData.vitals.bp_sys ?? cleanBoxesData.vitals.systolic_bp ?? '--'}/
                        {cleanBoxesData.vitals.bp_dia ?? cleanBoxesData.vitals.diastolic_bp ?? '--'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="block text-[10px] font-bold text-slate-500">TEMP</span>
                      <span className="text-sm font-black text-rose-600">
                        {cleanBoxesData.vitals.temp ?? cleanBoxesData.vitals.temperature_c ?? '--'}°C
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="block text-[10px] font-bold text-slate-500">SPO2</span>
                      <span className="text-sm font-black text-emerald-700">
                        {cleanBoxesData.vitals.spo2 ?? cleanBoxesData.vitals.spo2_percent ?? '--'}%
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="block text-[10px] font-bold text-slate-500">HEART RATE</span>
                      <span className="text-sm font-black text-slate-900">
                        {cleanBoxesData.vitals.heart_rate_bpm ?? 98} bpm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clean Box 5: Conclusion (Clinical impression / summary) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      <span>5. Conclusion (Clinical Summary)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleConfirmation('conclusion')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        confirmedFields.conclusion
                          ? 'bg-emerald-50 text-[var(--color-emerald)] border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          confirmedFields.conclusion
                            ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {confirmedFields.conclusion && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px]">Tick to confirm accuracy</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                    {cleanBoxesData.conclusion}
                  </p>
                </div>

                {/* Clean Box 6: Source (Guideline / Protocol reference) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>6. Source (Clinical Guideline)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleConfirmation('source')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        confirmedFields.source
                          ? 'bg-emerald-50 text-[var(--color-emerald)] border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          confirmedFields.source
                            ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {confirmedFields.source && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px]">Tick to confirm accuracy</span>
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-emerald)]" />
                    <span>{cleanBoxesData.source}</span>
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Section 5: Post-Translation Sticky Footer Action Buttons */}
      {cleanBoxesData && (
        <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-xl z-40">
          <div className="max-w-md mx-auto space-y-2">
            {!isAllConfirmed && (
              <p className="text-[11px] text-amber-700 font-semibold text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Confirm all 6 clean boxes above before proceeding</span>
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {/* Button 1: Save Encounter (Amber) */}
              <button
                type="button"
                disabled={!isAllConfirmed}
                onClick={() => {
                  const saved = saveEncounter();
                  if (saved && onSaveEncounter) {
                    onSaveEncounter(saved.data);
                  }
                }}
                className="min-h-12 px-2.5 py-3 rounded-xl bg-[var(--color-amber)] hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Save encounter locally and stop here"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span className="leading-tight text-center">Save Encounter</span>
              </button>

              {/* Button 2: Run Diagnosis (Emerald - Primary) */}
              <button
                type="button"
                disabled={!isAllConfirmed}
                onClick={() => {
                  const data = prepareDiagnosis();
                  if (data && onRunDiagnosis) {
                    onRunDiagnosis(data);
                  }
                }}
                className="min-h-12 px-2.5 py-3 rounded-xl bg-[var(--color-emerald)] hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Direct to clinical diagnosis engine with confirmed 6-part data"
              >
                <Stethoscope className="w-4 h-4 stroke-[2.25]" />
                <span className="leading-tight text-center">Run Diagnosis</span>
              </button>

              {/* Button 3: Auto Referral (Crimson) */}
              <button
                type="button"
                disabled={!isAllConfirmed}
                onClick={() => {
                  const data = prepareReferral();
                  if (data && onAutoReferral) {
                    onAutoReferral(data);
                  }
                }}
                className="min-h-12 px-2.5 py-3 rounded-xl bg-[var(--color-crimson)] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                title="Generate immediate emergency referral pass"
              >
                <Share2 className="w-4 h-4" />
                <span className="leading-tight text-center">Auto Referral</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
