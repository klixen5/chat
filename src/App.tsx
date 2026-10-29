import LoginForm from './components/LoginForm.tsx'
import ChatPage from './components/ChatPage.tsx'
import { fetchHealth } from './api/restApi.ts'
import { type SubmitEvent, useState, useEffect } from 'react'
import styles from './App.module.css'


type CheckServerStatusState = 'idle' | 'pending' | 'fulfilled' | 'rejected'


export default function App() {
  const [name, setName] = useState<string | null>(null)
  const [valid, setValid] = useState(true)
  const [checkServerStatus, setCheckServerStatus] = useState<CheckServerStatusState>('idle')

  useEffect(() => {
    const controller = new AbortController()
    setCheckServerStatus('pending')

    fetchHealth(controller.signal)
      .then(_ => setCheckServerStatus('fulfilled'))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') {
          return
        }
        console.error(e)
        setCheckServerStatus('rejected')
      })

    return () => controller.abort()
  }, []);

  function handleSubmitLoginForm(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (new FormData(form).get('username') as string).trim()

    if (isValid(name)) {
      setName(name)
    } else {
      setValid(false)
    }
  }

  if (checkServerStatus === 'idle' || checkServerStatus === 'pending') {
    return <p className={styles.download}>Загрузка...</p>
  }

  if (checkServerStatus === 'rejected') {
    return <p className={styles.error}>Сервер недоступен</p>
  }

  return name === null
    ? <LoginForm showError={!valid} onSubmit={handleSubmitLoginForm} setValid={setValid} />
    : <ChatPage name={name} />
}


function isValid(text: string): boolean {
  const clearText = text.trim()
  return clearText.length >= 2 && clearText.length <= 30
}


