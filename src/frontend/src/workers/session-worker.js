// Session keep-alive worker
// Runs every 60 seconds to dispatch synthetic mousemove events

let intervalId = null;

// Start the keep-alive interval
function startKeepAlive() {
  if (intervalId !== null) {
    return; // Already running
  }

  console.log('[Worker] Session keep-alive started');

  intervalId = setInterval(() => {
    console.log('Session keep-alive: mousemove event triggered');
    self.postMessage({ type: 'keep-alive' });
  }, 60000); // 60 seconds
}

// Stop the keep-alive interval
function stopKeepAlive() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Worker] Session keep-alive stopped');
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { type } = event.data;

  switch (type) {
    case 'start':
      startKeepAlive();
      break;
    case 'stop':
      stopKeepAlive();
      break;
    default:
      console.warn('[Worker] Unknown message type:', type);
  }
});

// Start automatically when worker is created
startKeepAlive();
