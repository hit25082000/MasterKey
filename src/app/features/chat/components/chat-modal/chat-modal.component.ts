import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { Message } from '../../../../core/models/message.model';
import { Conversation } from '../../../../core/models/conversation.model';
import { UserSelectionDialogComponent } from '../user-selection-dialog/user-selection-dialog.component';
import { ChatService } from '../../services/chat.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-modal" [class.minimized]="isMinimized()">
      <div class="chat-header" (click)="toggleMinimize()">
        @if (selectedConversation()) {
          <div class="selected-user">
            <button class="back-button" (click)="backToList($event)">
              <i class="fas fa-arrow-left"></i>
            </button>
            <span>{{ selectedConversation()?.userName }}</span>
          </div>
        } @else {
          <h3>Mensagens</h3>
        }
        @if (unreadCount() > 0) {
          <span class="notification-badge">{{ unreadCount() }}</span>
        }
        <button class="minimize-btn">
          <i [class]="isMinimized() ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </button>
      </div>

      @if (!isMinimized()) {
        <div class="chat-content">
          @if (!selectedConversation()) {
            <div class="conversation-list">
              @for (conversation of conversations(); track conversation.userId) {
                <div
                  class="conversation-item"
                  [class.unread]="conversation.unreadCount! > 0"
                  (click)="selectConversation(conversation)"
                >
                  <div class="user-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="conversation-info">
                    <div class="conversation-header">
                      <span class="user-name">{{ conversation.userName }}</span>
                      <span class="time">{{ formatTime(conversation.lastMessageTimestamp) }}</span>
                    </div>
                    <div class="conversation-preview">
                      <p class="last-message">
                        @if (conversation.lastMessage) {
                          <span class="sender-name" *ngIf="conversation.lastMessageSender !== currentUserId()">
                            {{ conversation.lastMessageSenderName }}:
                          </span>
                          {{ conversation.lastMessage }}
                        } @else {
                          <span class="no-messages">Nenhuma mensagem ainda</span>
                        }
                      </p>
                      @if (conversation.unreadCount! > 0) {
                        <span class="unread-badge">{{ conversation.unreadCount }}</span>
                      }
                    </div>
                  </div>
                </div>
              }

              <button class="new-chat-btn" (click)="openNewConversationDialog()">
                <i class="fas fa-plus"></i>
                Nova Conversa
              </button>
            </div>
          }

          @if (selectedConversation()) {
            <div class="chat-area">
              <div class="messages" #messageContainer>
                @for (message of messages(); track message.timestamp) {
                  <div
                    class="message"
                    [class.outgoing]="message.senderId === currentUserId()"
                    [class.incoming]="message.senderId !== currentUserId()"
                  >
                    <div class="message-content">
                      {{ message.content }}
                      <div class="message-time">
                        {{ formatTime(message.timestamp) }}
                        @if (message.senderId === currentUserId()) {
                          <i class="fas fa-check" [class.read]="message.isRead"></i>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="input-area">
                <input
                  [(ngModel)]="newMessage"
                  (keyup.enter)="sendMessage()"
                  placeholder="Digite uma mensagem..."
                />
                <button (click)="sendMessage()">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./chat-modal.component.scss']
})
export class ChatModalComponent implements OnInit {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  // Signals
  isMinimized = signal(true);
  currentUserId = signal<string | null>(null);
  currentUserName = signal<string | null>(null);
  selectedConversation = signal<Conversation | null>(null);
  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  unreadCount = computed(() => this.chatService.unreadMessages());

  // Estado local
  newMessage = '';

  constructor() {
    // Efeito para atualizar mensagens quando a conversa muda
    effect(() => {
      if (this.selectedConversation()) {
        this.loadMessages();
      }
    });
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserId.set(user.uid);
        this.currentUserName.set(user.displayName);
        this.loadConversations();
        this.chatService.requestNotificationPermission();
      }
    });
  }

  private async loadConversations() {
    if (this.currentUserId()) {
      const conversations = await this.chatService.getConversations(this.currentUserId()!);
      this.conversations.set(conversations);
    }
  }

  private loadMessages() {
    if (!this.selectedConversation()) return;

    this.chatService.getMessages(
      this.currentUserId()!,
      this.selectedConversation()!.userId
    ).subscribe(messages => {
      this.messages.set(messages);
      this.scrollToBottom();
      this.markAsRead();
    });
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation.set(conversation);
    this.markAsRead();
  }

  backToList(event: Event) {
    event.stopPropagation();
    this.selectedConversation.set(null);
    this.messages.set([]);
  }

  private markAsRead() {
    if (!this.selectedConversation()) return;

    this.chatService.markConversationAsRead(
      this.currentUserId()!,
      this.selectedConversation()!.userId
    );
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation()) return;

    try {
      await this.chatService.sendMessage(
        this.currentUserId()!,
        this.selectedConversation()!.userId,
        this.newMessage,
        this.currentUserName()!
      );
      this.newMessage = '';
      this.scrollToBottom();
    } catch (error) {
      this.notificationService.error('Erro ao enviar mensagem');
    }
  }

  toggleMinimize() {
    this.isMinimized.set(!this.isMinimized());
  }

  private scrollToBottom() {
    setTimeout(() => {
      const messageContainer = document.querySelector('.messages');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    });
  }

  openNewConversationDialog() {
    const dialogRef = this.dialog.open(UserSelectionDialogComponent, {
      width: '300px',
      data: { currentUserId: this.currentUserId() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.id !== this.currentUserId()) {
        this.startNewConversation(result);
      } else if (result && result.id === this.currentUserId()) {
        this.notificationService.error('Não é possível iniciar conversa consigo mesmo');
      }
    });
  }

  formatTime(timestamp: any): string {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  }

  private async startNewConversation(selectedUser: any) {
    try {
      await this.chatService.createConversation(
        this.currentUserId()!,
        selectedUser.id,
        selectedUser.name
      );
      await this.loadConversations();
      const newConversation = this.conversations().find(c => c.userId === selectedUser.id);
      if (newConversation) {
        this.selectConversation(newConversation);
      }
    } catch (error) {
      this.notificationService.error('Erro ao iniciar conversa');
    }
  }
}
