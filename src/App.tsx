import LoginForm from './components/LoginForm.tsx'
import ChatPage from './components/ChatPage.tsx'
import { fetchHealth } from './api/restApi.ts'
import { type SubmitEvent, useState, useEffect } from 'react'


type CheckServerStatusState = 'idle' | 'pending' | 'fulfilled' | 'rejected'


export default function App() {
  const [name, setName] = useState<string | null>(null)
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
    const name = new FormData(form).get('username') as string
    setName(name)
  }

  if (checkServerStatus === 'idle' || checkServerStatus === 'pending') {
    return <p>Загрузка</p>
  }

  if (checkServerStatus === 'rejected') {
    return <p>Сервер недоступен</p>
  }

  return name === null ? <LoginForm onSubmit={handleSubmitLoginForm} /> : <ChatPage name={name} />
}


