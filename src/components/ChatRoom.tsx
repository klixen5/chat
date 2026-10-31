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
    error: string | null
    hasMore: boolean
    nextBefore: number | null
    isLoadingMore: boolean
  }
  sendMessage: (text: string) => void
  roomLeave: () => void
  className: string
}


export default function ChatRoom({ currentRoom, roomInfo, historyInfo, sendMessage, roomLeave, className }: ChatRoomProps) {

  if (currentRoom === null) {
    return <h1 className={`${styles.hint} ${className}`}>Выберите комнату</h1>
  }

  return (
    <section className={`${styles.container} ${className}`}>
      <ChatHeader
        currentRoom={currentRoom}
        roomInfo={roomInfo}
        roomLeave={roomLeave}
      />
      <MessageList historyInfo={historyInfo} />
      <MessageForm
        currentRoom={currentRoom}
        roomInfo={roomInfo}
        sendMessage={sendMessage}
      />
    </section>
  )
}
