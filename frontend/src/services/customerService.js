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
    console.log('🔍 CustomerService: Making request to /api/customers');
    console.log('🔍 CustomerService: Auth header:', axios.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
    
    const response = await axios.get('/api/customers');
    console.log('✅ CustomerService: Customers fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    let message = 'Failed to fetch customers';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};


const getCustomer = async (id) => {
  try {
    const response = await axios.get(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    let message = 'Failed to fetch customer';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const createCustomer = async (customerData) => {
  try {
    const response = await axios.post('/api/customers', customerData);
    return response.data;
  } catch (error) {
    let message = 'Failed to create customer';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const updateCustomer = async (id, customerData) => {
  try {
    const response = await axios.put(`/api/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    let message = 'Failed to update customer';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const deleteCustomer = async (id) => {
  try {
    const response = await axios.delete(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    let message = 'Failed to delete customer';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
  }
};

const updateCustomerStage = async (id, stage) => {
  try {
    const response = await axios.put(`/api/customers/${id}`, { stage });
    return response.data;
  } catch (error) {
    let message = 'Failed to update customer stage';
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    throw new Error(message);
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