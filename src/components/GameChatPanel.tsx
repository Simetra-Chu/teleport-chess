import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMobileGameLayout } from '../hooks/useMobileGameLayout'
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

function useCompactChatLayout() {
  return useMobileGameLayout()
}

function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    if (!active) {
      setInset(0)
      return
    }

    const viewport = window.visualViewport
    if (!viewport) return

    const sync = () => {
      const gap = window.innerHeight - viewport.height - viewport.offsetTop
      setInset(Math.max(0, Math.round(gap)))
    }

    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
    }
  }, [active])

  return inset
}

function ChatPanelBody({
  messages,
  playerColor,
  disabled,
  disabledHint,
  draft,
  sending,
  error,
  listRef,
  inputRef,
  onDraftChange,
  onSend,
  headerAction,
}: {
  messages: ChatMessage[]
  playerColor: PlayerColor | null
  disabled?: boolean
  disabledHint?: string
  draft: string
  sending: boolean
  error: string | null
  listRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  onDraftChange: (value: string) => void
  onSend: () => void
  headerAction?: ReactNode
}) {
  return (
    <>
      <div className="game-chat-panel-head">
        <div className="game-chat-panel-head-main">
          <h3 className="game-chat-panel-title">对局聊天</h3>
          <p className="game-chat-panel-hint">
            {disabled ? disabledHint : '与对手实时交流'}
          </p>
        </div>
        {headerAction}
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
          onSend()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={200}
          disabled={disabled || sending}
          placeholder={disabled ? disabledHint : '输入消息…'}
          onChange={(event) => onDraftChange(event.target.value)}
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
    </>
  )
}

export default function GameChatPanel({
  messages,
  playerColor,
  disabled = false,
  disabledHint = '等待对手加入后可聊天',
  onSend,
}: GameChatPanelProps) {
  const compact = useCompactChatLayout()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seenCount, setSeenCount] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardInset = useKeyboardInset(compact && sheetOpen)

  const unreadCount = Math.max(0, messages.length - seenCount)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [messages, sheetOpen])

  useEffect(() => {
    if (sheetOpen) {
      setSeenCount(messages.length)
    }
  }, [sheetOpen, messages.length])

  useEffect(() => {
    if (!compact || !sheetOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [compact, sheetOpen])

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

  const body = (
    <ChatPanelBody
      messages={messages}
      playerColor={playerColor}
      disabled={disabled}
      disabledHint={disabledHint}
      draft={draft}
      sending={sending}
      error={error}
      listRef={listRef}
      inputRef={inputRef}
      onDraftChange={setDraft}
      onSend={() => {
        void handleSend()
      }}
      headerAction={
        compact ? (
          <button
            type="button"
            className="game-chat-sheet-close"
            aria-label="收起聊天"
            onClick={() => setSheetOpen(false)}
          >
            收起
          </button>
        ) : undefined
      }
    />
  )

  if (compact) {
    return createPortal(
      <>
        {!sheetOpen && (
          <button
            type="button"
            className="game-chat-fab"
            aria-label="打开对局聊天"
            onClick={() => setSheetOpen(true)}
          >
            <span aria-hidden>💬</span>
            <span>聊天</span>
            {unreadCount > 0 && (
              <span className="game-chat-fab-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        )}

        {sheetOpen && (
          <div
            className="game-chat-sheet-root"
            style={
              keyboardInset
                ? { paddingBottom: `${keyboardInset}px` }
                : undefined
            }
          >
            <button
              type="button"
              className="game-chat-sheet-backdrop"
              aria-label="关闭聊天"
              onClick={() => setSheetOpen(false)}
            />
            <section className="game-chat-panel game-chat-panel--sheet" aria-label="对局聊天">
              {body}
            </section>
          </div>
        )}
      </>,
      document.body,
    )
  }

  return (
    <section className="game-chat-panel" aria-label="对局聊天">
      {body}
    </section>
  )
}
