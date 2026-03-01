const http = require('http');

http.get('http://localhost:5173/event/evt-001', (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      if (rawData.includes('Error')) {
          console.log("Found error string in payload output");
      }
      console.log('HTTP Status Code:', res.statusCode);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
