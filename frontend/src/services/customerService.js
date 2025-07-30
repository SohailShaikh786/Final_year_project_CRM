import axios from 'axios';

// const getCustomers = async () => {
//   try {
//     const response = await axios.get('/api/customers');
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };
const getCustomers = async () => {
  try {
    const response = await axios.get('/api/customers');
    console.log('✅ Customers fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Customer fetch error:', error.response?.data || error.message);
    throw error;
  }
};


const getCustomer = async (id) => {
  try {
    const response = await axios.get(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createCustomer = async (customerData) => {
  try {
    const response = await axios.post('/api/customers', customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateCustomer = async (id, customerData) => {
  try {
    const response = await axios.put(`/api/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteCustomer = async (id) => {
  try {
    const response = await axios.delete(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateCustomerStage = async (id, stage) => {
  try {
    const response = await axios.put(`/api/customers/${id}`, { stage });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const customerService = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStage
};

export default customerService; 