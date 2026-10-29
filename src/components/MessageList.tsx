import MessageItem from './MessageItem.tsx'
import { type Message } from '../api/types.ts'
import styles from './MessageList.module.css'

type MessageListProps = {
  messages: Message[]
}


export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className={styles.container}>
      {messages.map(message => <MessageItem key={message.id} message={message} />)}
    </div>
  )
}