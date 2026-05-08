import React, { useState } from 'react';

const GivePage = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !paymentMethod) {
      alert('Please fill in all fields.');
      return;
    }
    alert(`Processing ${paymentMethod} payment of ${amount}`);
  };

  return (
    <div className="give-page">
      <h1>Support Our Mission</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />

        <label htmlFor="payment-method">Payment Method:</label>
        <select
          id="payment-method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">Select Payment Method</option>
          <option value="MTN">MTN</option>
          <option value="Airtel">Airtel</option>
        </select>

        <button type="submit">Donate</button>
      </form>
    </div>
  );
};

export default GivePage;