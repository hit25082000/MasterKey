import { Entity } from './entity';

interface ParticipantInfo {
  name: string;
  role: string;
}

export interface Conversation extends Entity {
  participants: string[];
  participantsInfo: {
    [key: string]: ParticipantInfo;
  };
  lastMessage: string;
  lastMessageTimestamp: Date;
  lastMessageSender: string;
  lastMessageSenderName: string;
  unreadCount?: number;
}
