import { useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedImage, setSelectedImage] = useState(null)

  const goToChat = (image) => {
    setSelectedImage(image)
    setCurrentPage('chat')
  }

  const goHome = () => {
    setCurrentPage('home')
    setSelectedImage(null)
  }

  return (
    <div className="app">
      {currentPage === 'home' && <HomePage onImageSelect={goToChat} />}
      {currentPage === 'chat' && <ChatPage image={selectedImage} onBack={goHome} />}
    </div>
  )
}

export default App
