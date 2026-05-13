import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { LogIn, Shield, Key, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked! Please allow popups for this site or try again.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore user cancellation
      } else {
        setError("Authentication failed. Please check your internet connection.");
      }
    }
  };

  const signInAsAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Admin Auth error:", err);
      // Email/Password login is often not enabled by default or user doesn't exist
      setError("Admin credentials invalid. For Google login students, use the 'Back' button below.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card max-w-md w-full text-center py-12 flex flex-col items-center gap-8"
      >
        <div className="w-20 h-20 bg-secondary border-4 border-black rounded-2xl brutal-shadow flex items-center justify-center transform rotate-3">
          <Shield size={40} className="text-on-secondary" />
        </div>
        
        <div>
          <h1 className="font-headline text-4xl mb-2">ProctorEdge</h1>
          <p className="text-on-surface-variant">Secure, Private, AI-Powered Proctoring</p>
        </div>

        <AnimatePresence mode="wait">
          {!isAdminMode ? (
            <motion.div 
              key="student"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 w-full"
            >
                <div className="space-y-4">
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Candidate Entrance</p>
                  
                  {error && (
                    <p className="text-xs text-error font-bold bg-error/10 p-2 border border-error/20 text-center">
                      {error}
                    </p>
                  )}

                  <button 
                      onClick={signInWithGoogle}
                      className="brutal-btn-primary w-full flex items-center justify-center gap-3 text-lg py-4"
                  >
                      <LogIn size={20} />
                      Continue with Google
                  </button>
                  <p className="text-xs text-on-surface-variant px-8">
                      By signing in, you agree to the monitoring guidelines for academic integrity.
                  </p>
                </div>

                <button 
                  onClick={() => setIsAdminMode(true)}
                  className="text-xs font-bold text-secondary uppercase hover:underline"
                >
                  Administrator Portal
                </button>
            </motion.div>
          ) : (
            <motion.form 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={signInAsAdmin}
              className="space-y-4 w-full"
            >
              <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Key size={14} /> Integrity Hub Login
              </p>
              
              <div className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder="Admin Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container border-2 border-black p-3 text-on-surface outline-none brutal-shadow-sm focus:bg-surface-container-high"
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container border-2 border-black p-3 text-on-surface outline-none brutal-shadow-sm focus:bg-surface-container-high"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-error font-bold bg-error/10 p-2 border border-error/20">
                  {error}
                </p>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="brutal-btn-primary w-full flex items-center justify-center gap-3 text-lg py-4 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                Authenticate
              </button>

              <button 
                type="button"
                onClick={() => setIsAdminMode(false)}
                className="text-xs font-bold text-on-surface-variant uppercase hover:underline"
              >
                Back to Candidate Gate
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
