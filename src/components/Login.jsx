import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET

export default function Login({ setLoggedInUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()

  // GraphQL operations
  const operationsDoc = `
    query GetUser($email: String!) {
      users(where: {email: {_eq: $email}}) {
        id
        name
        email
        password_hash
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

  // Login user
  async function loginUser(e) {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, errors } = await fetchGraphQL(operationsDoc, 'GetUser', { email })
      
      if (errors) {
        setError(errors[0].message)
      } else if (data.users.length === 0) {
        setError('User not found')
      } else {
        const user = data.users[0]
        // In a real app, you would properly verify the password
        if (user.password_hash === password) {
          setLoggedInUser(user)
          setError(null)
          // User is automatically saved to localStorage by App component
          navigate('/dashboard')
        } else {
          setError('Incorrect password')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error">Error: {error}</div>}
      <form onSubmit={loginUser}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? 
        <button className="link-button" onClick={() => navigate('/register')}>
          Register
        </button>
      </p>
    </div>
  )
}