import { useState, useCallback } from 'react';
import { TranslationResponse } from '@/types';

export type TranslatorStatus = 'idle' | 'recording' | 'processing' | 'reviewing' | 'completed';

export interface UseMedicalTranslatorReturn {
  status: TranslatorStatus;
  instruction: string;
  extractedData: TranslationResponse | null;
  confirmations: Record<string, boolean>;
  
  setInstruction: (text: string) => void;
  playInstruction: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  processTranslation: () => Promise<void>;
  toggleConfirmation: (key: string) => void;
  reset: () => void;
}

export function useMedicalTranslator(): UseMedicalTranslatorReturn {
  const [status, setStatus] = useState<TranslatorStatus>('idle');
  const [instruction, setInstruction] = useState('');
  const [extractedData, setExtractedData] = useState<TranslationResponse | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({
    dialect: false,
    statement: false,
    translation: false,
    vitals: false,
    conclusion: false,
  });

  // Mock TTS Playback
  const playInstruction = useCallback(async () => {
    if (!instruction) return;
    // In production: call backend /api/v1/translator/tts and play audio
    console.log('Playing instruction via edge-tts:', instruction);
    await new Promise(resolve => setTimeout(resolve, 2000)); 
  }, [instruction]);

  const startRecording = useCallback(() => {
    setStatus('recording');
    // In production: initialize MediaRecorder API here
  }, []);

  const stopRecording = useCallback(() => {
    // In production: stop MediaRecorder and store blob
    setStatus('idle'); 
  }, []);

  // Mock STT + LLM Pipeline
  const processTranslation = useCallback(async () => {
    setStatus('processing');
    
    // Simulate API latency (Groq STT + LiteLLM LLM)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock successful response
    const mockResponse: TranslationResponse = {
      dialect: 'Hausa',
      statement: 'Ina jin zazzabi da ciwon kai tun jiya.',
      translation: 'I have been experiencing fever and headache since yesterday.',
      vitals: { temp: 38.8, bp_sys: 120, bp_dia: 80, spo2: 97, heart_rate: 88 },
      conclusion: 'Patient presents with acute febrile illness. Rule out malaria and viral infection.',
      source: 'Nigerian Standard Treatment Guidelines (NSTG)'
    };

    setExtractedData(mockResponse);
    setStatus('reviewing');
  }, []);

  const toggleConfirmation = useCallback((key: string) => {
    setConfirmations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setInstruction('');
    setExtractedData(null);
    setConfirmations({
      dialect: false, statement: false, translation: false, vitals: false, conclusion: false
    });
  }, []);

  return {
    status,
    instruction,
    extractedData,
    confirmations,
    setInstruction,
    playInstruction,
    startRecording,
    stopRecording,
    processTranslation,
    toggleConfirmation,
    reset
  };
}
