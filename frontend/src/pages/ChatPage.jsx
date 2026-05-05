import { useState, useEffect } from 'react'
import './ChatPage.css'
import { analyzeFood } from '../services/api'
import ResultCard from '../components/ResultCard'
import MessageBubble from '../components/MessageBubble'

function ChatPage({ image, onBack }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    analyzeImage()
  }, [image])

  const analyzeImage = async () => {
    setLoading(true)
    setError(null)
    setMessages([
      {
        type: 'user',
        content: 'Image uploaded',
        image: image,
      },
      {
        type: 'loading',
        content: 'Analyzing...',
      },
    ])

    try {
      const analysisResult = await analyzeFood(image)
      setResult(analysisResult)

      const assistantText =
        analysisResult?.message ||
        'Analysis complete. See the result card below.'

      setMessages([
        {
          type: 'user',
          content: 'Image uploaded',
          image: image,
        },
        {
          type: 'assistant',
          content: assistantText,
        },
      ])
    } catch (err) {
      const errorMessage = err?.message || 'Failed to analyze food. Please try again.'
      setError(errorMessage)
      setMessages([
        {
          type: 'user',
          content: 'Image uploaded',
          image: image,
        },
        {
          type: 'error',
          content: errorMessage,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Analysis Results</h2>
        <div className="spacer" />
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
        </div>
      </div>

      {result && !loading && (
        <div className="results-section">
          <ResultCard result={result} />
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={analyzeImage} className="retry-button">
            Retry Analysis
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatPage
