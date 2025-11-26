import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import locationService from '../services/locationService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    contactedCustomers: 0,
    proposalCustomers: 0,
    closedCustomers: 0,
    totalInteractions: 0
  });
  const [analytics, setAnalytics] = useState({
    recent_customers_count: 0,
    recent_interactions_count: 0,
    conversion_rate: 0,
    avg_interactions_per_customer: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        // Fetch dashboard stats
        const res = await fetch('http://127.0.0.1:5000/api/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch dashboard data');
        }

        const data = await res.json();
        setStats({
          totalCustomers: data.total_customers,
          newCustomers: data.new_customers,
          contactedCustomers: data.contacted_customers,
          proposalCustomers: data.proposal_customers,
          closedCustomers: data.closed_customers,
          totalInteractions: data.total_interactions
        });

        // Fetch analytics data
        try {
          const analyticsData = await locationService.getCustomerAnalytics();
          setAnalytics(analyticsData);
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError);
        }

        setLoading(false);
      } catch (error) {
        console.error('Dashboard error:', error);
        setError(error.message || 'Failed to load dashboard data');
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
          <Card className="mb-4 text-center shadow-sm border-0" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
            <Card.Body>
              <div className="mb-2">
                <i className="fas fa-users fa-2x"></i>
              </div>
              <h5 className="card-title">Total Customers</h5>
              <h2 className="card-text">{stats.totalCustomers}</h2>
              <Link to="/customers" className="btn btn-sm btn-light">View All</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm border-0" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
            <Card.Body>
              <div className="mb-2">
                <i className="fas fa-user-plus fa-2x"></i>
              </div>
              <h5 className="card-title">New Leads</h5>
              <h2 className="card-text">{stats.newCustomers}</h2>
              <Badge bg="light" text="dark" className="mb-2">
                {analytics.recent_customers_count} in last 30 days
              </Badge>
              <br />
              <Link to="/sales" className="btn btn-sm btn-light">View Pipeline</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm border-0" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
            <Card.Body>
              <div className="mb-2">
                <i className="fas fa-handshake fa-2x"></i>
              </div>
              <h5 className="card-title">Closed Deals</h5>
              <h2 className="card-text">{stats.closedCustomers}</h2>
              <Badge bg="light" text="dark" className="mb-2">
                {analytics.conversion_rate}% conversion rate
              </Badge>
              <br />
              <Link to="/sales" className="btn btn-sm btn-light">View Pipeline</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4 text-center shadow-sm border-0" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white'}}>
            <Card.Body>
              <div className="mb-2">
                <i className="fas fa-comments fa-2x"></i>
              </div>
              <h5 className="card-title">Interactions</h5>
              <h2 className="card-text">{stats.totalInteractions}</h2>
              <Badge bg="light" text="dark" className="mb-2">
                {analytics.avg_interactions_per_customer} avg per customer
              </Badge>
              <br />
              <Link to="/customers" className="btn btn-sm btn-light">View Customers</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Analytics Row */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Recent Activity
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={6}>
                  <div className="text-center p-3">
                    <div className="text-primary mb-2">
                      <i className="fas fa-user-plus fa-3x"></i>
                    </div>
                    <h4 className="text-primary">{analytics.recent_customers_count}</h4>
                    <p className="text-muted mb-0">New Customers</p>
                    <small className="text-muted">Last 30 days</small>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="text-center p-3">
                    <div className="text-success mb-2">
                      <i className="fas fa-comments fa-3x"></i>
                    </div>
                    <h4 className="text-success">{analytics.recent_interactions_count}</h4>
                    <p className="text-muted mb-0">Interactions</p>
                    <small className="text-muted">Last 7 days</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-trophy me-2"></i>
                Performance Metrics
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Conversion Rate</span>
                  <Badge bg="success">{analytics.conversion_rate}%</Badge>
                </div>
                <div className="progress" style={{height: '10px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${analytics.conversion_rate}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Avg Interactions per Customer</span>
                  <Badge bg="info">{analytics.avg_interactions_per_customer}</Badge>
                </div>
                <div className="progress" style={{height: '10px'}}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{width: `${Math.min(analytics.avg_interactions_per_customer * 20, 100)}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <Link to="/customers" className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-chart-bar me-2"></i>
                  View Detailed Analytics
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sales Pipeline */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Sales Pipeline Overview
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3} className="text-center">
                  <div className="pipeline-stage">
                    <div className="stage-icon bg-info text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                      <i className="fas fa-user-plus"></i>
                    </div>
                    <h4 className="text-info">{stats.newCustomers}</h4>
                    <p className="text-muted mb-0">New Leads</p>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="pipeline-stage">
                    <div className="stage-icon bg-primary text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                      <i className="fas fa-phone"></i>
                    </div>
                    <h4 className="text-primary">{stats.contactedCustomers}</h4>
                    <p className="text-muted mb-0">Contacted</p>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="pipeline-stage">
                    <div className="stage-icon bg-warning text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <h4 className="text-warning">{stats.proposalCustomers}</h4>
                    <p className="text-muted mb-0">Proposal</p>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="pipeline-stage">
                    <div className="stage-icon bg-success text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                      <i className="fas fa-handshake"></i>
                    </div>
                    <h4 className="text-success">{stats.closedCustomers}</h4>
                    <p className="text-muted mb-0">Closed</p>
                  </div>
                </Col>
              </Row>
              
              <div className="progress" style={{ height: '25px' }}>
                <div
                  className="progress-bar bg-info" 
                  role="progressbar" 
                  style={{ width: `${(stats.newCustomers / stats.totalCustomers) * 100 || 0}%` }}
                  title={`New: ${stats.newCustomers}`}>
                </div>
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${(stats.contactedCustomers / stats.totalCustomers) * 100 || 0}%` }}
                  title={`Contacted: ${stats.contactedCustomers}`}>
                </div>
                <div 
                  className="progress-bar bg-warning" 
                  role="progressbar" 
                  style={{ width: `${(stats.proposalCustomers / stats.totalCustomers) * 100 || 0}%` }}
                  title={`Proposal: ${stats.proposalCustomers}`}>
                </div>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${(stats.closedCustomers / stats.totalCustomers) * 100 || 0}%` }}
                  title={`Closed: ${stats.closedCustomers}`}>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <Link to="/sales" className="btn btn-primary">
                  <i className="fas fa-chart-line me-2"></i>
                  View Sales Pipeline
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
