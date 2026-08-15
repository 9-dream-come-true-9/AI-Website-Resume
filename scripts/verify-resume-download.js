const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const downloadResume = require('../api/download-resume');
const pageHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const pageCss = fs.readFileSync(path.join(process.cwd(), 'style.css'), 'utf8');

assert(pageHtml.includes('<strong>PDF 版本（推荐，更美观）</strong>'));
assert(pageHtml.includes('<span>适合在线查看与打印</span>'));
assert(/\.resume-download-copy strong\s*\{[^}]*white-space:\s*nowrap;/s.test(pageCss));
assert(
  /<a\s+class="resume-download-option"\s+href="\/api\/download-resume\?format=pdf"\s+download="赵亚杰-两年经验-AI产品经理\.pdf"[\s\S]*?<strong>PDF 版本（推荐，更美观）<\/strong>[\s\S]*?<svg[\s\S]*?<\/svg>\s*<\/a>/.test(pageHtml)
);

const FILES = {
  pdf: {
    filename: '赵亚杰-两年经验-AI产品经理.pdf',
    contentType: 'application/pdf'
  },
  docx: {
    filename: '赵亚杰-两年经验-AI产品经理.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
};

function createResponse() {
  return {
    statusCode: 200,
    headers: new Map(),
    body: undefined,
    setHeader(name, value) {
      this.headers.set(String(name).toLowerCase(), String(value));
    },
    end(body) {
      this.body = body;
    }
  };
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

for (const [format, expected] of Object.entries(FILES)) {
  assert(pageHtml.includes(`href="/api/download-resume?format=${format}"`));
  assert(pageHtml.includes(`download="${expected.filename}"`));

  const response = createResponse();
  downloadResume(
    { method: 'GET', query: { format }, url: `/api/download-resume?format=${format}` },
    response
  );

  const filePath = path.join(process.cwd(), 'assets', 'resume', expected.filename);
  const file = fs.readFileSync(filePath);
  const encodedFilename = encodeURIComponent(expected.filename);

  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.headers.get('content-type'), expected.contentType);
  assert.strictEqual(response.headers.get('content-length'), String(file.length));
  assert.strictEqual(
    response.headers.get('content-disposition'),
    `attachment; filename*=UTF-8''${encodedFilename}`
  );
  assert(Buffer.isBuffer(response.body));
  assert.strictEqual(hash(response.body), hash(file));

  const headResponse = createResponse();
  downloadResume(
    { method: 'HEAD', query: { format }, url: `/api/download-resume?format=${format}` },
    headResponse
  );
  assert.strictEqual(headResponse.statusCode, 200);
  assert.strictEqual(headResponse.headers.get('content-length'), String(file.length));
  assert.strictEqual(headResponse.body, undefined);
}

const invalidResponse = createResponse();
downloadResume(
  { method: 'GET', query: { format: '../docx' }, url: '/api/download-resume?format=../docx' },
  invalidResponse
);
assert.strictEqual(invalidResponse.statusCode, 400);

const methodResponse = createResponse();
downloadResume(
  { method: 'POST', query: { format: 'docx' }, url: '/api/download-resume?format=docx' },
  methodResponse
);
assert.strictEqual(methodResponse.statusCode, 405);
assert.strictEqual(methodResponse.headers.get('allow'), 'GET, HEAD');

console.log('Resume download endpoint verification passed');
