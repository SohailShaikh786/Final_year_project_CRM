import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import customerService from '../services/customerService';
import interactionService from '../services/interactionService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    contactedCustomers: 0,
    proposalCustomers: 0,
    closedCustomers: 0,
    totalInteractions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get all customers
        const customers = await customerService.getCustomers();
        
        // Get all interactions
        const interactions = await interactionService.getInteractions();
        
        // Calculate stats
        const newCustomers = customers.filter(c => c.stage === 'New').length;
        const contactedCustomers = customers.filter(c => c.stage === 'Contacted').length;
        const proposalCustomers = customers.filter(c => c.stage === 'Proposal').length;
        const closedCustomers = customers.filter(c => c.stage === 'Closed').length;
        
        setStats({
          totalCustomers: customers.length,
          newCustomers,
          contactedCustomers,
          proposalCustomers,
          closedCustomers,
          totalInteractions: interactions.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger mt-3" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      
      <Row>
        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm">
            <Card.Body>
              <h5 className="card-title">Total Customers</h5>
              <h2 className="card-text text-primary">{stats.totalCustomers}</h2>
              <Link to="/customers" className="btn btn-sm btn-outline-primary">View All</Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm">
            <Card.Body>
              <h5 className="card-title">New Leads</h5>
              <h2 className="card-text text-info">{stats.newCustomers}</h2>
              <Link to="/sales" className="btn btn-sm btn-outline-info">View Pipeline</Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm">
            <Card.Body>
              <h5 className="card-title">Closed Deals</h5>
              <h2 className="card-text text-success">{stats.closedCustomers}</h2>
              <Link to="/sales" className="btn btn-sm btn-outline-success">View Pipeline</Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm">
            <Card.Body>
              <h5 className="card-title">Total Interactions</h5>
              <h2 className="card-text text-warning">{stats.totalInteractions}</h2>
              <Link to="/customers" className="btn btn-sm btn-outline-warning">View Customers</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5>Sales Pipeline Overview</h5>
            </Card.Header>
            <Card.Body>
              <div className="progress" style={{ height: '30px' }}>
                <div 
                  className="progress-bar bg-info" 
                  role="progressbar" 
                  style={{ width: `${stats.newCustomers / stats.totalCustomers * 100}%` }}
                  aria-valuenow={stats.newCustomers}
                  aria-valuemin="0" 
                  aria-valuemax={stats.totalCustomers}>
                  New ({stats.newCustomers})
                </div>
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${stats.contactedCustomers / stats.totalCustomers * 100}%` }}
                  aria-valuenow={stats.contactedCustomers}
                  aria-valuemin="0" 
                  aria-valuemax={stats.totalCustomers}>
                  Contacted ({stats.contactedCustomers})
                </div>
                <div 
                  className="progress-bar bg-warning" 
                  role="progressbar" 
                  style={{ width: `${stats.proposalCustomers / stats.totalCustomers * 100}%` }}
                  aria-valuenow={stats.proposalCustomers}
                  aria-valuemin="0" 
                  aria-valuemax={stats.totalCustomers}>
                  Proposal ({stats.proposalCustomers})
                </div>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${stats.closedCustomers / stats.totalCustomers * 100}%` }}
                  aria-valuenow={stats.closedCustomers}
                  aria-valuemin="0" 
                  aria-valuemax={stats.totalCustomers}>
                  Closed ({stats.closedCustomers})
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 