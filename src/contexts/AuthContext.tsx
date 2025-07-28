import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    const userData: User = {
      uid: user.uid,
      email: user.email!,
      role: 'personel',
      isApproved: false,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Biraz bekle, Firebase tam başlasın
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            // Eğer kullanıcı dokümanı yoksa, yeni oluştur
            const userData: User = {
              uid: user.uid,
              email: user.email!,
              role: 'personel',
              isApproved: false,
              createdAt: new Date()
            };
            await setDoc(doc(db, 'users', user.uid), userData);
            setCurrentUser(userData);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (user) {
          // Fallback: Basic user bilgisi kullan
          setCurrentUser({
            uid: user.uid,
            email: user.email!,
            role: 'personel',
            isApproved: false,
            createdAt: new Date()
          });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 