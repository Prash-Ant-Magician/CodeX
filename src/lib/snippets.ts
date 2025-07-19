export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: string;
}

const SNIPPETS_KEY = 'codeleap-snippets';

// Functions to be used in client components
// Ensure they are only called on the client side

export const getSnippets = (): Snippet[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const snippetsJson = localStorage.getItem(SNIPPETS_KEY);
  if (snippetsJson) {
    try {
      const parsed = JSON.parse(snippetsJson);
      // sort by date descending
      return parsed.sort((a: Snippet, b: Snippet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error("Failed to parse snippets from localStorage", e);
      return [];
    }
  }
  return [];
};

export const saveSnippet = (snippet: Omit<Snippet, 'id' | 'createdAt'>): Snippet | null => {
   if (typeof window === 'undefined') {
    return null;
  }
  const snippets = getSnippets();
  const newSnippet: Snippet = {
    ...snippet,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  snippets.unshift(newSnippet);
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
  return newSnippet;
};

export const deleteSnippet = (id: string): void => {
   if (typeof window === 'undefined') {
    return;
  }
  let snippets = getSnippets();
  snippets = snippets.filter((s) => s.id !== id);
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
};
