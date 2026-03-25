export default function MessageBubble({ message, currentUserId, onMessageContextMenu }) {
  const isMine = String(message.senderId) === String(currentUserId)
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1`}
      onContextMenu={(e) => {
        if (!onMessageContextMenu) return
        e.preventDefault()
        onMessageContextMenu(e, message)
      }}
    >
      <div
        className={[
          'max-w-[75%] rounded-2xl border px-3 py-2 shadow-sm',
          'animate-fade-up',
          'transition',
          isMine
            ? 'border-blue-200 bg-gradient-to-b from-blue-500/15 to-indigo-500/10'
            : 'border-slate-200 bg-slate-50',
        ].join(' ')}
      >
        <div className="whitespace-pre-wrap break-words text-sm text-slate-900">{message.text}</div>
        {time ? (
          <div className={`mt-1 text-[11px] ${isMine ? 'text-slate-600/70' : 'text-slate-500/70'}`}>{time}</div>
        ) : null}
      </div>
    </div>
  )
}

