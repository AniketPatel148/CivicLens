import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';

function LocationPicker({ onLocationSelected, onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Debounced search for address suggestions
  const searchAddresses = useCallback(
    debounce(async (query) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'NeighborhoodIssueReporter/1.0'
            }
          }
        );
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Address search error:', err);
        setSuggestions([]);
      }
    }, 300),
    []
  );

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    searchAddresses(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    onLocationSelected({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name
    });
  };

  const handleCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'NeighborhoodIssueReporter/1.0'
              }
            }
          );
          
          onLocationSelected({
            lat: latitude,
            lng: longitude,
            address: response.data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        } catch (err) {
          onLocationSelected({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        }
        
        setIsLoading(false);
      },
      (err) => {
        setError('Unable to get your location. Please try entering an address.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDemoLocation = () => {
    // Houston, TX for demo
    onLocationSelected({
      lat: 29.7604,
      lng: -95.3698,
      address: 'Houston, TX (Demo Location)'
    });
  };

  const handleAddressSubmit = async () => {
    if (!address.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'NeighborhoodIssueReporter/1.0'
          }
        }
      );

      if (response.data.length === 0) {
        setError('Address not found. Please try a different search.');
        setIsLoading(false);
        return;
      }

      const result = response.data[0];
      onLocationSelected({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name
      });
    } catch (err) {
      setError('Failed to find location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="location-picker">
      <button className="back-btn" onClick={onBack}>
        ← Cancel
      </button>

      <h2>Where is the issue?</h2>
      <p className="helper-text">Help us locate the problem accurately</p>

      {error && <div className="error-message">{error}</div>}

      <div className="location-option" onClick={handleCurrentLocation}>
        <span className="option-icon">📍</span>
        <div className="option-content">
          <h3>Use My Current Location</h3>
          <p>Automatically detect where you are</p>
        </div>
        {isLoading && <div className="mini-spinner"></div>}
      </div>

      <div className="divider">
        <span>or</span>
      </div>

      <div className="address-search-container" ref={suggestionsRef}>
        <div className="address-input-group">
          <span className="input-icon">🏠</span>
          <input
            type="text"
            placeholder="Enter an address..."
            value={address}
            onChange={handleAddressChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="address-input"
            autoComplete="off"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="address-suggestions">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.place_id || index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                <span className="suggestion-icon">📍</span>
                <span className="suggestion-text">{suggestion.display_name}</span>
              </li>
            ))}
          </ul>
        )}

        <button 
          className="find-location-btn" 
          onClick={handleAddressSubmit}
          disabled={isLoading || !address.trim()}
        >
          {isLoading ? 'Searching...' : 'Find Location'}
        </button>
      </div>

      <div className="divider">
        <span>or</span>
      </div>

      <div className="location-option demo-option" onClick={handleDemoLocation}>
        <span className="option-icon">🗺️</span>
        <div className="option-content">
          <h3>Use Demo Location</h3>
          <p>Houston, TX (for testing)</p>
        </div>
      </div>

      <div className="map-tip">
        <span className="tip-icon">💡</span>
        Tip: Click on the map to select a specific location
      </div>
    </div>
  );
}

export default LocationPicker;
