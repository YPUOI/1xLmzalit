import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Match, Team, Prediction, AppUser } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
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
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Execute connection test
testConnection();

// Real-time Firestore synchronizers

// 1. Teams
export const subscribeTeams = (onUpdate: (teams: Record<string, Team>) => void) => {
  const path = 'teams';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const teams: Record<string, Team> = {};
      snapshot.forEach(docSnap => {
        teams[docSnap.id] = docSnap.data() as Team;
      });
      onUpdate(teams);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const syncSaveTeam = async (teamId: string, team: Team) => {
  const path = `teams/${teamId}`;
  try {
    await setDoc(doc(db, 'teams', teamId), team);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncDeleteTeam = async (teamId: string) => {
  const path = `teams/${teamId}`;
  try {
    await deleteDoc(doc(db, 'teams', teamId));
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
