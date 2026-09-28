import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDoc,
  getDocFromServer,
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { Match, Team, Prediction, AppUser, ArchivedSeason } from '../types';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance; /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per critical constraints
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || (error as any).code === 'unavailable') {
        console.warn("Firestore: Client is operating in offline mode.");
      }
    }
  }
}

// Execute connection test deferred after startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 2000);
}

// Real-time Firestore synchronizers

// Helper for safe team document IDs (handles special characters and slashes safely)
const getSafeTeamDocId = (teamId: string): string => {
  return encodeURIComponent(teamId.trim());
};

// 1. Teams
export const subscribeTeams = (onUpdate: (teams: Record<string, Team>) => void) => {
  const path = 'teams';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const teams: Record<string, Team> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Team;
        const key = (data && data.name) ? data.name : decodeURIComponent(docSnap.id);
        teams[key] = data;
      });
      onUpdate(teams);
    },
    (error) => {
      if (error && ((error as any).code === 'unavailable' || error.message?.includes('unavailable') || error.message?.includes('offline'))) {
        console.warn(`Firestore [${path}] snapshot operating in offline mode.`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const syncSaveTeam = async (teamId: string, team: Team) => {
  const safeId = getSafeTeamDocId(teamId);
  const path = `teams/${safeId}`;
  try {
    await setDoc(doc(db, 'teams', safeId), team);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncDeleteTeam = async (teamId: string) => {
  const safeId = getSafeTeamDocId(teamId);
  const path = `teams/${safeId}`;
  try {
    await deleteDoc(doc(db, 'teams', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 2. Matches
export const subscribeMatches = (onUpdate: (matches: Match[]) => void) => {
  const path = 'matches';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const matches: Match[] = [];
      snapshot.forEach(docSnap => {
        matches.push(docSnap.data() as Match);
      });
      onUpdate(matches);
    },
    (error) => {
      if (error && ((error as any).code === 'unavailable' || error.message?.includes('unavailable') || error.message?.includes('offline'))) {
        console.warn(`Firestore [${path}] snapshot operating in offline mode.`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const syncSaveMatch = async (match: Match) => {
  const path = `matches/${match.id}`;
  try {
    await setDoc(doc(db, 'matches', match.id), match);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncDeleteMatch = async (matchId: string) => {
  const path = `matches/${matchId}`;
  try {
    await deleteDoc(doc(db, 'matches', matchId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 3. Predictions
export const subscribePredictions = (onUpdate: (predictions: Record<string, Prediction>) => void) => {
  const path = 'predictions';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const predictions: Record<string, Prediction> = {};
      snapshot.forEach(docSnap => {
        predictions[docSnap.id] = docSnap.data() as Prediction;
      });
      onUpdate(predictions);
    },
    (error) => {
      if (error && ((error as any).code === 'unavailable' || error.message?.includes('unavailable') || error.message?.includes('offline'))) {
        console.warn(`Firestore [${path}] snapshot operating in offline mode.`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const syncSavePrediction = async (prediction: Prediction) => {
  const docId = `${prediction.username}_${prediction.matchId}`;
  const path = `predictions/${docId}`;
  try {
    await setDoc(doc(db, 'predictions', docId), prediction);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncDeletePrediction = async (docId: string) => {
  const path = `predictions/${docId}`;
  try {
    await deleteDoc(doc(db, 'predictions', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 4. Users
export const subscribeUsers = (onUpdate: (users: AppUser[]) => void) => {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach(docSnap => {
        users.push(docSnap.data() as AppUser);
      });
      onUpdate(users);
    },
    (error) => {
      if (error && ((error as any).code === 'unavailable' || error.message?.includes('unavailable') || error.message?.includes('offline'))) {
        console.warn(`Firestore [${path}] snapshot operating in offline mode.`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const syncSaveUser = async (user: AppUser) => {
  const path = `users/${user.username}`;
  try {
    await setDoc(doc(db, 'users', user.username), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncDeleteUser = async (username: string) => {
  const path = `users/${username}`;
  try {
    await deleteDoc(doc(db, 'users', username));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const syncRenameUser = async (
  oldUsername: string,
  newUsername: string,
  user: AppUser,
  predictionsToMigrate: Prediction[]
) => {
  // 1. Save new user document
  await syncSaveUser({ ...user, username: newUsername });

  // 2. Migrate existing predictions to new username
  for (const pred of predictionsToMigrate) {
    const updatedPred = { ...pred, username: newUsername };
    await syncSavePrediction(updatedPred);
    const oldDocId = `${oldUsername}_${pred.matchId}`;
    await syncDeletePrediction(oldDocId);
  }

  // 3. Delete old user document
  await syncDeleteUser(oldUsername);
};

// 5. Settings / Security Config Synchronization
export const subscribeSecurityConfig = (onUpdate: (data: { friendPassword?: string }) => void) => {
  const docRef = doc(db, 'settings', 'security');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { friendPassword?: string };
        if (data && data.friendPassword) {
          onUpdate(data);
        }
      }
    },
    (error) => {
      console.warn("Settings sync notice:", error);
    }
  );
};

export const getLatestFriendPassword = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, 'settings', 'security');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as { friendPassword?: string };
      return data?.friendPassword || null;
    }
  } catch (err) {
    console.warn("Could not fetch latest friend password from Firestore:", err);
  }
  return null;
};

export const syncSaveSecurityConfig = async (friendPassword: string) => {
  const path = 'settings/security';
  try {
    await setDoc(doc(db, 'settings', 'security'), {
      friendPassword: friendPassword.trim(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// 6. Archived Seasons (Past Seasons Leaderboards)
export const subscribeArchivedSeasons = (onUpdate: (seasons: ArchivedSeason[]) => void) => {
  const path = 'archived_seasons';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const seasons: ArchivedSeason[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ArchivedSeason;
        seasons.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort by seasonDate or archivedAt descending
      seasons.sort((a, b) => {
        return (b.seasonDate || '').localeCompare(a.seasonDate || '');
      });
      onUpdate(seasons);
    },
    (error) => {
      if (error && ((error as any).code === 'unavailable' || error.message?.includes('unavailable') || error.message?.includes('offline'))) {
        console.warn(`Firestore [${path}] snapshot operating in offline mode.`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const syncSaveArchivedSeason = async (season: ArchivedSeason) => {
  const safeId = season.id.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const path = `archived_seasons/${safeId}`;
  
  const cleanDoc: Record<string, any> = {
    id: safeId,
    seasonDate: season.seasonDate || '',
    archivedAt: season.archivedAt || new Date().toISOString(),
    totalParticipants: season.totalParticipants ?? (season.entries ? season.entries.length : 0),
    entries: (season.entries || []).map((e, idx) => ({
      rank: Number(e.rank) || idx + 1,
      playerName: String(e.playerName || '').trim(),
      points: Number(e.points) || 0,
      badge: String(e.badge || '').trim(),
      notes: String(e.notes || '').trim()
    }))
  };

  if (season.title && typeof season.title === 'string' && season.title.trim()) {
    cleanDoc.title = season.title.trim();
  }
  if (season.notes && typeof season.notes === 'string' && season.notes.trim()) {
    cleanDoc.notes = season.notes.trim();
  }
  if (season.archivedBy && typeof season.archivedBy === 'string' && season.archivedBy.trim()) {
    cleanDoc.archivedBy = season.archivedBy.trim();
  }

  try {
    await setDoc(doc(db, 'archived_seasons', safeId), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncDeleteArchivedSeason = async (seasonId: string) => {
  const safeId = seasonId.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const path = `archived_seasons/${safeId}`;
  try {
    await deleteDoc(doc(db, 'archived_seasons', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 7. Password Recovery via Firebase Authentication
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; dispatchedToFirebaseAuth: boolean }> => {
  const cleanEmail = email.trim();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return { success: true, dispatchedToFirebaseAuth: true };
  } catch (error: any) {
    console.warn("Firebase Auth sendPasswordResetEmail notice:", error?.code, error?.message);
    if (error?.code === 'auth/invalid-email') {
      throw new Error('invalid-email');
    }
    if (error?.code === 'auth/user-not-found') {
      throw new Error('user-not-found');
    }
    // Return success or fallback safely
    return { success: true, dispatchedToFirebaseAuth: false };
  }
};
