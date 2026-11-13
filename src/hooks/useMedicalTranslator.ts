import { useState, useRef, useCallback } from 'react';
import { TranslationResponse } from '@/types';

export type TranslatorStatus = 'idle' | 'recording' | 'processing' | 'reviewing' | 'error';

export function useMedicalTranslator() {
  const [status, setStatus] = useState<TranslatorStatus>('idle');
  const [instruction, setInstruction] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [extractedData, setExtractedData] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({ dialect: false, statement: false, translation: false, vitals: false, conclusion: false });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const playInstruction = useCallback(() => {
    if (!instruction) return;
    const utterance = new SpeechSynthesisUtterance(instruction);
    const voices = window.speechSynthesis.getVoices();
    const localVoice = voices.find(v => v.lang.includes('ha') || v.lang.includes('en-NG'));
    if (localVoice) utterance.voice = localVoice;
    window.speechSynthesis.speak(utterance);
  }, [instruction]);

  const startRecording = useCallback(async () => {
    setError(null); setAudioBlob(null); setExtractedData(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingDuration(0);
      };
      mediaRecorder.start();
      setStatus('recording');
      timerRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch { setError('Microphone access denied.'); setStatus('error'); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setStatus('idle');
    }
  }, []);

  const processTranslation = useCallback(async () => {
    if (!audioBlob) { setError('No audio recorded.'); return; }
    setStatus('processing'); setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'patient_recording.webm');
      const response = await fetch('/api/v1/translator/process', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data: TranslationResponse = await response.json();
      setExtractedData(data);
      setStatus('reviewing');
    } catch (err: any) {
      setError(err.message || 'Failed to process audio. Check backend.');
      setStatus('error');
    }
  }, [audioBlob]);

  const toggleConfirmation = useCallback((key: string) => setConfirmations(p => ({ ...p, [key]: !p[key] })), []);
  const reset = useCallback(() => { setStatus('idle'); setInstruction(''); setAudioBlob(null); setExtractedData(null); setError(null); setRecordingDuration(0); setConfirmations({ dialect: false, statement: false, translation: false, vitals: false, conclusion: false }); }, []);

  return { status, instruction, audioBlob, recordingDuration, extractedData, error, confirmations, setInstruction, playInstruction, startRecording, stopRecording, processTranslation, toggleConfirmation, reset };
}
