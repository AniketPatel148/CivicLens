function ResultCard({ report }) {
  if (!report) return null;

  const {
    issueType,
    confidence,
    summary,
    severity,
    department,
    reason,
    classificationFailed,
    enrichmentFailed
  } = report;

  const formatDepartment = (dept) => {
    return dept?.replace(/_/g, ' ') || 'General';
  };

  const issueIcons = {
    pothole: '🕳️',
    trash: '🗑️',
    graffiti: '🎨',
    streetlight: '💡',
    other: '❓'
  };

  return (
    <div className="result-card">
      {(classificationFailed || enrichmentFailed) && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          color: '#fcd34d'
        }}>
          ⚠️ Partial analysis — some AI features unavailable
        </div>
      )}

      <div className="result-header">
        <span className={`issue-badge ${issueType}`}>
          {issueIcons[issueType] || '📋'} {issueType}
        </span>
        {confidence > 0 && (
          <span className="confidence">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      <p className="summary-text">{summary}</p>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Severity Level
        </p>
        <div className="severity-bar">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`severity-segment ${level <= severity ? 'active' : ''} level-${severity}`}
            />
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {severity === 1 && 'Minor — cosmetic issue'}
          {severity === 2 && 'Low — nuisance, not urgent'}
          {severity === 3 && 'Medium — address within a week'}
          {severity === 4 && 'High — potential safety hazard'}
          {severity === 5 && 'Critical — immediate danger'}
        </p>
      </div>

      <div className="department-route">
        <p className="department-label">Routed to</p>
        <p className="department-name">{formatDepartment(department)}</p>
        {reason && (
          <p className="department-reason">{reason}</p>
        )}
      </div>
    </div>
  );
}

export default ResultCard;
