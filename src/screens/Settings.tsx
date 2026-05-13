import React, { useState } from 'react';
import { User, Bell, Shield, Laptop, Globe, Save, Loader2, Key, Mail, Camera, Smartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

export default function Settings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    email: profile?.email || '',
    institution: profile?.institution || 'Global Institute of Technology',
    notifications: true,
    biometricAuth: false,
    darkMode: true
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        institution: formData.institution,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-headline text-5xl font-extrabold text-on-surface">Settings</h1>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-2 italic">Configure your integrity perimeter</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="brutal-btn-primary px-8 py-3 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {success ? 'SAVED!' : 'SAVE CHANGES'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Profile */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <section className="brutal-card bg-surface-container-low">
            <h2 className="font-headline text-2xl mb-6 flex items-center gap-3">
              <User className="text-secondary" /> Profile Attributes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Full Identity Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    className="w-full bg-surface-container border-2 border-black p-4 pl-12 text-on-surface outline-none brutal-shadow-sm font-bold" 
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Primary Email (Locked)</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full bg-surface-container-highest border-2 border-black p-4 pl-12 text-on-surface outline-none brutal-shadow-sm font-bold cursor-not-allowed" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Linked Institution</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-surface-container border-2 border-black p-4 pl-12 text-on-surface outline-none brutal-shadow-sm font-bold" 
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="brutal-card bg-surface-container-low">
            <h2 className="font-headline text-2xl mb-6 flex items-center gap-3">
              <Shield className="text-secondary" /> Security Protocol
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-container border-2 border-black rounded-xl brutal-shadow-sm">
                <div>
                  <h4 className="font-bold flex items-center gap-2"><Smartphone size={18} className="text-secondary" /> Two-Factor Authentication</h4>
                  <p className="text-xs text-on-surface-variant">Verify identity through encrypted mobile handshake.</p>
                </div>
                <button 
                  onClick={() => setFormData({...formData, biometricAuth: !formData.biometricAuth})}
                  className={`w-14 h-7 rounded-full border-2 border-black relative transition-all ${formData.biometricAuth ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${formData.biometricAuth ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-container border-2 border-black rounded-xl brutal-shadow-sm">
                <div>
                  <h4 className="font-bold flex items-center gap-2"><Bell size={18} className="text-secondary" /> Integrity Alerts</h4>
                  <p className="text-xs text-on-surface-variant">Receive priority notifications for suspicious activity.</p>
                </div>
                <button 
                  onClick={() => setFormData({...formData, notifications: !formData.notifications})}
                  className={`w-14 h-7 rounded-full border-2 border-black relative transition-all ${formData.notifications ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${formData.notifications ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              <button className="w-full flex items-center justify-center gap-2 p-4 bg-black text-white brutal-border brutal-shadow-sm font-black uppercase tracking-widest text-xs hover:bg-black/80 transition-colors">
                <Key size={16} /> Reset Encryption Keys
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Visualization Settings */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <section className="brutal-card border-primary">
            <h3 className="font-headline text-xl mb-4 text-primary italic uppercase tracking-tighter">Hardware Manifest</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border-2 border-primary rounded-xl flex items-center gap-4">
                <div className="bg-primary text-on-primary p-2 rounded-lg">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-primary opacity-60">Primary Gaze Source</p>
                  <p className="font-bold text-sm">FaceTime HD Camera (Built-in)</p>
                </div>
              </div>
              <div className="p-4 bg-secondary/5 border-2 border-secondary rounded-xl flex items-center gap-4">
                <div className="bg-secondary text-on-secondary p-2 rounded-lg">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-secondary opacity-60">Authentication Node</p>
                  <p className="font-bold text-sm">iPhone 15 Pro (Linked)</p>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 brutal-btn-secondary py-2 text-xs font-bold uppercase">
              Recalibrate Edge Sensors
            </button>
          </section>

          <section className="brutal-card bg-surface-container-lowest opacity-80">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-secondary" />
              <h3 className="font-headline text-xl uppercase tracking-tighter">System Health</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold">Encryption Protocol</span>
                <span className="bg-secondary text-on-secondary px-2 py-0.5 rounded font-mono">AES-256-GCM</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold">Edge AI Model</span>
                <span className="bg-secondary text-on-secondary px-2 py-0.5 rounded font-mono">VOX_V3_MOD</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-outline-variant pt-2 mt-2">
                <span className="font-bold">Last Sync</span>
                <span className="opacity-60 italic">9 minutes ago</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
