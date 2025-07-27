
import { db } from '@/lib/firebase/firestore';
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    serverTimestamp, 
    Timestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore';

// Data Structures
export interface PostData {
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
}

export interface Post extends PostData {
  id: string;
  createdAt: Timestamp;
  commentCount: number;
}

export interface CommentData {
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
}

export interface Comment extends CommentData {
    id: string;
    createdAt: Timestamp;
}

const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';


// Functions
export const createPost = async (postData: PostData): Promise<string> => {
  try {
    const postsCollection = collection(db, POSTS_COLLECTION);
    const docRef = await addDoc(postsCollection, {
      ...postData,
      commentCount: 0,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Could not create post.");
  }
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    const postsCollection = collection(db, POSTS_COLLECTION);
    const q = query(postsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Post));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

export const getPost = async (postId: string): Promise<Post | null> => {
    try {
        const postDoc = doc(db, POSTS_COLLECTION, postId);
        const docSnap = await getDoc(postDoc);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Post;
        }
        return null;
    } catch (error) {
        console.error("Error fetching post:", error);
        return null;
    }
};

export const deletePost = async (postId: string): Promise<void> => {
    try {
        const postDocRef = doc(db, POSTS_COLLECTION, postId);
        // Note: Deleting a document does not delete its subcollections.
        // For a full cleanup, a Cloud Function triggered on delete would be needed to recursively delete comments.
        // This client-side delete will only remove the post document itself.
        
        // It's crucial that Firestore rules prevent unauthorized deletion.
        await deleteDoc(postDocRef);

    } catch (error) {
        console.error("Error deleting post:", error);
        throw new Error("Could not delete post.");
    }
}

export const createComment = async (postId: string, commentData: CommentData): Promise<void> => {
    try {
        const postDocRef = doc(db, POSTS_COLLECTION, postId);
        const commentsCollectionRef = collection(postDocRef, COMMENTS_COLLECTION);

        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postDocRef);
            if (!postDoc.exists()) {
                throw "Post does not exist!";
            }

            // Add the new comment
            transaction.set(doc(commentsCollectionRef), {
                ...commentData,
                createdAt: serverTimestamp(),
            });

            // Increment the comment count
            const newCommentCount = (postDoc.data().commentCount || 0) + 1;
            transaction.update(postDocRef, { commentCount: newCommentCount });
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        throw new Error("Could not create comment.");
    }
};

export const getComments = async (postId: string): Promise<Comment[]> => {
    try {
        const commentsCollection = collection(db, POSTS_COLLECTION, postId, COMMENTS_COLLECTION);
        const q = query(commentsCollection, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
    try {
        const postDocRef = doc(db, POSTS_COLLECTION, postId);
        const commentDocRef = doc(db, POSTS_COLLECTION, postId, COMMENTS_COLLECTION, commentId);

        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postDocRef);
            if (!postDoc.exists()) {
                throw "Post does not exist!";
            }
            
            // Delete the comment
            transaction.delete(commentDocRef);

            // Decrement the comment count, ensuring it doesn't go below zero
            const newCommentCount = Math.max(0, (postDoc.data().commentCount || 0) - 1);
            transaction.update(postDocRef, { commentCount: newCommentCount });
        });

    } catch (error) {
        console.error("Error deleting comment:", error);
        throw new Error("Could not delete comment.");
    }
}
