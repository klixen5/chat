import { useState, useEffect, useRef, useReducer } from "react";
import { type Room, type Message } from '../api/dataType.ts'
import { type Resp, type IdentityRequest, type JoinRoomRequest, type SendMessageRequest } from '../api/websocketTypes.ts'
import { websocketUrl } from '../api/config.ts'
import ClientChat from '../api/ClientChat.ts'
import getRoomMessages from '../api/getRoomMessages.ts'


export default function useChat(name: string, currentRoom: Room | null) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('idle')
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('idle')
  const [confirmObjects, dispatch] = useReducer(confirmReducer, { roomId: null, messages: [] })

  const clientChat = useRef<ClientChat | null>(null)
  const controller = useRef(new AbortController())
  const pendingRequestId = useRef<string | null>(null)


  useEffect(() => {
    clientChat.current = new ClientChat(new WebSocket(websocketUrl))
    setConnectionStatus('connecting')

    const clearMessage = clientChat.current.onMessage(e => {
      const data: Resp = JSON.parse(e.data)
      switch (data.type) {
        case 'connection:ready': {
          const req: IdentityRequest = {
            type: 'session:identify',
            requestId: crypto.randomUUID(),
            data: { name }
          }
          clientChat.current?.sendMessage(req)
          setConnectionStatus('identifying')
          break
        }
        case 'session:ready': {
          setConnectionStatus('ready')
          break
        }
        case 'room:joined': {
          if (data.requestId !== pendingRequestId.current) {
            break
          }
          dispatch({ type: 'updateRoomId', roomId: data.data.room.id })
          setRoomStatus('join')
          setHistoryStatus('loading')
          getRoomMessages(data.data.room.id, controller.current.signal)
            .then(messages => {
              if (data.requestId !== pendingRequestId.current) return

              setHistoryStatus('ready')
              dispatch({ type: 'updateMessages', messages: messages.items })
            })
            .catch((e: unknown) => {
              if (e instanceof Error && e.name === 'AbortError') {
                return
              } else {
                setHistoryStatus('error')
                console.log(e)
              }
            })
          break
        }
        case 'message:created': {
          dispatch({ type: 'addMessage', message: data.data.message })
          break
        }
      }
    })
    const clearClose = clientChat.current.onClose(_ => {
      setConnectionStatus('disconnected')
    })

    return () => {
      dispatch({ type: 'reset' })
      setRoomStatus('idle')
      setHistoryStatus('idle')
      controller.current.abort()
      controller.current = new AbortController()
      clearMessage()
      clearClose()
      clientChat.current?.destroy()
    }
  }, [name]);

  useEffect(() => {
    controller.current.abort()
    controller.current = new AbortController()

    if (currentRoom === null) return
    if (connectionStatus !== 'ready') return

    dispatch({ type: 'reset' })
    setHistoryStatus('idle')
    setRoomStatus('joining')

    const requestId = crypto.randomUUID()
    pendingRequestId.current = requestId
    const req: JoinRoomRequest = {
      type: 'room:join',
      requestId,
      data: { roomId: currentRoom.id }
    }
    clientChat.current?.sendMessage(req)
  }, [connectionStatus, currentRoom?.id]);


  function sendMessage(text: string): void {
    if (connectionStatus !== 'ready') return
    if (roomStatus !== 'join') return
    if (confirmObjects.roomId === null) return
    if (currentRoom?.id !== confirmObjects.roomId) return

    const req: SendMessageRequest = {
      type: 'message:send',
      requestId: crypto.randomUUID(),
      data: {
        roomId: confirmObjects.roomId,
        clientMessageId: crypto.randomUUID(),
        text
      }
    }
    clientChat.current?.sendMessage(req)
  }

  return [connectionStatus, roomStatus, historyStatus, confirmObjects, sendMessage] as const
}


type ConfirmState = {
  roomId: string | null,
  messages: Array<Message>
}

type ConfirmAction = {
  type: 'updateRoomId'
  roomId: string
} | {
  type: 'updateMessages'
  messages: Array<Message>
} | {
  type: 'addMessage'
  message: Message
} | {
  type: 'reset'
}

function confirmReducer(state: ConfirmState, action: ConfirmAction): ConfirmState {
  switch (action.type) {
    case 'updateRoomId':
      return { ...state, roomId: action.roomId }
    case 'updateMessages':
      return { ...state, messages: action.messages }
    case 'addMessage':
      if (action.message.roomId !== state.roomId) {
        return state
      }
      return { ...state, messages: [...state.messages, action.message]}
    case 'reset':
      return { roomId: null, messages: [] }
    default:
      throw new Error('Неизвестное действие')
  }
}


export type ConnectionStatus = 'connecting' | 'identifying' | 'ready' | 'disconnected' | 'error'
export type RoomStatus = 'idle' | 'joining' | 'join' | 'error'
export type HistoryStatus = 'idle' | 'loading' | 'ready' | 'error'




