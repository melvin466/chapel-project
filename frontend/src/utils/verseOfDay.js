const verses = [
  {
    reference: 'Psalm 118:24',
    text: 'This is the day that Yahweh has made. We will rejoice and be glad in it.',
  },
  {
    reference: 'Proverbs 3:5-6',
    text: 'Trust in Yahweh with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
  },
  {
    reference: 'Isaiah 40:31',
    text: 'Those who wait for Yahweh will renew their strength. They will mount up with wings like eagles.',
  },
  {
    reference: 'Matthew 5:16',
    text: 'Even so, let your light shine before men, that they may see your good works and glorify your Father who is in heaven.',
  },
  {
    reference: 'John 14:27',
    text: 'Peace I leave with you. My peace I give to you; not as the world gives, I give to you.',
  },
  {
    reference: 'Romans 12:12',
    text: 'Rejoicing in hope, enduring in troubles, continuing steadfastly in prayer.',
  },
  {
    reference: 'Philippians 4:6-7',
    text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.',
  },
  {
    reference: 'Colossians 3:23',
    text: 'And whatever you do, work heartily, as for the Lord and not for men.',
  },
  {
    reference: 'James 1:5',
    text: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach.',
  },
  {
    reference: '1 Peter 5:7',
    text: 'Casting all your worries on him, because he cares for you.',
  },
];

const getDayNumber = (date = new Date()) => {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
};

export const getVerseOfDay = (date = new Date()) => verses[getDayNumber(date) % verses.length];

export default verses;
