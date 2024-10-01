import { Component, OnInit } from '@angular/core';
import BaseUser from '../../../../core/models/default-user.model';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../../core/services/firestore.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [],
  template: `
    <ul>
      <li *ngFor="let usuario of usuarios$ | async">{{ usuario.nome }}</li>
    </ul>
  `,
})
export class UsersListComponent implements OnInit {
  usuarios$!: Observable<BaseUser[]>;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.usuarios$ =
      this.firestoreService.getCollectionObservable<BaseUser>('users');
  }
}
