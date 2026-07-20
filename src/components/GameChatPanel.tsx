import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, PlayerColor } from '../multiplayer/types'
import { colorLabel } from '../multiplayer/gameHelpers'

interface GameChatPanelProps {
  messages: ChatMessage[]
  playerColor: PlayerColor | null
  disabled?: boolean
  disabledHint?: string
  onSend: (text: string) => Promise<void>
}

function formatTime(ts: number): string {
  const date = new Date(ts)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function GameChatPanel({
  messages,
  playerColor,
  disabled = false,
  disabledHint = '等待对手加入后可聊天',
  onSend,
}: GameChatPanelProps) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [messages])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || disabled || sending) return

    setSending(true)
    setError(null)
    try {
      await onSend(text)
      setDraft('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="game-chat-panel" aria-label="对局聊天">
      <div className="game-chat-panel-head">
        <h3 className="game-chat-panel-title">对局聊天</h3>
        <p className="game-chat-panel-hint">
          {disabled ? disabledHint : '与对手实时交流'}
        </p>
      </div>

      <div ref={listRef} className="game-chat-messages" aria-live="polite">
        {messages.length === 0 ? (
          <p className="game-chat-empty">
            {disabled ? '对手加入后即可开始聊天' : '暂无消息，打个招呼吧'}
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.from === playerColor
            return (
              <div
                key={msg.id}
                className={`game-chat-message ${isMine ? 'game-chat-message--mine' : 'game-chat-message--theirs'}`}
              >
                <div className="game-chat-message-meta">
                  <span className="game-chat-message-author">
                    {isMine ? '我' : colorLabel(msg.from)}
                  </span>
                  <span className="game-chat-message-time">{formatTime(msg.ts)}</span>
                </div>
                <p className="game-chat-message-text">{msg.text}</p>
              </div>
            )
          })
        )}
      </div>

      <form
        className="game-chat-compose"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSend()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={200}
          disabled={disabled || sending}
          placeholder={disabled ? disabledHint : '输入消息…'}
          onChange={(event) => setDraft(event.target.value)}
          className="game-chat-input"
        />
        <button
          type="submit"
          disabled={disabled || sending || !draft.trim()}
          className="game-chat-send"
        >
          {sending ? '…' : '发送'}
        </button>
      </form>

      {error && <p className="game-chat-error">{error}</p>}
    </section>
  )
}
