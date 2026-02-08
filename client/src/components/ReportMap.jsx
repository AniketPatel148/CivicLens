import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons by issue type
const issueColors = {
  pothole: '#ef4444',
  trash: '#f59e0b',
  graffiti: '#8b5cf6',
  streetlight: '#3b82f6',
  other: '#6b7280'
};

const createIcon = (issueType) => {
  const color = issueColors[issueType] || issueColors.other;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const selectedLocationIcon = L.divIcon({
  className: 'selected-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #22c55e;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.3), 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Map click handler component (for selecting location)
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          address: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
        });
      }
    }
  });
  return null;
}

// Component to handle map transitions
function MapTransition({ focusLocation }) {
  const map = useMap();
  const prevLocation = useRef(null);

  useEffect(() => {
    if (focusLocation && focusLocation.lat && focusLocation.lng) {
      // Check if location actually changed
      const locationKey = `${focusLocation.lat}-${focusLocation.lng}`;
      if (prevLocation.current !== locationKey) {
        prevLocation.current = locationKey;
        map.flyTo([focusLocation.lat, focusLocation.lng], 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [focusLocation, map]);

  return null;
}

function ReportMap({ reports = [], refreshKey, onPinClick, selectedLocation, onMapClick, focusLocation }) {
  // Default center: Houston
  const defaultCenter = [29.7604, -95.3698];
  const defaultZoom = 13;

  const getSeverityColor = (severity) => {
    const colors = {
      1: '#22c55e',
      2: '#84cc16',
      3: '#f59e0b',
      4: '#f97316',
      5: '#ef4444'
    };
    return colors[severity] || colors[3];
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />

      <MapClickHandler onMapClick={onMapClick} />
      <MapTransition focusLocation={focusLocation} />

      {/* Selected location marker */}
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={selectedLocationIcon}
        >
          <Popup>
            <div className="popup-content">
              <h3>📍 Selected Location</h3>
              <p>{selectedLocation.address}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Report markers */}
      {reports.map((report) => {
        const [lng, lat] = report.location?.coordinates || [0, 0];
        
        return (
          <Marker
            key={report._id}
            position={[lat, lng]}
            icon={createIcon(report.issueType)}
            eventHandlers={{
              click: () => onPinClick && onPinClick(report._id)
            }}
          >
            <Popup>
              <div className="popup-content">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: issueColors[report.issueType]
                  }}></span>
                  {report.issueType}
                </h3>
                <p>{report.summary?.slice(0, 100)}...</p>
                <span 
                  className="severity-label"
                  style={{ 
                    background: getSeverityColor(report.severity) + '20',
                    color: getSeverityColor(report.severity),
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem'
                  }}
                >
                  Severity: {report.severity}/5
                </span>
                <p style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Click to view details
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Legend */}
      <div className="map-legend">
        <h4>Issue Types</h4>
        {Object.entries(issueColors).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ background: color }}></span>
            <span className="legend-label">{type}</span>
          </div>
        ))}
      </div>
    </MapContainer>
  );
}

export default ReportMap;
