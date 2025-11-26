import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const { register, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const [googleReady, setGoogleReady] = useState(false);
  const googleInitRef = useRef(false);
  const hiddenGoogleButtonRef = useRef(null);
  const googleRenderedButtonRef = useRef(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    
    // Password validation
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    
    try {
      setError('');
      setLoading(true);
      
      const result = await register(name, email, password);
      
      if (result.success) {
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to create an account');
      console.error(error);
    }
    
    setLoading(false);
  };

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    if (!response?.credential) {
      setError('Google did not return a credential. Please try again.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await loginWithGoogle(response.credential);
    if (result.success) {
      setSuccess('Signed in with Google! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGoogleReady(false);
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || googleInitRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse
        });
        if (hiddenGoogleButtonRef.current) {
          hiddenGoogleButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(hiddenGoogleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 320
          });
          googleRenderedButtonRef.current = hiddenGoogleButtonRef.current.querySelector('div[role="button"]');
        }
        googleInitRef.current = true;
        setGoogleReady(true);
      } catch (e) {
        console.error('Failed to initialize Google Identity Services', e);
        setGoogleReady(false);
      }
    };

    if (window.google && window.google.accounts && window.google.accounts.id) {
      initializeGoogle();
      return;
    }

    let script = document.querySelector('script[data-google-identity="true"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }

    const onLoad = () => initializeGoogle();
    const onError = () => setGoogleReady(false);

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, [handleGoogleCredentialResponse]);

  const handleGoogleSignInClick = () => {
    if (!googleReady || !window.google) {
      setError('Google sign-in is still loading. Please try again in a moment.');
      return;
    }
    try {
      if (googleRenderedButtonRef.current) {
        googleRenderedButtonRef.current.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
    } catch (err) {
      console.warn('Falling back to Google prompt', err);
    }
    window.google.accounts.id.prompt();
  };

  const GoogleLogo = () => (
    <span className="google-logo-circle">
      <svg className="google-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.24 3.6l6.9-6.9C35.64 2.16 30.48 0 24 0 14.5 0 6.2 5.4 2.4 13.2l7.8 6C11.4 13.2 17.2 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.57-.14-3.08-.41-4.55H24v9.28h12.7c-.56 3.04-2.25 5.61-4.82 7.34l7.8 6C43.8 38.2 46.5 31.9 46.5 24.5z"/>
        <path fill="#FBBC05" d="M10.2 28.7c-.6-1.8-.9-3.7-.9-5.7s.3-3.9.9-5.7l-7.8-6C.9 14.2 0 18.5 0 23c0 4.5.9 8.8 2.4 12.7l7.8-6z"/>
        <path fill="#34A853" d="M24 46c6.48 0 11.76-2.13 15.68-5.82l-7.8-6c-2.1 1.4-4.8 2.2-7.88 2.2-6.8 0-12.54-4.6-14.56-10.8l-7.8 6C6.2 42.6 14.5 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
    </span>
  );
  
  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <div className="w-100" style={{ maxWidth: '420px' }}>
          <Card className="login-card shadow-lg">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div className="login-icon mb-3">
                  <i className="fas fa-user-plus"></i>
                </div>
                <h2 className="login-title">Join Our CRM!</h2>
                <p className="login-subtitle">Create your account to get started</p>
              </div>
              {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}
              {success && <Alert variant="success" className="custom-alert">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="name" className="mb-3">
                  <Form.Label className="custom-label">
                    <i className="fas fa-user me-2"></i>Full Name
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="custom-input"
                    placeholder="Enter your full name"
                  />
                </Form.Group>
                <Form.Group id="email" className="mb-3">
                  <Form.Label className="custom-label">
                    <i className="fas fa-envelope me-2"></i>Email
                  </Form.Label>
                  <Form.Control 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="custom-input"
                    placeholder="Enter your email"
                  />
                </Form.Group>
                <Form.Group id="password" className="mb-3">
                  <Form.Label className="custom-label">
                    <i className="fas fa-lock me-2"></i>Password
                  </Form.Label>
                  <Form.Control 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="custom-input"
                    placeholder="Create a password"
                  />
                </Form.Group>
                <Form.Group id="password-confirm" className="mb-4">
                  <Form.Label className="custom-label">
                    <i className="fas fa-lock me-2"></i>Confirm Password
                  </Form.Label>
                  <Form.Control 
                    type="password" 
                    required 
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="custom-input"
                    placeholder="Confirm your password"
                  />
                </Form.Group>
              <Button disabled={loading} className="w-100 custom-login-btn" type="submit">
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Create Account
                    </>
                  )}
              </Button>
              <div className="mt-3 text-center">
                <Button 
                  className="google-btn" 
                  disabled={!googleReady || loading}
                  onClick={handleGoogleSignInClick}
                  type="button"
                >
                  <GoogleLogo />
                  <span className="google-btn-label">Continue with Google</span>
                </Button>
                <div ref={hiddenGoogleButtonRef} className="google-sdk-button" aria-hidden="true" />
                {!googleReady && (
                  <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                    
                  </div>
                )}
              </div>
              </Form>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-3">
            <p className="signup-link">
              Already have an account? <Link to="/login" className="custom-link">Sign In</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Register;