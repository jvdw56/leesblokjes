let running = false;

self.onmessage = async event => {
  if (running) return;
  running = true;
  let worker;
  let bitmap;
  try {
    importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');
    worker = await Tesseract.createWorker('nld', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',
      langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/nld@1.0.0/4.0.0_best_int',
      logger: message => self.postMessage({
        type: 'progress',
        progress: message.status === 'recognizing text' ? message.progress : 0
      }),
      errorHandler: () => self.postMessage({ type: 'error' })
    });
    const image = new Uint8Array(event.data);
    let { data } = await worker.recognize(image, { rotateAuto: true }, { text: true });
    const initialConfidence = data.confidence || 0;
    if (initialConfidence < 70) {
      bitmap = await createImageBitmap(new Blob([image], { type: 'image/png' }));
      let rotatedResult = data;
      for (const angle of [90, 270, 180]) {
        const sideways = angle !== 180;
        const canvas = new OffscreenCanvas(sideways ? bitmap.height : bitmap.width, sideways ? bitmap.width : bitmap.height);
        const context = canvas.getContext('2d');
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(angle * Math.PI / 180);
        context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
        const rotated = await canvas.convertToBlob({ type: 'image/png' });
        canvas.width = canvas.height = 0;
        const result = await worker.recognize(new Uint8Array(await rotated.arrayBuffer()), { rotateAuto: true }, { text: true });
        if (result.data.text?.trim() && result.data.confidence > (rotatedResult.confidence || 0)) rotatedResult = result.data;
        if (rotatedResult.confidence >= 90) break;
      }
      if (rotatedResult.confidence >= 70 && rotatedResult.confidence >= initialConfidence + 15) data = rotatedResult;
    }
    await worker.terminate();
    worker = null;
    self.postMessage({ type: 'result', text: data.text || '', confidence: data.confidence });
  } catch (error) {
    self.postMessage({ type: 'error' });
  } finally {
    bitmap?.close();
    if (worker) await worker.terminate();
  }
};