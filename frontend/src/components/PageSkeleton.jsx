import React from 'react';

const PageSkeleton = ({ variant = 'public' }) => (
  <div className={`skeleton-page skeleton-page-${variant}`} aria-label="Loading page">
    <div className="skeleton-shell">
      <div className="skeleton-line skeleton-line-short" />
      <div className="skeleton-line skeleton-line-title" />
      <div className="skeleton-line" />
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </div>
  </div>
);

export default PageSkeleton;

