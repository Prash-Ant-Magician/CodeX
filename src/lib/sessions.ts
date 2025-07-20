
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface SessionData {
  topic: string;
  expert: string;
  date: string;
  time: string;
  avatarHint: string;
  description: string;
}

export interface Session extends SessionData {
  id: string;
  createdAt: Timestamp;
}

const SESSIONS_COLLECTION = 'sessions';

export const getSessions = async (): Promise<Session[]> => {
  try {
    const sessionsCollection = collection(db, SESSIONS_COLLECTION);
    const q = query(sessionsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        topic: data.topic,
        expert: data.expert,
        date: data.date,
        time: data.time,
        avatarHint: data.avatarHint,
        description: data.description,
        createdAt: data.createdAt as Timestamp,
      };
    });
  } catch (error) {
    console.error("Error fetching sessions from Firestore:", error);
    throw new Error("Could not fetch sessions.");
  }
};

export const addSession = async (sessionData: SessionData): Promise<void> => {
  try {
    await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...sessionData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding session to Firestore:", error);
    throw new Error("Could not add session.");
  }
};

export const updateSession = async (sessionId: string, sessionData: Partial<SessionData>): Promise<void> => {
    try {
        const sessionDoc = doc(db, SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionDoc, sessionData);
    } catch (error) {
        console.error("Error updating session in Firestore:", error);
        throw new Error("Could not update session.");
    }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const sessionDoc = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionDoc);
  } catch (error) {
    console.error("Error deleting session from Firestore:", error);
    throw new Error("Could not delete session.");
  }
};
