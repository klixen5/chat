import LoginForm from './components/LoginForm.tsx'

import { useState } from 'react'

import { type ChangeEvent, type SubmitEvent } from 'react'



type ResponseRooms = {
  items: Array<{ id: string, name: string, description: string }>
}

type State = {
  name: string
  isComeIn: boolean
  rooms: ResponseRooms
}

const actions = {
  updateName: 'updateName',
  updateRooms: 'updateRooms',
  updateIsComeIn: 'updateIsComeIn'
} as const


export default function App() {
  const [name, setName] = useState('')
  const [isComeIn, setIsComeIn] = useState(false)

  function handleChangeLoginForm(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }

  async function handleSubmitLoginForm(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsComeIn(true)
  }

  return (
    <LoginForm
      name={name}
      onChange={handleChangeLoginForm}
      onSubmit={handleSubmitLoginForm}
    />
  )
}


