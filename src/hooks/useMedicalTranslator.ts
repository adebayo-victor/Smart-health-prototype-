import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ConfirmedFields,
  MedicalTranslatorState,
  SixPartAIResponse,
} from '../types/translator.ts';
import { useTranslatorStore } from '../stores/useTranslatorStore.ts';

const DEFAULT_CONFIRMED: ConfirmedFields = {
  dialect: true,
  statement: true,
  translation: true,
  vitals: true,
  conclusion: true,
  source: true,
};

export interface TranslatedInstructionData {
  dialect: string;
  originalText: string;
  translatedText: string;
  engine: string;
}

export function useMedicalTranslator() {
  // State Machine: idle -> recording -> processing_stt -> processing_llm -> reviewing
  const [state, setState] = useState<MedicalTranslatorState>('idle');

  // Worker instruction & Audio TTS (Groq Orpheus TTS & Edge-TTS)
  const [instructionText, setInstructionText] = useState(
    'Please state your full name, age, and describe the symptoms you are feeling today.'
  );
  const [targetDialect, setTargetDialect] = useState<string>('Hausa');
  const [ttsEngine, setTtsEngine] = useState<'groq' | 'edge'>('groq');
  const [ttsVoice, setTtsVoice] = useState<string>('autumn');
  const [groqApiKey, setGroqApiKeyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smarthealth_groq_api_key') || '';
    }
    return '';
  });

  const setGroqApiKey = useCallback((key: string) => {
    setGroqApiKeyState(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('smarthealth_groq_api_key', key);
      } else {
        localStorage.removeItem('smarthealth_groq_api_key');
      }
    }
  }, []);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [translatedInstruction, setTranslatedInstruction] = useState<TranslatedInstructionData | null>(null);

  // Model selection & Gateway status
  const [selectedModel, setSelectedModel] = useState<string>('bedrock-amazon-nova-pro-v1-0');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'bedrock-amazon-nova-pro-v1-0',
    'bedrock-amazon-nova-lite-v1-0',
    'bedrock-deepseek-v3-2',
    'bedrock-meta-llama3-70b-instruct-v1-0',
    'bedrock-mistral-mistral-large-2402-v1-0',
  ]);

  // Patient Audio Recording & Overrides
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [patientTextOverride, setPatientTextOverride] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 6-Part Clean Boxes data and verification directly from LiteLLM
  const [cleanBoxesData, setCleanBoxesData] = useState<SixPartAIResponse | null>(null);
  const [confirmedFields, setConfirmedFields] = useState<ConfirmedFields>(DEFAULT_CONFIRMED);

  // Zustand Store
  const saveEncounterToStore = useTranslatorStore((s) => s.saveEncounter);
  const setActiveEncounterInStore = useTranslatorStore((s) => s.setActiveEncounter);

  // Audio, SpeechSynthesis & MediaRecorder references
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const actualMimeTypeRef = useRef<string>('audio/webm');
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available models on load
  useEffect(() => {
    fetch('/api/v1/translator/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
        }
        if (data.currentModel) {
          setSelectedModel(data.currentModel);
        }
      })
      .catch(() => {
        // Fallback to verified Bedrock models
      });
  }, []);

  // Clean up timers & audio on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * 1. Play Instruction:
   * Translates instruction into patient's dialect via LiteLLM.
   * Plays either audio stream (if supported) or browser native voice synthesis.
   */
  const playInstruction = useCallback(
    async (customText?: string, customDialect?: string) => {
      const text = customText || instructionText;
      const dialect = customDialect || targetDialect;
      if (!text.trim()) return;

      setIsPlayingAudio(true);
      setAudioProgress(0);
      setErrorMessage(null);

      // Stop any existing playback
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      try {
        const payload = {
          text,
          dialect,
          engine: ttsEngine,
          voice: ttsEngine === 'groq' ? ttsVoice : (dialect === 'Hausa' ? 'en-NG-EzinneNeural' : 'en-NG-AbeoNeural'),
          model: 'canopylabs/orpheus-v1-english',
          modelOverride: selectedModel,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (groqApiKey && groqApiKey.trim()) {
          headers['x-groq-api-key'] = groqApiKey.trim();
        }

        const response = await fetch('/api/v1/translator/tts', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errData.error || `TTS failed with HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // Case A: Server returned binary audio (Groq WAV or Edge-TTS MP3)
        if (contentType.includes('audio')) {
          const rawTrans = response.headers.get('x-litellm-translation');
          const transText = rawTrans ? decodeURIComponent(rawTrans) : text;
          const engine = response.headers.get('x-voice-engine') || (ttsEngine === 'groq' ? `Groq Orpheus TTS (${ttsVoice})` : 'Edge-TTS (en-NG-AbeoNeural)');

          setTranslatedInstruction({
            dialect,
            originalText: text,
            translatedText: transText,
            engine,
          });

          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audioElementRef.current = audio;

          audio.onended = () => {
            setIsPlayingAudio(false);
            setAudioProgress(100);
          };

          audio.onerror = () => {
            setIsPlayingAudio(false);
            setErrorMessage('Unable to play synthesized audio. Browser voice will be used.');
          };

          await audio.play();

          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = setInterval(() => {
            if (audio && audio.duration) {
              setAudioProgress(Math.min(100, Math.round((audio.currentTime / audio.duration) * 100)));
            }
          }, 150);
          return;
        }

        // Case B: JSON response with dialect translation and browser speech instruction
        const data = await response.json();
        const spokenText = data.translatedText || text;

        setTranslatedInstruction({
          dialect: data.dialect || dialect,
          originalText: data.originalText || text,
          translatedText: spokenText,
          engine: data.engine || 'Browser Voice Fallback',
        });

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(spokenText);
          utterance.rate = 0.9;
          utterance.pitch = 1.0;

          // Attempt to match language voice if available
          const voices = window.speechSynthesis.getVoices();
          const targetLangCode = dialect.toLowerCase().includes('hausa')
            ? 'ha'
            : dialect.toLowerCase().includes('yoruba')
            ? 'yo'
            : dialect.toLowerCase().includes('igbo')
            ? 'ig'
            : 'en-NG';

          const matchingVoice = voices.find((v) => v.lang.startsWith(targetLangCode) || v.lang.includes('NG'));
          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }

          let progressCounter = 0;
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = setInterval(() => {
            progressCounter += 4;
            setAudioProgress(Math.min(95, progressCounter));
          }, 150);

          utterance.onend = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setAudioProgress(100);
            setIsPlayingAudio(false);
          };

          utterance.onerror = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setIsPlayingAudio(false);
          };

          window.speechSynthesis.speak(utterance);
        } else {
          // Visual timer progression if Web Speech API is absent
          let counter = 0;
          const simInterval = setInterval(() => {
            counter += 10;
            setAudioProgress(Math.min(100, counter));
            if (counter >= 100) {
              clearInterval(simInterval);
              setIsPlayingAudio(false);
            }
          }, 250);
        }
      } catch (err: any) {
        setIsPlayingAudio(false);
        setErrorMessage(err.message || 'LiteLLM instruction translation failed.');
      }
    },
    [instructionText, targetDialect, selectedModel]
  );

  const pauseInstruction = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsPlayingAudio(false);
  }, []);

  /**
   * Helper to pick the best supported mime type for the current browser
   */
  const getSupportedMimeType = (): string => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  /**
   * 2. Recording Flow:
   * Captures patient audio using MediaRecorder with multi-codec resilience and iframe fallback.
   */
  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser. Please use the simulated scenario or file upload.');
      }

      // Request microphone stream with clean audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      activeStreamRef.current = stream;

      const chosenMime = getSupportedMimeType();
      actualMimeTypeRef.current = chosenMime || 'audio/webm';

      const options: MediaRecorderOptions = chosenMime ? { mimeType: chosenMime } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = actualMimeTypeRef.current || 'audio/webm';
        // Create audio blob from captured chunks
        let finalBlob: Blob;
        if (audioChunksRef.current.length > 0) {
          finalBlob = new Blob(audioChunksRef.current, { type });
        } else {
          // Fallback minimal audio container if stopped too quickly
          finalBlob = new Blob([new Uint8Array([0, 0, 0, 0])], { type });
        }

        setAudioBlob(finalBlob);
        try {
          const previewUrl = URL.createObjectURL(finalBlob);
          setAudioPreviewUrl(previewUrl);
        } catch {
          // Ignore preview URL failure in restricted environments
        }

        // Clean up tracks
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          activeStreamRef.current = null;
        }

        setState('idle');
      };

      // Collect data in small slices to guarantee data available even on short recordings
      recorder.start(200);
      setState('recording');

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone getUserMedia error:', err);
      const isPermissionDenied = err.name === 'NotAllowedError' || err.name === 'SecurityError' || err.message?.includes('Permission');

      setErrorMessage(
        isPermissionDenied
          ? 'Microphone access is blocked in this browser frame. Loading a simulated clinical voice recording instead.'
          : err.message || 'Microphone recording failed. Using simulated clinical patient voice.'
      );

      // Auto-fallback to simulated clinical patient scenario so user is never blocked
      const fallbackText = targetDialect === 'Hausa'
        ? 'Sannu likita, sunana Amina, ina da shekara 34. Ina fama da zazzaɓi mai zafi da ciwon kai kwana uku. Hawan jini na ya kasance 135/88, zafin jiki na 38.6°C.'
        : targetDialect === 'Yoruba'
        ? 'E kaaro dokita. Oruko mi ni Folake, mo je omo odun 28. Mo n ni irora ikun ti o le gan-an pelu dizziness. Eje mi ga si 145/95, otutu mi si je 37.8°C.'
        : 'Good morning doctor, my name is Emeka, I be 45 years. My body dey hot and fever dey catch me. My BP na 135/88 and my temperature dey 38.5C.';

      setPatientTextOverride(fallbackText);
      const simulatedBlob = new Blob([new TextEncoder().encode(fallbackText)], { type: 'audio/webm' });
      setAudioBlob(simulatedBlob);
      setRecordingSeconds(8);
      setState('idle');
    }
  }, [targetDialect]);

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Request any remaining audio buffer
        mediaRecorderRef.current.requestData();
      } catch {
        // Some browsers don't support requestData while stopping
      }
      mediaRecorderRef.current.stop();
      // Notice: state transition to 'idle' will happen in recorder.onstop after setting finalBlob!
    } else {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        activeStreamRef.current = null;
      }
      setState('idle');
    }
  }, []);

  /**
   * Allows direct upload of an audio recording file (webm, mp3, wav, m4a)
   */
  const handleAudioFileUpload = useCallback((file: File) => {
    setAudioBlob(file);
    setPatientTextOverride('');
    setRecordingSeconds(15);
    try {
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
    } catch {
      // Ignore preview URL failure
    }
    setErrorMessage(null);
  }, []);

  /**
   * 3. Process Translation via LiteLLM:
   * Dispatches to /api/v1/translator/process, triggering Whisper STT and LLM 6-part JSON extraction.
   */
  const processAudioTranslation = useCallback(async (customSpeechText?: string) => {
    const textToProcess = customSpeechText || patientTextOverride;
    if (!audioBlob && !textToProcess.trim()) {
      setErrorMessage('Please record patient audio or select a dialect statement before translating.');
      return;
    }

    setErrorMessage(null);
    setState('processing_stt');

    const formData = new FormData();
    if (audioBlob) {
      formData.append('audio', audioBlob, 'patient_recording.webm');
    }
    if (textToProcess) {
      formData.append('raw_text_override', textToProcess);
    }
    formData.append('dialect', targetDialect);
    formData.append('language', targetDialect === 'Hausa' ? 'ha' : 'en');
    formData.append('modelOverride', selectedModel);

    try {
      // Small visual indicator progression for STT -> LLM
      const llmTimer = setTimeout(() => {
        setState('processing_llm');
      }, 750);

      const reqHeaders: Record<string, string> = {};
      if (groqApiKey && groqApiKey.trim()) {
        reqHeaders['x-groq-api-key'] = groqApiKey.trim();
      }

      const response = await fetch('/api/v1/translator/process', {
        method: 'POST',
        headers: reqHeaders,
        body: formData,
      });

      clearTimeout(llmTimer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errJson.error || `LiteLLM failed with status ${response.status}`);
      }

      const json: SixPartAIResponse = await response.json();

      // Normalize vitals schema
      const normalizedVitals = {
        ...json.vitals,
        age: json.vitals?.age ?? null,
        gender: json.vitals?.gender ?? null,
        bp_sys: json.vitals?.bp_sys ?? json.vitals?.systolic_bp ?? null,
        bp_dia: json.vitals?.bp_dia ?? json.vitals?.diastolic_bp ?? null,
        spo2: json.vitals?.spo2 ?? json.vitals?.spo2_percent ?? null,
        temp: json.vitals?.temp ?? json.vitals?.temperature_c ?? null,
        temperature_c: json.vitals?.temp ?? json.vitals?.temperature_c ?? null,
        systolic_bp: json.vitals?.bp_sys ?? json.vitals?.systolic_bp ?? null,
        diastolic_bp: json.vitals?.bp_dia ?? json.vitals?.diastolic_bp ?? null,
        spo2_percent: json.vitals?.spo2 ?? json.vitals?.spo2_percent ?? null,
        heart_rate_bpm: json.vitals?.heart_rate_bpm ?? null,
      };

      setCleanBoxesData({
        ...json,
        vitals: normalizedVitals,
      });

      setConfirmedFields(DEFAULT_CONFIRMED);
      setState('reviewing');
    } catch (err: any) {
      setState('idle');
      setErrorMessage(err.message || 'Failed to complete LiteLLM extraction.');
    }
  }, [audioBlob, patientTextOverride, targetDialect, selectedModel]);

  // Quick preset patient scenarios for fast clinical verification
  const loadSampleScenario = useCallback((scenarioType: 'fever' | 'maternal' | 'respiratory') => {
    if (scenarioType === 'fever') {
      setTargetDialect('Hausa');
      setPatientTextOverride('Sannu likita, sunana Amina, ina da shekara 34. Ina fama da zazzaɓi mai zafi, ciwon kai da amai kwana uku. Hawan jini na ya kasance 135/88, zafin jiki na 38.6°C.');
    } else if (scenarioType === 'maternal') {
      setTargetDialect('Yoruba');
      setPatientTextOverride('E kaaro dokita. Oruko mi ni Folake, mo je omo odun 28, mo si loyun osu keje. Mo n ni irora ikun ti o le gan-an pelu dizziness. Eje mi ga si 145/95, otutu mi si je 37.8°C.');
    } else {
      setTargetDialect('Nigerian Pidgin');
      setPatientTextOverride('Good morning doctor. My name na Emeka, I be 45 years old. My chest dey pain me tight since morning and I no fit breathe well. My BP na 150/98 and my heart dey beat fast fast.');
    }
    // Simulate audio present so user can proceed
    const dummyBlob = new Blob(['sample-audio-data'], { type: 'audio/webm' });
    setAudioBlob(dummyBlob);
    setRecordingSeconds(12);
  }, []);

  // 4. Human-in-the-Loop Confirmation Toggles
  const toggleConfirmation = useCallback((field: keyof ConfirmedFields) => {
    setConfirmedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const confirmAll = useCallback(() => {
    setConfirmedFields(DEFAULT_CONFIRMED);
  }, []);

  const isAllConfirmed =
    confirmedFields.dialect &&
    confirmedFields.statement &&
    confirmedFields.translation &&
    confirmedFields.vitals &&
    confirmedFields.conclusion &&
    confirmedFields.source;

  // 5. Actions: Save Encounter, Run Diagnosis, Auto Referral
  const saveEncounter = useCallback(() => {
    if (!cleanBoxesData) return null;
    return saveEncounterToStore(cleanBoxesData, confirmedFields, 'SAVED');
  }, [cleanBoxesData, confirmedFields, saveEncounterToStore]);

  const prepareDiagnosis = useCallback(() => {
    if (!cleanBoxesData) return null;
    saveEncounterToStore(cleanBoxesData, confirmedFields, 'DIAGNOSIS_PENDING');
    setActiveEncounterInStore(cleanBoxesData, confirmedFields);
    return cleanBoxesData;
  }, [cleanBoxesData, confirmedFields, saveEncounterToStore, setActiveEncounterInStore]);

  const prepareReferral = useCallback(() => {
    if (!cleanBoxesData) return null;
    saveEncounterToStore(cleanBoxesData, confirmedFields, 'REFERRED');
    setActiveEncounterInStore(cleanBoxesData, confirmedFields);
    return cleanBoxesData;
  }, [cleanBoxesData, confirmedFields, saveEncounterToStore, setActiveEncounterInStore]);

  const resetAll = useCallback(() => {
    setState('idle');
    setAudioBlob(null);
    setPatientTextOverride('');
    setRecordingSeconds(0);
    setCleanBoxesData(null);
    setConfirmedFields(DEFAULT_CONFIRMED);
    setErrorMessage(null);
    setAudioProgress(0);
    setIsPlayingAudio(false);
    setTranslatedInstruction(null);
  }, []);

  return {
    state,
    setState,
    isIdle: state === 'idle',
    isRecording: state === 'recording',
    isProcessingSTT: state === 'processing_stt',
    isProcessingLLM: state === 'processing_llm',
    isReviewing: state === 'reviewing',
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
    recordingSeconds,
    audioBlob,
    audioPreviewUrl,
    handleAudioFileUpload,
    hasRecordedAudio: Boolean(audioBlob || patientTextOverride),
    patientTextOverride,
    setPatientTextOverride,
    loadSampleScenario,
    startRecording,
    stopRecording,
    cleanBoxesData,
    confirmedFields,
    isAllConfirmed,
    toggleConfirmation,
    confirmAll,
    processAudioTranslation,
    saveEncounter,
    prepareDiagnosis,
    prepareReferral,
    resetAll,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}
