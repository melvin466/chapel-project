import React, { useState, useEffect } from 'react';
import  donationService  from '../services/donationService';
import { useAuth } from '../context/AuthContext';

const DonationsPage = () => {
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('tithe');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [provider, setProvider] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const { isAuthenticated } = useAuth();
  const [donationOptions, setDonationOptions] = useState([
    { id: 'tithe', name: 'Tithe' },
    { id: 'offering', name: 'Offering' },
    { id: 'pledge', name: 'Pledge' },
    { id: 'building', name: 'Building Fund' },
    { id: 'missions', name: 'Missions' },
    { id: 'benevolence', name: 'Benevolence' },
  ]);

  useEffect(() => {
    donationService.getDonationOptions()
      .then(response => {
        setDonationOptions(response.data?.options || donationOptions);
      })
      .catch(error => {
        console.error('Error fetching donation options:', error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Please log in to make a donation.' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await donationService.createDonation({
        amount: parseInt(amount, 10),
        donationType,
        paymentMethod,
        provider,
        phoneNumber,
        isAnonymous
      });

      const paymentUrl = response?.data?.paymentUrl;
      if (paymentUrl) {
        setMessage({
          type: 'success',
          text: 'Redirecting to Pesapal for MTN/Airtel mobile money payment...',
        });
        window.location.assign(paymentUrl);
        return;
      }

      setMessage({
        type: 'success',
        text: 'Donation saved. Check your phone to complete the payment.',
      });
      setAmount('');
      setPhoneNumber('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Donation failed.' });
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
          {message && (
            <div className={`form-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <input type="number" placeholder="Amount (UGX)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <select value={donationType} onChange={(e) => setDonationType(e.target.value)}>
              {donationOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <div>
              <label htmlFor="paymentMethod">Payment method</label>
              <input id="paymentMethod" type="text" value="Mobile Money" disabled className="readonly-input" />
            </div>
            <div>
              <label htmlFor="provider">Operator</label>
              <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="MTN">MTN Mobile Money</option>
                <option value="Airtel">Airtel Money</option>
              </select>
            </div>
            <div>
              <label htmlFor="phoneNumber">Mobile money phone number</label>
              <input id="phoneNumber" type="tel" placeholder="256700000000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
            <label className="checkbox-label"><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Donate Anonymously</label>
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

