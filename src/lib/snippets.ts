import { db } from '@/lib/firebase/firestore';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: string | Timestamp; // Allow both string for local and Timestamp for Firebase
}

export interface SnippetData {
    name: string;
    language: string;
    code: string;
}

const LOCAL_STORAGE_KEY = 'codeleap-snippets';

// --- Firestore Functions ---

export const saveSnippet = async (userId: string, snippetData: SnippetData): Promise<Snippet | null> => {
  try {
    const snippetsCollection = collection(db, 'users', userId, 'snippets');
    const docRef = await addDoc(snippetsCollection, {
      ...snippetData,
      createdAt: serverTimestamp(),
    });
    return {
        id: docRef.id,
        ...snippetData,
        createdAt: new Date().toISOString(), // Return a client-side date for immediate use
    };
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
      console.warn("Permission denied saving snippet to Firestore. Falling back to local storage.");
      return saveLocalSnippet(snippetData);
    }
    console.error("Error saving snippet:", error);
    return saveLocalSnippet(snippetData); // Fallback on any error
  }
};

export const getSnippets = async (userId: string): Promise<Snippet[]> => {
    try {
        const snippetsCollection = collection(db, 'users', userId, 'snippets');
        const q = query(snippetsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
            id: doc.id,
            name: data.name,
            language: data.language,
            code: data.code,
            // Convert Timestamp to ISO string for consistency
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            };
        });
    } catch (error: any) {
        if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
            console.warn("Permission denied fetching snippets from Firestore. Falling back to local storage.");
            return getLocalSnippets();
        }
        console.error("Error fetching snippets:", error);
        return getLocalSnippets(); // Fallback on any error
    }
};

export const deleteSnippet = async (userId: string, snippetId: string): Promise<void> => {
  try {
    const snippetDoc = doc(db, 'users', userId, 'snippets', snippetId);
    await deleteDoc(snippetDoc);
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
        console.warn("Permission denied deleting snippet from Firestore. Snippet might only exist locally.");
    } else {
        console.error("Error deleting snippet:", error);
    }
    // Attempt to delete from local storage as a fallback regardless.
    deleteLocalSnippet(snippetId);
  }
};


// --- Local Storage Functions (for non-authenticated users) ---

export const getLocalSnippets = (): Snippet[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const snippetsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (snippetsJson) {
    try {
      const parsed = JSON.parse(snippetsJson);
      // sort by date descending
      return parsed.sort((a: Snippet, b: Snippet) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    } catch (e) {
      console.error("Failed to parse snippets from localStorage", e);
      return [];
    }
  }
  return [];
};

export const saveLocalSnippet = (snippet: SnippetData): Snippet | null => {
   if (typeof window === 'undefined') {
    return null;
  }
  const snippets = getLocalSnippets();
  const newSnippet: Snippet = {
    ...snippet,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  snippets.unshift(newSnippet);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snippets));
  return newSnippet;
};

export const deleteLocalSnippet = (id: string): void => {
   if (typeof window === 'undefined') {
    return;
  }
  let snippets = getLocalSnippets();
  snippets = snippets.filter((s) => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snippets));
};
