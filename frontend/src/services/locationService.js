import axios from 'axios';

const updateLocation = async (latitude, longitude) => {
  try {
    const response = await axios.post('/api/locations', { latitude, longitude });
    return response.data;
  } catch (error) {
    let message = 'Failed to update location';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const getLocations = async () => {
  try {
    const response = await axios.get('/api/locations');
    return response.data;
  } catch (error) {
    let message = 'Failed to fetch locations';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const calculateDistance = async (lat1, lng1, lat2, lng2) => {
  try {
    const response = await axios.post('/api/distance', { lat1, lng1, lat2, lng2 });
    return response.data;
  } catch (error) {
    let message = 'Failed to calculate distance';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

// Get the current location of the user
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        error => {
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
};

// Start tracking the user's location
const startLocationTracking = (callback, interval = 60000) => {
  // Get the initial location
  getCurrentLocation()
    .then(location => {
      updateLocation(location.latitude, location.longitude)
        .then(() => callback(location))
        .catch(error => console.error('Error updating location:', error));
    })
    .catch(error => console.error('Error getting current location:', error));

  // Set up interval to update location
  const trackingId = setInterval(() => {
    getCurrentLocation()
      .then(location => {
        updateLocation(location.latitude, location.longitude)
          .then(() => callback(location))
          .catch(error => console.error('Error updating location:', error));
      })
      .catch(error => console.error('Error getting current location:', error));
  }, interval);

  return trackingId;
};

// Stop tracking the user's location
const stopLocationTracking = (trackingId) => {
  clearInterval(trackingId);
};

const planRoute = async (customerIds) => {
  try {
    const response = await axios.post('/api/route-planning', { customer_ids: customerIds });
    return response.data;
  } catch (error) {
    let message = 'Failed to plan route';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const getCustomerAnalytics = async () => {
  try {
    const response = await axios.get('/api/customer-analytics');
    return response.data;
  } catch (error) {
    let message = 'Failed to fetch customer analytics';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const locationService = {
  updateLocation,
  getLocations,
  calculateDistance,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  planRoute,
  getCustomerAnalytics
};

export default locationService; 