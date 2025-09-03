import React from 'react';
import './App.css';
import Homepage from './pages/Home.jsx';
import FlightsPage from "./pages/FlightsPage.jsx";
import Earth from './pages/Earth';
import ProfilePage from './pages/ProfilePage';
import AgriculturePage from './pages/AgriculturePage';
import AgricultureLimitedPage from './pages/AgricultureLimitedPage';
import EarthVisualization from './pages/EarthVisualization';
import SubscriptionPage from './pages/SubscriptionPage';
import SectorBasedAgricultureMap from './components/SectorBasedAgricultureMap';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/earth" element={<Earth />} />

      {/* Protected Homepage */}
      <Route 
        path="/home" 
        element={
          <PrivateRoute redirectPath="/earth">
            <Homepage />
          </PrivateRoute>
        }
      />

      {/* Protected Flights Page */}
      <Route 
        path="/flights" 
        element={
          <PrivateRoute redirectPath="/earth">
            <FlightsPage />
          </PrivateRoute>
        }
      />

      {/* Protected Profile Page */}
      <Route 
        path="/profile" 
        element={
          <PrivateRoute redirectPath="/earth">
            <ProfilePage />
          </PrivateRoute>
        }
      />
      
      {/* Protected Subscription Page */}
      <Route 
        path="/subscription" 
        element={
          <PrivateRoute redirectPath="/earth">
            <SubscriptionPage />
          </PrivateRoute>
        }
      />
      
      {/* Protected Agriculture Page */}
      <Route 
        path="/agriculture" 
        element={
          <PrivateRoute redirectPath="/earth">
            <AgriculturePage />
          </PrivateRoute>
        }
      />
      
      {/* Agriculture Limited/Preview Page (Public) */}
      <Route 
        path="/agriculture-limited" 
        element={<AgricultureLimitedPage />}
      />
      
      {/* Enhanced Sector-Based Agriculture Map */}
      <Route 
        path="/agriculture/sectors" 
        element={
          <PrivateRoute redirectPath="/earth">
            <SectorBasedAgricultureMap />
          </PrivateRoute>
        }
      />
      
      {/* Domain Pages */}
      <Route 
        path="/domain/agriculture" 
        element={
          <PrivateRoute redirectPath="/earth">
            <AgriculturePage />
          </PrivateRoute>
        }
      />
      
      {/* Earth Visualization Page */}
      <Route 
        path="/earth-visualization" 
        element={
          <PrivateRoute redirectPath="/earth">
            <EarthVisualization />
          </PrivateRoute>
        }
      />

      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/home" replace /> : <Navigate to="/earth" replace />
        } 
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/earth" replace />} />
    </Routes>
  );
}

export default App;
