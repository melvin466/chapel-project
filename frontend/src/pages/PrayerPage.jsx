import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PrayerPage = () => {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/prayer-requests')
      .then(response => {
        setPrayerRequests(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching prayer requests:', error);
        setError('Failed to load prayer requests.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="prayer-page">
      <h1>Prayer Requests</h1>
      {loading && <p>Loading prayer requests...</p>}
      {error && <p className="error-message">{error}</p>}
      {prayerRequests.length > 0 ? (
        prayerRequests.map(request => (
          <div key={request.id} className="prayer-item">
            <h2>{request.title}</h2>
            <p>{request.description}</p>
          </div>
        ))
      ) : (
        !loading && <p>No prayer requests available at the moment.</p>
      )}
    </div>
  );
};

export default PrayerPage;