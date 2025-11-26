import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    <div className="form-container">
      <h2>Register</h2>
      {error && <div className="alert alert-error">Error: {error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={registerUser}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-center">
        Already have an account? 
        <button className="btn btn-link" onClick={() => navigate('/login')}>
          Login
        </button>
      </p>
    </div>
  )
}