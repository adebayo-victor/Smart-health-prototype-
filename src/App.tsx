import React, { useState } from 'react';
import StartPage from '@/pages/StartPage';
import WorkerLogin from '@/pages/WorkerLogin';
import WorkerDashboard from '@/pages/WorkerDashboard';
import MedicalTranslator from '@/pages/MedicalTranslator';
import Diagnosis from '@/pages/Diagnosis';
import OfflineTriage from '@/pages/OfflineTriage';
import Referral from '@/pages/Referral';

type AppView = 'start' | 'login' | 'dashboard' | 'translator' | 'diagnosis' | 'triage' | 'referral';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('start');
  const [workerId, setWorkerId] = useState<string>('');

  // Navigation Helpers
  const navigate = (view: AppView) => setCurrentView(view);
  const goBack = () => {
    if (currentView === 'login') navigate('start');
    else if (['translator', 'diagnosis', 'triage', 'referral'].includes(currentView)) navigate('dashboard');
  };

  // Render Logic
  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] font-sans antialiased">
      
      {/* --- AUTH FLOW --- */}
      {currentView === 'start' && (
        <StartPage 
          onProceedAsWorker={() => navigate('login')} 
          onProceedAsUser={() => alert('User Face (Patient Chat) coming soon!')} 
        />
      )}

      {currentView === 'login' && (
        <WorkerLogin 
          onBack={() => navigate('start')} 
          onLogin={(id) => { setWorkerId(id); navigate('dashboard'); }} 
        />
      )}

      {/* --- WORKER DASHBOARD --- */}
      {currentView === 'dashboard' && (
        <WorkerDashboard 
          onNavigate={(widget) => {
            if (widget === 'translator') navigate('translator');
            if (widget === 'diagnosis') navigate('diagnosis');
            if (widget === 'triage') navigate('triage');
            if (widget === 'referral') navigate('referral');
          }}
          onViewEncounter={(id) => console.log('Viewing encounter:', id)} 
        />
      )}

      {/* --- CLINICAL WORKFLOWS (Full Screen, No Bottom Nav) --- */}
      {currentView === 'translator' && (
        <MedicalTranslator 
          onBack={goBack} 
          onRunDiagnosis={(data) => { console.log('Passing to diagnosis:', data); navigate('diagnosis'); }}
          onAutoReferral={(data) => { console.log('Auto referring:', data); navigate('referral'); }}
        />
      )}

      {currentView === 'diagnosis' && (
        <Diagnosis onBack={goBack} />
      )}

      {currentView === 'triage' && (
        <OfflineTriage />
        {/* Note: Add a back button to OfflineTriage component if needed, or wrap in a layout */}
      )}

      {currentView === 'referral' && (
        <Referral />
        {/* Note: Add a back button to Referral component if needed */}
      )}

    </div>
  );
}
