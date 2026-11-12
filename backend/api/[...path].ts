import { handle } from '../src/handle'

export default {
  fetch(request: Request) {
    return handle(request)
  },
}
