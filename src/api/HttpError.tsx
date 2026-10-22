export default class HttpError extends Error {
  public status: number
  public name: string

  constructor(status: number) {
    super();
    this.name = 'HttpError'
    this.status = status
  }
}