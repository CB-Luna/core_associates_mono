/**
 * Export data as CSV and trigger download.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: { key: string; header: string }[],
  filename: string,
) {
  const headers = columns.map((c) => c.header).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const str = val == null ? '' : String(val);
        // Escape commas and quotes in CSV values
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(','),
  );

  const csv = '\uFEFF' + headers + '\n' + rows.join('\n'); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as a simple printable HTML table and trigger browser print (PDF).
 */
export function exportToPrintPDF(
  data: Record<string, unknown>[],
  columns: { key: string; header: string }[],
  title: string,
) {
  const headerRow = columns.map((c) => `<th style="border:1px solid #ccc;padding:8px;background:#f9fafb;text-align:left;font-size:12px">${c.header}</th>`).join('');
  const bodyRows = data
    .map(
      (row) =>
        '<tr>' +
        columns
          .map((c) => {
            const val = row[c.key];
            return `<td style="border:1px solid #eee;padding:6px 8px;font-size:12px">${val == null ? '' : String(val)}</td>`;
          })
          .join('') +
        '</tr>',
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      p { font-size: 12px; color: #666; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; }
    </style></head><body>
    <h1>${title}</h1>
    <p>Generado: ${new Date().toLocaleString('es-MX')}</p>
    <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
    </body></html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('No se pudo abrir la ventana de impresión. Verifica que los popups estén permitidos.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.print();
}

/**
 * Export data as a native PDF file using jsPDF.
 */
export async function exportToPDFNative(
  data: Record<string, unknown>[],
  columns: { key: string; header: string }[],
  title: string,
  filename: string,
) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 18);

  // Subtitle with date
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 24);

  // Table
  const head = [columns.map((c) => c.header)];
  const body = data.map((row) => columns.map((c) => {
    const val = row[c.key];
    return val == null ? '' : String(val);
  }));

  (doc as any).autoTable({
    startY: 30,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
