import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import customerService from '../services/customerService';

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [columns, setColumns] = useState({
    'New': {
      name: 'New Leads',
      items: []
    },
    'Contacted': {
      name: 'Contacted',
      items: []
    },
    'Proposal': {
      name: 'Proposal',
      items: []
    },
    'Closed': {
      name: 'Closed Deals',
      items: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  useEffect(() => {
    // Organize customers by stage
    if (customers.length > 0) {
      const newColumns = {
        'New': {
          name: 'New Leads',
          items: customers.filter(c => c.stage === 'New')
        },
        'Contacted': {
          name: 'Contacted',
          items: customers.filter(c => c.stage === 'Contacted')
        },
        'Proposal': {
          name: 'Proposal',
          items: customers.filter(c => c.stage === 'Proposal')
        },
        'Closed': {
          name: 'Closed Deals',
          items: customers.filter(c => c.stage === 'Closed')
        }
      };
      
      setColumns(newColumns);
    }
  }, [customers]);
  
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
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // If the card was dropped in the same column, do nothing
    if (source.droppableId === destination.droppableId) return;
    
    // Get the customer that was dragged
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const customer = sourceColumn.items[source.index];
    
    // Update the customer's stage
    try {
      await customerService.updateCustomerStage(customer.id, destination.droppableId);
      
      // Refresh customers
      fetchCustomers();
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
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Sales Pipeline</h2>
        <Button
          as={Link}
          to="/customers"
          variant="outline-primary"
        >
          Manage Customers
        </Button>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Row className="g-4">
          {Object.entries(columns).map(([columnId, column]) => (
            <Col key={columnId} md={3}>
              <Card className="shadow-sm h-100">
                <Card.Header className={`text-white ${
                  columnId === 'New' ? 'bg-info' :
                  columnId === 'Contacted' ? 'bg-primary' :
                  columnId === 'Proposal' ? 'bg-warning' :
                  'bg-success'
                }`}>
                  <h5 className="mb-0">{column.name} ({column.items.length})</h5>
                </Card.Header>
                
                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-2"
                      style={{ 
                        minHeight: '500px',
                        backgroundColor: '#f8f9fa' 
                      }}
                    >
                      {column.items.map((customer, index) => (
                        <Draggable
                          key={`${customer.id}`}
                          draggableId={`${customer.id}`}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2 customer-card"
                            >
                              <Card.Body>
                                <h6>
                                  <Link to={`/customers/${customer.id}`}>
                                    {customer.name}
                                  </Link>
                                </h6>
                                {customer.company && (
                                  <p className="mb-1 text-muted">{customer.company}</p>
                                )}
                                {customer.email && (
                                  <p className="mb-1 small">{customer.email}</p>
                                )}
                                {customer.phone && (
                                  <p className="mb-1 small">{customer.phone}</p>
                                )}
                                <div className="d-flex justify-content-end mt-2">
                                  <Button
                                    as={Link}
                                    to={`/customers/${customer.id}`}
                                    variant="outline-secondary"
                                    size="sm"
                                  >
                                    Details
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Card>
            </Col>
          ))}
        </Row>
      </DragDropContext>
    </div>
  );
};

export default Sales; 