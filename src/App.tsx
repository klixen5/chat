import LoginForm from './components/LoginForm.tsx'
import ChatPage from './components/ChatPage.tsx'

import HttpError from './api/HttpError.tsx'

import { type ChangeEvent, type SubmitEvent, useState, useEffect } from 'react'

const healthUrl = 'http://127.0.0.1:3001/api/health'

export default function App() {
  const [name, setName] = useState('')
  const [isComeIn, setIsComeIn] = useState(false)
  const [health, setHealth] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function checkServer(): Promise<void> {
      try {
        const response = await fetch(healthUrl, { signal: controller.signal })
        if (response.status !== 200) {
          throw new HttpError(response.status)
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
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
        }
      }
    }
    checkServer()

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
    <ChatPage />
  )

  return health ? page : <p>Ошибка сервера</p>
}


