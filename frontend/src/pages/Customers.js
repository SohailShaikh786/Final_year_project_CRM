import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import customerService from '../services/customerService';
import locationService from '../services/locationService';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'New'
  });
  const [formErrors, setFormErrors] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
  useEffect(() => {
    fetchCustomers();
    
    // Get the user's current location
    locationService.getCurrentLocation()
      .then(location => {
        setCurrentLocation(location);
      })
      .catch(error => {
        console.error('Error getting current location:', error);
        setLocationError('Unable to get your location. Location features will be limited.');
      });
  }, []);
  
  useEffect(() => {
    // Filter customers based on search term
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, searchTerm]);
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
      setLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      stage: 'New'
    });
    setFormErrors({});
  };
  
  const handleShowModal = () => setShowModal(true);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (basic format check)
    if (formData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Include location if available
      const customerData = {
        ...formData
      };
      
      if (currentLocation) {
        customerData.lat = currentLocation.latitude;
        customerData.lng = currentLocation.longitude;
      }
      
      await customerService.createCustomer(customerData);
      handleCloseModal();
      fetchCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to create customer');
    }
  };
  
  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Failed to delete customer');
      }
    }
  };
  
  const calculateDistance = async (customer) => {
    if (!currentLocation || !customer.lat || !customer.lng) {
      alert('Location information is not available');
      return;
    }
    
    try {
      const result = await locationService.calculateDistance(
        currentLocation.latitude, 
        currentLocation.longitude, 
        customer.lat, 
        customer.lng
      );
      
      alert(`Distance to ${customer.name}: ${result.distance_km} km (${result.distance_mi} miles)\nEstimated travel time: ${result.estimated_time_text}`);
    } catch (error) {
      console.error('Error calculating distance:', error);
      alert('Failed to calculate distance');
    }
  };
  
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };
  
  const handlePlanRoute = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer for route planning');
      return;
    }
    
    try {
      setRouteLoading(true);
      const result = await locationService.planRoute(selectedCustomers);
      setRouteData(result);
      setShowRouteModal(true);
    } catch (error) {
      console.error('Error planning route:', error);
      alert('Failed to plan route: ' + error.message);
    } finally {
      setRouteLoading(false);
    }
  };
  
  const clearSelection = () => {
    setSelectedCustomers([]);
  };
  
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Customers</h2>
          {selectedCustomers.length > 0 && (
            <Badge bg="info" className="ms-2">
              {selectedCustomers.length} selected
            </Badge>
          )}
        </Col>
        <Col xs="auto">
          {selectedCustomers.length > 0 && (
            <>
              <Button 
                variant="success" 
                className="me-2" 
                onClick={handlePlanRoute}
                disabled={routeLoading}
              >
                {routeLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Planning Route...
                  </>
                ) : (
                  <>
                    <i className="fas fa-route me-2"></i>
                    Plan Route
                  </>
                )}
              </Button>
              <Button variant="outline-secondary" className="me-2" onClick={clearSelection}>
                Clear Selection
              </Button>
            </>
          )}
          <Button variant="primary" onClick={handleShowModal}>
            <i className="fas fa-plus me-2"></i>
            Add Customer
          </Button>
        </Col>
      </Row>
      
      {locationError && (
        <div className="alert alert-warning mb-3" role="alert">
          {locationError}
        </div>
      )}
      
      {/* Search Bar */}
      <Row className="mb-3">
        <Col md={6}>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder="Search customers by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-5"
            />
            <i className="fas fa-search position-absolute" style={{left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d'}}></i>
          </div>
        </Col>
        <Col md={6} className="text-end">
          <small className="text-muted">
            Showing {filteredCustomers.length} of {customers.length} customers
          </small>
        </Col>
      </Row>
      
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      
      {filteredCustomers.length === 0 ? (
        searchTerm ? (
          <Card className="text-center p-5">
            <Card.Body>
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No customers found</h5>
              <p>No customers match your search criteria: "{searchTerm}"</p>
              <Button variant="outline-primary" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="text-center p-5">
            <Card.Body>
              <h5>No customers found</h5>
              <p>Click "Add Customer" to create your first customer record.</p>
            </Card.Body>
          </Card>
        )
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>
                <Form.Check 
                  type="checkbox"
                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCustomers(filteredCustomers.map(c => c.id));
                    } else {
                      setSelectedCustomers([]);
                    }
                  }}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className={selectedCustomers.includes(customer.id) ? 'table-active' : ''}>
                <td>
                  <Form.Check 
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => handleCustomerSelect(customer.id)}
                  />
                </td>
                <td>
                  <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.company}</td>
                <td>
                  <span className={`badge ${
                    customer.stage === 'New' ? 'bg-info' :
                    customer.stage === 'Contacted' ? 'bg-primary' :
                    customer.stage === 'Proposal' ? 'bg-warning' :
                    'bg-success'
                  }`}>
                    {customer.stage}
                  </span>
                </td>
                <td>
                  {customer.lat && customer.lng ? (
                    <Badge bg="success">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      Located
                    </Badge>
                  ) : (
                    <Badge bg="secondary">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      No Location
                    </Badge>
                  )}
                </td>
                <td>
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    className="me-1"
                    as={Link} 
                    to={`/customers/${customer.id}`}
                  >
                    <i className="fas fa-eye"></i>
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="me-1"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                  {customer.lat && customer.lng && currentLocation && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => calculateDistance(customer)}
                      title="Calculate distance and travel time"
                    >
                      <i className="fas fa-route"></i>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      
      {/* Add Customer Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!formErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +1 (555) 123-4567"
                isInvalid={!!formErrors.phone}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.phone}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stage</Form.Label>
              <Form.Select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Proposal">Proposal</option>
                <option value="Closed">Closed</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Customer
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Route Planning Modal */}
      <Modal show={showRouteModal} onHide={() => setShowRouteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-route me-2"></i>
            Route Planning
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {routeData && (
            <>
              <Alert variant="info">
                <strong>Route Summary:</strong>
                <br />
                Total Distance: <strong>{routeData.total_distance_km} km</strong>
                <br />
                Estimated Total Time: <strong>{Math.floor(routeData.total_estimated_time_minutes / 60)}h {routeData.total_estimated_time_minutes % 60}m</strong>
                <br />
                Number of Stops: <strong>{routeData.route.length}</strong>
              </Alert>
              
              <h6>Route Details:</h6>
              <div className="route-list">
                <div className="route-item mb-3 p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <div className="route-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                      <i className="fas fa-home"></i>
                    </div>
                    <div>
                      <strong>Starting Point</strong>
                      <br />
                      <small className="text-muted">Your Current Location</small>
                    </div>
                  </div>
                </div>
                
                {routeData.route.map((stop, index) => (
                  <div key={stop.customer_id} className="route-item mb-3 p-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <div className="route-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                        {index + 1}
                      </div>
                      <div className="flex-grow-1">
                        <strong>{stop.customer_name}</strong>
                        {stop.customer_company && (
                          <>
                            <br />
                            <small className="text-muted">{stop.customer_company}</small>
                          </>
                        )}
                      </div>
                      <div className="text-end">
                        <Badge bg="info" className="me-2">
                          {stop.distance_from_previous} km
                        </Badge>
                        <Badge bg="warning">
                          {Math.floor(stop.estimated_time_minutes / 60) > 0 ? `${Math.floor(stop.estimated_time_minutes / 60)}h ` : ''}{stop.estimated_time_minutes % 60}m
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRouteModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            // Here you could integrate with Google Maps or other mapping service
            alert('Route planning complete! You can now navigate to each customer location.');
            setShowRouteModal(false);
          }}>
            <i className="fas fa-navigation me-2"></i>
            Start Navigation
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customers; 