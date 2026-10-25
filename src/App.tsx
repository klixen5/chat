import LoginForm from './components/LoginForm.tsx'
import ChatPage from './components/ChatPage.tsx'

import fetchHealth from './api/health.ts'

import { type ChangeEvent, type SubmitEvent, useState, useEffect } from 'react'


export default function App() {
  const [name, setName] = useState('')
  const [isComeIn, setIsComeIn] = useState(false)
  const [health, setHealth] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetchHealth(controller.signal)
      .catch((e: Error) => {
        switch (e.name) {
          case 'AbortError':
            break
          case 'TypeError':
            setHealth(false)
            break
          case 'HttpError':
            setHealth(false)
            break
          default:
            throw e
        }
      })

    return () => controller.abort()
  }, []);

  function handleChangeLoginForm(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }

  async function handleSubmitLoginForm(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsComeIn(true)
  }

  const page = !isComeIn ? (
    <LoginForm
      name={name}
      onChange={handleChangeLoginForm}
      onSubmit={handleSubmitLoginForm}
    />
  ) : (
    <ChatPage name={name}/>
  )

  return health ? page : <p>Ошибка сервера</p>
}


