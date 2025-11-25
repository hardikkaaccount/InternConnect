import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const navigate = useNavigate()

  // GraphQL operations
  const operationsDoc = `
    mutation RegisterUser($name: String!, $email: String!, $password_hash: String!) {
      insert_users_one(object: {name: $name, email: $email, password_hash: $password_hash}) {
        id
        name
        email
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

  // Register a new user
  async function registerUser(e) {
    e.preventDefault()
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // In a real app, you would hash the password properly
      const { data, errors } = await fetchGraphQL(operationsDoc, 'RegisterUser', { 
        name, 
        email, 
        password_hash: password 
      })
      
      if (errors) {
        setError(errors[0].message)
      } else {
        setSuccess('User registered successfully!')
        // Clear form
        setName('')
        setEmail('')
        setPassword('')
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <div className="error">Error: {error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={registerUser}>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? 
        <button className="link-button" onClick={() => navigate('/login')}>
          Login
        </button>
      </p>
    </div>
  )
}