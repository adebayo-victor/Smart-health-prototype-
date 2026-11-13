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
  const [activeEncounterId, setActiveEncounterId] = useState<string | undefined>(undefined);

  const navigate = (view: AppView) => setCurrentView(view);
  const goBack = () => {
    setActiveEncounterId(undefined);
    if (currentView === 'login') navigate('start');
    else navigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] font-sans antialiased">
      {currentView === 'start' && <StartPage onProceedAsWorker={() => navigate('login')} onProceedAsUser={() => alert('User Face coming soon!')} />}
      {currentView === 'login' && <WorkerLogin onBack={() => navigate('start')} onLogin={() => navigate('dashboard')} />}
      {currentView === 'dashboard' && <WorkerDashboard onNavigate={(w) => { if(w==='translator') navigate('translator'); if(w==='diagnosis') navigate('diagnosis'); if(w==='triage') navigate('triage'); if(w==='referral') navigate('referral'); }} onViewEncounter={(id) => { setActiveEncounterId(id); navigate('diagnosis'); }} />}
      {currentView === 'translator' && <MedicalTranslator onBack={goBack} onRunDiagnosis={(id) => { setActiveEncounterId(id); navigate('diagnosis'); }} onAutoReferral={(id) => { setActiveEncounterId(id); navigate('referral'); }} />}
      {currentView === 'diagnosis' && <Diagnosis onBack={goBack} encounterId={activeEncounterId} />}
      {currentView === 'triage' && <OfflineTriage />}
      {currentView === 'referral' && <Referral onBack={goBack} encounterId={activeEncounterId} />}
    </div>
  );
}
