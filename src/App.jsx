import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on app start
  useEffect(() => {
    console.log('App mounting, checking for saved user...')
    const savedUser = localStorage.getItem('loggedInUser')
    // console.log('Raw saved user from localStorage:', savedUser)
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        // console.log('Parsed user:', user)
        // Validate that the user object has the required properties
        if (user && user.id && user.name && user.email) {
          console.log('Valid user found, setting as logged in')
          setLoggedInUser(user)
        } else {
          console.log('User data incomplete, removing from localStorage')
          // If user data is incomplete, remove it
          localStorage.removeItem('loggedInUser')
        }
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e)
        localStorage.removeItem('loggedInUser')
      }
    } else {
      console.log('No saved user found')
    }
    setLoading(false)
  }, [])

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        // Validate that the user object has the required properties
        if (user && user.id && user.name && user.email) {
          setLoggedInUser(user)
        } else {
          // If user data is incomplete, remove it
          localStorage.removeItem('loggedInUser')
          setLoading(false)
        }
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e)
        localStorage.removeItem('loggedInUser')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (loggedInUser && loggedInUser.id && loggedInUser.name && loggedInUser.email) {
      // Only store non-sensitive user information
      const userToStore = {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email
      };
      localStorage.setItem('loggedInUser', JSON.stringify(userToStore))
    } else {
      localStorage.removeItem('loggedInUser')
    }
  }, [loggedInUser])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="app">
      <h1>Intern Connect</h1>
      <Routes>
        <Route path="/" element={<Login setLoggedInUser={setLoggedInUser} />} />
        <Route path="/login" element={<Login setLoggedInUser={setLoggedInUser} />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />} 
        />
      </Routes>
    </div>
  )
}

export default App