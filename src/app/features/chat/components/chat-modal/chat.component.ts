import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Message } from '../../../../core/models/message.model';
import { Conversation } from '../../../../core/models/conversation.model';
import { UserSelectionDialogComponent } from '../user-selection-dialog/user-selection-dialog.component';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  conversations: Conversation[] = [];
  newMessage: string = '';
  currentUserId: string | null = null;
  currentUserName: string | null = null;
  selectedUserId: string | null = null;
  isMinimized: boolean = false;
  unreadMessagesCount: number = 0;

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.currentUserName = user.displayName;
        this.loadConversations();
      }
    });
  }

  loadConversations() {
    this.chatService
      .getConversations(this.currentUserId!)
      .subscribe((conversations) => {
        this.conversations = conversations;
        this.updateUnreadMessagesCount();
      });
  }

  updateUnreadMessagesCount() {
    this.unreadMessagesCount = this.conversations.reduce(
      (count, conversation) => count + (conversation.unreadCount || 0),
      0
    );
  }

  selectConversation(conversation: Conversation) {
    this.selectedUserId = conversation.participants.find(
      (participant) => participant !== this.currentUserId
    ) as string;
    this.loadMessages();
    this.markConversationAsRead(conversation);
  }

  markConversationAsRead(conversation: Conversation) {
    if (conversation.unreadCount && conversation.unreadCount > 0) {
      this.chatService.markConversationAsRead(
        this.currentUserId!,
        conversation.userId
      );
      this.updateUnreadMessagesCount();
    }
  }

  loadMessages() {
    if (this.currentUserId && this.selectedUserId) {
      this.chatService
        .getMessages(this.currentUserId, this.selectedUserId)
        .subscribe((messages) => {
          this.messages = messages;
        });
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.currentUserId && this.selectedUserId) {
      this.chatService.sendMessage(
        this.currentUserId,
        this.selectedUserId,
        this.newMessage,
        this.currentUserName!
      );
      this.newMessage = '';
    }
  }

  openNewConversationDialog() {
    const dialogRef = this.dialog.open(UserSelectionDialogComponent, {
      width: '250px',
      data: { currentUserId: this.currentUserId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.startNewConversation(result);
      }
    });
  }

  startNewConversation(selectedUser: any) {
    this.chatService
      .createConversation(
        this.currentUserId!,
        selectedUser.id,
        selectedUser.name
      )
      .then(() => {
        this.loadConversations();
        this.selectConversation({
          userId: selectedUser.id,
          userName: selectedUser.name,
          lastMessage: '', // Adicione uma string vazia ou um valor padrão apropriado
          lastMessageTimestamp: new Date(), // Use a data atual ou um valor padrão apropriado
          participants: [this.currentUserId!], // Adicione o operador de asserção não nula
        });
      });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    if (!this.isMinimized) {
      this.unreadMessagesCount = 0;
    }
  }
}
