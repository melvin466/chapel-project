const { parseUgandaSms } = require('../utils/smsParser');

describe('parseUgandaSms', () => {
  it('correctly parses MTN MoMo received message with a fee charged', () => {
    const text = 'Yello. You have received Shs 2,998 from JOHN DOE (256771234567) on 2026-06-07 10:00:00. Fee charged: Shs 2. Balance: Shs 50,000. Ref: 1234567890.';
    const result = parseUgandaSms(text);

    expect(result).toEqual({
      amount: 3000, // Reconstructed (2998 + 2)
      phoneNumber: '256771234567',
      reference: '1234567890'
    });
  });

  it('correctly parses Airtel Money received message with a transaction fee', () => {
    const text = 'You have received Shs 4,950 from MARY SMITH (256701234567). Transaction fee: Shs 50. Balance: Shs 25,000. Ref: 9876543210.';
    const result = parseUgandaSms(text);

    expect(result).toEqual({
      amount: 5000, // Reconstructed (4950 + 50)
      phoneNumber: '256701234567',
      reference: '9876543210'
    });
  });

  it('correctly parses received message when no fee is charged', () => {
    const text = 'Yello. You have received Shs 3,000 from JOHN DOE (0772000000) on 2026-06-07. Fee charged: Shs 0. Ref: 111111';
    const result = parseUgandaSms(text);

    expect(result).toEqual({
      amount: 3000,
      phoneNumber: '256772000000',
      reference: '111111'
    });
  });

  it('returns null if text is invalid or empty', () => {
    expect(parseUgandaSms('')).toBeNull();
    expect(parseUgandaSms(null)).toBeNull();
  });
});
