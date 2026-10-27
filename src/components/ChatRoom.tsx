import ChatHeader from './ChatHeader.tsx'
import MessageList from './MessageList.tsx'
import MessageForm from './MessageForm.tsx'
import useChat from '../hooks/useChat.ts'
import { type Room } from '../api/dataType.ts'
import styles from './ChatRoom.module.css'


type ChatRoomProps = {
  name: string
  currentRoom: Room | null
}


export default function ChatRoom({ name, currentRoom }: ChatRoomProps) {
  const [
    connectionStatus,
    roomStatus,
    historyStatus,
    confirmObjects,
    sendMessage,
  ] = useChat(name, currentRoom)

  if (currentRoom === null) {
    return <h1>Выберите комнату</h1>
  }

  return (
    <div className={styles.container}>
      <ChatHeader name={currentRoom.name} description={currentRoom.description} status={'disconnected'} />
      <MessageList messages={confirmObjects.messages} />
      <MessageForm sendMessage={sendMessage} />
    </div>
  )
}
