import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../../core/models/message.model';
import { FirestoreService } from '../../core/services/firestore.service';
import { orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore = inject(FirestoreService);

  getMessages(): Observable<Message[]> {
    return new Observable<Message[]>((observer) => {
      this.firestore
        .getDocumentsByQuery<Message>('messages', orderBy('timestamp'))
        .then((messages) => {
          observer.next(messages);
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  async sendMessage(
    userId: string,
    content: string,
    userName: string
  ): Promise<void> {
    const message: Message = {
      userId,
      content,
      userName,
      timestamp: new Date(),
    };
    await this.firestore.addToCollection('messages', message);
  }
}
