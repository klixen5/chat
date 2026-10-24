import RoomItem from './RoomItem.tsx'
import getRooms, { type RoomsResponse } from '../api/getRooms.ts'
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'


type RoomListProps = {
  selectedRoomId: string | null
  setSelectedRoomId: Dispatch<SetStateAction<string | null>>
}
type RoomsState = null | RoomsResponse


export default function RoomList({ selectedRoomId, setSelectedRoomId }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomsState>(null)
  const [health, setHealth] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    getRooms(controller.signal)
      .then(rooms => {
        setRooms(rooms)
        setSelectedRoomId(rooms.items[0].id)
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
  }, [setSelectedRoomId])

  function handleClick(id: string): () => void {
    return  () => setSelectedRoomId(id)
  }

  const roomsElement = rooms !== null ? (
    <nav>
      {rooms.items.map(item =>
        <RoomItem
          key={item.id}
          name={item.name}
          onClick={handleClick(item.id)}
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