# CRM Backend API

This is the Flask-based backend API for the CRM application.

## Setup Instructions

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with the following variables:
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

6. Run the application:
   ```
   python app.py
   ```

The API will be available at http://localhost:5000.

## API Endpoints

- **Authentication**
  - POST `/api/register` - Register a new user
  - POST `/api/login` - Login and get access token

- **Customers**
  - GET `/api/customers` - Get all customers
  - POST `/api/customers` - Create a new customer
  - PUT `/api/customers/<id>` - Update a customer
  - DELETE `/api/customers/<id>` - Delete a customer

- **Interactions**
  - GET `/api/interactions` - Get all interactions (can filter by customer_id)
  - POST `/api/interactions` - Create a new interaction

- **Locations**
  - POST `/api/locations` - Update user location
  - GET `/api/locations` - Get all user locations

- **Distance**
  - POST `/api/distance` - Calculate distance between two coordinates 