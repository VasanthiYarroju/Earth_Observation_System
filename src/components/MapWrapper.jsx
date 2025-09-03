import React, { useState, useEffect } from 'react';
import LeafletMap from './LeafletMap';
import './EarthMap.css';

const MapWrapper = ({ domain, enhanced = false, showControls = true }) => {
  const [hasError, setHasError] = useState(false);
  const [mapVisible, setMapVisible] = useState(true);

  useEffect(() => {
    // Add error event listener to window to catch any map errors
    const handleError = (event) => {
      console.error('Window caught error:', event);
      if (event.message && (
        event.message.includes('leaflet') || 
        event.message.includes('map')
      )) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const resetMap = () => {
    setMapVisible(false);
    setHasError(false);
    setTimeout(() => {
      setMapVisible(true);
    }, 1000);
  };

  return (
    <div className="map-wrapper">
      {hasError && (
        <div className="map-error-controls">
          <div className="error-message">
            <p>There was a problem loading the map.</p>
          </div>
          <div className="error-actions">
            <button onClick={resetMap}>Reload Map</button>
          </div>
        </div>
      )}
      
      {mapVisible && (
        <LeafletMap
          domain={domain}
          enhanced={enhanced}
          showControls={showControls}
        />
      )}
    </div>
  );
};

export default MapWrapper;
