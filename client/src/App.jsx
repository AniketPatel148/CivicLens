import { useState, useCallback, useEffect, useMemo } from 'react';
import ReportMap from './components/ReportMap';
import UploadForm from './components/UploadForm';
import ResultCard from './components/ResultCard';
import Dashboard from './components/Dashboard';
import ReportDetail from './components/ReportDetail';
import LocationPicker from './components/LocationPicker';
import ZipcodeStats from './components/ZipcodeStats';
import axios from 'axios';

// Calculate distance between two points in km (Haversine formula)
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Views: 'dashboard' | 'new-report' | 'location-picker' | 'submitting' | 'success' | 'detail' | 'stats'
function App() {
  const [view, setView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [focusLocation, setFocusLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');

  // Get user's location on app load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setFocusLocation({ lat: latitude, lng: longitude });
          
          // Try to get location name via reverse geocoding
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const addr = res.data.address;
            const name = addr.city || addr.town || addr.suburb || addr.county || 'Your Area';
            setLocationName(name);
          } catch (e) {
            setLocationName('Your Area');
          }
        },
        () => {
          // Fallback to Houston if location denied
          setUserLocation({ lat: 29.7604, lng: -95.3698 });
          setLocationName('Houston');
        }
      );
    }
  }, []);

  // Fetch all non-resolved reports
  const fetchReports = useCallback(async () => {
    try {
      const response = await axios.get('/api/reports?limit=100');
      // Filter to show only non-resolved
      const activeReports = response.data.data.filter(r => r.status !== 'resolved');
      setReports(activeReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshKey]);

  // Filter reports by distance from user (within 10km)
  const nearbyReports = useMemo(() => {
    if (!userLocation) return reports;
    return reports.filter(report => {
      if (!report.location?.coordinates) return false;
      const [lng, lat] = report.location.coordinates;
      const distance = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
      return distance <= 10; // Within 10km
    }).sort((a, b) => {
      // Sort by distance
      const [lngA, latA] = a.location.coordinates;
      const [lngB, latB] = b.location.coordinates;
      const distA = getDistanceKm(userLocation.lat, userLocation.lng, latA, lngA);
      const distB = getDistanceKm(userLocation.lat, userLocation.lng, latB, lngB);
      return distA - distB;
    });
  }, [reports, userLocation]);

  const handleStartNewReport = () => {
    setSelectedLocation(null);
    setResult(null);
    setError(null);
    setFocusLocation(null);
    setView('location-picker');
  };

  const handleLocationSelected = (location) => {
    setSelectedLocation(location);
    setFocusLocation(location); // Fly to selected location
    setView('new-report');
  };

  const handleSubmit = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);
    setView('submitting');

    try {
      const response = await axios.post('/api/reports', {
        ...formData,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: selectedLocation.address || ''
      });
      setResult(response.data.data);
      setRefreshKey(prev => prev + 1);
      
      // Fly to the submitted report location
      setFocusLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
      
      setView('success');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
      if (err.response?.data?.data) {
        setResult(err.response.data.data);
        setView('success');
      } else {
        setView('new-report');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation]);

  const handleViewReport = useCallback((reportId) => {
    setSelectedReportId(reportId);
    
    // Find the report and fly to its location
    const report = reports.find(r => r._id === reportId);
    if (report && report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      setFocusLocation({ lat, lng });
    }
    
    setView('detail');
  }, [reports]);

  const handleBackToDashboard = () => {
    setView('dashboard');
    setResult(null);
    setSelectedReportId(null);
    setFocusLocation(null); // Reset focus
  };

  const handleMapPinClick = (reportId) => {
    handleViewReport(reportId);
  };

  const handleViewStats = () => {
    setView('stats');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo" onClick={handleBackToDashboard} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">🔍</div>
          <h1>CivicLens</h1>
        </div>

        {view === 'dashboard' && (
          <Dashboard 
            reports={nearbyReports}
            allReports={reports}
            locationName={locationName}
            onNewReport={handleStartNewReport}
            onViewReport={handleViewReport}
            onViewStats={handleViewStats}
          />
        )}

        {view === 'stats' && (
          <>
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <ZipcodeStats />
          </>
        )}

        {view === 'location-picker' && (
          <LocationPicker 
            onLocationSelected={handleLocationSelected}
            onBack={handleBackToDashboard}
          />
        )}

        {view === 'new-report' && (
          <>
            <div className="location-summary">
              <p className="location-label">📍 Report Location</p>
              <p className="location-coords">
                {selectedLocation?.address || `${selectedLocation?.lat.toFixed(4)}, ${selectedLocation?.lng.toFixed(4)}`}
              </p>
              <button className="change-location-btn" onClick={() => setView('location-picker')}>
                Change Location
              </button>
            </div>
            <UploadForm 
              onSubmit={handleSubmit} 
              isLoading={isLoading} 
            />
          </>
        )}

        {view === 'submitting' && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span className="loading-text">Analyzing your report...</span>
            <p className="loading-subtext">Our AI is classifying the issue and generating a summary</p>
          </div>
        )}

        {view === 'success' && result && (
          <div className="success-view">
            <div className="success-header">
              <div className="success-icon">✅</div>
              <h2>Report Submitted!</h2>
              <p className="report-id">Report ID: {result._id?.slice(-8)}</p>
            </div>
            
            <ResultCard report={result} />
            
            <div className="success-actions">
              <button className="primary-btn" onClick={() => handleViewReport(result._id)}>
                Track This Report
              </button>
              <button className="secondary-btn" onClick={handleStartNewReport}>
                Report Another Issue
              </button>
              <button className="tertiary-btn" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {view === 'detail' && (
          <ReportDetail 
            reportId={selectedReportId}
            onBack={handleBackToDashboard}
          />
        )}

        {error && view === 'new-report' && (
          <div className="error-message">
            {error}
          </div>
        )}
      </aside>

      <main className="map-container">
        <ReportMap 
          reports={reports}
          refreshKey={refreshKey}
          onPinClick={handleMapPinClick}
          selectedLocation={view === 'location-picker' ? null : selectedLocation}
          focusLocation={focusLocation}
        />
      </main>
    </div>
  );
}

export default App;
