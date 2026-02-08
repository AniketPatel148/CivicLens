function Dashboard({ reports, allReports = [], locationName, onNewReport, onViewReport, onViewStats }) {
  const issueIcons = {
    pothole: '🕳️',
    trash: '🗑️',
    graffiti: '🎨',
    streetlight: '💡',
    other: '❓'
  };

  const statusLabels = {
    pending: 'Pending',
    acknowledged: 'Acknowledged',
    in_progress: 'In Progress',
    resolved: 'Resolved'
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group by status for stats
  const stats = {
    nearby: reports.length,
    citywide: allReports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress' || r.status === 'acknowledged').length
  };

  return (
    <div className="dashboard">
      {/* Location header */}
      {locationName && (
        <div className="location-header">
          <span className="location-icon">📍</span>
          <div className="location-info">
            <span className="location-name">{locationName}</span>
            <span className="location-radius">Issues within 10km</span>
          </div>
        </div>
      )}

      <div className="dashboard-actions">
        <button className="new-report-btn" onClick={onNewReport}>
          <span className="btn-icon">📷</span>
          Report New Issue
        </button>
        <button className="stats-btn" onClick={onViewStats}>
          <span className="btn-icon">📊</span>
          View Stats
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card highlight">
          <span className="stat-value">{stats.nearby}</span>
          <span className="stat-label">Near You</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.citywide}</span>
          <span className="stat-label">City-wide</span>
        </div>
      </div>

      <h2 className="section-title">
        {reports.length > 0 ? `Issues Near You` : 'Recent Reports'}
      </h2>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <p>No issues near you!</p>
            <p className="empty-subtext">Your neighborhood looks great. Spot something? Report it!</p>
          </div>
        ) : (
          reports.slice(0, 10).map(report => (
            <div 
              key={report._id} 
              className="report-card"
              onClick={() => onViewReport(report._id)}
            >
              <div className="report-card-header">
                <span className={`issue-badge small ${report.issueType}`}>
                  {issueIcons[report.issueType]} {report.issueType}
                </span>
                <span className={`status-badge ${report.status}`}>
                  {statusLabels[report.status]}
                </span>
              </div>
              <p className="report-summary">{report.summary?.slice(0, 80)}...</p>
              <div className="report-card-footer">
                <span className="severity-indicator" data-level={report.severity}>
                  Severity: {report.severity}/5
                </span>
                <span className="report-time">{formatDate(report.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
