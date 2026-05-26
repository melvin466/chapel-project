import React from 'react';
import { getVerseOfDay } from '../utils/verseOfDay';

const VerseOfDay = () => {
  const verse = getVerseOfDay();

  return (
    <section className="home-section verse-section">
      <div className="container verse-card">
        <div>
          <span className="home-eyebrow">Verse of the day</span>
          <h2>{verse.reference}</h2>
        </div>
        <p>{verse.text}</p>
      </div>
    </section>
  );
};

export default VerseOfDay;
