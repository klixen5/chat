import RoomItem from './RoomItem.tsx'

import getRooms, { type RoomsResponse } from '../api/rooms.ts'

import { useState, useEffect } from 'react'


type StateRooms = null | RoomsResponse

export default function RoomList() {
  const [rooms, setRooms] = useState<StateRooms>(null)

  useEffect(() => {
    const controller = new AbortController()
    getRooms(controller.signal)
      .then(rooms => setRooms(rooms))

    return () => controller.abort()
  }, []);

  return (
    <div>
      <p>RoomList</p>
      <RoomItem />
    </div>
  )
}