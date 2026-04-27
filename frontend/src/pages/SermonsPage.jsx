import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SermonsPage = () => {
  const [sermons, setSermons] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/sermons')
      .then(response => {
        setSermons(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching sermons:', error);
        setError('Failed to load sermons.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="sermons-page">
      <h1>Recent Sermons</h1>
      {loading && <p>Loading sermons...</p>}
      {error && <p className="error-message">{error}</p>}
      {sermons.length > 0 ? (
        sermons.map(sermon => (
          <div key={sermon.id} className="sermon-item">
            <h2>{sermon.title}</h2>
            <p>{sermon.date}</p>
            <p>{sermon.description}</p>
          </div>
        ))
      ) : (
        !loading && <p>No sermons available at the moment.</p>
      )}
    </div>
  );
};

export default SermonsPage;