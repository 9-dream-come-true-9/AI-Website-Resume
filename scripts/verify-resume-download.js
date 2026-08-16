const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const downloadResume = require('../api/download-resume');
const pageHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const pageCss = fs.readFileSync(path.join(process.cwd(), 'style.css'), 'utf8');

assert(pageHtml.includes('<strong>PDF 版本（推荐，更美观）</strong>'));
assert(pageHtml.includes('<span>适合在线查看与打印</span>'));
assert(pageHtml.includes('<strong>Word 版本</strong>'));
assert(pageHtml.includes('<span>选择电脑版或手机版</span>'));
assert(pageHtml.includes('<strong>电脑版</strong>'));
assert(pageHtml.includes('<span>原版排版，电脑编辑</span>'));
assert(pageHtml.includes('<strong>手机版</strong>'));
assert(pageHtml.includes('<span>手机电脑均可编辑</span>'));
assert.strictEqual((pageHtml.match(/data-resume-word-trigger/g) || []).length, 1);
assert.strictEqual((pageHtml.match(/data-resume-word-options/g) || []).length, 1);
assert(/data-resume-word-trigger[\s\S]*?aria-expanded="false"[\s\S]*?aria-controls="resume-word-options"/.test(pageHtml));
assert(/id="resume-word-options"[\s\S]*?data-resume-word-options[\s\S]*?hidden/.test(pageHtml));
assert(/\.resume-download-copy strong\s*\{[^}]*white-space:\s*nowrap;/s.test(pageCss));
assert(
  /<a\s+class="resume-download-option"\s+href="\/api\/download-resume\?format=pdf"\s+download="赵亚杰-两年经验-AI产品经理\.pdf"[\s\S]*?<strong>PDF 版本（推荐，更美观）<\/strong>[\s\S]*?<svg[\s\S]*?<\/svg>\s*<\/a>/.test(pageHtml)
);

const FILES = {
  pdf: {
    assetFilename: '赵亚杰-两年经验-AI产品经理.pdf',
    downloadFilename: '赵亚杰-两年经验-AI产品经理.pdf',
    contentType: 'application/pdf',
    sha256: 'a291bbb2951052877c22672fb8bb420453e41f9f542fe93f83f45de77ca32eab'
  },
  docx: {
    assetFilename: '赵亚杰-两年经验-AI产品经理.docx',
    downloadFilename: '赵亚杰-两年经验-AI产品经理.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sha256: '4ef61a79cd8ffd35824e6f224eb8836f408305f5b035cf4048e0bc08be2853d4'
  },
  'docx-mobile': {
    assetFilename: '赵亚杰-两年经验-AI产品经理-手机可编辑版.docx',
    downloadFilename: '赵亚杰-两年经验-AI产品经理-手机可编辑版.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sha256: '974b95fd6754c5c893662d5f7be79750b27c0fd9518b3a49d89da39153a71f6d'
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
  assert(pageHtml.includes(`download="${expected.downloadFilename}"`));

  const response = createResponse();
  downloadResume(
    { method: 'GET', query: { format }, url: `/api/download-resume?format=${format}` },
    response
  );

  const filePath = path.join(process.cwd(), 'assets', 'resume', expected.assetFilename);
  const file = fs.readFileSync(filePath);
  const encodedFilename = encodeURIComponent(expected.downloadFilename);
  assert.strictEqual(hash(file), expected.sha256);

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
