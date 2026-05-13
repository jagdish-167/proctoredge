import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Globe, Laptop, Play, SkipBack, SkipForward, AlertTriangle, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { explainFlag } from '../services/geminiService';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Incident } from '../types';

export default function TriageReview({ incidentId, onBack }: { incidentId: string | null; onBack: () => void }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>("Analyzing environmental context via edge-AI metadata...");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    const path = `incidents/${incidentId}`;

    async function fetchData() {
      setLoading(true);
      try {
        const docRef = doc(db, 'incidents', incidentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Incident;
          setIncident(data);
          
          try {
            const explanation = await explainFlag(
              data.type, 
              data.description
            );
            setAiExplanation(explanation);
          } catch (aiError) {
            console.warn("AI Explanation quota reached, using local logic:", aiError);
            setAiExplanation(`PROTOCOL ANALYSIS: The ${data.severity} severity anomaly of type "${data.type}" suggests a potential breach of the integrity perimeter. Metadata packet reveals: ${data.description}. Recommended action: Manual visual verification.`);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [incidentId]);

  const handleUpdateStatus = async (newStatus: 'cleared' | 'flagged') => {
    if (!incident || !incidentId) return;
    setIsUpdating(true);
    const path = `incidents/${incidentId}`;
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'incidents', incidentId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setIncident({ ...incident, status: newStatus });
      alert(`Incident successfully marked as ${newStatus.toUpperCase()}. Integrity log synchronized.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-secondary" size={64} />
        <p className="font-black text-on-surface-variant uppercase tracking-widest animate-pulse">Decrypting evidence packet...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-20">
        <p>Incident not found.</p>
        <button onClick={onBack} className="mt-4 brutal-btn-secondary">Back to Queue</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold">Back to Queue</span>
        </button>
        <div className="flex gap-4">
          <span className={`px-4 py-2 border-2 border-black font-bold brutal-shadow-sm flex items-center gap-2 ${(incident as any).severity === 'CRITICAL' ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'}`}>
            <AlertTriangle size={16} /> {(incident as any).severity} PRIORITY
          </span>
          <span className="bg-surface-container text-primary px-4 py-2 border-2 border-black font-bold brutal-shadow-sm">
            CONFIDENCE: {(incident.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Evidence Image */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-black border-4 border-black brutal-shadow-lg relative aspect-video overflow-hidden group">
            <img 
              src={incident.imageUrl} 
              alt="Proctor Feed Evidence" 
              className="w-full h-full object-contain"
            />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black/20 via-transparent to-transparent">
              <div className="flex justify-between items-start">
                <div className="bg-error/80 backdrop-blur-md border-2 border-black px-3 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-data text-xs text-white uppercase tracking-tighter">EVIDENCE SNAPSHOT • {new Date(incident.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explainable Insights */}
          <div className="brutal-card border-secondary bg-surface-container-low shadow-[4px_4px_0px_0px_var(--color-secondary)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary/10 border-2 border-secondary flex items-center justify-center shrink-0">
                <ShieldAlert className="text-secondary" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-headline text-lg text-secondary uppercase font-bold tracking-wider">AI Explainability Insight</h4>
                <p className="text-on-surface font-body italic">"{aiExplanation}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="brutal-card border-tertiary">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 border-4 border-tertiary rounded-full overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
                   <User size={32} className="text-tertiary" />
                </div>
                <div>
                   <h3 className="font-headline text-2xl font-bold truncate max-w-[200px]">{incident.studentEmail?.split('@')[0]}</h3>
                   <p className="font-data text-sm text-on-surface-variant uppercase truncate max-w-[200px]">{incident.studentEmail}</p>
                </div>
             </div>
             
             <div className="space-y-3">
               {[
                 { label: 'Incident Type', value: incident.type, icon: AlertTriangle },
                 { label: 'Exam Session', value: incident.examId.substring(0, 8), icon: Laptop },
                 { label: 'Detection Time', value: new Date(incident.timestamp).toLocaleTimeString(), icon: User },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center py-2 border-b border-outline-variant/30 text-sm">
                    <span className="text-on-surface-variant flex items-center gap-2"><item.icon size={14} /> {item.label}</span>
                    <span className="font-bold truncate max-w-[120px]">{item.value}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Metadata Packet</h4>
            <div className="p-4 bg-surface-container-lowest border-2 border-black brutal-shadow-sm font-mono text-[10px] leading-relaxed opacity-60">
               INCIDENT_ID: {incident.id}<br/>
               REASONING: {incident.description}<br/>
               CONFIDENCE: {incident.confidence}<br/>
               SYSTEM_PROTOCOL: EDGE_VOX_V3
            </div>
          </div>

          <div className="flex gap-4 mt-auto">
            <button 
              onClick={() => handleUpdateStatus('cleared')}
              disabled={isUpdating || (incident as any).status === 'cleared'}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-black uppercase text-xs transition-all ${(incident as any).status === 'cleared' ? 'bg-secondary text-black brutal-border cursor-not-allowed opacity-80' : 'bg-surface-container border-2 border-black hover:bg-secondary/10'}`}
            >
              <CheckCircle size={16} />
              {(incident as any).status === 'cleared' ? 'CLEARED' : 'CLEAR ISSUE'}
            </button>
            <button 
              onClick={() => handleUpdateStatus('flagged')}
              disabled={isUpdating || (incident as any).status === 'flagged'}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-black uppercase text-xs transition-all ${(incident as any).status === 'flagged' ? 'bg-error text-on-error brutal-border cursor-not-allowed opacity-80' : 'brutal-btn-primary bg-error text-white'}`}
            >
              <ShieldAlert size={16} />
              {(incident as any).status === 'flagged' ? 'FLAGGED' : 'FLAG SESSION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

