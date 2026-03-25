import MessageBubble from './MessageBubble'

export default function MessageList({ messages, currentUserId, bottomRef, onMessageContextMenu }) {
  return (
    <div className="flex-1 overflow-auto px-6 py-5 bg-gradient-to-b from-slate-50 to-white">
      <div className="space-y-3">
        {messages.map((m) => {
          const key = m.messageId ?? m._id ?? `${m.senderId}-${m.receiverId}-${m.timestamp}`
          return (
            <MessageBubble
              key={key}
              message={m}
              currentUserId={currentUserId}
              onMessageContextMenu={onMessageContextMenu}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

