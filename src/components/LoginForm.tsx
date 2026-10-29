import { type SubmitEvent, useId, useState, type Dispatch, type SetStateAction } from 'react'
import styles from './LoginForm.module.css'

type LoginFormProps = {
  showError: boolean
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
  setValid: Dispatch<SetStateAction<boolean>>
}

export default function LoginForm({ showError, onSubmit: handleSubmit, setValid }: LoginFormProps) {
  const [name, setName] = useState('')

  const nameId = useId()
  const formId = useId()

  return (
    <div className={styles.loginForm}>
      <div className={`${styles.column} ${styles.columnHero}`}>
        <div className={styles.logo}>
          <div className={styles.logoSymbol}>#</div>
          комната
        </div>
        <p className={styles.heroSlogan}>Для тех, кто разбирается вместе</p>
        <h1 className={styles.heroTitle}>
          Хороший вопрос.<br />
          Живой разговор.
        </h1>
        <p className={styles.heroDescription}>Обсуждай JavaScript, React и алгоритмы. Одна тема - одна комната.</p>
        <div className={styles.topics}>
          <div className={styles.topic}># JavaScript</div>
          <div className={styles.topic}># React</div>
          <div className={styles.topic}># Алгоритмы</div>
        </div>
      </div>
      <div className={`${styles.column} ${styles.columnForm}`}>
        <header className={styles.formHeader}>
          <p className={styles.formSlogan}>Без лишних формальностей</p>
          <h2 className={styles.formTitle}>Давай знакомиться</h2>
          <p className={styles.formHint}>Выбери имя, под которым тебя увидят в общих комнатах</p>
        </header>
        <form onSubmit={handleSubmit} className={styles.form} id={formId}>
          <label htmlFor={nameId} className={styles.formLabel}>Твоё имя</label>
          <input
            id={nameId}
            className={styles.formInput}
            name="username"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (showError) {
                setValid(true)
              }
            }}
          />
          {showError
            ? <p className={styles.formNoValid}>Имя должно содержать от 2 до 30 символов</p>
            : <p className={styles.formValid}>От 2 до 30 символов. Можно использовать ник.</p>
          }

        </form>
        <button form={formId} type="submit" className={styles.formSubmit} >Войти в чат</button>
        <p className={styles.formDescription}>Без пароля и регистрации. История комнат общая для всех.</p>
      </div>
    </div>
  )
}