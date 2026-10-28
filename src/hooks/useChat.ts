import { useState, useRef, useReducer, useEffect, useEffectEvent } from 'react'
import { restUrl } from '../api/config.ts'
import { fetchRoomMessages } from '../api/restApi.ts'
import { type Room, type Message, type Resp, type IdentityRequest } from '../api/types.ts'
import { reducer, initConnectionState } from './chatReducer.ts'


const WEBSOCKET_PATH = new URL('/ws', restUrl)


export function useChat(name: string) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [connection, dispatch] = useReducer(reducer, initConnectionState)
  const websocket = useRef<WebSocket | null>(null)
  const requestTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const historyController = useRef(new AbortController())
  const onHistoryLoaded = useEffectEvent((roomId: string, messages: Message[]) => {
    if (roomId !== connection.roomInfo.confirmedRoom?.id) {
      return
    }

    dispatch({
      type: 'historyLoadCompleted',
      roomId: roomId,
      messages: messages
    })
  })


  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_PATH)
    websocket.current = ws

    const handleMessage = (e: MessageEvent) => {
      const data: Resp = JSON.parse(e.data)
      switch (data.type) {
        case 'connection:ready': {
          dispatch({ type: 'identificationStart' })

          if (ws.readyState !== WebSocket.OPEN) {
            dispatch({ type: 'connectionClosed' })
            break
          }

          const requestId = crypto.randomUUID()
          const req: IdentityRequest = {
            type: 'session:identify',
            requestId,
            data: { name }
          }

          const timerId = setTimeout(() => {
            requestTimers.current.delete(requestId)

            dispatch({
              type: 'identificationFailed',
              error: 'Сервер не подтвердил имя вовремя'
            })
          }, 10_000)

          requestTimers.current.set(requestId, timerId)
          ws.send(JSON.stringify(req))
          break
        }
        case 'session:ready': {
          if (!requestTimers.current.has(data.requestId)) {
            break
          }

          const timerId = requestTimers.current.get(data.requestId)
          clearTimeout(timerId)
          requestTimers.current.delete(data.requestId)

          dispatch({type: 'sessionConfirmed'})
          break
        }
        case 'room:joined':
          dispatch({ type: 'roomJoinConfirmed', room: data.data.room })
          dispatch({ type: 'historyLoadStarted' })

          historyController.current.abort()
          const controller = new AbortController()
          historyController.current = controller

          fetchRoomMessages(data.data.room.id, controller.signal)
            .then(response => onHistoryLoaded(data.data.room.id, response.items))
            .catch((e: unknown) => {
              if (e instanceof Error && e.name === 'AbortError') {
                return
              }
              console.error(e)
              dispatch({ type: 'historyLoadFailed', error: 'Ошибка при загрузке истории' })
            })

          break
      }
    }

    const handleClose = () => {
      for (const [requestId, timerId] of requestTimers.current) {
        clearTimeout(timerId)
        requestTimers.current.delete(requestId)
      }
      historyController.current.abort()
      ws.removeEventListener('message', handleMessage)
      dispatch({ type: 'connectionClosed' })
    }

    ws.addEventListener('message', handleMessage)
    ws.addEventListener('close', handleClose)

    return () => {
      for (const [requestId, timerId] of requestTimers.current) {
        clearTimeout(timerId)
        requestTimers.current.delete(requestId)
      }
      historyController.current.abort()
      ws.removeEventListener('message', handleMessage)
      ws.removeEventListener('close', handleClose)
      ws.close()
    }
  }, [name])


  return [currentRoom, setCurrentRoom, connection] as const
}





