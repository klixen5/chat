import ChatHeader from './ChatHeader.tsx'
import MessageList from './MessageList.tsx'
import MessageForm from './MessageForm.tsx'
import { type Room, type Message } from '../api/types.ts'
import { type HistoryStatus, type RoomStatus } from '../hooks/chatReducer.ts'
import styles from './ChatRoom.module.css'


type ChatRoomProps = {
  currentRoom: Room | null
  roomInfo: {
    status: RoomStatus
    confirmedRoom: Room | null
    error: string | null
  }
  historyInfo: {
    roomId: string | null
    status: HistoryStatus
    messages: Message[]
  }
  sendMessage: (text: string) => void
}


export default function ChatRoom({ currentRoom, roomInfo, historyInfo, sendMessage }: ChatRoomProps) {

  if (currentRoom === null) {
    return <h1 className={styles.selectRoom}>Выберите комнату</h1>
  }

  return (
    <div className={styles.container}>
      <ChatHeader currentRoom={currentRoom} roomInfo={roomInfo} />
      <MessageList messages={historyInfo.messages}/>
      <MessageForm sendMessage={sendMessage} />
    </div>
  )
}
