/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// @ts-ignore
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const pdfjsLib = require('pdfjs-dist');

let canvas = null;

self.onmessage = async (message) => {
  if (message.data.signal == 'canvas') {
    canvas = message.data.canvas;
    const worker = new Worker('pdf.worker.js');
    pdfjsLib.GlobalWorkerOptions.workerPort = worker;
  } else if (message.data.signal == 'render') {
    const url = message.data.url;

    const document = {
      fonts: self.fonts,
      createElement: (name) => {
        if (name == 'canvas') {
          return new OffscreenCanvas(1, 1);
        }
        return null;
      },
    };

    const pdf = await pdfjsLib.getDocument({
      url, // @ts-ignore
      ownerDocument: document,
    }).promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.35 });

    const outputScale = message.data.outputScale || 1;
    canvas = canvas;
    canvas.width = Math.floor(viewport.width * 1);
    canvas.height = Math.floor(viewport.height * 1);

    const context = canvas.getContext('2d', { alpha: false });

    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    setTimeout(async () => {
      await page.render(renderContext).promise;
      if (context && message.data.invert) {
        context.filter = 'invert(0.9)';
        context.drawImage(canvas, 0, 0);
      }

      setTimeout(() => {
        self.postMessage({
          signal: 'finished',
        });
      }, 100);
    }, 100);
  }
};
