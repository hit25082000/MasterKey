import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Message } from '../../core/models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  newMessage: string = '';
  currentUserId: string | null = null;
  currentUserName: string | null = null;

  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.currentUserName = user.displayName;
        this.loadMessages();
      }
    });
  }

  loadMessages() {
    this.chatService.getMessages().subscribe((messages) => {
      this.messages = messages;
    });
  }

  sendMessage() {
    if (this.newMessage.trim() && this.currentUserId) {
      this.chatService.sendMessage(
        this.currentUserId,
        this.newMessage,
        this.currentUserName!
      );
      this.newMessage = '';
    }
  }
}
