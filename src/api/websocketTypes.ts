export type IdentityRequest = {
  type: 'session:identify'
  requestId: string
  data: {
    name: string
  }
}

export type IdentityResponse = {
  type: 'session:ready'
  requestId: string
  data: {
    connectionId: string
    name: string
  }
}

export type JoinRoomRequest = {
  type: 'room:join'
  requestId: string
  data: {
    roomId: string
  }
}

export type JoinRoomResponse = {
  type: 'room:joined'
  requestId: string
  data: {
    room: { id: string, name: string, description: string }
  }
}

export type LeaveRoomRequest = {
  type: 'room:leave'
  requestId: string
  data: Record<string, never>
}

export type LeaveRoomResponse = {
  type: 'room:left'
  requestId: string
  data: {
    roomId: string | null
  }
}

export type SendMessageRequest = {
  type: 'message:send'
  requestId: string
  data: {
    roomId: string
    clientMessageId: string
    text: string
  }
}

export type SendMessageResponse = {
  type: 'message:ack'
  requestId: string
  data: {
    message: {
      id: number
      roomId: string
      clientMessageId: string
      authorName: string
      text: string
      createdAt: string
    }
    duplicate: boolean
  }
}

export type ConnectionResponse = {
  type: 'connection:ready'
  data: {
    connectionId: string
  }
}

export type CreatedMessageResponse = {
  type: 'message:created'
  data: Omit<SendMessageResponse['data'], 'duplicate'>
}

export const errorTypes = {
  INVALID_JSON: 'INVALID_JSON',
  INVALID_EVENT: 'INVALID_EVENT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  IDENTIFY_REQUIRED: 'IDENTIFY_REQUIRED',
  ALREADY_IDENTIFIED: 'ALREADY_IDENTIFIED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  JOIN_REQUIRED: 'JOIN_REQUIRED',
  ROOM_MISMATCH: 'ROOM_MISMATCH',
  MESSAGE_ID_CONFLICT: 'MESSAGE_ID_CONFLICT',
  UNKNOWN_EVENT: 'UNKNOWN_EVENT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorResponse = {
  type: 'error'
  requestId?: string
  data: {
    code: keyof typeof errorTypes
    message: string
    details?: {
      field: string
    }
  }
}




