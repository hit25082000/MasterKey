import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Package } from '../../../core/models/package.model';
import { Firestore, collection, collectionData, CollectionReference } from '@angular/fire/firestore';

const PACKAGES_PATH = 'packages';

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  firestore = inject(Firestore);

  packagesCollection = collection(
    this.firestore,
    PACKAGES_PATH
  ) as CollectionReference<Package>;

  packages = signal<Package[]>([]);
  selectedPackage = signal<Package | undefined>(undefined);
  isLoading = signal<boolean>(true);

  constructor() {
    collectionData(this.packagesCollection, { idField: 'id' }).subscribe(
      (data) => {
        this.packages.set(data);
        this.isLoading.set(false);
      },
      (error) => {
        console.error("Erro ao buscar pacotes:", error);
        this.isLoading.set(false);
      }
    );
  }

  async selectPackage(id: string): Promise<WritableSignal<Package | undefined>> {
    while (this.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const pkg = this.packages().find(p => p.id === id);
    this.selectedPackage.set(pkg);
    return this.selectedPackage;
  }
}
