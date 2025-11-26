import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Sales from './pages/Sales';
import Locations from './pages/Locations';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';
import locationService from './services/locationService';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { currentUser } = useContext(AuthContext);
  const [trackingId, setTrackingId] = useState(null);
  
  // Start location tracking when a user is logged in
  useEffect(() => {
    if (currentUser && !trackingId) {
      const id = locationService.startLocationTracking((location) => {
        console.log('Location updated:', location);
      }, 60000); // Update every minute
      
      setTrackingId(id);
    } else if (!currentUser && trackingId) {
      locationService.stopLocationTracking(trackingId);
      setTrackingId(null);
    }
    
    return () => {
      if (trackingId) {
        locationService.stopLocationTracking(trackingId);
      }
    };
  }, [currentUser, trackingId]);
  
  return (
    <div className="App">
      {currentUser && <Navigation />}
      <div className="container-fluid mt-3">
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!currentUser ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password/:token" element={!currentUser ? <ResetPassword /> : <Navigate to="/" />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;