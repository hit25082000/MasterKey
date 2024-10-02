import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Message } from '../../core/models/message.model';
import { FirestoreService } from '../../core/services/firestore.service';
import { orderBy, where } from '@angular/fire/firestore';
import { Conversation } from '../../core/models/conversation.model';

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
    return from(
      this.firestore.getDocumentsByQuery<Message>(
        'messages',
        where(
          'participants',
          'array-contains',
          [currentUserId, selectedUserId].sort().join('_')
        ),
        orderBy('timestamp')
      )
    );
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
}
