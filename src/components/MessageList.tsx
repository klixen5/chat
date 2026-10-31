import MessageItem from './MessageItem.tsx'
import { useRef, useEffect } from 'react'
import { type Message } from '../api/types.ts'
import styles from './MessageList.module.css'

type MessageListProps = {
  messages: Message[]
}


export default function MessageList({ messages }: MessageListProps) {
  const list = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (list.current === null) return

    list.current.scrollTop = list.current.scrollHeight - list.current.clientHeight
  }, [messages])

  return (
    <div ref={list} className={styles.container}>
      {messages.map(message => <MessageItem key={message.id} message={message} />)}
    </div>
  )
}