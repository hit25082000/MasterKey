import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleManagementService {
  constructor(private firestore: FirestoreService) {}

  async create(role: Role): Promise<string> {
    const existingRoles = await this.firestore.getDocumentsByAttribute('roles', 'name', role.name);
    if (existingRoles.length === 0) {
      return this.firestore.addToCollection('roles', role);
    } else {
      throw new Error('Uma função com este nome já existe.');
    }
  }

  async update(id: string, newRole: Role): Promise<void> {
    const oldRole = await this.firestore.getDocument('roles', id) as Role;
    if (oldRole) {
      await this.firestore.updateDocument("roles", id, newRole);
    } else {
      throw new Error('Função não encontrada.');
    }
  }

  async getById(id: string): Promise<Role> {
    const role = await this.firestore.getDocument('roles', id) as Role;
    if (role) {
      return role;
    } else {
      throw new Error('Função não encontrada.');
    }
  }
}
