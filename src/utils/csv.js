// src/utils/csv.js
// Small shared CSV helpers -- no dependency needed for the simple tabular data this
// app exports/imports (net worth items, scenario comparisons).

// Minimal RFC4180-ish parser: handles quoted fields, embedded commas/quotes ("" escape),
// and both \n and \r\n line endings. Good enough for a bank/spreadsheet export without
// pulling in a full CSV library for a handful of columns.
export const parseCSV = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
};

// Quotes a field only when it needs it (contains a comma, quote, or newline).
const escapeField = (value) => {
  const str = String(value ?? '');
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const toCSV = (rows) => rows.map(row => row.map(escapeField).join(',')).join('\n');

export const downloadCSV = (filename, rows) => {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
