import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  DocumentReference,
  runTransaction,
  getFirestore,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  QuerySnapshot,
  query,
  where,
} from '@angular/fire/firestore';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  Storage,
  uploadBytes,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { FirebaseApp } from '@angular/fire/app';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  firebase: FirebaseApp = inject(FirebaseApp);
  storage: Storage = inject(Storage);

  constructor() {}

  getFile(path: string) {
    return getStorage(this.firebase, path);
  }

  async uploadIcon(input: File, path: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, 'icons');
    const iconsRef = ref(storageRef, path + '.jpg');

    var snapshot = await uploadBytes(iconsRef, input);
    var url = await getDownloadURL(snapshot.ref);

    return url;
  }

  deleteIcon(path: string): Promise<void> {
    const storage = getStorage();
    const storageRef = ref(storage, 'icons');
    const iconsRef = ref(storageRef, path + '.jpg');

    return deleteObject(iconsRef);
  }

  async uploadBookImage(file: File, bookId: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, `book-images/${bookId}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  async uploadBookPdf(file: File, bookId: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, `book-pdfs/${bookId}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }
}
