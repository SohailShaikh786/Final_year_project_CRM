import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const showDevLink = process.env.NODE_ENV !== 'production';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setResetUrl('');
    setEmailSent(false);
    try {
      setLoading(true);
      const res = await axios.post('/api/forgot-password', { email });
      const { reset_url, email_sent } = res.data || {};
      const linkMessage = email_sent
        ? `We've sent a password reset link to ${email}. Please check your inbox and spam folder.`
        : 'Password reset link generated. Email delivery is not configured, so use the link below to continue.';
      setSuccess(linkMessage);
      setEmailSent(Boolean(email_sent));
      if (reset_url) {
        setResetUrl(reset_url);
      }
    } catch (err) {
      let message = 'Failed to request password reset';
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
                  <i className="fas fa-key"></i>
                </div>
                <h2 className="login-title">Forgot Password</h2>
                <p className="login-subtitle">Enter your email to reset password</p>
              </div>
              {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}
              {success && <Alert variant="success" className="custom-alert">{success}</Alert>}
              {resetUrl && (!emailSent || showDevLink) && (
                <Alert variant="info" className="custom-alert">
                  Dev reset link: <a href={resetUrl}>{resetUrl}</a>
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="email" className="mb-4">
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
                <Button disabled={loading} className="w-100 custom-login-btn" type="submit">
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Send Reset Link
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-3">
            <p className="signup-link">
              Remembered your password? <Link to="/login" className="custom-link">Sign In</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;