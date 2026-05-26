import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sermonService from '../services/sermonService';

const SermonsPage = () => {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      const response = await sermonService.getSermons();
      setSermons(response.data?.sermons || []);
    } catch (error) {
      console.error('Error loading sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPosterName = (sermon) => (
    sermon.createdBy
      ? `${sermon.createdBy.firstName || ''} ${sermon.createdBy.lastName || ''}`.trim()
      : sermon.speaker
  );

  if (loading) return <div className="loading">Loading sermons...</div>;

  return (
    <div className="container">
      <section className="sermons-hero">
        <div>
          <span>Listen again</span>
          <h1>Sermons</h1>
          <p>
            Revisit Sunday teaching, chapel reflections, and messages that help faith become steady,
            thoughtful, and lived out during the week. Each message is kept here as a growing library
            for personal devotion, study groups, and anyone who wants to return to the Word after a service.
          </p>
        </div>
        <aside>
          <strong>For your quiet time</strong>
          <p>Open a sermon to listen, watch, reflect with scripture, and carry the teaching into prayer or cell discussion.</p>
        </aside>
      </section>

      <section className="sermons-intro">
        <div>
          <span>Grow in the Word</span>
          <h2>Teaching for the week, not only for the service.</h2>
          <p>
            Use this space to revisit chapel messages at your own pace. Sermons may include audio,
            video, Bible references, and study notes so you can listen again, share with a friend,
            or prepare for deeper conversations in fellowship.
          </p>
        </div>
        <div className="sermons-intro-points">
          <div><strong>Listen</strong><span>Catch up on messages you missed or replay what spoke to you.</span></div>
          <div><strong>Reflect</strong><span>Return to the scriptures and themes connected to each message.</span></div>
          <div><strong>Share</strong><span>Use sermons as a starting point for cell group discussion and prayer.</span></div>
        </div>
      </section>

      {sermons.length === 0 ? (
        <div className="no-data rich-empty">
          <strong>No sermons have been posted yet.</strong>
          <span>Audio and video messages will appear here once the chapel team uploads them.</span>
        </div>
      ) : (
        <div className="sermons-grid">
          {sermons.map((sermon) => (
            <div key={sermon._id} className="sermon-card" onClick={() => navigate(`/sermons/${sermon._id}`)}>
              <div className="sermon-icon">Audio</div>
              <div className="sermon-content">
                <h3>{sermon.title}</h3>
                <p className="sermon-speaker">
                  {getPosterName(sermon)}
                  {sermon.createdBy?.role && <span>{sermon.createdBy.role}</span>}
                </p>
                <p className="sermon-date">{new Date(sermon.date).toLocaleDateString()}</p>
                <p className="sermon-description">{sermon.description?.substring(0, 100)}...</p>
                <div className="sermon-stats">
                  <span>{sermon.views || 0} views</span>
                  <span>{sermon.likes?.length || 0} likes</span>
                </div>
                <button className="btn-secondary">Listen Now</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .sermons-hero {
          min-height: 330px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 1.2rem;
          align-items: end;
          margin: 1rem 0 1.4rem;
          padding: 1.5rem;
          border-radius: 8px;
          overflow: hidden;
          color: white;
          background:
            linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.55), rgba(10,16,21,0.86)),
            url('https://images.pexels.com/photos/8468474/pexels-photo-8468474.jpeg?auto=compress&cs=tinysrgb&w=1600');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.24);
        }
        .sermons-hero span {
          display: inline-block;
          color: #9bd8aa;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .sermons-hero h1 {
          font-size: clamp(2.1rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 0.8rem;
        }
        .sermons-hero p {
          max-width: 720px;
          color: rgba(255,255,255,0.78);
        }
        .sermons-hero aside {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(18px);
        }
        .sermons-hero aside strong {
          display: block;
          color: white;
          margin-bottom: 0.35rem;
        }
        .sermons-intro {
          max-width: 1040px;
          margin: 0 auto 1.5rem;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
          gap: 1rem;
          align-items: stretch;
        }
        .sermons-intro > div {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 8px;
          padding: 1.2rem;
          color: white;
          backdrop-filter: blur(18px);
        }
        .sermons-intro span {
          display: inline-block;
          color: #9bd8aa;
          font-size: 0.76rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .sermons-intro h2 {
          font-size: 1.65rem;
          line-height: 1.15;
          margin-bottom: 0.7rem;
          color: white;
        }
        .sermons-intro p,
        .sermons-intro-points div span {
          color: rgba(255,255,255,0.76);
          line-height: 1.6;
        }
        .sermons-intro-points {
          display: grid;
          gap: 0.65rem;
        }
        .sermons-intro-points div {
          display: grid;
          gap: 0.25rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
        }
        .sermons-intro-points strong {
          color: white;
        }
        .sermons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 320px)); justify-content: center; gap: 1rem; margin: 2rem auto 0; max-width: 1040px; }
        .sermon-card { background: rgba(255,255,255,0.95); border-radius: 8px; padding: 1rem; transition: transform 0.3s; cursor: pointer; display: grid; grid-template-columns: 54px 1fr; gap: 0.85rem; align-items: start; min-height: 220px; }
        .sermon-card:hover { transform: translateY(-5px); }
        .sermon-icon { min-height: 44px; display: grid; place-items: center; border-radius: 8px; background: rgba(47,125,70,0.22); color: #9bd8aa; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; line-height: 1; }
        .sermon-content { flex: 1; }
        .sermon-content h3 { color: #333; margin-bottom: 0.5rem; font-size: 1.05rem; line-height: 1.25; }
        .sermon-speaker, .sermon-date { color: #666; font-size: 0.85rem; margin-bottom: 0.25rem; }
        .sermon-speaker span { display: inline-block; margin-left: 0.45rem; padding: 0.12rem 0.42rem; border-radius: 999px; background: rgba(47,125,70,0.12); color: #2f7d46; text-transform: capitalize; font-size: 0.72rem; font-weight: 700; }
        .sermon-description { color: #888; margin: 0.5rem 0; font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .sermon-stats { display: flex; gap: 1rem; margin: 0.5rem 0; color: #999; font-size: 0.8rem; }
        .sermon-card .btn-secondary { margin-top: auto; }
        .rich-empty {
          display: grid;
          gap: 0.35rem;
        }
        .rich-empty strong {
          color: white;
          font-size: 1.2rem;
        }
        .rich-empty span {
          color: rgba(255,255,255,0.72);
        }
        @media (max-width: 760px) { .sermons-hero, .sermons-intro { grid-template-columns: 1fr; min-height: auto; } }
        @media (max-width: 560px) { .sermon-card { grid-template-columns: 1fr; text-align: left; } }
      `}</style>
    </div>
  );
};

export default SermonsPage;
