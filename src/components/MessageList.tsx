import MessageItem from './MessageItem.tsx'
import { useRef, useEffect } from 'react'
import { type HistoryStatus } from '../hooks/chatReducer.ts'
import { type Message } from '../api/types.ts'
import styles from './MessageList.module.css'

type MessageListProps = {
  historyInfo: {
    roomId: string | null
    status: HistoryStatus
    messages: Message[]
    error: string | null
    hasMore: boolean
    nextBefore: number | null
    isLoadingMore: boolean
  }
}


export default function MessageList({ historyInfo }: MessageListProps) {
  const list = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (list.current === null) return

    list.current.scrollTop = list.current.scrollHeight - list.current.clientHeight
  }, [historyInfo.messages])

  return (
    <div ref={list} className={styles.container}>
      {historyInfo.hasMore ? <button className={styles.loadBtn}>Загрузить предыдущие 30 сообщений</button> : <span className={styles.endText}>Сообщений больше нет</span>}
      {historyInfo.messages.map(message => <MessageItem key={message.id} message={message} />)}
    </div>
  )
}