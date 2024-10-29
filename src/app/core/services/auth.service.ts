import { inject, Injectable, signal, computed, effect } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  updateCurrentUser,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
  user,
  UserCredential,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private userSignal = signal<User | null>(null);
  currentUser = signal<User | undefined>(undefined);

  constructor() {
    effect(() => {
      const user = this.userSignal();
      if (user) {
        this.getUserFromFirestore(user.uid).then((userDoc) => {
          this.currentUser.set(userDoc as User);
        });
      } else {
        this.currentUser.set(undefined);
      }
    });

    this.auth.onAuthStateChanged((user) => {
      this.userSignal.set(user);
    });
  }

  private async getUserFromFirestore(uid: string) {
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
  }

  async register(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    await sendEmailVerification(userCredential.user);
    // O onAuthStateChanged já atualizará o currentUserSubject
    return userCredential;
  }

  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    this.auth.signOut();
  }

  passwordReset(email: string) {
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        // Password reset email sent!
        // ..
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });
  }
}
