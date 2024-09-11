import { Firestore, collection, collectionData, addDoc, doc, DocumentReference,runTransaction, getFirestore, setDoc, getDoc, deleteDoc, getDocs, QuerySnapshot, query, where} from '@angular/fire/firestore';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { deleteObject, getDownloadURL, getStorage, ref, Storage, uploadBytes, uploadBytesResumable } from '@angular/fire/storage';
import { FirebaseApp } from '@angular/fire/app';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  firebase: FirebaseApp = inject(FirebaseApp)
  storage: Storage = inject(Storage);

  constructor() {  }

  getFile(path : string){
    return getStorage(this.firebase, path);
  }

    async uploadFile(input: File,url : string) : Promise<string> {
      const storage = getStorage();
      const storageRef = ref(storage,'icons');
      const iconsRef = ref(storageRef, url + ".jpg");

      var snapshot = await uploadBytes(iconsRef, input)
      var url = await getDownloadURL(snapshot.ref)

      return url
    }

  deleteFile(path: string): Promise<void> {
    const file = ref(this.storage,path);
    return deleteObject(file);
  }
}
