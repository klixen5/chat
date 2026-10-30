import RoomItem from './RoomItem.tsx'
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { fetchRooms } from '../api/restApi.ts'
import { type Room } from '../api/types.ts'
import styles from './RoomList.module.css'


type RoomListProps = {
  name: string
  currentRoom: Room | null
  setCurrentRoom: Dispatch<SetStateAction<Room | null>>
  className: string
}

type RoomsState = Room[]
type RoomsStatusState = 'idle' | 'pending' | 'fulfilled' | 'rejected'


export default function RoomList({ name, currentRoom, setCurrentRoom, className }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomsState>([])
  const [roomsStatus, setRoomsStatus] = useState<RoomsStatusState>('idle')

  useEffect(() => {
    const controller = new AbortController()
    setRoomsStatus('pending')

    fetchRooms(controller.signal)
      .then(rooms => {
        setRooms(rooms.items)
        setRoomsStatus('fulfilled')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') {
          return
        }
        console.error(e)
        setRoomsStatus('rejected')
      })

    return () => controller.abort()
  }, [])

  function handleClick(room: Room): () => void {
    return () => setCurrentRoom(room)
  }

  if (roomsStatus === 'rejected') {
    return <p>Не удалось загрузить комнаты</p>
  }

  if (roomsStatus === 'idle' || roomsStatus === 'pending') {
    return <p>Загрузка...</p>
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <h1 className={styles.title}>Комнаты</h1>
      <nav className={styles.buttonMenu}>
        {rooms.map(item =>
          <RoomItem
            key={item.id}
            name={item.name}
            selected={item.id === currentRoom?.id}
            onClick={handleClick(item)}
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
          <path d="M4.91667 0.75H0.75V12.4167H4.91667M8.25 9.91667L11.5833 6.58333L8.25 3.25M11.5833 6.58333H3.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
        </svg>
      </section>
    </div>
  )
}