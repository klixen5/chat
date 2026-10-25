import { type Status } from './ChatPage.tsx'
import styles from './ChatHeader.module.css'

type ChatHeaderProps = {
  status: Status
  name: string
  description: string
}

export default function ChatHeader({ status, name, description }: ChatHeaderProps) {
  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>
          <span>#</span>
          <span>{name}</span>
        </h1>
        <p className={styles.description}>{description}</p>
      </div>
      {status === 'identifying' ? (
        <div className={`${styles.statusEl} ${styles.connectedStatus}`}>Подключено</div>
      ) : (
        <div className={`${styles.statusEl} ${styles.disconnectedStatus}`}>Не подключено</div>
      )}
    </div>
  )
}