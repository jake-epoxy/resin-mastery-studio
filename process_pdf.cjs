const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Read the extracted JPEG
    const jpegBuffer = fs.readFileSync('extracted.jpg');
    const base64Jpeg = jpegBuffer.toString('base64');

    // Run a script in the browser to crop the white box
    const croppedDataUrl = await page.evaluate(async (base64) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          let sigTop = -1;
          let sigBottom = -1;
          
          // Scan from bottom to top
          for (let y = canvas.height - 1; y >= 0; y--) {
            let whiteCount = 0;
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              // Check for white or near-white
              if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
                whiteCount++;
              }
            }
            const whiteRatio = whiteCount / canvas.width;
            
            if (whiteRatio > 0.3) {
              if (sigBottom === -1) {
                sigBottom = y;
              }
              sigTop = y; // keep updating top as we go up
            } else if (sigBottom !== -1) {
              // we found the top of the white box
              break;
            }
          }

          // Safety bounds
          if (sigBottom === -1 || sigBottom - sigTop < 50) {
            resolve(null);
            return;
          }

          // Find horizontal bounds within the white block
          let minX = canvas.width, maxX = 0;
          for (let y = sigTop; y <= sigBottom; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
              }
            }
          }

          let minY = sigTop;
          let maxY = sigBottom;

          // Crop the canvas
          const cropCanvas = document.createElement('canvas');
          const width = maxX - minX;
          const height = maxY - minY;
          cropCanvas.width = width;
          cropCanvas.height = height;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

          resolve(cropCanvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = 'data:image/jpeg;base64,' + base64;
      });
    }, base64Jpeg);

    if (!croppedDataUrl) {
      console.log('Failed to find white signature box in the image.');
      await browser.close();
      return;
    }

    console.log('Successfully cropped the signature box.');

    // Now load the fixed HTML template and inject the signature
    let htmlTemplate = fs.readFileSync('Nikki_Agreement_Fixed.html', 'utf8');
    
    // Replace the signature image source and unhide it
    htmlTemplate = htmlTemplate.replace(
      '<img id="sig-img" class="max-w-full max-h-full object-contain hidden" />',
      `<img id="sig-img" src="${croppedDataUrl}" class="max-w-full max-h-full object-contain" />`
    );
    htmlTemplate = htmlTemplate.replace(
      'id="sig-date" style="display:none;"',
      'id="sig-date" style="display:block;"'
    );
    // Remove the paste instructions
    htmlTemplate = htmlTemplate.replace(
      '<p class="text-slate-400 font-bold uppercase tracking-wider text-sm no-print mb-2">Click here and press Ctrl+V to paste signature image</p>',
      ''
    );

    // Set page content
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    // Ensure all styles are loaded before printing
    await new Promise(r => setTimeout(r, 1000));

    const outPath = 'C:\\Users\\jakef\\Downloads\\Agreement_Nicole_Givens_Official.pdf';
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    console.log('Official PDF successfully saved to: ' + outPath);

    await browser.close();
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
})();
