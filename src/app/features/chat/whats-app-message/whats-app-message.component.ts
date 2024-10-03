import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../core/services/firestore.service';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-whats-app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whats-app-message.component.html',
  styleUrls: ['./whats-app-message.component.scss']
})
export class WhatsAppMessageComponent implements OnInit {
  users: any[] = [];
  selectedUsers: string[] = [];
  message: string = '';
  isSending: boolean = false;

  constructor(
    private firestoreService: FirestoreService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.users = await this.firestoreService.getCollection<any>('users');
  }

  toggleUserSelection(userId: string) {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  async sendMessage() {
    this.isSending = true;
    for (const userId of this.selectedUsers) {
      const user = this.users.find(u => u.id === userId);
      if (user && user.phone1) {
        await this.sendWhatsAppMessage(user.phone1, this.message);
      }
    }
    this.isSending = false;
    this.message = '';
    this.selectedUsers = [];
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string) {
    const url = `https://graph.facebook.com/v17.0/${environment.whatsappBusinessAccountId}/messages`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.whatsappAccessToken}`
    });

    const body = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    };

    try {
      await this.http.post(url, body, { headers }).toPromise();
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
    }
  }

  addMarkdown(prefix: string, suffix: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.message.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    this.message = this.message.substring(0, start) + replacement + this.message.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, end + prefix.length);
  }
}
