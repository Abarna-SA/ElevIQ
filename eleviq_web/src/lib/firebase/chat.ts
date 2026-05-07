import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot,
    Timestamp,
    Firestore,
    serverTimestamp,
} from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { db, auth } from './config';

const CONVERSATIONS_COLLECTION = 'conversations';

export interface Conversation {
    id: string;
    userId: string;
    title: string;
    lastMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    files?: { name: string; type: string; url?: string; preview?: string }[];
    artifactIds?: string[];
    createdAt: Date;
}

// Helper to ensure db is available
const getFirestore = (): Firestore => {
    if (!db) throw new Error('Firestore not initialized');
    return db;
};

// Helper to ensure auth is available
const getAuth = (): Auth => {
    if (!auth) throw new Error('Auth not initialized');
    return auth;
};

// Get collections
const getConversationsRef = () => collection(getFirestore(), CONVERSATIONS_COLLECTION);
const getMessagesRef = (conversationId: string) =>
    collection(getFirestore(), `${CONVERSATIONS_COLLECTION}/${conversationId}/messages`);

// Get current user ID
const getCurrentUserId = (): string | null => {
    try {
        return getAuth().currentUser?.uid ?? null;
    } catch {
        return null;
    }
};

// Convert Firestore doc to Conversation
const conversationFromFirestore = (docSnapshot: any): Conversation => {
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        userId: data.userId,
        title: data.title,
        lastMessage: data.lastMessage,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    };
};

// Convert Firestore doc to ChatMessage
const messageFromFirestore = (docSnapshot: any): ChatMessage => {
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        files: data.files,
        artifactIds: data.artifactIds,
        createdAt: data.createdAt?.toDate() || new Date(),
    };
};

// Create a new conversation
export async function createConversation(title: string, lastMessage?: string): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const now = new Date();
    const docRef = await addDoc(getConversationsRef(), {
        userId,
        title,
        lastMessage: lastMessage || '',
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
    });

    return docRef.id;
}

// Update a conversation title/lastMessage
export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), CONVERSATIONS_COLLECTION, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), CONVERSATIONS_COLLECTION, id);
    await deleteDoc(docRef);
}

// Add a message to a conversation
export async function addMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>
): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const now = new Date();
    
    // Create payload and remove any undefined fields before saving
    const payload: any = {
        ...message,
        conversationId,
        createdAt: Timestamp.fromDate(now),
    };
    
    // Explicitly delete undefined fields to prevent Firestore errors
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });

    const docRef = await addDoc(getMessagesRef(conversationId), payload);

    // Update conversation's last message and updatedAt
    await updateConversation(conversationId, {
        lastMessage: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        updatedAt: now,
    });

    return docRef.id;
}

// Subscribe to conversations (real-time)
export function subscribeToConversations(
    callback: (conversations: Conversation[]) => void
): () => void {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    const q = query(
        getConversationsRef(),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs.map(conversationFromFirestore);
        callback(convos);
    });
}

// Subscribe to messages in a conversation (real-time)
export function subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const userId = getCurrentUserId();
    if (!userId || !conversationId) {
        callback([]);
        return () => { };
    }

    const q = query(
        getMessagesRef(conversationId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(messageFromFirestore);
        callback(msgs);
    });
}

// ARTIFACTS
const ARTIFACTS_COLLECTION = 'artifacts';

export interface DbArtifact {
    id: string;
    name: string;
    type: string;
    content: string;
    mimeType?: string;
    language?: string;
    createdAt: Date;
    userId: string;
}

const getArtifactsRef = () => collection(getFirestore(), ARTIFACTS_COLLECTION);

export async function saveArtifact(artifact: Omit<DbArtifact, 'userId'>): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), ARTIFACTS_COLLECTION, artifact.id);
    const payload: any = {
        ...artifact,
        userId,
        createdAt: Timestamp.fromDate(artifact.createdAt || new Date()),
    };

    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });

    await setDoc(docRef, payload);
}

export async function getArtifactsByIds(ids: string[]): Promise<DbArtifact[]> {
    if (!ids || ids.length === 0) return [];
    
    // Firestore 'in' queries support max 10 items
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
    }
    
    let results: DbArtifact[] = [];
    for (const chunk of chunks) {
        // Use document IDs directly for fetching multiple docs efficiently
        const fetchPromises = chunk.map(id => getDocs(query(getArtifactsRef(), where('id', '==', id))));
        const snapshots = await Promise.all(fetchPromises);
        
        for (const snap of snapshots) {
            if (!snap.empty) {
                const doc = snap.docs[0];
                const data = doc.data();
                results.push({
                    id: doc.id,
                    name: data.name,
                    type: data.type,
                    content: data.content,
                    mimeType: data.mimeType,
                    language: data.language,
                    userId: data.userId,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            }
        }
    }
    
    return results;
}
