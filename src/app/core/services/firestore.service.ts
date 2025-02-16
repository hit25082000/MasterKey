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
import { Observable } from 'rxjs';
import {
  deleteObject,
  getStorage,
  ref,
  Storage,
  uploadBytesResumable,
  getDownloadURL,
  getBytes,
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

  async getCollection<T>(path: string): Promise<T[]> {
    const docs = await getDocs(collection(this.firestore, path));
    const list: any[] = [];

    docs.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id }); // Converte diretamente os dados para o tipo T
    });

    return list;
  }

  async getDocument<T>(path: string, id: string): Promise<any> {
    const docItem = await getDoc(doc(this.firestore, path, id));

    if (docItem.data()) {
      return { ...docItem.data(), id: docItem.id };
    }
  }

  async getUser<T>(id: string): Promise<any> {
    const docItem = await getDoc(doc(this.firestore, 'users', id));

    return { ...docItem.data(), id: docItem.id };
  }

  async getDocumentsByAttribute<T>(
    path: string,
    attributeName: string,
    attributeValue: string
  ): Promise<any[]> {
    const q = query(
      collection(this.firestore, path),
      where(attributeName, '==', attributeValue)
    );
    var list: any = [];

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      if (doc.data()) list.push({ ...doc.data(), id: doc.id });
    });

    return list as T[];
  }

  async addToCollection<T>(path: string, data: any): Promise<any> {
    return await addDoc(collection(this.firestore, path), { ...data });
  }

  async addToCollectionWithId<T>(
    path: string,
    id: string,
    data: any
  ): Promise<void> {
    return await setDoc(doc(this.firestore, path, id), { ...data });
  }

  async setDocument(path: string, id: string, data: any): Promise<void> {
    return await setDoc(doc(this.firestore, path, id), { ...data });
  }

  updateDocument<T>(path: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, path, id);
    return updateDoc(docRef, data);
  }

  deleteDocument(path: string, id: string): Promise<void> {
    var ref = doc(collection(this.firestore, path), id);

    return deleteDoc(ref);
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

  async downloadImageAsBytes(imageUrl: string): Promise<Uint8Array> {
    try {
      // Extrair o caminho do storage da URL completa
      const storageRef = ref(this.storage, this.getStoragePathFromUrl(imageUrl));
      
      // Fazer download dos bytes da imagem
      const arrayBuffer = await getBytes(storageRef);
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Erro ao fazer download da imagem:', error);
      throw error;
    }
  }

  private getStoragePathFromUrl(url: string): string {
    try {
      // Remove a parte inicial da URL do Firebase Storage
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      if (url.startsWith(baseUrl)) {
        const pathStart = url.indexOf('/o/') + 3;
        const pathEnd = url.indexOf('?');
        let path = url.substring(pathStart, pathEnd !== -1 ? pathEnd : undefined);
        // Decodifica o caminho da URL
        return decodeURIComponent(path);
      }
      return url;
    } catch (error) {
      console.error('Erro ao extrair caminho do storage:', error);
      return url;
    }
  }

}

type FirestoreFilterOperator = '<' | '<=' | '==' | '!=' | '>=' | '>';
