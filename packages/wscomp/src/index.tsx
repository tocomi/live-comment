import React from 'react'
import { getLogger, CommentMessage, Message } from 'common'

export interface WebSocketControl {
  _reconnectTimer: number
  send(message: Message): void
  reconnect(): void
  reconnectWithBackoff(): void
  close(): void
}

export type WebSocketClientPropsType = {
  onOpen?: (control: WebSocketControl) => void
  onClose?: (ev: CloseEvent) => void
  onError?: (ev: Event) => void
  onMessage: (message: Message) => void
  url: string
  noComments?: boolean
}

const log = getLogger('WebSocketClient')

function createWebSocket(
  props: WebSocketClientPropsType,
  webSocketRef: React.MutableRefObject<WebSocket | null>
): void {
  if (!/^wss?:\/\/./.test(props.url)) {
    webSocketRef.current = null
    return
  }

  const webSocket = new WebSocket(props.url)
  webSocket.addEventListener('open', (ev: Event): void => {
    log.debug('[onopen]', ev)
    if (props.onOpen) {
      const control: WebSocketControl = {
        _reconnectTimer: 0,
        send: (message: Message): void => {
          const ws = webSocketRef.current
          if (ws) {
            const json = JSON.stringify(message)
            ws.send(json)
            log.trace('[send]', message)
          }
        },
        reconnect: (): void => {
          log.debug('[WebSocketControl.reconnect] Start.')
          webSocketRef.current?.close()
          createWebSocket(props, webSocketRef)
          log.debug('[WebSocketControl.reconnect] End.')
        },
        reconnectWithBackoff: (): void => {
          if (control._reconnectTimer !== 0) {
            log.warn('[reconnectWithBackoff] Already timered:', control._reconnectTimer)
            return
          }
          const waitMillis = 7000 + 13000 * Math.random()
          control._reconnectTimer = window.setTimeout((): void => {
            control._reconnectTimer = 0
            log.info('[reconnectWithBackoff] Try to reconnect.')
            control.reconnect()
          }, waitMillis)
          log.info(`[reconnectWithBackoff] Reconnect after ${waitMillis}ms.`)
        },
        close: (): void => {
          log.debug('[WebSocketControl.close]')
          if (control._reconnectTimer) {
            window.clearTimeout(control._reconnectTimer)
            control._reconnectTimer = 0
          }
          if (webSocketRef.current) {
            webSocketRef.current.close()
            webSocketRef.current = null
          }
        }
      }
      props.onOpen(control)
    }
  })
  webSocket.addEventListener('close', (ev: CloseEvent): void => {
    log.debug('[onclose]', ev)
    if (webSocketRef.current) {
      webSocketRef.current.close()
      webSocketRef.current = null
    }
    if (props.onClose) {
      props.onClose(ev)
    }
  })
  webSocket.addEventListener('error', (ev: Event): void => {
    log.debug('[onerror]', ev)
    if (props.onError) {
      props.onError(ev)
    }
  })
  webSocket.addEventListener('message', (ev: MessageEvent<string>): void => {
    log.trace('[onmessage]', ev)
    const message: Message = JSON.parse(ev.data)
    props.onMessage(message)
  })

  log.info('[createWebSocket] Websocket created.', props.url)
  webSocketRef.current = webSocket
}

export function WebSocketClient(props: WebSocketClientPropsType): JSX.Element {
  const webSocketRef = React.useRef<WebSocket | null>(null)
  const createWebSocketMemo = React.useCallback(
    () => createWebSocket(props, webSocketRef),
    [props, webSocketRef]
  )

  React.useEffect((): (() => void) => {
    if (props.noComments) {
      log.debug('[componentDidMount] No comments mode.')
      const comment: CommentMessage = {
        type: 'comment',
        comment: 'Entering no comments mode.'
      }
      props.onMessage(comment)
    }
    createWebSocketMemo()

    return (): void => {
      if (webSocketRef.current) {
        webSocketRef.current.close()
        webSocketRef.current = null
        log.debug('[componentWillUnmount] Websocket closed.')
      }
    }
  })

  return <div />
}