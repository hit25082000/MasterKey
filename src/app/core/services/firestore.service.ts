import { Firestore, collection, collectionData, addDoc, doc, DocumentReference,runTransaction, getFirestore, setDoc, getDoc, deleteDoc, getDocs, QuerySnapshot, query, where} from '@angular/fire/firestore';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { deleteObject, getStorage, ref, Storage, uploadBytesResumable } from '@angular/fire/storage';
import { FirebaseApp } from '@angular/fire/app';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firebase: FirebaseApp = inject(FirebaseApp)
  firestore: Firestore = inject(Firestore);
  storage: Storage = inject(Storage);

  constructor() {  }

  async getCollection<T>(path: string): Promise<T[]> {
    const docs = await getDocs(collection(this.firestore, path));
    const list: any[] = [];

    docs.forEach((doc) => {
      list.push({ ...doc.data() ,id : doc.id }); // Converte diretamente os dados para o tipo T
    });

    return list;
  }

  async getDocument<T>(path: string,id : string): Promise<any> {
    const docItem = await getDoc(doc(this.firestore, path, id));
    return { ...docItem.data(), id: docItem.id };
  }

  async getDocumentRelation<T>(path: string,id : string): Promise<any> {
    const docItem = await getDoc(doc(this.firestore, path, id));
    return { ...docItem.data()};
  }

  async getUser<T>(id : string): Promise<any> {
    const docItem = await getDoc(doc(this.firestore, 'users', id));

    return { ...docItem.data(), id: docItem.id };
  }

  async getDocumentsByAttribute<T>(path : string, attributeName : string, attributeValue : string): Promise<any[]> {
    const q = query(collection(this.firestore, path), where(attributeName, "==", attributeValue));
    var list : any = []

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      if(doc.data())
      list.push({...doc.data(),id: doc.id})
    });

    return list as T[];
  }

  async addToCollection<T>(path: string, data: any) : Promise<any>{
    return await addDoc(collection(this.firestore, path), { ...data });
  }

  async addToCollectionWithId<T>(path: string, id : string, data: any) : Promise<any>{
    return await setDoc(doc(this.firestore, path, id), { ...data });
  }

  updateDocument<T>(path: string, id: string, data: any) : Promise<void> {
    var ref = doc(collection(this.firestore,path),id)

    return setDoc(ref,{ ...data },{ merge: true });
  }

  deleteDocument(path: string, id: string): Promise<void> {
    var ref = doc(collection(this.firestore,path),id)

    return deleteDoc(ref);
  }

  async getDocumentsByArrayItemId<T>(collectionName : string, arrayName : string, value : string): Promise<any[]> {
    const q = query(collection(this.firestore, collectionName), where(arrayName, 'array-contains', value));
    var list : any = []

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      list.push({...doc.data(),id: doc.id})
    });

    return list as T[];
  }
}
