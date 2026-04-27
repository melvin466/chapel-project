import React, { useState, useEffect } from 'react';
import { donationService } from '../services/donationService';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DonationsPage = () => {
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('tithe');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const [donationOptions, setDonationOptions] = useState([]);

  useEffect(() => {
    axios.get('/api/donation-options')
      .then(response => {
        setDonationOptions(response.data);
      })
      .catch(error => {
        console.error('Error fetching donation options:', error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to make a donation');
      return;
    }
    setSubmitting(true);
    try {
      await donationService.createDonation({ amount: parseInt(amount), donationType, paymentMethod, isAnonymous });
      alert('Thank you for your donation!');
      setAmount('');
    } catch (error) {
      alert(error.response?.data?.message || 'Donation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Give Online</h1>
      
      <div className="two-columns">
        <div className="form-card">
          <h2>Make a Donation</h2>
          <form onSubmit={handleSubmit}>
            <input type="number" placeholder="Amount (UGX)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <select value={donationType} onChange={(e) => setDonationType(e.target.value)}>
              {donationOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="mobile_money">Mobile Money</option><option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option>
            </select>
            <label><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Donate Anonymously</label>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Processing...' : 'Give Now'}</button>
          </form>
        </div>
        
        <div className="info-card">
          <h3>Why Give?</h3>
          <p>Your giving supports our ministry and helps us serve the community.</p>
          <h4>Bank Details</h4>
          <p>Bank: Stanbic Bank<br />Account: 1234567890<br />Name: St. Francis Chapel</p>
          <h4>Mobile Money</h4>
          <p>MTN: +256 700 000000<br />Airtel: +256 701 000000</p>
        </div>
      </div>
    </div>
  );
};

export default DonationsPage;