import {restUrl} from './config.ts'


export type RoomsResponse = {
  items: Array<{id: string, name: string, description: string}>
}


export default async function rooms(signal: AbortSignal): Promise<RoomsResponse> {
  const url = new URL('/api/rooms', restUrl)
  const response = await fetch(url, { signal })
  return await response.json()
}