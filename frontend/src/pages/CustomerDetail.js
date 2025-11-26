import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Form, Table, Spinner, Modal, Tab, Tabs } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import interactionService from '../services/interactionService';
import locationService from '../services/locationService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [interactionData, setInteractionData] = useState({
    type: 'note',
    note: ''
  });
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'New',
    lat: null,
    lng: null
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  
  useEffect(() => {
    fetchCustomerData();
    
    // Get current location
    locationService.getCurrentLocation()
      .then(location => {
        setCurrentLocation(location);
      })
      .catch(error => {
        console.error('Error getting current location:', error);
      });
  }, [id]);
  
  useEffect(() => {
    // Calculate distance if both customer and current location are available
    if (customer && currentLocation && customer.lat && customer.lng) {
      locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        customer.lat,
        customer.lng
      )
        .then(result => {
          setDistance(result);
        })
        .catch(error => {
          console.error('Error calculating distance:', error);
        });
    }
  }, [customer, currentLocation]);
  
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Get customer details
      const customerResponse = await customerService.getCustomer(id);
      setCustomer(customerResponse);
      setCustomerData({
        name: customerResponse.name || '',
        email: customerResponse.email || '',
        phone: customerResponse.phone || '',
        company: customerResponse.company || '',
        stage: customerResponse.stage || 'New',
        lat: customerResponse.lat,
        lng: customerResponse.lng
      });
      
      // Get customer interactions
      const interactionsResponse = await interactionService.getInteractions(id);
      setInteractions(interactionsResponse);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load customer data');
      setLoading(false);
    }
  };
  
  const handleInteractionChange = (e) => {
    const { name, value } = e.target;
    setInteractionData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleInteractionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await interactionService.createInteraction({
        ...interactionData,
        customer_id: id
      });
      
      setShowInteractionModal(false);
      setInteractionData({
        type: 'note',
        note: ''
      });
      
      // Refresh interactions
      const interactionsResponse = await interactionService.getInteractions(id);
      setInteractions(interactionsResponse);
    } catch (error) {
      console.error('Error creating interaction:', error);
      setError('Failed to create interaction');
    }
  };
  
  const handleDeleteInteraction = async (interactionId) => {
    if (window.confirm('Are you sure you want to delete this interaction?')) {
      try {
        await interactionService.deleteInteraction(interactionId);
        // Refresh interactions
        const interactionsResponse = await interactionService.getInteractions(id);
        setInteractions(interactionsResponse);
      } catch (error) {
        console.error('Error deleting interaction:', error);
        setError('Failed to delete interaction');
      }
    }
  };
  
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await customerService.updateCustomer(id, customerData);
      setShowEditModal(false);
      
      // Refresh customer data
      fetchCustomerData();
    } catch (error) {
      console.error('Error updating customer:', error);
      setError('Failed to update customer');
    }
  };
  
  const handleStageUpdate = async (newStage) => {
    try {
      await customerService.updateCustomerStage(id, newStage);
      
      // Refresh customer data
      fetchCustomerData();
    } catch (error) {
      console.error('Error updating customer stage:', error);
      setError('Failed to update customer stage');
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
  
  if (error) {
    return (
      <div className="alert alert-danger mt-3" role="alert">
        {error}
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="alert alert-warning mt-3" role="alert">
        Customer not found
      </div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customer Details</h2>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2" 
            onClick={() => setShowEditModal(true)}
          >
            Edit Customer
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/customers')}>
            Back to List
          </Button>
        </div>
      </div>
      
      <Tabs defaultActiveKey="details" className="mb-4">
        <Tab eventKey="details" title="Details">
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Customer Information</h5>
                    <span className={`badge ${
                      customer.stage === 'New' ? 'bg-info' :
                      customer.stage === 'Contacted' ? 'bg-primary' :
                      customer.stage === 'Proposal' ? 'bg-warning' :
                      'bg-success'
                    }`}>
                      {customer.stage}
                    </span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col md={4} className="fw-bold">Name:</Col>
                    <Col md={8}>{customer.name || 'Not provided'}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={4} className="fw-bold">Email:</Col>
                    <Col md={8}>
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`}>{customer.email}</a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={4} className="fw-bold">Phone:</Col>
                    <Col md={8}>
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={4} className="fw-bold">Company:</Col>
                    <Col md={8}>{customer.company || <span className="text-muted">Not provided</span>}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={4} className="fw-bold">Created:</Col>
                    <Col md={8}>{new Date(customer.created_at).toLocaleDateString()}</Col>
                  </Row>
                  {distance && (
                    <Row className="mb-2">
                      <Col md={4} className="fw-bold">Distance:</Col>
                      <Col md={8}>
                        {distance.distance_km.toFixed(1)} km ({distance.distance_mi.toFixed(1)} miles)
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
              
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Sales Pipeline</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <Button 
                      variant={customer.stage === 'New' ? 'info' : 'outline-info'}
                      onClick={() => handleStageUpdate('New')}
                      className="flex-grow-1 mx-1"
                    >
                      New
                    </Button>
                    <Button 
                      variant={customer.stage === 'Contacted' ? 'primary' : 'outline-primary'}
                      onClick={() => handleStageUpdate('Contacted')}
                      className="flex-grow-1 mx-1"
                    >
                      Contacted
                    </Button>
                    <Button 
                      variant={customer.stage === 'Proposal' ? 'warning' : 'outline-warning'}
                      onClick={() => handleStageUpdate('Proposal')}
                      className="flex-grow-1 mx-1"
                    >
                      Proposal
                    </Button>
                    <Button 
                      variant={customer.stage === 'Closed' ? 'success' : 'outline-success'}
                      onClick={() => handleStageUpdate('Closed')}
                      className="flex-grow-1 mx-1"
                    >
                      Closed
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              {customer.lat && customer.lng ? (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Customer Location</h5>
                  </Card.Header>
                  <Card.Body style={{ padding: 0 }}>
                    <div style={{ height: '300px', width: '100%' }}>
                      <MapContainer 
                        center={[customer.lat, customer.lng]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[customer.lat, customer.lng]}>
                          <Popup>
                            {customer.name} <br />
                            {customer.company || ''}
                          </Popup>
                        </Marker>
                        {currentLocation && (
                          <Marker 
                            position={[currentLocation.latitude, currentLocation.longitude]}
                            icon={new L.Icon({
                              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                              iconSize: [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34]
                            })}
                          >
                            <Popup>
                              Your Location
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Customer Location</h5>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted">No location information available for this customer.</p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="interactions" title="Interactions">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Customer Interactions</h5>
              <Button variant="primary" size="sm" onClick={() => setShowInteractionModal(true)}>
                Add Interaction
              </Button>
            </Card.Header>
            <Card.Body>
              {interactions.length === 0 ? (
                <p className="text-muted">No interactions recorded for this customer yet.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Note</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interactions.map(interaction => (
                      <tr key={interaction.id}>
                        <td>
                          <span className={`badge ${
                            interaction.type === 'call' ? 'bg-info' :
                            interaction.type === 'meeting' ? 'bg-primary' :
                            interaction.type === 'email' ? 'bg-warning' :
                            'bg-secondary'
                          }`}>
                            <i className={`fas ${
                              interaction.type === 'call' ? 'fa-phone' :
                              interaction.type === 'meeting' ? 'fa-calendar' :
                              interaction.type === 'email' ? 'fa-envelope' :
                              'fa-sticky-note'
                            } me-1`}></i>
                            {interaction.type}
                          </span>
                        </td>
                        <td>{interaction.note}</td>
                        <td>
                          <small>{new Date(interaction.timestamp).toLocaleDateString()}</small>
                          <br />
                          <small className="text-muted">{new Date(interaction.timestamp).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteInteraction(interaction.id)}
                            title="Delete interaction"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Add Interaction Modal */}
      <Modal show={showInteractionModal} onHide={() => setShowInteractionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Log Interaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleInteractionSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Interaction Type</Form.Label>
              <Form.Select
                name="type"
                value={interactionData.type}
                onChange={handleInteractionChange}
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="note"
                value={interactionData.note}
                onChange={handleInteractionChange}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowInteractionModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Interaction
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Edit Customer Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCustomerSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleCustomerChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleCustomerChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={customerData.phone}
                onChange={handleCustomerChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={customerData.company}
                onChange={handleCustomerChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stage</Form.Label>
              <Form.Select
                name="stage"
                value={customerData.stage}
                onChange={handleCustomerChange}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Proposal">Proposal</option>
                <option value="Closed">Closed</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Customer
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CustomerDetail; 