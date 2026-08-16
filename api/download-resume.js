const fs = require('fs');
const path = require('path');

const PDF_RESUME = Object.freeze({
  assetFilename: '赵亚杰-两年经验-AI产品经理.pdf',
  downloadFilename: '赵亚杰-两年经验-AI产品经理.pdf',
  contentType: 'application/pdf'
});

const DESKTOP_WORD_RESUME = Object.freeze({
  assetFilename: '赵亚杰-两年经验-AI产品经理.docx',
  downloadFilename: '赵亚杰-两年经验-AI产品经理.docx',
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
});

const MOBILE_WORD_RESUME = Object.freeze({
  assetFilename: '赵亚杰-两年经验-AI产品经理-手机可编辑版.docx',
  downloadFilename: '赵亚杰-两年经验-AI产品经理-手机可编辑版.docx',
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
});

const RESUME_FILES = Object.freeze({
  pdf: PDF_RESUME,
  docx: DESKTOP_WORD_RESUME,
  'docx-mobile': MOBILE_WORD_RESUME
});

function getRequestedFormat(req) {
  const queryValue = req.query && req.query.format;
  if (Array.isArray(queryValue)) {
    return String(queryValue[0] || '').toLowerCase();
  }
  if (queryValue) {
    return String(queryValue).toLowerCase();
  }

  try {
    return String(new URL(req.url || '/', 'http://localhost').searchParams.get('format') || '').toLowerCase();
  } catch (_error) {
    return '';
  }
}

function encodeContentDispositionFilename(filename) {
  return encodeURIComponent(filename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', String(body.length));
  res.end(body);
}

module.exports = function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const format = getRequestedFormat(req);
  const resume = RESUME_FILES[format];
  if (!resume) {
    sendJson(res, 400, { error: 'Unsupported resume format' });
    return;
  }

  const filePath = path.join(process.cwd(), 'assets', 'resume', resume.assetFilename);

  try {
    const fileStats = fs.statSync(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', resume.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeContentDispositionFilename(resume.downloadFilename)}`
    );
    res.setHeader('Content-Length', String(fileStats.size));
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    if (method === 'HEAD') {
      res.end();
      return;
    }

    res.end(fs.readFileSync(filePath));
  } catch (_error) {
    sendJson(res, 500, { error: 'Resume file is unavailable' });
  }
};
