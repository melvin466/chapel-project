const parseUgandaSms = (text) => {
  if (!text) return null;

  // 1. Parse Amount (UGX, Shs, or Shs.)
  let amount = null;
  const amountMatch = text.match(/(?:UGX|Shs|Shs\.)\s*([\d,]+)/i) 
    || text.match(/(?:received|credited)\s*([\d,]+)\s*(?:UGX|Shs)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // 2. Parse Phone Number (normalizing to Uganda standard format, e.g. 2567...)
  let phoneNumber = null;
  const phoneMatch = text.match(/(?:from|by)\s+[^(\n]*\((256\d{9}|0\d{9}|\d{9})\)/i)
    || text.match(/\((256\d{9}|0\d{9}|\d{9})\)/);
  if (phoneMatch) {
    const rawDigits = phoneMatch[1].replace(/\D/g, '');
    if (rawDigits.startsWith('256') && rawDigits.length === 12) {
      phoneNumber = rawDigits;
    } else if (rawDigits.startsWith('0') && rawDigits.length === 10) {
      phoneNumber = `256${rawDigits.slice(1)}`;
    } else if (rawDigits.startsWith('7') && rawDigits.length === 9) {
      phoneNumber = `256${rawDigits}`;
    }
  }

  // 3. Parse Transaction Reference / ID
  let reference = null;
  const refMatch = text.match(/(?:Reference|Transaction ID|TxID|ID|Ref)\s*:\s*(\w+)/i)
    || text.match(/(?:Transaction ID|Reference|Ref)\s+(\w+)/i)
    || text.match(/Reference\s+is\s+(\w+)/i)
    || text.match(/ID\s+is\s+(\w+)/i);
  if (refMatch) {
    reference = refMatch[1].trim();
  }

  return { amount, phoneNumber, reference };
};

module.exports = { parseUgandaSms };
