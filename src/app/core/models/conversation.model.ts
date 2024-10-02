export interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTimestamp: Date;
  participants: string[]; // Nova propriedade adicionada
}
