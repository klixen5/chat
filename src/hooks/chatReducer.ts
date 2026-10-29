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
        }
      }
    case 'roomJoinStarted':
      return { ...state, roomInfo: { ...state.roomInfo, status: 'joining', error: null } }
    case 'roomJoinConfirmed':
      return { ...state, roomInfo: { status: 'joined', confirmedRoom: action.room, error: null } }
    case 'roomJoinFailed':
      return { ...state, roomInfo: { ...state.roomInfo, status: 'error', error: action.error } }
    case 'historyLoadStarted':
      return { ...state, historyInfo: { ...state.historyInfo, status: 'loading', error: null } }
    case 'historyLoadCompleted':
      return { ...state, historyInfo: { status: 'ready', messages: action.messages, roomId: action.roomId, error: null } }
    case 'historyLoadFailed':
      return { ...state, historyInfo: { ...state.historyInfo, status: 'error', error: action.error } }
  }
}


type ConnectionStatus = 'connecting' | 'identifying' | 'ready' | 'disconnected' | 'error'
type RoomStatus = 'idle' | 'joining' | 'joined' | 'error'
type HistoryStatus  = 'idle' | 'loading' | 'ready' | 'error'


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
  }
}


export {
  reducer,
  initConnectionState,
  type RoomStatus,
  type HistoryStatus
}