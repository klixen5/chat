import RoomList from './RoomList.tsx'
import ChatRoom from './ChatRoom.tsx'
import ChatLayout from './ChatLayout.tsx'
import { useChat } from '../hooks/useChat.ts'
import styles from './ChatPage.module.css'


type ChatPageProps = {
  name: string
}

export default function ChatPage({ name }: ChatPageProps) {
  const [currentRoom, setCurrentRoom, connection, sendMessage] = useChat(name)


  if (connection.connectionInfo.status !== 'ready') {
    return <p className={styles.download}>Загрузка...</p>
  }

  return (
    <div>
      <ChatLayout name={name}>
        <RoomList
          name={name}
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
        />
        <ChatRoom
          currentRoom={currentRoom}
          roomInfo={connection.roomInfo}
          historyInfo={connection.historyInfo}
          sendMessage={sendMessage}
        />
      </ChatLayout>
    </div>
  )
}