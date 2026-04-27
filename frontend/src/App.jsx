import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrayerPage from './pages/PrayerPage';
import DonationsPage from './pages/DonationsPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/prayer" element={<PrayerPage />} />
              <Route path="/donations" element={<DonationsPage />} />
              <Route path="/announcements" element={<div className="container"><h1>Announcements</h1><p>Coming soon...</p></div>} />
              <Route path="/sermons" element={<div className="container"><h1>Sermons</h1><p>Coming soon...</p></div>} />
              <Route path="/cells" element={<div className="container"><h1>Cells</h1><p>Coming soon...</p></div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;