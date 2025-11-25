import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET

export default function Dashboard({ loggedInUser, setLoggedInUser }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()

  // GraphQL operations
  const operationsDoc = `
    query GetMessages {
      messages(order_by: {created_at: asc}) {
        id
        content
        user_id
        created_at
        user {
          name
        }
      }
    }
    
    mutation AddMessage($content: String!, $userId: uuid!) {
      insert_messages_one(object: {content: $content, user_id: $userId}) {
        id
        content
        user_id
        created_at
        user {
          name
        }
      }
    }
  `

  // Function to fetch GraphQL data
  async function fetchGraphQL(operationsDoc, operationName, variables) {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    })

    return await response.json()
  }

  // Fetch all messages
  async function fetchMessages() {
    setLoading(true)
    setError(null)
    
    try {
      const { data, errors } = await fetchGraphQL(operationsDoc, 'GetMessages', {})
      
      if (errors) {
        setError(errors[0].message)
      } else {
        setMessages(data.messages)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add a new message
  async function addMessage(e) {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, errors } = await fetchGraphQL(operationsDoc, 'AddMessage', { 
        content: newMessage, 
        userId: loggedInUser.id
      })
      
      if (errors) {
        setError(errors[0].message)
      } else {
        // Clear form and refresh messages
        setNewMessage('')
        fetchMessages()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Logout user
  function logoutUser() {
    setLoggedInUser(null)
    // User is automatically removed from localStorage by App component
    navigate('/login')
  }

  // Load messages when component mounts
  useEffect(() => {
    // Check if user is properly loaded
    if (!loggedInUser || !loggedInUser.id) {
      navigate('/login')
      return
    }
    
    fetchMessages()
    
    // Set up polling to refresh messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    
    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [loggedInUser, navigate])

  if (!loggedInUser || !loggedInUser.id) {
    navigate('/login')
    return null
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h2>Welcome, {loggedInUser.name}!</h2>
        <button onClick={logoutUser}>Logout</button>
      </div>
      
      <div className="chat-container">
        <div className="messages">
          {loading && messages.length === 0 ? (
            <div>Loading messages...</div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="message">
                <div className="message-header">
                  <span className="username">{message.user?.name || 'Anonymous'}</span>
                  <span className="timestamp">
                    {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="content">{message.content}</div>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={addMessage} className="message-form">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
      
      {error && <div className="error">Error: {error}</div>}
    </div>
  )
}