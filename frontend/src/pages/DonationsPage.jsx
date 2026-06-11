import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import  donationService  from '../services/donationService';

const scriptureNotes = [
  {
    reference: '2 Corinthians 9:7',
    quote: 'God loves a cheerful giver.',
    note: 'Giving is worship before it is a transaction.',
  },
  {
    reference: 'Matthew 6:21',
    quote: 'Where your treasure is, there will your heart be also.',
    note: 'Generosity forms our attention, trust, and love.',
  },
  {
    reference: 'James 1:17',
    quote: 'Every good gift and every perfect gift is from above.',
    note: 'We give from gratitude for what God has first given.',
  },
];

const givingImpact = [
  {
    id: 'ministry',
    percent: '38%',
    title: 'Ministry and pastoral care',
    description: 'Supports counselling, prayer care, student ministry, chapel leaders, and weekly ministry needs.',
  },
  {
    id: 'worship',
    percent: '24%',
    title: 'Worship and gatherings',
    description: 'Helps sustain services, music, fellowship events, discipleship spaces, and chapel hospitality.',
  },
  {
    id: 'outreach',
    percent: '18%',
    title: 'Outreach and missions',
    description: 'Funds mission activity, benevolence, community support, and practical help for people in need.',
  },
  {
    id: 'operations',
    percent: '20%',
    title: 'Facilities and operations',
    description: 'Keeps chapel spaces, systems, payments, communications, and administration running responsibly.',
  },
];

