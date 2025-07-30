import React, { useState, useEffect } from 'react';
import { Card, Spinner, Table, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import locationService from '../services/locationService';
import customerService from '../services/customerService';

// Fix for Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

// Custom icons
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const salesRepIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const Locations = () => {
  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default to London
  const [mapZoom, setMapZoom] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDistance, setSelectedDistance] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current location
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
        
        // Center map on current location
        setMapCenter([location.latitude, location.longitude]);
        
        // Get customers
        const customersData = await customerService.getCustomers();
        
        // Filter only customers with location data
        const customersWithLocation = customersData.filter(c => c.lat && c.lng);
        setCustomers(customersWithLocation);
        
        // Get other sales reps locations
        const salesRepsData = await locationService.getLocations();
        setSalesReps(salesRepsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching location data:', error);
        setError('Failed to load location data');
        setLoading(false);
        
        // Try to at least get customers if geolocation fails
        try {
          const customersData = await customerService.getCustomers();
          const customersWithLocation = customersData.filter(c => c.lat && c.lng);
          setCustomers(customersWithLocation);
          
          // If we have customers with location, center on the first one
          if (customersWithLocation.length > 0) {
            setMapCenter([customersWithLocation[0].lat, customersWithLocation[0].lng]);
          }
        } catch (e) {
          console.error('Error fetching customers:', e);
        }
      }
    };
    
    fetchData();
    
    // Set up interval to update locations
    const trackingId = locationService.startLocationTracking(location => {
      setCurrentLocation(location);
    }, 60000); // Update every minute
    
    return () => {
      locationService.stopLocationTracking(trackingId);
    };
  }, []);
  
  const calculateDistance = async (customer) => {
    try {
      if (!currentLocation) {
        setError('Your location is not available');
        return;
      }
      
      const result = await locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        customer.lat,
        customer.lng
      );
      
      setSelectedDistance({
        customer,
        distance: result
      });
    } catch (error) {
      console.error('Error calculating distance:', error);
      setError('Failed to calculate distance');
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
      <h2 className="mb-4">Location Tracking</h2>
      
      {error && (
        <Alert variant="warning" className="mb-4">
          {error}
        </Alert>
      )}
      
      <div className="row">
        <div className="col-md-8">
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Map View</h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <div style={{ height: '500px', width: '100%' }}>
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Current user location */}
                  {currentLocation && (
                    <>
                      <Marker 
                        position={[currentLocation.latitude, currentLocation.longitude]} 
                        icon={salesRepIcon}
                      >
                        <Popup>
                          Your current location
                          <br />
                          {new Date().toLocaleString()}
                        </Popup>
                      </Marker>
                      
                      {/* Radius circle around current location */}
                      <Circle
                        center={[currentLocation.latitude, currentLocation.longitude]}
                        radius={5000} // 5km radius
                        pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue', weight: 1 }}
                      />
                    </>
                  )}
                  
                  {/* Other sales reps */}
                  {salesReps.map(rep => (
                    // Skip current user
                    rep.user_id !== (currentLocation?.user_id) && (
                      <Marker 
                        key={rep.user_id}
                        position={[rep.latitude, rep.longitude]} 
                        icon={salesRepIcon}
                      >
                        <Popup>
                          {rep.name} (Sales Rep)
                          <br />
                          Last updated: {new Date(rep.timestamp).toLocaleString()}
                        </Popup>
                      </Marker>
                    )
                  ))}
                  
                  {/* Customer locations */}
                  {customers.map(customer => (
                    <Marker 
                      key={customer.id}
                      position={[customer.lat, customer.lng]} 
                      icon={customerIcon}
                      eventHandlers={{
                        click: () => calculateDistance(customer)
                      }}
                    >
                      <Popup>
                        <strong>{customer.name}</strong>
                        <br />
                        {customer.company && `${customer.company}`}
                        <br />
                        Stage: {customer.stage}
                        {currentLocation && (
                          <div className="mt-2">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => calculateDistance(customer)}
                            >
                              Calculate Distance
                            </button>
                          </div>
                        )}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-4">
          {selectedDistance && (
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">Distance Calculation</h5>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Customer:</strong> {selectedDistance.customer.name}
                </p>
                <p>
                  <strong>Distance:</strong> {selectedDistance.distance.distance_km.toFixed(1)} km ({selectedDistance.distance.distance_mi.toFixed(1)} miles)
                </p>
                <p className="mb-0">
                  <strong>Company:</strong> {selectedDistance.customer.company || 'N/A'}
                </p>
              </Card.Body>
            </Card>
          )}
          
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Customers</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {customers.length === 0 ? (
                <p className="text-muted">No customers with location data</p>
              ) : (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.company || 'N/A'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-link"
                            onClick={() => calculateDistance(customer)}
                          >
                            Distance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Locations; 