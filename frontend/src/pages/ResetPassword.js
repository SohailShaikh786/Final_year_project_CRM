import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/reset-password', { token, new_password: password });
      if (res.status === 200) {
        setSuccess('Password reset successful. You can now sign in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      let message = 'Failed to reset password';
      if (err.response && err.response.data && err.response.data.message) {
        message = err.response.data.message;
      }
      setError(message);
    }
    setLoading(false);
  };

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
                  <i className="fas fa-lock"></i>
                </div>
                <h2 className="login-title">Reset Password</h2>
                <p className="login-subtitle">Create a new password to continue</p>
              </div>
              {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}
              {success && <Alert variant="success" className="custom-alert">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="password" className="mb-3">
                  <Form.Label className="custom-label">
                    <i className="fas fa-lock me-2"></i>New Password
                  </Form.Label>
                  <Form.Control 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="custom-input"
                    placeholder="Enter new password"
                  />
                </Form.Group>
                <Form.Group id="password-confirm" className="mb-4">
                  <Form.Label className="custom-label">
                    <i className="fas fa-lock me-2"></i>Confirm New Password
                  </Form.Label>
                  <Form.Control 
                    type="password" 
                    required 
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="custom-input"
                    placeholder="Confirm new password"
                  />
                </Form.Group>
                <Button disabled={loading} className="w-100 custom-login-btn" type="submit">
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Reset Password
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-3">
            <p className="signup-link">
              Back to <Link to="/login" className="custom-link">Sign In</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;