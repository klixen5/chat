import { restUrl } from './config.ts'
import HttpError from './HttpError.ts'

export default async function health(signal: AbortSignal): Promise<void> {
  const url = new URL('/api/health', restUrl)
  const response = await fetch(url, { signal })

  if (response.status !== 200) {
    throw new HttpError(response.status)
  }
}