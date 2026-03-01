import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

/**
 * Generates and downloads a CSV file from given data.
 * @param {Array} data - Array of objects representing rows
 * @param {String} filename - Output file name
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates and downloads a PDF table report using jsPDF AutoTable.
 * @param {Array} columns - Array of string column headers
 * @param {Array} rows - Array of arrays containing row data
 * @param {String} title - Title of the PDF document
 * @param {String} filename - Output file name
 */
export const exportToPDF = (columns, rows, title = 'Event Report', filename = 'report.pdf') => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const doc = new jsPDF('landscape');
  
  // Custom Styling
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 35,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [100, 50, 200], // Brand Violet
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250],
    },
  });

  doc.save(filename);
};
