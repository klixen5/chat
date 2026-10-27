import { HttpError } from './HttpError.ts'
import { restUrl } from './config.ts'
import { type RoomsResponse, type RoomMessagesResponse } from './types.ts'


export async function fetchHealth(signal: AbortSignal): Promise<void> {
  const url = new URL('/api/health', restUrl)
  const response = await fetch(url, { signal })

  if (response.status !== 200) {
    throw new HttpError(response.status)
  }
}

export async function fetchRooms(signal: AbortSignal): Promise<RoomsResponse> {
  const url = new URL('/api/rooms', restUrl)
  const response = await fetch(url, { signal })

  if (response.status !== 200) {
    throw new HttpError(response.status)
  }

  return await response.json()
}

export async function fetchRoomMessages(
  roomId: string,
  signal: AbortSignal,
  params?: Params,
): Promise<RoomMessagesResponse> {
  const url = new URL(`/api/rooms/${roomId}/messages`, restUrl)

  if (params !== undefined) {
    if ('before' in params) {
      url.searchParams.set('before', String(params.before))
    } else if ('after' in params) {
      url.searchParams.set('after', String(params.after))
    }
    url.searchParams.set('limit', String(params.limit))
  }

  const response = await fetch(url, { signal })

  if (response.status !== 200) {
    throw new HttpError(response.status)
  }

  return await response.json()
}


type Params = {
  limit: number
} | {
  limit: number
  before: number
  after?: never
} | {
  limit: number
  after: number
  before?: never
}

