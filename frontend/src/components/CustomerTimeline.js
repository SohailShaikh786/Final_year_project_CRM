import React from 'react';
import { Card, Badge } from 'react-bootstrap';

const CustomerTimeline = ({ interactions, customer }) => {
  const getInteractionIcon = (type) => {
    switch (type) {
      case 'call':
        return 'fas fa-phone';
      case 'email':
        return 'fas fa-envelope';
      case 'meeting':
        return 'fas fa-calendar';
      case 'note':
        return 'fas fa-sticky-note';
      default:
        return 'fas fa-comment';
    }
  };

  const getInteractionColor = (type) => {
    switch (type) {
      case 'call':
        return 'primary';
      case 'email':
        return 'info';
      case 'meeting':
        return 'success';
      case 'note':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Combine customer creation and interactions into timeline
  const timelineItems = [
    {
      id: 'created',
      type: 'created',
      timestamp: customer?.created_at,
      note: `Customer ${customer?.name} was added to the system`,
      isSystemEvent: true
    },
    ...interactions.map(interaction => ({
      ...interaction,
      isSystemEvent: false
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (timelineItems.length === 0) {
    return (
      <Card className="text-center p-4">
        <Card.Body>
          <i className="fas fa-history fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No Activity Yet</h5>
          <p className="text-muted">Start interacting with this customer to see their activity timeline.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="timeline-container">
      <style jsx>{`
        .timeline-container {
          position: relative;
        }
        
        .timeline-item {
          position: relative;
          padding-left: 3rem;
          padding-bottom: 2rem;
        }
        
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 1.25rem;
          top: 3rem;
          bottom: -1rem;
          width: 2px;
          background: #e9ecef;
        }
        
        .timeline-icon {
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
          z-index: 1;
        }
        
        .timeline-content {
          background: #f8f9fa;
          border-radius: 0.5rem;
          padding: 1rem;
          border-left: 4px solid #dee2e6;
          transition: all 0.3s ease;
        }
        
        .timeline-content:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }
        
        .system-event .timeline-content {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-left-color: #6c757d;
        }
      `}</style>
      
      {timelineItems.map((item, index) => (
        <div key={item.id || index} className={`timeline-item ${item.isSystemEvent ? 'system-event' : ''}`}>
          <div 
            className={`timeline-icon bg-${item.isSystemEvent ? 'secondary' : getInteractionColor(item.type)}`}
          >
            <i className={item.isSystemEvent ? 'fas fa-plus' : getInteractionIcon(item.type)}></i>
          </div>
          
          <div className="timeline-content">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 className="mb-1">
                  {item.isSystemEvent ? (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Customer Created
                    </>
                  ) : (
                    <>
                      <i className={`${getInteractionIcon(item.type)} me-2`}></i>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </>
                  )}
                </h6>
                <small className="text-muted">
                  <i className="fas fa-clock me-1"></i>
                  {formatDate(item.timestamp)}
                </small>
              </div>
              <Badge 
                bg={item.isSystemEvent ? 'secondary' : getInteractionColor(item.type)}
                className="text-uppercase"
              >
                {item.isSystemEvent ? 'System' : item.type}
              </Badge>
            </div>
            
            <p className="mb-0 text-dark">
              {item.note}
            </p>
            
            {!item.isSystemEvent && (
              <div className="mt-2 pt-2 border-top">
                <small className="text-muted">
                  <i className="fas fa-user me-1"></i>
                  Interaction #{item.id}
                </small>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Timeline end indicator */}
      <div className="timeline-item">
        <div className="timeline-icon bg-light border">
          <i className="fas fa-flag text-muted"></i>
        </div>
        <div className="timeline-content bg-light">
          <small className="text-muted">
            <i className="fas fa-history me-2"></i>
            End of timeline
          </small>
        </div>
      </div>
    </div>
  );
};

export default CustomerTimeline;
