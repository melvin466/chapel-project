import React, { useEffect, useState } from 'react';
import "../App.css";
import api from '../services/api';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings');
        setBookings(response.data.data.bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="bookings-page">
      <h1>Bookings</h1>
      <div className="bookings-list">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="booking-item">
              <h2>{booking.title}</h2>
              <p>{booking.description}</p>
              <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p>No bookings available.</p>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;