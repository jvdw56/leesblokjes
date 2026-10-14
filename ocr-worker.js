let running = false;

self.onmessage = async event => {
  if (running) return;
  running = true;
  let worker;
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
    const { data } = await worker.recognize(new Uint8Array(event.data), {}, { text: true });
    await worker.terminate();
    worker = null;
    self.postMessage({ type: 'result', text: data.text || '' });
  } catch (error) {
    self.postMessage({ type: 'error' });
  } finally {
    if (worker) await worker.terminate();
  }
};