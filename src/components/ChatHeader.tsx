import type { RoomStatus } from '../hooks/chatReducer.ts'
import type { Room } from '../api/types.ts'
import styles from './ChatHeader.module.css'

type ChatHeaderProps = {
  currentRoom: Room
  roomInfo: {
    status: RoomStatus
    confirmedRoom: Room | null
    error: string | null
  }
}

export default function ChatHeader({ currentRoom, roomInfo }: ChatHeaderProps) {
  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>
          <span>#</span>
          <span>{currentRoom?.name}</span>
        </h1>
        <p className={styles.description}>{currentRoom.description}</p>
      </div>
      {
        roomInfo.status === 'error'
        ? <div className={`${styles.statusEl} ${styles.disconnectedStatus}`}>Не удалось подключиться</div>
        : roomInfo.status === 'joined' && roomInfo.confirmedRoom?.id === currentRoom.id
        ? <div className={`${styles.statusEl} ${styles.connectedStatus}`}>Подключено</div>
        : <div className={`${styles.statusEl} ${styles.pendingStatus}`}>Подключение</div>
      }
    </div>
  )
}