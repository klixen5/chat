import RoomList from './RoomList.tsx'
import ChatRoom from './ChatRoom.tsx'
import ChatLayout from './ChatLayout.tsx'
import { useChat } from '../hooks/useChat.ts'


type ChatPageProps = {
  name: string
}

export default function ChatPage({ name }: ChatPageProps) {
  const [currentRoom, setCurrentRoom, connection, sendMessage] = useChat(name)

  return (
    <div>
      <ChatLayout name={name}>
        <RoomList
          name={name}
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
        />
        <ChatRoom
          name={name}
          currentRoom={currentRoom}
          historyInfo={connection.historyInfo}
          sendMessage={sendMessage}
        />
      </ChatLayout>
    </div>
  )
}