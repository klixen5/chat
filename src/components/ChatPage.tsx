import RoomList from './RoomList.tsx'
import ChatRoom from './ChatRoom.tsx'
import ChatLayout from './ChatLayout.tsx'
import {useCallback, useEffect, useReducer, useRef} from 'react'
import ClientChat from '../api/ClientChat.ts'
import {socket} from '../api/config.ts'
import {
  type ErrorResponse,
  type IdentityRequest,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type Resp
} from '../api/websocketTypes.ts'
import {type RoomMessagesResponse} from '../api/getRoomMessages.ts'


type ChatPageProps = {
  name: string
}

type Status = 'connecting' | 'identifying' | 'ready' | 'error' | 'disconnected'

type State = {
  status: Status
  room: Room | null
  messages: RoomMessagesResponse | null
  error: ErrorResponse | null
}

export type Room = {
  id: string
  name: string
  description: string
}

type Action = {
  type: 'updateStatus'
  status: Status
} | {
  type: 'updateRoom'
  room: Room
} | {
  type: 'updateRoomId'
  roomId: string
} | {
  type: 'updateMessages'
  messages: RoomMessagesResponse
} | {
  type: 'updateError'
  error: ErrorResponse
}


export default function ChatPage({ name }: ChatPageProps) {
  const [state, dispatch] = useReducer(reducer, { status: 'disconnected', room: null, messages: null, error: null })
  const websocket = useRef<ClientChat | null>(null)
  const handleUpdateRoom = useCallback((room: Room) => {
    return () => dispatch({ type: 'updateRoom', room: room })
  }, [])

  useEffect(() => {
    websocket.current = new ClientChat(new WebSocket(socket))
    const clearOpen = websocket.current.onOpen(_ => {
      dispatch({ type: 'updateStatus', status: 'connecting' })
    })
    const clearMessage = websocket.current.onMessage(e => {
      const responseData: Resp = JSON.parse(e.data)
      switch (responseData.type) {
        case 'connection:ready':
          const identify: IdentityRequest = {
            type: 'session:identify',
            requestId: crypto.randomUUID(),
            data: { name },
          }
          websocket.current?.sendMessage(identify)
          dispatch({ type: 'updateStatus', status: 'identifying' })
          break
      }
    })

    const clearClose = websocket.current.onClose(_ => {
      dispatch({ type: 'updateStatus', status: 'disconnected'})
    })
    return () => {
      clearOpen()
      clearMessage()
      clearClose()
    }
  }, [name]);

  useEffect(() => {
    if (state.status === 'ready' && state.room !== null) {
      const joinRoom: JoinRoomRequest = {
        type: 'room:join',
        requestId: crypto.randomUUID(),
        data: { roomId: state.room.id },
      }
      websocket.current?.sendMessage(joinRoom)
    }
  }, [state.room?.id, state.status]);

  return (
    <div>
      <ChatLayout name={name}>
        <RoomList roomId={state.room !== null ? state.room.id : null} updateRoom={handleUpdateRoom} />
        <ChatRoom />
      </ChatLayout>
    </div>
  )
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'updateStatus':
      return { ...state, status: action.status }
    case 'updateRoom':
      return { ...state, room: action.room }
    case 'updateMessages':
      return { ...state, messages: action.messages }
    case 'updateError':
      return { ...state, error: action.error }
    default:
      throw new Error('Неизвестный тип обновления состояния')
  }
}