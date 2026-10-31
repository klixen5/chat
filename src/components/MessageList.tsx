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
  historyLoadBefore: () => void
}


export default function MessageList({ historyInfo, historyLoadBefore }: MessageListProps) {
  const list = useRef<HTMLDivElement | null>(null)
  const skipNextScroll = useRef(false)

  useEffect(() => {
    if (skipNextScroll.current) {
      skipNextScroll.current = false
      return
    }

    const element = list.current
    if (element === null) return

    element.scrollTop = element.scrollHeight - element.clientHeight
  }, [historyInfo.messages])

  function handleHistoryLoadBefore(): void {
    skipNextScroll.current = true
    historyLoadBefore()
  }

  return (
    <div ref={list} className={styles.container}>
      {
        historyInfo.hasMore
        ? <button className={styles.loadBtn} onClick={handleHistoryLoadBefore}>Загрузить предыдущие 30 сообщений</button>
        : <span className={styles.endText}>Сообщений больше нет</span>
      }
      {historyInfo.messages.map(message => <MessageItem key={message.id} message={message} />)}
    </div>
  )
}