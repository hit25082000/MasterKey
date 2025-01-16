import { Entity } from './entity';

export interface Conversation extends Entity {
  participants: string[];
  participantsInfo: {
    [key: string]: string;  // key é o userId, value é o userName
  };
  lastMessage: string;
  lastMessageTimestamp: Date;
  lastMessageSender: string;
  lastMessageSenderName: string;
  unreadCount?: number;
}
