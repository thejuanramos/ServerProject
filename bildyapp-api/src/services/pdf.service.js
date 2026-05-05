import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateDeliveryNotePDF = async (note) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `dn_${note._id}.pdf`;
    const filePath = path.join('uploads', 'pdfs', fileName);

    // Ensure directory exists
    if (!fs.existsSync(path.join('uploads', 'pdfs'))) {
      fs.mkdirSync(path.join('uploads', 'pdfs'), { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('DELIVERY NOTE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`ID: ${note._id}`);
    doc.text(`Date: ${new Date(note.workDate).toLocaleDateString()}`);
    doc.moveDown();

    // Company & Client Info
    doc.fontSize(12).text('Details:', { underline: true });
    doc.fontSize(10).text(`Client: ${note.client.name} (${note.client.cif})`);
    doc.text(`Project: ${note.project.name} [${note.project.projectCode}]`);
    doc.moveDown();

    // Format Specific Content
    doc.fontSize(12).text('Work Description:', { underline: true });
    doc.fontSize(10).text(note.description);
    doc.moveDown();

    if (note.format === 'material') {
      doc.text(`Material: ${note.material}`);
      doc.text(`Quantity: ${note.quantity} ${note.unit || ''}`);
    } else {
      doc.text(`Total Hours: ${note.hours || 'See breakdown'}`);
      if (note.workers && note.workers.length > 0) {
        doc.text('Workers:');
        note.workers.forEach(w => doc.text(`- ${w.name}: ${w.hours}h`));
      }
    }

    // Signature
    if (note.signatureData) {
      doc.moveDown();
      doc.fontSize(12).text('Signature:', { underline: true });
      // Remove base64 header if present
      const base64Data = note.signatureData.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, 'base64');
      doc.image(imgBuffer, { width: 150 });
      doc.text(`Signed at: ${new Date(note.signedAt).toLocaleString()}`);
    }

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
};