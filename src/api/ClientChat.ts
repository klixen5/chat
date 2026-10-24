import { type IdentityRequest, type JoinRoomRequest, type LeaveRoomRequest, type SendMessageRequest } from "./websocketTypes.ts";


type Send = IdentityRequest | JoinRoomRequest | LeaveRoomRequest | SendMessageRequest


export default class ClientChat {
  private websocket: WebSocket

  constructor(websocket: WebSocket) {
    this.websocket = websocket
  }

  onOpen(callback: (event: Event) => void): () => void {
    this.websocket.addEventListener('open', callback)
    return () => this.websocket.removeEventListener('open', callback)
  }

  onMessage(callback: (event: MessageEvent<unknown>) => void): () => void {
    this.websocket.addEventListener('message', callback)
    return () => this.websocket.removeEventListener('message', callback)
  }

  onError(callback: (event: Event) => void): () => void {
    this.websocket.addEventListener('error', callback)
    return () => this.websocket.removeEventListener('error', callback)
  }

  onClose(callback: (event: CloseEvent) => void): () => void {
    this.websocket.addEventListener('close', callback)
    return () => this.websocket.removeEventListener('close', callback)
  }

  sendMessage(data: Send): void {
    const json = JSON.stringify(data)
    this.websocket.send(json)
  }

  destroy(): void {
    this.websocket.close()
  }
}