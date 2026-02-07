import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

const ZipcodeStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchZip, setSearchZip] = useState('');
  const [zipStats, setZipStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/stats/summary`);
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const searchByZipcode = async () => {
    if (!searchZip.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit zipcode');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/reports/stats/zipcode/${searchZip}`);
      const result = await response.json();
      if (result.success) {
        setZipStats(result.data);
      }
    } catch (err) {
      setError('Failed to load zipcode stats');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours) => {
    if (hours === null || hours === undefined) return 'N/A';
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const getDepartmentLabel = (dept) => {
    const labels = {
      public_works: 'Public Works',
      sanitation: 'Sanitation',
      parks: 'Parks & Rec',
      utilities: 'Utilities',
      police_non_emergency: 'Police (Non-Emergency)',
      general: 'General'
    };
    return labels[dept] || dept;
  };

  const getRatingColor = (hours) => {
    if (hours === null) return 'var(--text-muted)';
    if (hours <= 24) return 'var(--success)';
    if (hours <= 72) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getRatingLabel = (hours) => {
    if (hours === null) return 'No data';
    if (hours <= 24) return 'Excellent';
    if (hours <= 48) return 'Good';
    if (hours <= 72) return 'Average';
    if (hours <= 168) return 'Slow';
    return 'Very Slow';
  };

  if (loading && !stats) {
    return (
      <div className="stats-container">
        <div className="loading-spinner">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>📊 Municipality Performance</h2>
        <p className="stats-subtitle">Track how quickly issues get resolved in your area</p>
      </div>

      {/* Search by Zipcode */}
      <div className="zipcode-search">
        <input
          type="text"
          placeholder="Enter zipcode (e.g., 77002)"
          value={searchZip}
          onChange={(e) => setSearchZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="zipcode-input"
          maxLength={5}
        />
        <button 
          onClick={searchByZipcode}
          className="search-btn"
          disabled={searchZip.length !== 5}
        >
          Search
        </button>
      </div>

      {error && <div className="stats-error">{error}</div>}

      {/* Zipcode-specific stats */}
      {zipStats && (
        <div className="zipcode-results">
          <h3>📍 Zipcode {zipStats.zipcode}</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{zipStats.overall?.totalReports || 0}</div>
              <div className="stat-label">Total Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{zipStats.overall?.resolvedReports || 0}</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div 
                className="stat-value"
                style={{ color: getRatingColor(zipStats.overall?.avgResolutionHours) }}
              >
                {formatTime(zipStats.overall?.avgResolutionHours)}
              </div>
              <div className="stat-label">Avg Resolution</div>
            </div>
            <div className="stat-card">
              <div 
                className="stat-value rating"
                style={{ color: getRatingColor(zipStats.overall?.avgResolutionHours) }}
              >
                {getRatingLabel(zipStats.overall?.avgResolutionHours)}
              </div>
              <div className="stat-label">Rating</div>
            </div>
          </div>

          {/* Department breakdown */}
          {zipStats.byDepartment?.length > 0 && (
            <div className="department-stats">
              <h4>By Department</h4>
              <div className="dept-list">
                {zipStats.byDepartment.map((dept) => (
                  <div key={dept.department} className="dept-row">
                    <span className="dept-name">{getDepartmentLabel(dept.department)}</span>
                    <span className="dept-count">{dept.totalReports} issues</span>
                    <span 
                      className="dept-time"
                      style={{ color: getRatingColor(dept.avgResolutionHours) }}
                    >
                      {formatTime(dept.avgResolutionHours)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            className="clear-btn"
            onClick={() => setZipStats(null)}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Overall stats */}
      {stats && !zipStats && (
        <>
          <div className="overall-stats">
            <h3>🏙️ City-wide Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.overall?.totalReports || 0}</div>
                <div className="stat-label">Total Reports</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.overall?.resolvedReports || 0}</div>
                <div className="stat-label">Resolved</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {formatTime(stats.overall?.avgResolutionHours)}
                </div>
                <div className="stat-label">Avg Resolution</div>
              </div>
            </div>
          </div>

          {/* Top zipcodes */}
          {stats.byZipcode?.length > 0 && (
            <div className="zipcode-list">
              <h3>📍 By Zipcode</h3>
              <div className="zipcode-table">
                {stats.byZipcode.slice(0, 10).map((zip) => (
                  <div 
                    key={zip.zipcode} 
                    className="zipcode-row"
                    onClick={() => {
                      setSearchZip(zip.zipcode);
                      searchByZipcode();
                    }}
                  >
                    <span className="zip-code">{zip.zipcode}</span>
                    <span className="zip-reports">{zip.totalReports} reports</span>
                    <span 
                      className="zip-time"
                      style={{ color: getRatingColor(zip.avgResolutionHours) }}
                    >
                      {formatTime(zip.avgResolutionHours)}
                    </span>
                    <span 
                      className="zip-rate"
                      style={{ 
                        color: zip.resolutionRate > 70 ? 'var(--success)' : 
                               zip.resolutionRate > 40 ? 'var(--warning)' : 'var(--danger)'
                      }}
                    >
                      {zip.resolutionRate}% resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="stats-help">
        <p>💡 <strong>Moving to a new area?</strong> Check the zipcode to see how responsive the local municipality is to reported issues.</p>
      </div>
    </div>
  );
};

export default ZipcodeStats;
