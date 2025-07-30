# CRM Web Application

A full-stack Customer Relationship Management (CRM) web application with location tracking and distance calculation features.

## Features

- **Authentication**: Login/Signup with JWT tokens
- **Customer Management**: Create, view, update, and delete customer information
- **Interaction Logging**: Record customer interactions (calls, meetings, notes)
- **Sales Pipeline**: Kanban-style board with drag-and-drop functionality
- **Location Tracking**: Track and display user and customer locations on maps
- **Distance Calculation**: Calculate distance between users and customers

## Tech Stack

### Backend
- **Python Flask**: REST API for server-side logic
- **PostgreSQL**: Database for storing application data
- **SQLAlchemy**: ORM for database operations
- **Flask-JWT-Extended**: Authentication with JWT tokens
- **Geopy**: Distance calculation between coordinates

### Frontend
- **React.js**: UI components and state management
- **React Router**: Navigation and routing
- **React Bootstrap**: UI framework for responsive design
- **Leaflet.js**: Interactive maps for location tracking
- **Axios**: HTTP client for API requests

## Getting Started

### Prerequisites
- Python 3.7+
- Node.js and npm
- PostgreSQL

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   SECRET_KEY=your_secret_key_here
   JWT_SECRET_KEY=your_jwt_secret_key_here
   DATABASE_URL=postgresql://username:password@localhost:5432/crm_db
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

5. Initialize the database:
   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. Run the backend server:
   ```
   python app.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or log in with existing credentials
3. Use the navigation menu to access different features of the CRM
4. Allow location access when prompted to enable location-based features

## License

This project is licensed under the MIT License. 