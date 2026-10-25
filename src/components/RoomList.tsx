import RoomItem from './RoomItem.tsx'
import getRooms, { type RoomsResponse } from '../api/getRooms.ts'
import { useState, useEffect } from 'react'
import { type Room } from './ChatPage.tsx'


type RoomListProps = {
  roomId: string | null
  updateRoom: (room: Room) => () => void
}
type RoomsState = RoomsResponse | null


export default function RoomList({ roomId, updateRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomsState>(null)
  const [health, setHealth] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    getRooms(controller.signal)
      .then(rooms => {
        setRooms(rooms)
        updateRoom(rooms.items[0])
      })
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
  }, [updateRoom])

  const roomsElement = rooms !== null ? (
    <nav>
      {rooms.items.map(item =>
        <RoomItem
          key={item.id}
          name={item.name}
          selected={item.id === roomId}
          onClick={updateRoom(item)}
        />
      )}
    </nav>
  ) : (
    <p>Загрузка...</p>
  )

  if (!health) {
    return <p>Ошибка сервера</p>
  }

  return (
    <div>
      <h2>Комнаты</h2>
      {roomsElement}
    </div>
  )
}