import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser,
    Unsubscribe
} from 'firebase/auth';
import { auth } from './firebase';

// Sign up with email and password
export const signUp = async (
    email: string,
    password: string,
    displayName?: string
): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
};

// Sign in with email and password
export const signIn = async (
    email: string,
    password: string
): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

// Sign out
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

// Subscribe to auth state changes
export const onAuthChange = (
    callback: (user: FirebaseUser | null) => void
): Unsubscribe => {
    return onAuthStateChanged(auth, callback);
};
