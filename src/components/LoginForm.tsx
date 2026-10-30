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
    <main className={styles.loginForm}>
      <div className={styles.columnHero}>
        <p className={styles.heroSlogan}>Для тех, кто разбирается вместе</p>
        <h1 className={styles.heroTitle}>
          Хороший вопрос.<br />
          Живой разговор.
        </h1>
        <p className={styles.heroDescription}>Обсуждай JavaScript, React и алгоритмы. Одна тема - одна комната.</p>
        <ul className={styles.topics}>
          <li className={styles.topic}># JavaScript</li>
          <li className={styles.topic}># React</li>
          <li className={styles.topic}># Алгоритмы</li>
        </ul>
      </div>
      <section className={styles.columnForm}>
        <header className={styles.formHeader}>
          <p className={styles.formSlogan}>Без лишних формальностей</p>
          <h2 className={styles.formTitle}>
            <span className={styles.fullText}>Давай знакомиться</span>
            <span className={styles.shortText}>Как тебя зовут?</span>
          </h2>
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
            ? <p className={styles.hintNoValid}>Имя должно содержать от 2 до 30 символов</p>
            : <p className={styles.hintValid}>От 2 до 30 символов. Можно использовать ник.</p>
          }

        </form>
        <button form={formId} type="submit" className={styles.submit} >Войти в чат</button>
        <p className={styles.formDescription}>Без пароля и регистрации. История комнат общая для всех.</p>
      </section>
    </main>
  )
}