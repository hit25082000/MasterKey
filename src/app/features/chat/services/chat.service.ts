import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, tap } from 'rxjs';
import { Message } from '../../../core/models/message.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { orderBy, where } from '@angular/fire/firestore';
import { Conversation } from '../../../core/models/conversation.model';
import { NotificationService } from '../../../shared/services/notification.service';

type ConversationWithParticipants = Conversation & { participants: string[] };

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore = inject(FirestoreService);
  private notificationService = inject(NotificationService);

  // Signals
  unreadMessages = signal<number>(0);
  activeConversations = signal<Conversation[]>([]);
  currentMessages = signal<Message[]>([]);

  getUsers(): Observable<any[]> {
    return from(this.firestore.getCollection<any>('users'));
  }

  getMessages(currentUserId: string, selectedUserId: string): Observable<Message[]> {
    return this.firestore.getCollectionWithQuery<Message>('messages', [
      where('participants', '==', [currentUserId, selectedUserId].sort().join('_')),
      orderBy('timestamp', 'asc'),
    ]).pipe(
      tap(messages => {
        // Marca as mensagens recebidas como lidas
        messages.forEach(message => {
          if (message.receiverId === currentUserId && !message.isRead) {
            this.markMessageAsRead(message.id, message);
          }
        });
      })
    );
  }

  async sendMessage(
    currentUserId: string,
    selectedUserId: string,
    content: string,
    userName: string
  ): Promise<void> {
    // Impede envio de mensagem para si mesmo
    if (currentUserId === selectedUserId) {
      this.notificationService.error('Não é possível enviar mensagem para si mesmo');
      return;
    }

    const message: Omit<Message, 'id' | 'active'> = {
      senderId: currentUserId,
      receiverId: selectedUserId,
      content,
      userName,
      timestamp: new Date(),
      participants: [currentUserId, selectedUserId].sort().join('_'),
      isRead: false
    };

    const messageId = await this.firestore.addToCollection('messages', message);

    // Atualiza a última mensagem na conversa
    await this.updateConversation(currentUserId, selectedUserId, content, userName);
    await this.incrementUnreadCount(currentUserId, selectedUserId);

    // Notifica o usuário receptor
    this.notifyUser(selectedUserId, userName, content);
  }

  private async updateConversation(
    currentUserId: string,
    selectedUserId: string,
    lastMessage: string,
    senderName: string
  ): Promise<void> {
    const conversationId = [currentUserId, selectedUserId].sort().join('_');

    const conversationUpdate = {
      lastMessage,
      lastMessageTimestamp: new Date(),
      lastMessageSender: currentUserId,
      lastMessageSenderName: senderName
    };

    await this.firestore.updateDocument('conversations', conversationId, conversationUpdate);
  }

  async createConversation(
    currentUserId: string,
    selectedUserId: string,
    selectedUserName: string
  ): Promise<void> {
    // Impede criação de conversa consigo mesmo
    if (currentUserId === selectedUserId) {
      this.notificationService.error('Não é possível iniciar conversa consigo mesmo');
      return;
    }

    const existingConversation = await this.findExistingConversation(currentUserId, selectedUserId);

    if (existingConversation) {
      return;
    }

    const conversationId = [currentUserId, selectedUserId].sort().join('_');

    const conversation: Omit<ConversationWithParticipants, 'id' | 'active'> = {
      userId: selectedUserId,
      userName: selectedUserName,
      participants: [currentUserId, selectedUserId],
      lastMessage: '',
      lastMessageTimestamp: new Date(),
      unreadCount: 0,
      lastMessageSender: '',
      lastMessageSenderName: ''
    };

    await this.firestore.addToCollectionWithId('conversations', conversationId, conversation);
  }

  private notifyUser(userId: string, senderName: string, content: string) {
    // Aqui você pode implementar a lógica de notificação push
    // Por enquanto, vamos usar uma notificação simples
    if (Notification.permission === 'granted') {
      new Notification(`Nova mensagem de ${senderName}`, {
        body: content,
        icon: 'assets/icons/chat-icon.png'
      });
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const conversations = await this.firestore.getDocumentsByQuery<Conversation>(
      'conversations',
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );

    this.activeConversations.set(conversations);
    this.updateUnreadCount(conversations);
    return conversations;
  }

  private updateUnreadCount(conversations: Conversation[]) {
    const total = conversations.reduce(
      (count, conv) => count + (conv.unreadCount || 0),
      0
    );
    this.unreadMessages.set(total);
  }

  private async findExistingConversation(userId1: string, userId2: string): Promise<boolean> {
    const conversationId = [userId1, userId2].sort().join('_');
    const conversation = await this.firestore.getDocument('conversations', conversationId);
    return !!conversation;
  }

  async markConversationAsRead(currentUserId: string, otherUserId: string): Promise<void> {
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    await this.firestore.updateDocument('conversations', conversationId, {
      unreadCount: 0,
    });

    // Atualiza o contador de mensagens não lidas
    const conversations = await this.getConversations(currentUserId);
    this.updateUnreadCount(conversations);
  }

  async updateLastMessage(
    currentUserId: string,
    otherUserId: string,
    lastMessage: string
  ): Promise<void> {
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    await this.firestore.updateDocument('conversations', conversationId, {
      lastMessage,
      lastMessageTimestamp: new Date(),
    });
  }

  async incrementUnreadCount(currentUserId: string, otherUserId: string): Promise<void> {
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    const conversation = await this.firestore.getDocument<ConversationWithParticipants>(
      'conversations',
      conversationId
    );

    if (conversation) {
      const newUnreadCount = (conversation.unreadCount || 0) + 1;
      await this.firestore.updateDocument('conversations', conversationId, {
        unreadCount: newUnreadCount,
      });

      // Atualiza o contador local
      const conversations = await this.getConversations(otherUserId);
      this.updateUnreadCount(conversations);
    }
  }

  // Método para solicitar permissão de notificação
  async requestNotificationPermission(): Promise<void> {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  // Adicionar método para marcar mensagem como lida
  async markMessageAsRead(messageId: string, message: Message): Promise<void> {
    const updatedMessage: Partial<Message> = {
      ...message,
      isRead: true
    };
    await this.firestore.updateDocument('messages', messageId, updatedMessage);
  }
}
