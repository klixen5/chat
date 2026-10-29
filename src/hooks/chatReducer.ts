import { type Room, type Message } from '../api/types.ts'


type State = {
  connectionInfo: {
    status: ConnectionStatus
    error: string | null
  }
  roomInfo: {
    status: RoomStatus
    confirmedRoom: Room | null
    error: string | null
  }
  historyInfo: {
    roomId: string | null
    status: HistoryStatus
    messages: Message[]
    error: string | null
  }
  sendInfo: {
    status: SendStatus
    message: Message | null
    error: string | null
  }
}

type Action = {
  type: 'identificationStart' | 'sessionConfirmed' | 'connectionClosed'
} | {
  type: 'identificationFailed'
  error: string | null
} | {
  type: 'roomJoinStarted'
} | {
  type: 'roomJoinConfirmed'
  room: Room
} | {
  type: 'roomJoinFailed'
  error: string
} | {
  type: 'historyLoadStarted'
} | {
  type: 'historyLoadCompleted'
  roomId: string
  messages: Message[]
} | {
  type: 'historyLoadFailed'
  error: string
} | {
  type: 'messageSendStarted'
} | {
  type: 'messageConfirmed'
  message: Message
} | {
  type: 'messageFailed'
  error: string
} | {
  type: 'updateHistory'
  message: Message
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'identificationStart':
      return { ...state, connectionInfo: { status: 'identifying', error: null } }
    case 'sessionConfirmed':
      return { ...state, connectionInfo: { status: 'ready', error: null } }
    case 'identificationFailed':
      return { ...state, connectionInfo: { status: 'error', error: action.error } }
    case 'connectionClosed':
      return {
        ...state,
        connectionInfo: { ...state.connectionInfo, status: 'disconnected' },
        roomInfo: {
          status: 'idle',
          confirmedRoom: null,
          error: null
        },
        historyInfo: {
          ...state.historyInfo,
          status: state.historyInfo.status === 'loading' ? 'idle' : state.historyInfo.status
        },
        sendInfo: {
          status: 'idle',
          message: null,
          error: null
        }
      }
    case 'roomJoinStarted':
      return { ...state, roomInfo: { status: 'joining', confirmedRoom: null, error: null } }
    case 'roomJoinConfirmed':
      return { ...state, roomInfo: { status: 'joined', confirmedRoom: action.room, error: null } }
    case 'roomJoinFailed':
      return { ...state, roomInfo: { ...state.roomInfo, status: 'error', error: action.error } }
    case 'historyLoadStarted':
      return { ...state, historyInfo: { status: 'loading', messages: [], roomId: null, error: null } }
    case 'historyLoadCompleted': {
      const uniqueMessages = new Map<number, Message>
      for (const mes of [...state.historyInfo.messages, ...action.messages]) {
        uniqueMessages.set(mes.id, mes)
      }
      const sortMessages = [...uniqueMessages.values()].sort((m1, m2) => m1.id - m2.id)
      return {...state, historyInfo: {status: 'ready', messages: sortMessages, roomId: action.roomId, error: null } }
    }
    case 'historyLoadFailed':
      return { ...state, historyInfo: { ...state.historyInfo, status: 'error', error: action.error } }
    case 'messageSendStarted':
      return { ...state, sendInfo: { status: 'sending', message: null, error: null } }
    case 'messageConfirmed':
      return { ...state, sendInfo: { ...state.sendInfo, status: 'confirmed', message: action.message } }
    case 'messageFailed':
      return { ...state, sendInfo: { ...state.sendInfo, status: 'error', error: action.error } }
    case 'updateHistory': {
      const uniqueMessages = new Map<number, Message>
      for (const mes of [...state.historyInfo.messages, action.message]) {
        uniqueMessages.set(mes.id, mes)
      }
      const sortMessages = [...uniqueMessages.values()].sort((m1, m2) => m1.id - m2.id)
      return {
        ...state,
        historyInfo: {...state.historyInfo, messages: sortMessages},
        sendInfo: {
          status: 'idle',
          message: null,
          error: null
        }
      }
    }
  }
}


type ConnectionStatus = 'connecting' | 'identifying' | 'ready' | 'disconnected' | 'error'
type RoomStatus = 'idle' | 'joining' | 'joined' | 'error'
type HistoryStatus  = 'idle' | 'loading' | 'ready' | 'error'
type SendStatus = 'idle' | 'sending' | 'confirmed' | 'error'


const initConnectionState: State = {
  connectionInfo: {
    status: 'connecting',
    error: null
  },
  roomInfo: {
    status: 'idle',
    confirmedRoom: null,
    error: null
  },
  historyInfo: {
    roomId: null,
    status: 'idle',
    messages: [],
    error: null
  },
  sendInfo: {
    status: 'idle',
    message: null,
    error: null
  }
}


export {
  reducer,
  initConnectionState,
  type RoomStatus,
  type HistoryStatus
}