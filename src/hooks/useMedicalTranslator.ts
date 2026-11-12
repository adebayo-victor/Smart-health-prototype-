import { useState, useRef, useCallback } from 'react';
import { TranslationResponse } from '@/types';

export type TranslatorStatus = 'idle' | 'recording' | 'processing' | 'reviewing' | 'error';

export interface UseMedicalTranslatorReturn {
  status: TranslatorStatus;
  instruction: string;
  audioBlob: Blob | null;
  recordingDuration: number;
  extractedData: TranslationResponse | null;
  error: string | null;
  confirmations: Record<string, boolean>;
  
  setInstruction: (text: string) => void;
  playInstruction: () => void; // Still uses browser TTS for instruction
  startRecording: () => void;
  stopRecording: () => void;
  processTranslation: () => Promise<void>;
  toggleConfirmation: (key: string) => void;
  reset: () => void;
}

export function useMedicalTranslator(): UseMedicalTranslatorReturn {
  const [status, setStatus] = useState<TranslatorStatus>('idle');
  const [instruction, setInstruction] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [extractedData, setExtractedData] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({
    dialect: false, statement: false, translation: false, vitals: false, conclusion: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // 1. Play Instruction (Browser Native TTS)
  const playInstruction = useCallback(() => {
    if (!instruction) return;
    const utterance = new SpeechSynthesisUtterance(instruction);
    // Try to find a Nigerian/Hausa voice if available, else default
    const voices = window.speechSynthesis.getVoices();
    const hausaVoice = voices.find(v => v.lang.includes('ha') || v.lang.includes('en-NG'));
    if (hausaVoice) utterance.voice = hausaVoice;
    window.speechSynthesis.speak(utterance);
  }, [instruction]);

  // 2. Real Audio Recording
  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setExtractedData(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop()); // Stop mic
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingDuration(0);
      };

      mediaRecorder.start();
      setStatus('recording');
      
      // Start Timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Microphone access denied or unavailable.');
      setStatus('error');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setStatus('idle');
    }
  }, []);

  // 3. Real API Pipeline (No Mocks)
  const processTranslation = useCallback(async () => {
    if (!audioBlob) {
      setError('No audio recorded. Please record the patient first.');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'patient_recording.webm');

      // CALL YOUR BACKEND ENDPOINT
      const response = await fetch('/api/v1/translator/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: TranslationResponse = await response.json();
      setExtractedData(data);
      setStatus('reviewing');

    } catch (err: any) {
      setError(err.message || 'Failed to process audio. Check backend connection.');
      setStatus('error');
    }
  }, [audioBlob]);

  const toggleConfirmation = useCallback((key: string) => {
    setConfirmations(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setInstruction('');
    setAudioBlob(null);
    setExtractedData(null);
    setError(null);
    setRecordingDuration(0);
    setConfirmations({ dialect: false, statement: false, translation: false, vitals: false, conclusion: false });
  }, []);

  return {
    status, instruction, audioBlob, recordingDuration, extractedData, error, confirmations,
    setInstruction, playInstruction, startRecording, stopRecording, processTranslation, toggleConfirmation, reset
  };
}
