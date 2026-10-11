// EAN / UPC validation and normalisation.

function checksumOk(code) {
  const body = code.slice(0, -1);
  const check = Number(code[code.length - 1]);
  // Weights alternate 3,1,3,... starting from the digit next to the check digit.
  let total = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    total += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (total % 10)) % 10 === check;
}

/**
 * Return a canonical EAN for a scanned code, or null if it is invalid.
 * Accepts EAN-8, UPC-A (12 digits, converted to EAN-13 with a leading 0) and EAN-13.
 */
function normalize(raw) {
  let code = String(raw == null ? '' : raw).trim();
  if (!/^\d+$/.test(code) || ![8, 12, 13].includes(code.length)) return null;
  if (code.length === 12) code = '0' + code;
  return checksumOk(code) ? code : null;
}

module.exports = { normalize };
