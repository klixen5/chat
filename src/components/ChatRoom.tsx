import ChatHeader from './ChatHeader.tsx'
import MessageList from './MessageList.tsx'
import MessageForm from './MessageForm.tsx'
import { type Room } from '../api/types.ts'
import styles from './ChatRoom.module.css'


type ChatRoomProps = {
  name: string
  currentRoom: Room | null
}


export default function ChatRoom({ name, currentRoom }: ChatRoomProps) {

  if (currentRoom === null) {
    return <h1>Выберите комнату</h1>
  }

  function sendMessage(text: string): void {

  }

  return (
    <div className={styles.container}>
      <ChatHeader name={currentRoom.name} description={currentRoom.description} />
      <MessageList messages={[]}/>
      <MessageForm sendMessage={sendMessage} />
    </div>
  )
}
