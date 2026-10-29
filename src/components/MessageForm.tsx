import { type SubmitEvent, useState } from 'react'
import { type RoomStatus } from "../hooks/chatReducer.ts";
import { type Room } from "../api/types.ts";
import styles from './MessageForm.module.css'


type MessageFromProps = {
  currentRoom: Room
  roomInfo: {
    status: RoomStatus
    confirmedRoom: Room | null
    error: string | null
  }
  sendMessage: (text: string) => void
}


export default function MessageForm({ currentRoom, roomInfo, sendMessage }: MessageFromProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (text.trim() === '') {
      return
    }

    setText('')
    sendMessage(text)
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          id="message"
          className={styles.input}
          name="message"
          placeholder="Сообщение"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className={styles.button} disabled={!(roomInfo.status === 'joined' && roomInfo.confirmedRoom?.id === currentRoom.id)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.4167 6.58333L6.58333 0.75L0.75 6.58333M6.58333 0.75V12.4167" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

