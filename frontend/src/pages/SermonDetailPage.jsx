import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import  sermonService  from '../services/sermonService';
import { useAuth } from '../context/AuthContext';
import { getEmbeddableVideoUrl, getMediaUrl } from '../utils/media';

const SermonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [liked, setLiked] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadSermon();
  }, [id]);

  const loadSermon = async () => {
    try {
      setLoading(true);
      const response = await sermonService.getSermonById(id);
      setSermon(response.data.sermon);
    } catch (error) {
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
      setLiked(response.liked);
      setMessage(response.liked ? 'Sermon liked.' : 'Sermon like removed.');
      setError(null);
      loadSermon();
    } catch (error) {
      setError('Failed to like sermon');
    }
  };

  if (loading) return <div className="loading">Loading sermon...</div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={loadSermon} className="btn-primary">Retry</button></div>;
  if (!sermon) return <div className="container"><p>Sermon not found</p><button onClick={() => navigate('/sermons')} className="btn-secondary">Back</button></div>;

  const audioSrc = getMediaUrl(sermon.audioUrl);
  const videoSrc = getMediaUrl(sermon.videoUrl);
  const embedVideoSrc = getEmbeddableVideoUrl(sermon.videoUrl);

  return (
    <div className="container">
      <button onClick={() => navigate('/sermons')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Back to Sermons
      </button>
      
      <div className="sermon-detail">
        <h1>{sermon.title}</h1>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="sermon-meta">
          <p>🎙️ <strong>Speaker:</strong> {sermon.speaker}</p>
          <p>📅 <strong>Date:</strong> {new Date(sermon.date).toLocaleDateString()}</p>
          {sermon.duration && <p>⏱️ <strong>Duration:</strong> {sermon.duration} minutes</p>}
        </div>
        
        <div className="sermon-description">
          <h3>About this Sermon</h3>
          <p>{sermon.description}</p>
        </div>
        
        {sermon.bibleVerses && sermon.bibleVerses.length > 0 && (
          <div className="sermon-verses">
            <h3>Bible Verses</h3>
            {sermon.bibleVerses.map((verse, i) => <p key={i}>📖 {verse}</p>)}
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
                height="400"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <>
                <video controls preload="metadata" src={videoSrc} style={{ width: '100%', maxHeight: '480px' }}>
                  <a href={videoSrc}>Open video</a>
                </video>
                <a className="media-open-link" href={videoSrc} target="_blank" rel="noreferrer">Open video file</a>
              </>
            )}
          </div>
        )}
        
        <button onClick={handleLike} className="btn-primary">
          ❤️ {sermon.likes?.length || 0} Likes
        </button>
      </div>

      <style>{`
        .sermon-detail { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 2rem; margin: 1rem 0; }
        .sermon-detail h1 { color: #333; margin-bottom: 1rem; }
        .sermon-meta { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .sermon-meta p { color: #666; margin-bottom: 0.5rem; }
        .sermon-description h3, .sermon-verses h3, .sermon-audio h3, .sermon-video h3 { color: #333; margin: 1rem 0 0.5rem; }
        .sermon-description p, .sermon-verses p { color: #666; line-height: 1.6; }
        .media-open-link { display: inline-block; margin-top: 0.45rem; color: #9bd8aa; font-weight: 700; text-decoration: none; }
      `}</style>
    </div>
  );
};

export default SermonDetailPage;
