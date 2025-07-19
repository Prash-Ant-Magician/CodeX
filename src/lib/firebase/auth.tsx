'use client';
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  type Auth,
  type User,
  type ConfirmationResult
} from 'firebase/auth';
import firebaseApp from './config';

export const auth = getAuth(firebaseApp);

// Export ConfirmationResult type for use in components
export type { ConfirmationResult };

// Auth context
const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth functions
export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Make sure the recaptcha container is visible
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export const signInWithPhoneNumber = (phoneNumber: string, appVerifierContainerId: string): Promise<ConfirmationResult> => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined') {
        return Promise.reject(new Error("Phone authentication can only be used in the browser."));
    }
    
    // Check if the verifier already exists, otherwise create it.
    if (!window.recaptchaVerifier) {
         window.recaptchaVerifier = new RecaptchaVerifier(auth, appVerifierContainerId, {
            'size': 'invisible',
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }

    return firebaseSignInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
};


export const signOut = () => {
  return firebaseSignOut(auth);
};
