import { restUrl } from './config.ts'
import HttpError from './HttpError.ts'


type RoomMessagesResponse = {
  items: Array<{
    id: number
    roomId: string
    clientMessageId: string
    authorName: string
    text: string
    createdAt: string
  }>
  pagination: {
    limit: number
    hasMore: false
    nextBefore: number
    nextAfter: number
  }
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

export default async function getRoomMessages(
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