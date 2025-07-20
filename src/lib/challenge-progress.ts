
import { db } from '@/lib/firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'codeleap-challenge-progress';

// --- Firestore Functions ---

export const getCompletedChallenges = async (userId: string): Promise<string[]> => {
  try {
    const progressDocRef = doc(db, 'challengeProgress', userId);
    const docSnap = await getDoc(progressDocRef);
    if (docSnap.exists()) {
      return docSnap.data().completedIds || [];
    }
    return [];
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
      console.warn("Permission denied fetching from Firestore. Falling back to local storage.");
      return getLocalCompletedChallenges();
    }
    console.error("Error fetching completed challenges:", error);
    return getLocalCompletedChallenges(); // Fallback on any error
  }
};

export const markChallengeAsCompleted = async (userId: string, challengeId: string): Promise<void> => {
  try {
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
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
        console.warn("Permission denied saving to Firestore. Falling back to local storage.");
        markLocalChallengeAsCompleted(challengeId);
    } else {
        console.error("Error marking challenge as completed:", error);
        markLocalChallengeAsCompleted(challengeId); // Fallback on any error
    }
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
