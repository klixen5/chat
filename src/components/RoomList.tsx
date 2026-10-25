import RoomItem from './RoomItem.tsx'
import getRooms, { type RoomsResponse } from '../api/getRooms.ts'
import { useState, useEffect } from 'react'
import { type Room } from './ChatPage.tsx'
import styles from './RoomList.module.css'


type RoomListProps = {
  roomId: string | null
  updateRoom: (room: Room) => () => void
  name: string
}
type RoomsState = RoomsResponse | null


export default function RoomList({ roomId, updateRoom, name }: RoomListProps) {
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

  if (!health) {
    return <p>Ошибка сервера</p>
  }

  if (rooms === null) {
    return <p>Загрузка...</p>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Комнаты</h1>
      <nav className={styles.buttonMenu}>
        {rooms.items.map(item =>
          <RoomItem
            key={item.id}
            name={item.name}
            selected={item.id === roomId}
            onClick={updateRoom(item)}
          />
        )}
      </nav>
      <section className={styles.hint}>
        <h2 className={styles.hintTitle}>Общие комнаты</h2>
        <p className={styles.hintText}>Выбери тему и присоединяйтесь к разговору</p>
      </section>
      <section className={styles.profile}>
        <div className={styles.profileIcon}>{name[0]}</div>
        <div>
          <p className={styles.profileName}>{name}</p>
          <p className={styles.profileDescription}>Вход под именем</p>
        </div>
        <svg className={styles.profileOut} width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.91667 0.75H0.75V12.4167H4.91667M8.25 9.91667L11.5833 6.58333L8.25 3.25M11.5833 6.58333H3.25" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
        </svg>
      </section>
    </div>
  )
}