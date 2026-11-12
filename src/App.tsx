import { useState } from 'react';
import StartPage from './pages/StartPage.tsx';
import WorkerLogin from './pages/WorkerLogin.tsx';
import WorkerDashboard from './pages/WorkerDashboard.tsx';
import { ArrowLeft, User, CheckCircle2 } from 'lucide-react';

import MedicalTranslator from './pages/MedicalTranslator.tsx';
import { SixPartAIResponse } from './types/translator.ts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'worker-login' | 'worker-dashboard' | 'translator' | 'patient'>('start');
  const [authenticatedWorkerId, setAuthenticatedWorkerId] = useState<string>('');
  const [lastEncounterData, setLastEncounterData] = useState<SixPartAIResponse | null>(null);

  // Screen: Worker Login
  if (currentScreen === 'worker-login') {
    return (
      <WorkerLogin
        onBack={() => setCurrentScreen('start')}
        onLogin={(workerId) => {
          setAuthenticatedWorkerId(workerId);
          setCurrentScreen('worker-dashboard');
        }}
      />
    );
  }

  // Screen: Medical Translator
  if (currentScreen === 'translator') {
    return (
      <MedicalTranslator
        onBack={() => setCurrentScreen('worker-dashboard')}
        onSaveEncounter={(data) => {
          setLastEncounterData(data);
          alert(`Encounter Saved Locally (Offline Queue):\nPatient vitals (Temp: ${data.vitals.temperature_c}°C, BP: ${data.vitals.systolic_bp}/${data.vitals.diastolic_bp}) stored.`);
          setCurrentScreen('worker-dashboard');
        }}
        onRunDiagnosis={(data) => {
          setLastEncounterData(data);
          alert(`Running Clinical Diagnosis Engine for ${data.dialect} patient statement...\nPrimary Vitals: ${data.vitals.temperature_c}°C, SpO2: ${data.vitals.spo2_percent}%`);
        }}
        onAutoReferral={(data) => {
          setLastEncounterData(data);
          alert(`Generating Emergency Referral Pass:\nHigh urgency detected (Temp: ${data.vitals.temperature_c}°C, Heart Rate: ${data.vitals.heart_rate_bpm} bpm). Destination center notified.`);
        }}
      />
    );
  }

  // Screen: Worker Dashboard
  if (currentScreen === 'worker-dashboard') {
    return (
      <WorkerDashboard
        workerName="CHEW Amina Bello"
        workerId={authenticatedWorkerId || '4092'}
        centerName="Odeda Primary Healthcare Centre"
        onNavigate={(screen) => {
          if (screen === 'translator') {
            setCurrentScreen('translator');
          } else if (screen === 'home') {
            setCurrentScreen('worker-dashboard');
          } else {
            console.log(`Navigating to ${screen}`);
          }
        }}
        onEncounterClick={(encounterId) => {
          alert(`Opening Encounter: ${encounterId}\nPatient record and vitals loaded.`);
        }}
      />
    );
  }

  // Screen: Patient Mode
  if (currentScreen === 'patient') {
    return (
      <div className="min-h-screen bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-sky-50 text-[var(--color-sky-blue)] flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> Patient Mode Active
          </span>
          <h2 className="text-xl font-bold text-slate-900">Patient Care & Chat Ready</h2>
          <p className="mt-2 text-sm text-slate-600">
            Multilingual symptom assistance, health advice, and triage chat will appear here.
          </p>
          <button
            type="button"
            onClick={() => setCurrentScreen('start')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Start Page
          </button>
        </div>
      </div>
    );
  }

  // Default: Start Screen
  return (
    <StartPage
      onProceedAsWorker={() => setCurrentScreen('worker-login')}
      onProceedAsPatient={() => setCurrentScreen('patient')}
    />
  );
}


