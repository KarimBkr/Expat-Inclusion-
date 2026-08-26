export interface ConversationPeer {
  id: number;
  name: string;
}

export interface ConversationSummary {
  conversation_id: string;
  booking_id: number;
  status: string;
  participant_ids: string[];
  parent_id: string;
  aesh_user_id: string | null;
  peer: ConversationPeer | null;
  created_at: string | null;
}

export interface FirebaseTokenResponse {
  token: string;
  uid: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: Date | null;
}

export interface ConversationMeta {
  lastMessageAt: Date | null;
  lastMessageSenderId: string | null;
}
