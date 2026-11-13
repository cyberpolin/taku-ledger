import { handle } from '../src/handle.js'

export default {
  fetch(request: Request) {
    return handle(request)
  },
}
