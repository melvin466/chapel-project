import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../services/eventService';
import announcementService from '../services/announcementService';
import VerseOfDay from '../components/VerseOfDay';
import { getMediaUrl } from '../utils/media';
import '/HomePage.css';

const eventFallbackImage = 'https://photos.smugmug.com/2025/n-LrkspB/Makfest-25/Worship-Evening/i-GwB63b7/0/MSp79rm3QMPHDsvTsSHg4BdJFbpxvbHdN98xqXCJP/M/IMGW4103-M.jpg';
const announcementFallbackImage = 'https://photos.smugmug.com/2025/n-LrkspB/Makfest-25/Family-Sunday/i-VKbcgk3/0/Ld65MZ7DhzkHNX9hnhMJrK5mgzR9d3SC56KznZG5Z/M/IMGW5311-M.jpg';

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [loading, setLoading] = useState({ events: true, announcements: true });
  const [error, setError] = useState({ events: null, announcements: null });

  useEffect(() => {
    eventService.getEvents({ limit: 3 })
      .then((response) => {
        setEvents(response.data?.events || []);
        setTotalEvents(response.data?.pagination?.total || 0);
        setLoading((current) => ({ ...current, events: false }));
      })
      .catch(() => {
        setError((current) => ({ ...current, events: 'Failed to load events.' }));
        setLoading((current) => ({ ...current, events: false }));
      });

    announcementService.getAnnouncements({ limit: 3 })
      .then((response) => {
        setAnnouncements(response.data?.announcements || []);
        setTotalAnnouncements(response.data?.pagination?.total || 0);
        setLoading((current) => ({ ...current, announcements: false }));
      })
      .catch(() => {
        setError((current) => ({ ...current, announcements: 'Failed to load announcements.' }));
        setLoading((current) => ({ ...current, announcements: false }));
      });
  }, []);

  const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'Date to be announced';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: options.withYear ? 'numeric' : undefined,
    });
  };

  const getDay = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString(undefined, { day: '2-digit' });
  };

  const getMonth = (dateString) => {
    if (!dateString) return 'To be announced';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short' });
  };

  const excerpt = (text = '', length = 130) => {
    if (text.length <= length) return text;
    return `${text.slice(0, length).trim()}...`;
  };

  return (
    <div className="homepage">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="home-eyebrow">Chapel Community</span>
            <h1>Worship, community, and care in one living system.</h1>
            <p>
              Follow chapel events, read announcements, send prayer requests, book support, and give securely from one place.
            </p>
            <div className="home-hero-actions">
              <Link to="/events" className="home-button primary">View Events</Link>
              <Link to="/prayer" className="home-button">Request Prayer</Link>
            </div>
          </div>

          <div className="home-hero-panel">
            <span className="panel-label">Today at Chapel</span>
            <div className="panel-service">
              <strong>Weekday Mass</strong>
              <span>7:00 AM and 12:10 PM</span>
            </div>
            <div className="panel-service">
              <strong>Wednesday Fellowship</strong>
              <span>5:30 PM</span>
            </div>
            <div className="panel-stats">
              <div>
                <strong>{totalEvents}</strong>
                <span>Upcoming</span>
              </div>
              <div>
                <strong>{totalAnnouncements}</strong>
                <span>Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <VerseOfDay />

      <section className="home-actions-section">
        <div className="container home-action-grid">
          <Link to="/give" className="home-action-card">
            <span>Give</span>
            <strong>Support the mission</strong>
            <p>Use MTN or Airtel mobile money giving.</p>
          </Link>
          <Link to="/bookings" className="home-action-card">
            <span>Book</span>
            <strong>Request chapel support</strong>
            <p>Plan counselling, facility, or appointment requests.</p>
          </Link>
          <Link to="/cells" className="home-action-card">
            <span>Connect</span>
            <strong>Join a cell group</strong>
            <p>Find a smaller community for fellowship.</p>
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="home-section-heading">
            <div>
              <span className="home-eyebrow">Upcoming at Chapel</span>
              <h2>Upcoming Events</h2>
            </div>
            <Link to="/events">View all</Link>
          </div>

          {loading.events ? (
            <div className="home-events-grid skeleton-list" aria-busy="true">
              <span className="sr-only">Loading events...</span>
              {[1, 2, 3].map((item) => (
                <div key={item} className="home-event-card skeleton-card-block">
                  <div className="skeleton-date-block" />
                  <div>
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-line-mid" />
                  </div>
                </div>
              ))}
            </div>
          ) : error.events ? (
            <div className="home-state error">{error.events}</div>
          ) : events.length > 0 ? (
            <div className="home-events-grid">
              {events.map((event) => (
                <Link key={event._id} className="home-event-card" to={`/events/${event._id}`}>
                  <div className="home-event-image-container">
                    <img src={event.featuredImage ? getMediaUrl(event.featuredImage) : eventFallbackImage} alt="" loading="lazy" />
                    <div className="home-event-date-overlay">
                      <span>{getMonth(event.startDate)}</span>
                      <strong>{getDay(event.startDate)}</strong>
                    </div>
                  </div>
                  <div className="home-event-content">
                    <h3>{event.title}</h3>
                    <p className="home-muted">🕐 {formatDate(event.startDate, { withYear: true })} · {event.startTime || 'Time TBA'}</p>
                    <p>{excerpt(event.description)}</p>
                    <span className="home-meta">📍 Location: {event.location || 'TBA'}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-state">No upcoming events yet.</div>
          )}
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="container">
          <div className="home-section-heading">
            <div>
              <span className="home-eyebrow">Latest notices</span>
              <h2>Announcements</h2>
            </div>
            <Link to="/announcements">View all</Link>
          </div>

          {loading.announcements ? (
            <div className="home-announcement-list skeleton-list" aria-busy="true">
              <span className="sr-only">Loading announcements...</span>
              {[1, 2, 3].map((item) => (
                <div key={item} className="home-announcement-card skeleton-card-block">
                  <div>
                    <div className="skeleton-pill" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line" />
                  </div>
                  <div className="skeleton-line skeleton-line-short" />
                </div>
              ))}
            </div>
          ) : error.announcements ? (
            <div className="home-state error">{error.announcements}</div>
          ) : announcements.length > 0 ? (
            <div className="home-announcement-list">
              {announcements.map((announcement) => (
                <Link key={announcement._id} to={`/announcements/${announcement._id}`} className="home-announcement-card">
                  <div className="home-announcement-image">
                    <img src={announcement.featuredImage ? getMediaUrl(announcement.featuredImage) : announcementFallbackImage} alt="" loading="lazy" />
                  </div>
                  <div className="home-announcement-content">
                    <div>
                      <span className={`home-priority priority-${announcement.priority || 'medium'}`}>
                        {announcement.priority || 'medium'}
                      </span>
                      <h3>{announcement.title}</h3>
                      <p>{excerpt(announcement.summary || announcement.content, 150)}</p>
                    </div>
                    <span className="home-date">{formatDate(announcement.publishDate || announcement.createdAt, { withYear: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-state">No announcements available yet.</div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="container home-schedule-band">
          <div>
            <span className="home-eyebrow">Service rhythm</span>
            <h2>Gather through the week</h2>
          </div>
          <div className="home-schedule-list">
            <div><strong>Sunday</strong><span>8:00 AM, 10:00 AM, 5:00 PM</span></div>
            <div><strong>Weekdays</strong><span>7:00 AM, 12:10 PM</span></div>
            <div><strong>Wednesday</strong><span>5:30 PM fellowship</span></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
