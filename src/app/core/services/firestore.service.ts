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
  QueryConstraint,
  writeBatch,
  updateDoc,
  onSnapshot,
} from '@angular/fire/firestore';
import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import {
  deleteObject,
  getStorage,
  ref,
  Storage,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { FirebaseApp } from '@angular/fire/app';
import { arrayUnion } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firebase: FirebaseApp = inject(FirebaseApp);
  firestore: Firestore = inject(Firestore);
  storage: Storage = inject(Storage);

  constructor() {}

  getCollection<T>(path: string): Observable<T[]> {
    return collectionData(collection(this.firestore, path), { idField: 'id' }) as Observable<T[]>;
  }

  getDocument<T>(path: string, id: string): Observable<T> {
    return from(getDoc(doc(this.firestore, path, id))).pipe(
      map(docSnap => docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as T : [] as T)
    );
  }

  getDocumentsByAttribute<T>(path: string, attributeName: string, attributeValue: string): Observable<T[]> {
    const q = query(collection(this.firestore, path), where(attributeName, '==', attributeValue));
    return new Observable<T[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
        observer.next(items);
      }, error => observer.error(error));
      return () => unsubscribe();
    });
  }

  addToCollection<T>(path: string, data: any): Observable<string> {
    const docRef = doc(collection(this.firestore, path));
    return from(setDoc(docRef, data)).pipe(map(() => docRef.id));
  }

  updateDocument<T>(path: string, id: string, data: any): Observable<void> {
    return from(setDoc(doc(this.firestore, path, id), data, { merge: true }));
  }

  deleteDocument(path: string, id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, path, id)));
  }

  async getUser<T>(id: string): Promise<any> {
    const docItem = await getDoc(doc(this.firestore, 'users', id));

    return { ...docItem.data(), id: docItem.id };
  }

  async getDocumentsByArrayItemId<T>(
    collectionName: string,
    arrayName: string,
    value: string
  ): Promise<any[]> {
    const q = query(
      collection(this.firestore, collectionName),
      where(arrayName, 'array-contains', value)
    );
    var list: any = [];

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id });
    });

    return list as T[];
  }

  async getDocumentsByQuery<T>(
    path: string,
    ...queryConstraints: any[]
  ): Promise<T[]> {
    const q = query(collection(this.firestore, path), ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const list: T[] = [];
    querySnapshot.forEach((doc) => {
      if (doc.data()) {
        list.push({ ...doc.data(), id: doc.id } as T);
      }
    });

    return list;
  }

  getCollectionObservable<T>(path: string): Observable<T[]> {
    return collectionData(collection(this.firestore, path), {
      idField: 'id',
    }) as Observable<T[]>;
  }

  // Adicione um método para atualizar campos específicos de um documento
  async updateFields(
    path: string,
    id: string,
    fields: Partial<any>
  ): Promise<void> {
    const docRef = doc(this.firestore, path, id);
    return updateDoc(docRef, fields);
  }

  // Adicione um método para realizar operações em lote
  async batchOperation(operations: (() => Promise<void>)[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    for (const operation of operations) {
      await operation();
    }
    await batch.commit();
  }

  getCollectionWithQuery<T>(
    collectionName: string,
    queryConstraints: any[]
  ): Observable<T[]> {
    return new Observable<T[]>((observer) => {
      const collectionRef = collection(this.firestore, collectionName);
      const q = query(collectionRef, ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const items = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as T)
          );
          observer.next(items);
        },
        (error) => {
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  async generateId(path: string, id?: string) {
    const taskCollection = collection(this.firestore, path);
    return id ? doc(taskCollection, id) : doc(taskCollection);
  }

  async getDocumentsWithCondition<T>(
    path: string,
    field: string,
    operator: FirestoreFilterOperator,
    value: any
  ): Promise<T[]> {
    const q = query(
      collection(this.firestore, path),
      where(field, operator, value)
    );
    const querySnapshot = await getDocs(q);

    const list: T[] = [];
    querySnapshot.forEach((doc) => {
      if (doc.data()) {
        list.push({ ...doc.data(), id: doc.id } as T);
      }
    });

    return list;
  }

  async updateArrayField(path: string, id: string, field: string, value: any): Promise<void> {
    const docRef = doc(this.firestore, path, id);
    return updateDoc(docRef, {
      [field]: arrayUnion(value)
    });
  }

}

type FirestoreFilterOperator = '<' | '<=' | '==' | '!=' | '>=' | '>';
