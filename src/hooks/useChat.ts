import { useState, useRef, useReducer, useEffect, useEffectEvent } from 'react'
import { restUrl } from '../api/config.ts'
import { fetchRoomMessages } from '../api/restApi.ts'
import { type Room, type Message, type Resp, type IdentityRequest, type JoinRoomRequest, type SendMessageRequest, type LeaveRoomRequest } from '../api/types.ts'
import { reducer, initConnectionState } from './chatReducer.ts'


const WEBSOCKET_PATH = new URL('/ws', restUrl)


export function useChat(name: string) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [connection, dispatch] = useReducer(reducer, initConnectionState)
  const websocket = useRef<WebSocket | null>(null)
  const requestTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const pendingJoinId = useRef<string | null>(null)
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
  const updateHistory = useEffectEvent((message: Message) => {
    if (message.roomId !== currentRoom?.id) return
    dispatch({ type: 'updateHistory', message })
  })
  const onRoomLeft = useEffectEvent(() => {
    if (currentRoom !== null) return
    dispatch({ type: 'roomLeave' })
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

          dispatch({ type: 'sessionConfirmed' })
          break
        }
        case 'room:joined':
          if (data.requestId !== pendingJoinId.current) {
            break
          }

          const timerId = requestTimers.current.get(data.requestId)
          clearTimeout(timerId)
          requestTimers.current.delete(data.requestId)

          dispatch({ type: 'roomJoinConfirmed', room: data.data.room })
          dispatch({ type: 'historyLoadStarted' })

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
        case 'room:left':
          onRoomLeft()
          break
        case 'message:created':
          updateHistory(data.data.message)
          break
        case 'message:ack':
          clearTimeout(requestTimers.current.get(data.requestId))
          requestTimers.current.delete(data.requestId)
          break
        case 'error':
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


  useEffect(() => {
    if (currentRoom === null) return
    if (connection.connectionInfo.status !== 'ready') return

    const ws = websocket.current
    if (ws === null || ws.readyState !== WebSocket.OPEN) return


    const requestId = crypto.randomUUID()
    const req: JoinRoomRequest = {
      type: 'room:join',
      requestId,
      data: {
        roomId: currentRoom.id
      }
    }

    const timerId = setTimeout(function again(): void {
      requestTimers.current.delete(requestId)

      if (requestId !== pendingJoinId.current) return

      pendingJoinId.current = null
      dispatch({
        type: 'roomJoinFailed',
        error: 'Сервер не подтвердил вход в комнату вовремя'
      })
    }, 10_000)

    historyController.current.abort()
    pendingJoinId.current = requestId
    requestTimers.current.set(requestId, timerId)

    dispatch({ type: 'roomJoinStarted' })
    ws.send(JSON.stringify(req))

    return () => {
      clearTimeout(timerId)
      requestTimers.current.delete(requestId)
    }
  }, [currentRoom?.id, connection.connectionInfo.status])


  function sendMessage(text: string): void {
    if (connection.roomInfo.confirmedRoom === null) return
    const ws = websocket.current
    if (ws === null || ws.readyState !== WebSocket.OPEN) return

    const requestId = crypto.randomUUID()
    const clientMessageId = crypto.randomUUID()
    const req: SendMessageRequest = {
      type: 'message:send',
      requestId,
      data: {
        roomId: connection.roomInfo.confirmedRoom.id,
        clientMessageId,
        text
      }
    }

    const timerId = setTimeout(() => {
      requestTimers.current.delete(requestId)

      if (req.data.roomId !== currentRoom?.id) return

      dispatch({
        type: 'messageFailed',
        error: 'Сервер не подтвердил отправку сообщения'
      })
    }, 10_000)

    requestTimers.current.set(requestId, timerId)

    dispatch({ type: 'messageSendStarted' })
    ws.send(JSON.stringify(req))
  }

  function roomLeave(): void {
    const ws = websocket.current
    if (ws === null || ws.readyState !== WebSocket.OPEN) return

    const requestId = crypto.randomUUID()
    const req: LeaveRoomRequest = {
      type: 'room:leave',
      requestId,
      data: {}
    }

    setCurrentRoom(null)
    ws.send(JSON.stringify(req))
  }


  return [currentRoom, setCurrentRoom, connection, sendMessage, roomLeave] as const
}





