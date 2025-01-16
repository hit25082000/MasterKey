import { Component, OnInit, signal, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../../../shared/services/notification.service';
import { delay, from, of, tap } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { WhatsAppStatusService } from '../../services/whats-app-status.service';
import { environment } from '../../../../../environments/environment.development';

interface WhatsAppResponse {
  success: boolean;
  message: string;
}

interface User {
  id: string;
  name: string;
  phone1: string;
}

interface MessageStatus {
  userId: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

@Component({
  selector: 'app-whats-app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whats-app-message.component.html',
  styleUrls: ['./whats-app-message.component.scss']
})
export class WhatsAppMessageComponent implements OnInit {
  users = signal<User[]>([]);
  selectedUsers = signal<string[]>([]);
  private messageSignal = signal<string>('');
  isSending = signal<boolean>(false);
  messageStatuses = signal<MessageStatus[]>([]);
  searchTerm = signal<string>('');

  readonly DELAY_BETWEEN_MESSAGES = 5000; // 5 segundos
  readonly MAX_MESSAGE_LENGTH = 4096; // Limite do WhatsApp
  private readonly PHONE_NUMBER_REGEX = /^\d{12,14}$/; // Formato internacional

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.users().filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.phone1.includes(term)
    );
  });

  constructor(
    private firestoreService: FirestoreService,
    private http: HttpClient,
    private notificationService: NotificationService,
    private statusService: WhatsAppStatusService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const users = await this.firestoreService.getCollection<User>('users');
      // Filtra apenas usuários com números válidos
      this.users.set(users.filter(user => this.isValidPhoneNumber(user.phone1)));
    } catch (error) {
      this.notificationService.error('Erro ao carregar usuários');
    }
  }

  toggleUserSelection(userId: string) {
    const currentSelected = this.selectedUsers();
    const index = currentSelected.indexOf(userId);

    if (index > -1) {
      this.selectedUsers.set(currentSelected.filter(id => id !== userId));
    } else {
      this.selectedUsers.set([...currentSelected, userId]);
    }
  }

  async sendMessage() {
    if (!this.validateMessage()) return;

    this.isSending.set(true);
    this.messageStatuses.set([]);

    try {
      const selectedUsers = this.users().filter(user =>
        this.selectedUsers().includes(user.id)
      );

      let successCount = 0;
      let errorCount = 0;

      from(selectedUsers).pipe(
        concatMap(user => {
          return this.sendWhatsAppMessage(user).pipe(
            delay(this.DELAY_BETWEEN_MESSAGES),
            tap(
              () => successCount++,
              () => errorCount++
            )
          );
        })
      ).subscribe({
        complete: () => {
          this.finalizeSending();
          this.notificationService.success(
            `Mensagens enviadas: ${successCount} sucesso, ${errorCount} falhas`
          );
        },
        error: (error) => {
          console.error('Erro no envio das mensagens:', error);
          this.notificationService.error(
            `Erro ao enviar mensagens: ${error.message || 'Erro desconhecido'}`
          );
          this.finalizeSending();
        }
      });

    } catch (error) {
      this.notificationService.error('Erro ao iniciar envio de mensagens');
      this.finalizeSending();
    }
  }

  private validateMessage(): boolean {
    if (!this.getMessage()?.trim()) {
      this.notificationService.error('Por favor, digite uma mensagem');
      return false;
    }

    if (this.getMessage().length > this.MAX_MESSAGE_LENGTH) {
      this.notificationService.error(`Mensagem muito longa. Máximo: ${this.MAX_MESSAGE_LENGTH} caracteres`);
      return false;
    }

    if (this.selectedUsers().length === 0) {
      this.notificationService.error('Selecione pelo menos um usuário');
      return false;
    }

    return true;
  }

  private sendWhatsAppMessage(user: User) {
    const url = `${environment.whatsappAccessApiUrl}`;

    const formattedPhone = this.formatPhoneNumber(user.phone1);

    const body = {
      key: environment.whatsappAccessApiToken,
      numero: user.phone1,
      texto: this.getMessage().trim(),
      url: ""
    };

    this.messageStatuses.update(statuses =>
      statuses.filter(status => status.userId !== user.id)
    );

    this.messageStatuses.update(statuses => [
      ...statuses,
      {
        userId: user.id,
        status: 'pending'
      }
    ]);

    return this.http.post<WhatsAppResponse>(url, body).pipe(
      concatMap(response => {
        this.messageStatuses.update(statuses =>
          statuses.filter(status => status.userId !== user.id)
        );

        if (!response.success) {
          this.messageStatuses.update(statuses => [
            ...statuses,
            {
              userId: user.id,
              status: 'error',
              error: response.message || 'Erro ao enviar mensagem'
            }
          ]);
          throw new Error(response.message || 'Erro ao enviar mensagem');
        }

        this.messageStatuses.update(statuses => [
          ...statuses,
          {
            userId: user.id,
            status: 'success'
          }
        ]);

        // Atualiza o widget com o status
        this.statusService.updateStatus(this.messageStatuses().map(status => ({
          ...status,
          userName: this.getUserName(status.userId)
        })));

        return of(response);
      })
    );
  }

  private finalizeSending() {
    this.isSending.set(false);
    this.setMessage('');
    this.selectedUsers.set([]);

    // Limpa o widget após alguns segundos se todos foram enviados com sucesso
    const allSuccess = this.messageStatuses().every(status => status.status === 'success');
    if (allSuccess) {
      setTimeout(() => {
        this.statusService.clear();
      }, 3000);
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return this.PHONE_NUMBER_REGEX.test(cleanPhone);
  }

  private formatPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  addMarkdown(prefix: string, suffix: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentMessage = this.getMessage();
    const selectedText = currentMessage.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    this.setMessage(
      currentMessage.substring(0, start) +
      replacement +
      currentMessage.substring(end)
    );

    // Reposiciona o cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  getMessage(): string {
    return this.messageSignal();
  }

  setMessage(value: string) {
    this.messageSignal.set(value);
  }

  getUserName(userId: string): string {
    const user = this.users().find(u => u.id === userId);
    return user?.name || 'Usuário não encontrado';
  }

  // Método de teste para simular envios contínuos
  async testContinuousMessage() {
    const mockUsers = this.users().slice(0, 5); // Pega os primeiros 5 usuários
    let index = 0;

    this.isSending.set(true);
    this.messageStatuses.set([]);

    const sendInterval = setInterval(() => {
      if (index < mockUsers.length) {
        const user = mockUsers[index];

        // Adiciona status pendente
        this.messageStatuses.update(statuses => [
          ...statuses,
          {
            userId: user.id,
            status: 'pending'
          }
        ]);

        // Simula processamento
        setTimeout(() => {
          // Atualiza status aleatoriamente entre sucesso e erro
          this.messageStatuses.update(statuses =>
            statuses.map(status =>
              status.userId === user.id
                ? {
                    ...status,
                    status: Math.random() > 0.3 ? 'success' : 'error',
                    error: Math.random() > 0.3 ? undefined : 'Erro simulado'
                  }
                : status
            )
          );

          // Atualiza o widget
          this.statusService.updateStatus(this.messageStatuses().map(status => ({
            ...status,
            userName: this.getUserName(status.userId)
          })));
        }, 2000);

        index++;
      } else {
        clearInterval(sendInterval);
        this.isSending.set(false);
      }
    }, 1000);
  }
}
