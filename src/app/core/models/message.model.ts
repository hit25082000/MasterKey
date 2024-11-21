import { Entity } from './entity';

export interface Message extends Entity {
  senderId: string;
  receiverId: string;
  content: string;
  userName: string;
  timestamp: Date;
  participants: string;
  isRead: boolean;
}
