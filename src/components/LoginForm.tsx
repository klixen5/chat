import { type ChangeEvent, type SubmitEvent } from 'react'

type LoginFormProps = {
  name: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

export default function LoginForm({ name, onChange: handleChange, onSubmit: handleSubmit }: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="userName">Ведите имя:</label>
      <input
        id="userName"
        name="userName"
        value={name}
        onChange={handleChange}
      />
      <button type="submit">Войти</button>
    </form>
  )
}