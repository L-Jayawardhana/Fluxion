/**
 * Escapes a single CSV field per RFC 4180: wraps in quotes if it contains a
 * comma, quote, or newline, and doubles any internal quotes.
 */
const escapeCsvField = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Builds CSV text from an array of row objects and a column spec.
 * @param {Array<object>} rows
 * @param {Array<{key: string, label: string, format?: (row) => string}>} columns
 */
export const buildCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCsvField(c.format ? c.format(row) : row[c.key]))
      .join(',')
  );
  // Leading BOM so Excel opens UTF-8 CSVs without mangling special characters.
  return '﻿' + [header, ...lines].join('\r\n');
};

/**
 * Triggers a browser download of the given CSV text.
 * @param {string} filename
 * @param {string} csvContent
 */
export const downloadCsv = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Convenience: build CSV from rows/columns and download it immediately. */
export const exportRowsToCsv = (filename, rows, columns) => {
  downloadCsv(filename, buildCsv(rows, columns));
};
