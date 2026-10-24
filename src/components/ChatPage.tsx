import RoomList from './RoomList.tsx'
import ChatRoom from './ChatRoom.tsx'
import {useEffect, useState} from 'react'


type ChatPageProps = {
  name: string
}

type RoomsState = string | null

export default function ChatPage({ name }: ChatPageProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<RoomsState>(null)



  return (
    <div>
      <RoomList selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} />
      <ChatRoom />
    </div>
  )
}