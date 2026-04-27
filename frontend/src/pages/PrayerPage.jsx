import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PrayerPage = () => {
  const [prayerRequests, setPrayerRequests] = useState([]);

  useEffect(() => {
    axios.get('/api/prayer-requests')
      .then(response => {
        setPrayerRequests(response.data);
      })
      .catch(error => {
        console.error('Error fetching prayer requests:', error);
      });
  }, []);

  return (
    <div>
      <h1>Prayer Requests</h1>
      {prayerRequests.map(request => (
        <div key={request.id}>
          <h2>{request.title}</h2>
          <p>{request.description}</p>
        </div>
      ))}
    </div>
  );
};

export default PrayerPage;