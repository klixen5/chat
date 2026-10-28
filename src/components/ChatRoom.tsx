import ChatHeader from './ChatHeader.tsx'
import MessageList from './MessageList.tsx'
import MessageForm from './MessageForm.tsx'
import { type Room, type Message } from '../api/types.ts'
import { type HistoryStatus } from '../hooks/chatReducer.ts'
import styles from './ChatRoom.module.css'


type ChatRoomProps = {
  name: string
  currentRoom: Room | null
  historyInfo: {
    roomId: string | null
    status: HistoryStatus
    messages: Message[]
  }
  sendMessage: (text: string) => void
}


export default function ChatRoom({ name, currentRoom, historyInfo, sendMessage }: ChatRoomProps) {
  if (currentRoom === null) {
    return <h1>Выберите комнату</h1>
  }

  return (
    <div className={styles.container}>
      <ChatHeader name={currentRoom.name} description={currentRoom.description} />
      <MessageList messages={historyInfo.messages}/>
      <MessageForm sendMessage={sendMessage} />
    </div>
  )
}
