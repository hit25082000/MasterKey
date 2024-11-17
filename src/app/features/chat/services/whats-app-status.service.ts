import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

interface MessageStatus {
  userId: string;
  userName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppStatusService {
  messageStatuses = signal<MessageStatus[]>([]);
  isMinimized = signal<boolean>(false);
  isVisible = signal<boolean>(false);

  updateStatus(statuses: MessageStatus[]) {
    this.messageStatuses.set(statuses);
    this.isVisible.set(statuses.length > 0);
  }

  toggleMinimize() {
    this.isMinimized.update(value => !value);
  }

  clear() {
    this.messageStatuses.set([]);
    this.isVisible.set(false);
  }

  getSuccessCount(): number {
    return this.messageStatuses().filter(status => status.status === 'success').length;
  }
}
