const API_BASE = '/api'

export const analyzeFood = async (imageBase64, userMessage = null) => {
  try {
    const response = await fetch(`${API_BASE}/analyze-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        user_message: userMessage,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Food analysis error:', error)
    throw error
  }
}

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return await response.json()
  } catch (error) {
    console.error('Health check failed:', error)
    return null
  }
}
