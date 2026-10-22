export type RoomId = 'javascript' | 'react' | 'algorithms';
export interface Room { id: RoomId; name: string; description: string }
export interface ChatMessage {
  id: number;
  roomId: RoomId;
  clientMessageId: string;
  authorName: string;
  text: string;
  createdAt: string;
}
export interface ApiError { code: string; message: string; details?: { field?: string } }
export interface HistoryResponse {
  items: ChatMessage[];
  pagination: { limit: number; hasMore: boolean; nextBefore: number | null; nextAfter: number | null };
}
type ClientPacket<T extends string, D> = { type: T; requestId?: string; data: D };
export type ClientEvent =
  | ClientPacket<'session:identify', { name: string }>
  | ClientPacket<'room:join', { roomId: RoomId }>
  | ClientPacket<'room:leave', Record<string, never>>
  | ClientPacket<'message:send', { roomId: RoomId; text: string; clientMessageId: string }>;
type ServerPacket<T extends string, D> = { type: T; requestId?: string; data: D };
export type ServerEvent =
  | ServerPacket<'connection:ready', { connectionId: string }>
  | ServerPacket<'session:ready', { connectionId: string; name: string }>
  | ServerPacket<'room:joined', { room: Room }>
  | ServerPacket<'room:left', { roomId: RoomId | null }>
  | ServerPacket<'message:created', { message: ChatMessage }>
  | ServerPacket<'message:ack', { message: ChatMessage; duplicate: boolean }>
  | ServerPacket<'error', ApiError>;
