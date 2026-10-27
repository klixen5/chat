import { type ConnectionStatus, type RoomStatus, type HistoryStatus } from '../hooks/useChat.ts'
import styles from './ChatHeader.module.css'

type ChatHeaderProps = {
  connectionStatus: ConnectionStatus
  roomStatus: RoomStatus
  historyStatus: HistoryStatus
  name: string
  description: string
}

export default function ChatHeader({ connectionStatus, roomStatus, historyStatus , name, description }: ChatHeaderProps) {
  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>
          <span>#</span>
          <span>{name}</span>
        </h1>
        <p className={styles.description}>{description}</p>
      </div>
      {connectionStatus === 'ready' && roomStatus === 'join' && historyStatus === 'ready' ? (
        <div className={`${styles.statusEl} ${styles.connectedStatus}`}>Подключено</div>
      ) : (
        <div className={`${styles.statusEl} ${styles.disconnectedStatus}`}>Не подключено</div>
      )}
    </div>
  )
}