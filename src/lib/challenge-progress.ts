
import { db } from '@/lib/firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'codeleap-challenge-progress';

// --- Firestore Functions ---

export const getCompletedChallenges = async (userId: string): Promise<string[]> => {
  const progressDocRef = doc(db, 'challengeProgress', userId);
  const docSnap = await getDoc(progressDocRef);
  if (docSnap.exists()) {
    return docSnap.data().completedIds || [];
  }
  return [];
};

export const markChallengeAsCompleted = async (userId: string, challengeId: string): Promise<void> => {
  const progressDocRef = doc(db, 'challengeProgress', userId);
  const docSnap = await getDoc(progressDocRef);

  if (docSnap.exists()) {
    await updateDoc(progressDocRef, {
      completedIds: arrayUnion(challengeId),
    });
  } else {
    await setDoc(progressDocRef, {
      completedIds: [challengeId],
    });
  }
};


// --- Local Storage Functions (for non-authenticated users) ---

export const getLocalCompletedChallenges = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const progressJson = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (progressJson) {
    try {
      const parsed = JSON.parse(progressJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse challenge progress from localStorage", e);
      return [];
    }
  }
  return [];
};

export const markLocalChallengeAsCompleted = (challengeId: string): void => {
   if (typeof window === 'undefined') {
    return;
  }
  const completed = getLocalCompletedChallenges();
  if (!completed.includes(challengeId)) {
    completed.push(challengeId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completed));
  }
};
