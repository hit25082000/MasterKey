import { inject, Injectable } from '@angular/core';
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
import { Subscription, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  user$ = user(this.auth);
  userSubscription: Subscription;
  userInfo = new BehaviorSubject<any>(null);

  constructor() {
    this.userSubscription = this.user$.subscribe(async (aUser: User | null) => {
      if (aUser) {
        const userDoc = await this.getUserFromFirestore(aUser.uid);
        const id = aUser.uid;
        this.userInfo.next({ ...userDoc, id });
        this.getCurrentUser();
      } else {
        this.userInfo.next(null);
      }
    });
  }

  private async getUserFromFirestore(uid: string) {
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
  }

  async getIdToken(): Promise<string | null> {
    const currentUser = await this.auth.currentUser;
    return currentUser ? currentUser.getIdToken() : null;
  }

  getCurrentUser() {
    return this.userInfo.value;
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

  ngOnDestroy() {
    this.auth.signOut();
  }
}
