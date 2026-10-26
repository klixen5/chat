import styles from './MessageForm.module.css'


export default function MessageForm() {
  return (
    <div className={styles.container}>
      <form className={styles.form}>
        <input id="message" className={styles.input} name="message" placeholder="Сообщение" />
        <button type="submit" className={styles.button}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.4167 6.58333L6.58333 0.75L0.75 6.58333M6.58333 0.75V12.4167" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="white"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

