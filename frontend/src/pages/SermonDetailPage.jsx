import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import sermonService from '../services/sermonService';
import { useAuth } from '../context/AuthContext';
import { getEmbeddableVideoUrl, getMediaUrl } from '../utils/media';

const SermonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSermon();
  }, [id]);

  const loadSermon = async () => {
    try {
      setLoading(true);
      const response = await sermonService.getSermonById(id);
      setSermon(response.data.sermon);
      setError(null);
    } catch (loadError) {
      setError('Failed to load sermon');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await sermonService.likeSermon(id);
      setMessage(response.liked ? 'Sermon liked.' : 'Sermon like removed.');
      setError(null);
      loadSermon();
    } catch (likeError) {
      setError('Failed to like sermon');
    }
  };

  if (loading) return <div className="loading">Loading sermon...</div>;
  if (error && !sermon) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadSermon} className="btn-primary">Retry</button>
      </div>
    );
  }
  if (!sermon) {
    return (
      <div className="container">
        <p className="member-empty">Sermon not found.</p>
        <button onClick={() => navigate('/sermons')} className="btn-secondary">Back</button>
      </div>
    );
  }

  const audioSrc = getMediaUrl(sermon.audioUrl);
  const videoSrc = getMediaUrl(sermon.videoUrl);
  const embedVideoSrc = getEmbeddableVideoUrl(sermon.videoUrl);
  const posterName = sermon.createdBy
    ? `${sermon.createdBy.firstName || ''} ${sermon.createdBy.lastName || ''}`.trim()
    : sermon.speaker;

  return (
    <div className="container sermon-detail-page">
      <button onClick={() => navigate('/sermons')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
        Back to Sermons
      </button>

      <article className="sermon-detail">
        <section className="sermon-detail-hero" style={{
          backgroundImage: `linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.52), rgba(10,16,21,0.86)), url(${sermon.thumbnail ? getMediaUrl(sermon.thumbnail) : 'https://images.pexels.com/photos/8468474/pexels-photo-8468474.jpeg?auto=compress&cs=tinysrgb&w=1600'})`
        }}>
          <div>
            <span>{sermon.series || sermon.serviceType || 'Chapel message'}</span>
            <h1>{sermon.title}</h1>
            <p>{sermon.description}</p>
          </div>
          <aside>
            <strong>{posterName || 'Chapel Team'}</strong>
            <span>{new Date(sermon.date).toLocaleDateString()}</span>
            {sermon.duration && <span>{sermon.duration} minutes</span>}
          </aside>
        </section>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="sermon-meta">
          <p><strong>Posted by:</strong> {posterName}{sermon.createdBy?.role ? ` (${sermon.createdBy.role})` : ''}</p>
          <p><strong>Speaker:</strong> {sermon.speaker}</p>
          <p><strong>Date:</strong> {new Date(sermon.date).toLocaleDateString()}</p>
          {sermon.duration && <p><strong>Duration:</strong> {sermon.duration} minutes</p>}
        </div>

        {sermon.bibleVerses && sermon.bibleVerses.length > 0 && (
          <div className="sermon-verses">
            <h3>Bible Verses</h3>
            {sermon.bibleVerses.map((verse) => <p key={verse}>{verse}</p>)}
          </div>
        )}

        {sermon.audioUrl && (
          <div className="sermon-audio">
            <h3>Audio</h3>
            <audio controls preload="metadata" src={audioSrc} style={{ width: '100%' }}>
              <a href={audioSrc}>Open audio</a>
            </audio>
            <a className="media-open-link" href={audioSrc} target="_blank" rel="noreferrer">Open audio file</a>
          </div>
        )}

        {sermon.videoUrl && (
          <div className="sermon-video">
            <h3>Video</h3>
            {embedVideoSrc ? (
              <iframe
                src={embedVideoSrc}
                title={sermon.title}
                width="100%"
                height="430"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <>
                <video controls preload="metadata" src={videoSrc} style={{ width: '100%', maxHeight: '520px' }}>
                  <a href={videoSrc}>Open video</a>
                </video>
                <a className="media-open-link" href={videoSrc} target="_blank" rel="noreferrer">Open video file</a>
              </>
            )}
          </div>
        )}

        <button onClick={handleLike} className="btn-primary">
          {sermon.likes?.length || 0} Likes
        </button>
      </article>

      <style>{`
        .sermon-detail-page { padding-bottom: 3rem; }
        .sermon-detail {
          background: var(--glass-panel);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1.2rem;
          margin: 1rem 0;
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
        }
        .sermon-detail-hero {
          min-height: 300px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 1rem;
          align-items: end;
          margin-bottom: 1rem;
          padding: 1.3rem;
          border-radius: 8px;
          color: white;
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }
        .sermon-detail-hero span {
          display: inline-block;
          color: var(--brand-soft);
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.45rem;
        }
        .sermon-detail-hero h1 {
          max-width: 760px;
          color: white;
          font-size: clamp(2.1rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 0.8rem;
        }
        .sermon-detail-hero p {
          max-width: 720px;
          color: rgba(255,255,255,0.78);
        }
        .sermon-detail-hero aside {
          display: grid;
          gap: 0.35rem;
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(18px);
        }
        .sermon-detail-hero aside strong {
          color: white;
          font-size: 1.05rem;
        }
        .sermon-meta,
        .sermon-verses,
        .sermon-audio,
        .sermon-video {
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.14);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .sermon-meta p { color: rgba(255,255,255,0.76); margin-bottom: 0.5rem; }
        .sermon-verses h3, .sermon-audio h3, .sermon-video h3 { color: white; margin: 0 0 0.5rem; }
        .sermon-verses p { color: rgba(255,255,255,0.76); line-height: 1.6; }
        .sermon-video iframe,
        .sermon-video video {
          border: 0;
          border-radius: 8px;
          overflow: hidden;
          background: #05080a;
        }
        .media-open-link { display: inline-block; margin-top: 0.45rem; color: #9bd8aa; font-weight: 700; text-decoration: none; }
        @media (max-width: 760px) {
          .sermon-detail-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default SermonDetailPage;
