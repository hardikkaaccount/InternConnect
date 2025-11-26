import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT;
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

export default function Login({ setLoggedInUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // GraphQL query to fetch user
  const getUserQuery = `
    query GetUser($email: String!, $password: String!) {
      users(where: {email: {_eq: $email}, password_hash: {_eq: $password}}) {
        id
        name
        email
      }
    }
  `;

  // Function to fetch GraphQL data
  async function fetchGraphQL(query, operationName, variables) {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
        operationName: operationName
      })
    });

    return await response.json();
  }

  // Handle login form submission
  async function handleLogin(e) {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, errors } = await fetchGraphQL(getUserQuery, 'GetUser', { 
        email, 
        password 
      });
      
      if (errors) {
        setError(errors[0].message);
      } else if (data.users.length === 0) {
        setError('Invalid email or password');
      } else {
        // Set the logged in user
        const user = data.users[0];
        setLoggedInUser(user);
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container">
      <h2>Login</h2>
      {error && <div className="alert alert-error">Error: {error}</div>}
      <form onSubmit={handleLogin}>
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
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center">
        Don't have an account? 
        <button className="btn btn-link" onClick={() => navigate('/register')}>
          Register
        </button>
      </p>
    </div>
  );
}