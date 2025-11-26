import axios from 'axios';

// const getInteractions = async (customerId = null) => {
//   try {
//     let url = '/api/interactions';
//     if (customerId) {
//       url += `?customer_id=${customerId}`;
//     }
//     const response = await axios.get(url);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };
const getInteractions = async (customerId = null) => {
  try {
    let url = '/api/interactions';
    if (customerId) {
      url += `?customer_id=${customerId}`;
    }
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    let message = 'Failed to fetch interactions';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};


const createInteraction = async (interactionData) => {
  try {
    const response = await axios.post('/api/interactions', interactionData);
    return response.data;
  } catch (error) {
    let message = 'Failed to create interaction';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const deleteInteraction = async (id) => {
  try {
    const response = await axios.delete(`/api/interactions/${id}`);
    return response.data;
  } catch (error) {
    let message = 'Failed to delete interaction';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const interactionService = {
  getInteractions,
  createInteraction,
  deleteInteraction
};

export default interactionService; 