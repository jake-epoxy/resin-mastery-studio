import fs from 'fs';

const pdfData = fs.readFileSync("C:\\Users\\jakef\\Downloads\\Agreement_Nicole_Givens.pdf");
let jpegStart = -1;
let jpegEnd = -1;

for (let i = 0; i < pdfData.length - 1; i++) {
  if (pdfData[i] === 0xFF && pdfData[i+1] === 0xD8) {
    if (jpegStart === -1) {
        jpegStart = i;
    }
  }
  if (pdfData[i] === 0xFF && pdfData[i+1] === 0xD9) {
    jpegEnd = i + 1;
  }
}

if (jpegStart !== -1 && jpegEnd !== -1) {
  const jpegData = pdfData.slice(jpegStart, jpegEnd + 1);
  fs.writeFileSync('extracted.jpg', jpegData);
  console.log('Successfully extracted JPEG from PDF.');
} else {
  console.log('Could not find JPEG markers.', { jpegStart, jpegEnd });
}