const DonationsPage = () => {
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('tithe');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [provider, setProvider] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedImpactId, setSelectedImpactId] = useState(givingImpact[0].id);
  const [donationOptions, setDonationOptions] = useState([
    { id: 'tithe', name: 'Tithe' },
    { id: 'offering', name: 'Offering' },
    { id: 'pledge', name: 'Pledge' },
    { id: 'building', name: 'Building Fund' },
    { id: 'missions', name: 'Missions' },
    { id: 'benevolence', name: 'Benevolence' },
  ]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    donationService.getDonationOptions()
      .then(response => {
        setDonationOptions(response.data?.options || donationOptions);
      })
      .catch(error => {
        console.error('Error fetching donation options:', error);
      });
  }, []);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('OrderMerchantReference');
    if (reference) {
      setVerifying(true);

      const checkStatus = async () => {
        try {
          const res = await donationService.getDonationStatusPublic(reference);
          if (res.success && res.data) {
            setVerificationResult(res.data);
            if (res.data.status !== 'pending') {
              setVerifying(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error verifying donation:', error);
        }

        let retries = 0;
        const interval = setInterval(async () => {
          retries += 1;
          try {
            const res = await donationService.getDonationStatusPublic(reference);
            if (res.success && res.data) {
              setVerificationResult(res.data);
              if (res.data.status !== 'pending' || retries >= 5) {
                clearInterval(interval);
                setVerifying(false);
              }
            }
          } catch (error) {
            console.error('Error verifying donation:', error);
            clearInterval(interval);
            setVerifying(false);
          }
        }, 3000);
      };

      checkStatus();
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
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
          text: 'Redirecting to secure payment checkout...',
        });
        window.location.assign(paymentUrl);
        return;
      }

      setMessage({
        type: 'success',
        text: response?.message || 'Pesapal checkout created. Use the secure payment link to complete your donation.',
      });
      setAmount('');
      setPhoneNumber('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Donation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedImpact = givingImpact.find((item) => item.id === selectedImpactId) || givingImpact[0];

  return (
    <div className="container giving-page">
      <section className="giving-hero">
        <div>
          <span>Secure chapel giving</span>
          <h1>Give with clarity, purpose, and care.</h1>
          <p>
            Support worship, student ministry, outreach, chapel spaces, and pastoral care through secure Pesapal checkout.
          </p>
        </div>
        <aside>
          <strong>Pesapal ready</strong>
          <p>Enter your amount and phone number, then continue through Pesapal to choose the available payment method.</p>
        </aside>
      </section>

      <section className="giving-purpose-grid" aria-label="Giving purposes">
        {donationOptions.slice(0, 6).map((option) => (
          <button
            key={option.id}
            type="button"
            className={`giving-purpose-card ${donationType === option.id ? 'active' : ''}`}
            onClick={() => setDonationType(option.id)}
          >
            <span>{option.name}</span>
          </button>
        ))}
      </section>

      <section className="giving-scripture-section" aria-label="Scripture about giving">
        <div className="giving-section-heading">
          <span>Why we give</span>
          <h2>Generosity begins with worship.</h2>
          <p>These reminders shape the spirit of giving in the chapel community.</p>
        </div>
        <div className="giving-scripture-grid">
          {scriptureNotes.map((item) => (
            <article key={item.reference} className="giving-scripture-card">
              <span>{item.reference}</span>
              <blockquote>{item.quote}</blockquote>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="two-columns">
        {verifying || verificationResult ? (
          <div className="form-card status-card">
            {verifying ? (
              <div className="status-container verifying">
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
                <h2>Verifying Payment</h2>
                <p>We are communicating with Pesapal to confirm your transaction. This will take just a moment...</p>
              </div>
            ) : (
              <div className={`status-container result ${verificationResult.status}`}>
                {verificationResult.status === 'completed' ? (
                  <div className="success-flow">
                    <div className="status-icon success-icon">✓</div>
                    <h2>Donation Successful!</h2>
                    <blockquote className="scripture-quote">
                      "God loves a cheerful giver."
                      <span>— 2 Corinthians 9:7</span>
                    </blockquote>
                    <div className="receipt-details">
                      <div className="receipt-row">
                        <span>Amount Paid:</span>
                        <strong>UGX {verificationResult.amount?.toLocaleString()}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Purpose:</span>
                        <strong>{donationOptions.find(o => o.id === verificationResult.donationType)?.name || verificationResult.donationType}</strong>
                      </div>
                      {verificationResult.isAnonymous && (
                        <div className="anonymous-badge">Donated Anonymously</div>
                      )}
                    </div>
                    <p className="thank-you-msg">
                      Thank you for your generous support of the Chapel System ministry.
                    </p>
                    <button type="button" onClick={() => {
                      setVerificationResult(null);
                      setSearchParams({});
                    }} className="btn-primary reset-btn">Done</button>
                  </div>
                ) : (
                  <div className="error-flow">
                    <div className="status-icon error-icon">✗</div>
                    <h2>Donation {verificationResult.status === 'pending' ? 'Pending' : 'Failed'}</h2>
                    <p className="error-msg">
                      {verificationResult.status === 'pending'
                        ? 'Your payment is still processing. It will automatically update in your history once confirmed.'
                        : 'The payment was not completed. Please try again.'}
                    </p>
                    <button type="button" onClick={() => {
                      setVerificationResult(null);
                      setSearchParams({});
                    }} className="btn-primary reset-btn">Try Again</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="form-card">
            <div className="giving-form-heading">
              <span>Selected purpose</span>
              <h2>{donationOptions.find((option) => option.id === donationType)?.name || 'Make a Donation'}</h2>
              <p>All payments are recorded securely and can be reviewed by the chapel finance team.</p>
            </div>
            {message && (
              <div className={`form-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <input type="number" min="500" placeholder="Amount (UGX, min 500)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <select value={donationType} onChange={(e) => setDonationType(e.target.value)}>
                {donationOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              <div>
                <label htmlFor="paymentMethod">Payment method</label>
                <input id="paymentMethod" type="text" value="Pesapal checkout" disabled className="readonly-input" />
              </div>
              <div>
                <label htmlFor="provider">Preferred mobile wallet</label>
                <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Airtel">Airtel Money</option>
                </select>
              </div>
              <div>
                <label htmlFor="phoneNumber">Payment phone number</label>
                <input id="phoneNumber" type="tel" placeholder="256700000000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              </div>
              <label className="checkbox-label"><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Donate Anonymously</label>
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Processing...' : 'Give Now'}</button>
            </form>
          </div>
        )}

        <div className="info-card">
          <span className="info-kicker">Giving guide</span>
          <h3>Where your support goes</h3>
          <div className="giving-info-list">
            <div>
              <strong>Ministry care</strong>
              <p>Counselling, prayer support, outreach, and student care.</p>
            </div>
            <div>
              <strong>Worship life</strong>
              <p>Services, music, gatherings, and chapel operations.</p>
            </div>
            <div>
              <strong>Community needs</strong>
              <p>Benevolence, missions, and practical help where needed.</p>
            </div>
          </div>
          <h4>Bank Details</h4>
          <p>Bank: Stanbic Bank<br />Account: 1234567890<br />Name: Chapel System</p>
          <h4>Pesapal Checkout</h4>
          <p>Pesapal will present the available mobile money and card options configured for the chapel merchant account.</p>
        </div>
      </div>

      <section className="giving-impact-section" aria-label="Where giving goes">
        <div className="giving-section-heading">
          <span>Where it goes</span>
          <h2>Transparent support for chapel life.</h2>
          <p>Tap a category to see how gifts help the ministry serve people.</p>
        </div>
        <div className="giving-impact-layout">
          <div className="giving-impact-ring" aria-hidden="true">
            <strong>{selectedImpact.percent}</strong>
            <span>{selectedImpact.title}</span>
          </div>
          <div className="giving-impact-list">
            {givingImpact.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`giving-impact-item ${selectedImpactId === item.id ? 'active' : ''}`}
                onClick={() => setSelectedImpactId(item.id)}
              >
                <strong>{item.percent}</strong>
                <span>{item.title}</span>
              </button>
            ))}
          </div>
          <article className="giving-impact-detail">
            <span>{selectedImpact.percent}</span>
            <h3>{selectedImpact.title}</h3>
            <p>{selectedImpact.description}</p>
          </article>
        </div>
      </section>

      <section className="giving-belief-band">
        <div>
          <span>What we believe</span>
          <h2>Giving is trust practiced in public and private.</h2>
          <p>
            Tithes, offerings, and mission gifts help the chapel care for people, gather for worship,
            and respond generously when needs arise.
          </p>
        </div>
        <div className="giving-question-card">
          <strong>Still have questions?</strong>
          <p>Giving can be personal. Contact the chapel office for guidance, records, or payment support.</p>
          <a href="mailto:managementchapel98@gmail.com">managementchapel98@gmail.com</a>
        </div>
      </section>
    </div>
  );
};

export default DonationsPage;

