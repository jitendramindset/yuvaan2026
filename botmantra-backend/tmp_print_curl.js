const fs = require('fs');

const col = JSON.parse(fs.readFileSync('Botmantra_Complete_API.postman_collection.json', 'utf8'));
const requests = [];

const walk = (items) => {
  (items || []).forEach((it) => {
    if (it.item) {
      walk(it.item);
    } else if (it.request) {
      requests.push(it);
    }
  });
};

walk(col.item || []);

const lines = requests.map((r) => {
  const req = r.request || {};
  const method = req.method || 'GET';
  const urlObj = req.url || {};
  const raw =
    urlObj.raw ||
    (urlObj.protocol
      ? `${urlObj.protocol}://${(urlObj.host || []).join('.')}${
          urlObj.port ? `:${urlObj.port}` : ''
        }/${(urlObj.path || []).join('/')}`
      : '');
  const headers = (req.header || [])
    .map((h) => `-H "${h.key}: ${h.value}"`)
    .join(' ');
  let body = '';
  if (req.body && req.body.mode === 'raw' && req.body.raw) {
    const cleaned = req.body.raw.replace(/\"/g, '\\"').replace(/\n/g, '');
    body = `-d "${cleaned}"`;
  }
  return `curl -X ${method} "${raw}" ${headers} ${body}`.trim();
});

console.log(lines.join('\n'));