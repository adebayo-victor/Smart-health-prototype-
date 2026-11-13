import { useState, useRef, useCallback } from 'react';
import { TranslationResponse } from '@/types';

export type TranslatorStatus = 'idle' | 'recording' | 'processing' | 'reviewing' | 'error';

export function useMedicalTranslator() {
  const [status, setStatus] = useState<TranslatorStatus>('idle');
  const [instruction, setInstruction] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<'ha' | 'pcm' | 'en'>('ha'); // ha=Hausa, pcm=Pidgin, en=English
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [extractedData, setExtractedData] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({ dialect: false, statement: false, translation: false, vitals: false, conclusion: false });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // UPDATED: Calls backend Edge TTS service to generate and play audio in selected language
  const playInstruction = useCallback(async () => {
    if (!instruction) return;
    setError(null);
    try {
      const response = await fetch('/api/v1/translator/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: instruction, language: targetLanguage }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.error('TTS Error:', err);
      setError('Failed to play instruction. Check network or try again.');
    }
  }, [instruction, targetLanguage]);

  const startRecording = useCallback(async () => {
    setError(null); setAudioBlob(null); setAudioFileName(''); setExtractedData(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
        setAudioFileName('recorded_audio.webm');
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingDuration(0);
        setStatus('idle');
      };
      mediaRecorder.start();
      setStatus('recording');
      timerRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch { setError('Microphone access denied.'); setStatus('error'); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    setError(null);
    setExtractedData(null);
    setAudioBlob(new Blob([file], { type: file.type }));
    setAudioFileName(file.name);
    setStatus('idle');
  }, []);

  // UPDATED: Robust error catching for the translation pipeline
  const processTranslation = useCallback(async () => {
    if (!audioBlob) { setError('No audio provided. Please record or upload a file.'); return; }
    setStatus('processing');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, audioFileName || 'patient_audio.webm');
      
      const response = await fetch('/api/v1/translator/process', { method: 'POST', body: formData });
      
      // 1. Check if backend returned an error (might be JSON or plain text)
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMsg = `Server Error: ${response.statusText}`;
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          errorMsg = errData.detail || errorMsg;
        } else {
          const text = await response.text();
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      // 2. Ensure the success response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server. Expected JSON.');
      }

      const data: TranslationResponse = await response.json();
      setExtractedData(data);
      setStatus('reviewing');
    } catch (err: any) {
      console.error('Translation Pipeline Error:', err);
      
      // 3. Map technical errors to user-friendly messages for the CHEW
      let friendlyError = 'Failed to process audio. Please try again.';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        friendlyError = 'Network error: Cannot reach the backend server. Check your connection.';
      } else if (err.message.includes('400') || err.message.toLowerCase().includes('transcription failed') || err.message.toLowerCase().includes('empty')) {
        friendlyError = 'Audio unclear or empty. Please record in a quiet environment or speak louder.';
      } else if (err.message.includes('413')) {
        friendlyError = 'Audio file is too large. Please keep recordings under 2 minutes.';
      } else {
        friendlyError = err.message || friendlyError;
      }
      
      setError(friendlyError);
      setStatus('error');
    }
  }, [audioBlob, audioFileName]);

  const toggleConfirmation = useCallback((key: string) => setConfirmations(p => ({ ...p, [key]: !p[key] })), []);
  
  const reset = useCallback(() => { 
    setStatus('idle'); setInstruction(''); setAudioBlob(null); setAudioFileName(''); 
    setExtractedData(null); setError(null); setRecordingDuration(0); 
    setConfirmations({ dialect: false, statement: false, translation: false, vitals: false, conclusion: false }); 
  }, []);

  return { 
    status, instruction, targetLanguage, setTargetLanguage, audioBlob, audioFileName, recordingDuration, extractedData, error, confirmations, 
    setInstruction, playInstruction, startRecording, stopRecording, handleFileUpload, processTranslation, toggleConfirmation, reset 
  };
}
