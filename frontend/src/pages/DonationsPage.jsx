import React, { useState, useEffect } from 'react';
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

      if (response?.data?.donation?.status === 'pending' && provider === 'MTN' && paymentMethod === 'mobile_money') {
        setMessage({
          type: 'success',
          text: (
            <div className="momo-instructions-success">
              <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.4rem' }}>🎉 Donation Recorded! Complete Your Payment:</strong>
              <ol style={{ margin: '0.5rem 0', paddingLeft: '1.2rem', textAlign: 'left', lineHeight: '1.6' }}>
                <li>Dial <strong style={{ color: 'white' }}>*165*3#</strong> on your MTN phone.</li>
                <li>Enter Merchant Code: <strong style={{ color: 'white' }}>04074416</strong>.</li>
                <li>Enter Amount: <strong style={{ color: 'white' }}>UGX {parseInt(amount, 10).toLocaleString()}</strong>.</li>
                <li>Enter your MoMo PIN to authorize.</li>
              </ol>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.86rem', color: '#b9f5cf', lineHeight: '1.4' }}>
                * Please ensure you pay using the same phone number (<strong style={{ color: 'white' }}>{phoneNumber}</strong>) you entered above. Your payment will be verified and matched automatically!
              </p>
            </div>
          )
        });
      } else {
        setMessage({
          type: 'success',
          text: response?.message || 'Mobile money prompt sent. Check your phone to approve the payment.',
        });
      }
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
            Support worship, student ministry, outreach, chapel spaces, and pastoral care through a simple mobile money flow.
          </p>
        </div>
        <aside>
          <strong>Mobile money ready</strong>
          <p>Enter your amount and phone number, then approve the prompt from MTN or Airtel on your phone.</p>
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
          <p>Bank: Stanbic Bank<br />Account: 1234567890<br />Name: St. Francis Chapel</p>
          <h4>Mobile Money</h4>
          <p>MTN: +256 700 000000<br />Airtel: +256 701 000000</p>
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
          <a href="mailto:chapel@example.org">chapel@example.org</a>
        </div>
      </section>
    </div>
  );
};

export default DonationsPage;

