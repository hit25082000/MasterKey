import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Message } from '../../../core/models/message.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { orderBy, where } from '@angular/fire/firestore';
import { Conversation } from '../../../core/models/conversation.model';

type ConversationWithParticipants = Conversation & { participants: string[] };

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore = inject(FirestoreService);

  getUsers(): Observable<any[]> {
    return from(this.firestore.getCollection<any>('users'));
  }

  getMessages(
    currentUserId: string,
    selectedUserId: string
  ): Observable<Message[]> {
    return this.firestore.getCollectionWithQuery<Message>('messages', [
      where(
        'participants',
        '==',
        [currentUserId, selectedUserId].sort().join('_')
      ),
      orderBy('timestamp'),
    ]);
  }

  async sendMessage(
    currentUserId: string,
    selectedUserId: string,
    content: string,
    userName: string
  ): Promise<void> {
    const message: Message = {
      senderId: currentUserId,
      receiverId: selectedUserId,
      content,
      userName,
      timestamp: new Date(),
      participants: [currentUserId, selectedUserId].sort().join('_'),
    };
    await this.firestore.addToCollection('messages', message);
  }

  getConversations(userId: string): Observable<Conversation[]> {
    return from(
      this.firestore.getDocumentsByQuery<Conversation>(
        'conversations',
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTimestamp', 'desc')
      )
    );
  }

  async createConversation(
    currentUserId: string,
    selectedUserId: string,
    selectedUserName: string
  ): Promise<void> {
    const conversation: ConversationWithParticipants = {
      userId: currentUserId,
      userName: selectedUserName,
      participants: [currentUserId, selectedUserId],
      lastMessage: '',
      lastMessageTimestamp: new Date(),
    };
    await this.firestore.addToCollection('conversations', conversation);
  }

  async markConversationAsRead(
    currentUserId: string,
    otherUserId: string
  ): Promise<void> {
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    await this.firestore.updateDocument('conversations', conversationId, {
      unreadCount: 0,
    });
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
      unreadCount: 1, // Incrementa o contador de mensagens não lidas
    });
  }

  async incrementUnreadCount(
    currentUserId: string,
    otherUserId: string
  ): Promise<void> {
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    const conversation =
      await this.firestore.getDocument<ConversationWithParticipants>(
        'conversations',
        conversationId
      );

    if (conversation) {
      const newUnreadCount = (conversation.unreadCount || 0) + 1;
      await this.firestore.updateDocument('conversations', conversationId, {
        unreadCount: newUnreadCount,
      });
    }
  }
}
