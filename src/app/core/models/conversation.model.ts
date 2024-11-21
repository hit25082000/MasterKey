import { Entity } from './entity';

export interface Conversation extends Entity {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTimestamp: Date;
  lastMessageSender: string;
  lastMessageSenderName: string;
  participants: string[];
  unreadCount?: number;
}
