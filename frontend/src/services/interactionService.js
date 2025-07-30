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
    console.log('✅ Interactions fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Interactions fetch error:', error.response?.data || error.message);
    throw error;
  }
};


const createInteraction = async (interactionData) => {
  try {
    const response = await axios.post('/api/interactions', interactionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const interactionService = {
  getInteractions,
  createInteraction
};

export default interactionService; 