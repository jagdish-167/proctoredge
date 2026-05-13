import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, profile: null });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const path = `users/${user.uid}`;
          try {
            const profileDoc = await getDoc(doc(db, 'users', user.uid));
            if (profileDoc.exists()) {
              setProfile(profileDoc.data());
            } else {
              // New user
              const adminEmails = ['jagdishsolunke02@gmail.com', 'jagsol2029@gmail.com'];
              const isAdmin = adminEmails.includes(user.email || '');
              const newProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                role: isAdmin ? 'admin' : 'student',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setProfile(newProfile);
            }
          } catch (error) {
            console.error("Profile fetch/create error:", error);
            // Don't throw here to avoid breaking the auth state
            // But we can still report it
            try {
              handleFirestoreError(error, OperationType.GET, path);
            } catch (e) {
              // Ignore the throw from handleFirestoreError inside the listener
            }
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
