import './MessageBubble.css'

function MessageBubble({ message }) {
  if (message.type === 'user') {
    return (
      <div className="message user-message">
        {message.image && (
          <img src={message.image} alt="Uploaded" className="message-image" />
        )}
        <div className="message-content">{message.content}</div>
      </div>
    )
  }

  if (message.type === 'loading') {
    return (
      <div className="message assistant-message">
        <div className="message-content loading">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )
  }

  if (message.type === 'error') {
    return (
      <div className="message error-message">
        <div className="message-content">❌ {message.content}</div>
      </div>
    )
  }

  return (
    <div className="message assistant-message">
      <div className="message-content">{message.content}</div>
    </div>
  )
}

export default MessageBubble
