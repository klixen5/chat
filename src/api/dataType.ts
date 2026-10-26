export type Room = {
  id: string
  name: string
  description: string
}

export type Message = {
  id: number
  roomId: string
  clientMessageId: string
  authorName: string
  text: string
  createdAt: string
}