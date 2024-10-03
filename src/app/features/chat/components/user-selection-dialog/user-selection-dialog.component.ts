import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-user-selection-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule],
  template: `
    <h2 mat-dialog-title>Selecione um usuário</h2>
    <mat-dialog-content>
      <mat-selection-list #userList [multiple]="false">
        <mat-list-option *ngFor="let user of users" [value]="user">
          {{ user.name }}
        </mat-list-option>
      </mat-selection-list>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button
        mat-button
        [mat-dialog-close]="getSelectedUser()"
        [disabled]="!hasSelectedUser()"
        cdkFocusInitial
      >
        Ok
      </button>
    </mat-dialog-actions>
  `,
})
export class UserSelectionDialogComponent implements OnInit {
  @ViewChild('userList') userList!: MatSelectionList;
  users: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<UserSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentUserId: string },
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.chatService.getUsers().subscribe((users) => {
      this.users = users.filter((user) => user.id !== this.data.currentUserId);
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getSelectedUser(): any | undefined {
    return this.userList?.selectedOptions.selected[0]?.value;
  }

  hasSelectedUser(): boolean {
    return this.userList?.selectedOptions.selected.length > 0;
  }
}
