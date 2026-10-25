import { type ReactNode } from 'react'
import styles from './ChatLayout.module.css'

type ChatLayoutProps = {
  name: string
  children: ReactNode
}

export default function ChatLayout({ name, children }: ChatLayoutProps) {
  return (
    <div>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoSymbol}>#</div>
          <span className={styles.logoText}>Комната</span>
        </div>
        <p className={styles.slogan}>Место для хороших вопросов</p>
        <div className={styles.profileIcon}>{name[0]}</div>
      </header>
    </div>
  )
}