import { type Message } from '../api/dataType.ts'
import styles from './MessageItem.module.css'


type MessageItemProps = {
  message: Message
}


export default function MessageItem({ message }: MessageItemProps) {
  return (
    <div className={styles.container}>
      <div className={styles.meta}>
        <div>
          {message.authorName}
        </div>
        <time dateTime={message.createdAt}>
          {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
      <div className={styles.message}>
        {message.text}
      </div>
    </div>
  )
}