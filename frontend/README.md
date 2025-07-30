# CRM Frontend

This is the React.js-based frontend for the CRM application.

## Features

- **Authentication**: Login/Signup with JWT tokens
- **Dashboard**: Summary view of customers, deals, and revenue
- **Customer Management**: Create, view, update, and delete customer records
- **Interaction Logging**: Record customer interactions
- **Sales Pipeline**: Kanban-style board with drag-and-drop functionality
- **Location Tracking**: Track and display user and customer locations on maps
- **Distance Calculation**: Calculate distance between users and customers

## Technology Stack

- **React.js**: UI components and state management
- **React Router**: Navigation and routing
- **React Bootstrap**: UI framework for responsive design
- **Leaflet.js**: Interactive maps for location tracking
- **Axios**: HTTP client for API requests

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Main application pages/views
- `src/services`: API service modules
- `src/context`: React context for state management
- `src/App.js`: Main application component with routing

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from create-react-app

## Location Tracking

This application uses the browser's Geolocation API to track the current user's location. The location data is sent to the backend and displayed on maps. To use this feature, you need to allow location access in your browser. 