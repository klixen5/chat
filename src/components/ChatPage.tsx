import RoomList from './RoomList.tsx'
import ChatRoom from './ChatRoom.tsx'
import ChatLayout from './ChatLayout.tsx'
import { useChat } from '../hooks/useChat.ts'
import styles from './ChatPage.module.css'


type ChatPageProps = {
  name: string
  outProfile: () => void
}

export default function ChatPage({ name, outProfile }: ChatPageProps) {
  const [
    currentRoom,
    setCurrentRoom,
    connection,
    sendMessage,
    roomLeave,
    historyLoadBefore
  ] = useChat(name)

  switch (connection.connectionInfo.status) {
    case 'connecting':
      return <p className={styles.download}>Соединение...</p>
    case 'identifying':
      return <p className={styles.download}>Запуск сессии...</p>
    case 'error':
      return <p className={styles.download}>{connection.connectionInfo.error}</p>
    case 'disconnected':
      return <p className={styles.download}>Соединение разорвано</p>
  }

  return (
    <div>
      <ChatLayout name={name}>
        <RoomList
          name={name}
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          outProfile={outProfile}
          className={currentRoom ? styles.hiddenOnMobile : ''}
        />
        <ChatRoom
          currentRoom={currentRoom}
          roomInfo={connection.roomInfo}
          historyInfo={connection.historyInfo}
          sendMessage={sendMessage}
          roomLeave={roomLeave}
          historyLoadBefore={historyLoadBefore}
          className={!currentRoom ? styles.hiddenOnMobile : ''}
        />
      </ChatLayout>
    </div>
  )
}