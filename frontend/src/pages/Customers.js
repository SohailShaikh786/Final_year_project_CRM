import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Row, Col, Card } from 'react-bootstrap';
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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  
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
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
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
  };
  
  const handleShowModal = () => setShowModal(true);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      alert(`Distance to ${customer.name}: ${result.distance_km.toFixed(1)} km (${result.distance_mi.toFixed(1)} miles)`);
    } catch (error) {
      console.error('Error calculating distance:', error);
      alert('Failed to calculate distance');
    }
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
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleShowModal}>Add Customer</Button>
        </Col>
      </Row>
      
      {locationError && (
        <div className="alert alert-warning mb-3" role="alert">
          {locationError}
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      
      {customers.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <h5>No customers found</h5>
            <p>Click "Add Customer" to create your first customer record.</p>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
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
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    className="me-1"
                    as={Link} 
                    to={`/customers/${customer.id}`}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="me-1"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    Delete
                  </Button>
                  {customer.lat && customer.lng && currentLocation && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => calculateDistance(customer)}
                    >
                      Distance
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
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
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
    </div>
  );
};

export default Customers; 