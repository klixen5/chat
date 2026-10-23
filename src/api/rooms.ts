import { restUrl } from './config.ts'
import HttpError from './HttpError.ts';

export type RoomsResponse = {
  items: Array<{id: string, name: string, description: string}>
}


export default async function rooms(signal: AbortSignal): Promise<RoomsResponse> {
  const url = new URL('/api/rooms', restUrl)
  const response = await fetch(url, { signal })

  if (response.status !== 200) {
    throw new HttpError(response.status)
  }

  return await response.json()
}