import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ onClose, showSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Attempting login with:', email);
      await login(email, password);
      console.log('Login successful');
      onClose();
      // Use replace: true to prevent back navigation to login screen
      navigate('/home', { replace: true }); 
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: '#0a192f',
        padding: '2rem',
        borderRadius: '10px',
        width: '400px',
        maxWidth: '90%',
        border: '1px solid rgba(79, 195, 247, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: '#4fc3f7',
            margin: 0,
            fontSize: '1.8rem'
          }}>
            Login
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'white',
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '5px',
                border: '1px solid rgba(79, 195, 247, 0.3)',
                backgroundColor: 'rgba(10, 25, 47, 0.7)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'white',
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '5px',
                border: '1px solid rgba(79, 195, 247, 0.3)',
                backgroundColor: 'rgba(10, 25, 47, 0.7)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{
              color: '#ff6b6b',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.8rem',
              backgroundColor: '#255b91',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1a4a7a';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#255b91';
            }}
          >
            Login
          </button>

          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem'
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                showSignup();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#4fc3f7',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                fontSize: '0.9rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {e.target.style.color = '#3ab0db'}}
              onMouseLeave={(e) => {e.target.style.color = '#4fc3f7'}}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;