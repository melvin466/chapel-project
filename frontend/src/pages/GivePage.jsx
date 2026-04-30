import React from 'react';

const GivePage = () => {
  return (
    <div className="give-page">
      <h1>Give</h1>
      <p>Support our mission by giving generously.</p>
      <form>
        <label htmlFor="amount">Amount:</label>
        <input type="number" id="amount" name="amount" placeholder="Enter amount" />
        <button type="submit">Donate</button>
      </form>
    </div>
  );
};

export default GivePage;