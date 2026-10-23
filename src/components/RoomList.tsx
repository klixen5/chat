import RoomItem from './RoomItem.tsx'

import getRooms, { type RoomsResponse } from '../api/rooms.ts'

import { useState, useEffect } from 'react'


type StateRooms = null | RoomsResponse

export default function RoomList() {
  const [rooms, setRooms] = useState<StateRooms>(null)
  const [health, setHealth] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    getRooms(controller.signal)
      .then(rooms => setRooms(rooms))
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

  const page = rooms !== null ? (
    rooms.items.map(item =>
      <RoomItem key={item.id} name={item.name} />)
  ) : (
    <p>Загрузка...</p>
  )

  return (
    <div>
      <p>RoomList</p>
      {health ? page : <p>Ошибка сервера</p>}
    </div>
  )
}