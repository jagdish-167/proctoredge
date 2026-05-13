import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Overview from './screens/Overview';
import Analytics from './screens/Analytics';
import ExamSetup from './screens/ExamSetup';
import FlaggedEvents from './screens/FlaggedEvents';
import TriageReview from './screens/TriageReview';
import AdminPortal from './screens/AdminPortal';
import ProctoringSession from './screens/ProctoringSession';
import Settings from './screens/Settings';
import Documentation from './screens/Documentation';
import Support from './screens/Support';
import Auth from './screens/Auth';
import { Screen, Exam } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, profile } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  if (!user) {
    return <Auth />;
  }

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setActiveScreen('proctoring');
  };

  const renderScreen = () => {
    const adminEmails = ['jagdishsolunke02@gmail.com', 'jagsol2029@gmail.com'];
    const isAdmin = adminEmails.includes(user?.email || '') || profile?.role === 'admin';

    switch (activeScreen) {
      case 'overview':
        return <Overview setScreen={setActiveScreen} onStartExam={handleStartExam} />;
      case 'analytics':
        return <Analytics />;
      case 'setup':
        return <ExamSetup onComplete={() => setActiveScreen('overview')} />;
      case 'flagged':
        return <FlaggedEvents onTriage={(id) => {
          setSelectedIncidentId(id);
          setActiveScreen('triage');
        }} />;
      case 'triage':
        return <TriageReview incidentId={selectedIncidentId} onBack={() => setActiveScreen('flagged')} />;
      case 'admin':
        return isAdmin ? <AdminPortal /> : <Overview setScreen={setActiveScreen} onStartExam={handleStartExam} />;
      case 'settings':
        return <Settings />;
      case 'documentation':
        return <Documentation />;
      case 'support':
        return <Support />;
      case 'proctoring':
        return activeExam ? (
          <ProctoringSession 
            exam={activeExam} 
            onFinish={() => {
              setActiveScreen('overview');
              setActiveExam(null);
            }} 
          />
        ) : <Overview setScreen={setActiveScreen} onStartExam={handleStartExam} />;
      default:
        return <Overview setScreen={setActiveScreen} onStartExam={handleStartExam} />;
    }
  };

  const getTitle = () => {
    switch (activeScreen) {
      case 'overview': return 'Institutional Overview';
      case 'analytics': return 'Performance Analytics';
      case 'flagged': return 'Flagged Events Queue';
      case 'setup': return 'Configure New Session';
      case 'triage': return 'Triage Review';
      case 'admin': return 'Platform Integrity Hub';
      case 'settings': return 'Configuration Perimeter';
      case 'documentation': return 'Operator Manual';
      case 'support': return 'Resolution Center';
      default: return 'ProctorEdge';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeScreen={activeScreen === 'triage' ? 'flagged' : activeScreen === 'settings' ? 'setup' : activeScreen} 
        setScreen={setActiveScreen} 
      />
      
      <main className="pl-64 min-h-screen flex flex-col">
        <TopBar 
          title={getTitle()} 
          onOpenSettings={() => setActiveScreen('settings')} 
        />
        
        <div className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
