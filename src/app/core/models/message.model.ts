export interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  userName: string;
  timestamp: Date;
  participants: string;
}
