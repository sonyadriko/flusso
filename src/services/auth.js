import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

// Sign up with email and password
export const signUp = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
};

// Sign in with email and password
export const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

// Sign out
export const signOut = async () => {
    await firebaseSignOut(auth);
};

// Subscribe to auth state changes
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};
