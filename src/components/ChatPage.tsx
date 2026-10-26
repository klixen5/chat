import RoomList from './RoomList.tsx'
import ChatRoom from './ChatRoom.tsx'
import ChatLayout from './ChatLayout.tsx'
import { useState } from 'react'
import { type Room } from '../api/dataType.ts'


type ChatPageProps = {
  name: string
}

export default function ChatPage({ name }: ChatPageProps) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)

  return (
    <div>
      <ChatLayout name={name}>
        <RoomList name={name} currentRoom={currentRoom} setCurrentRoom={setCurrentRoom} />
        <ChatRoom name={name} currentRoom={currentRoom} />
      </ChatLayout>
    </div>
  )
}