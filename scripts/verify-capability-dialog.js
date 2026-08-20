const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

const cardSectionStart = html.indexOf('<section id="capabilities"');
const cardSectionEnd = html.indexOf('<section class="capability-dialogs"', cardSectionStart);
assert(cardSectionStart >= 0 && cardSectionEnd > cardSectionStart, 'Capability card section is missing');
const cards = html.slice(cardSectionStart, cardSectionEnd);
const capabilityDialogsEnd = html.indexOf('<section id="experience"', cardSectionEnd);
assert(capabilityDialogsEnd > cardSectionEnd, 'Capability dialog section must stay before the experience section');
const capabilityDialogs = html.slice(cardSectionEnd, capabilityDialogsEnd);
assert.strictEqual((cards.match(/class="capability-card reveal"/g) || []).length, 4, 'There must be four capability cards');
assert.strictEqual((cards.match(/class="project-repo-link capability-card-action"/g) || []).length, 4, 'Each capability card must have exactly one detail button');
const cardBlocks = cards.match(/<article class="capability-card reveal">[\s\S]*?<\/article>/g) || [];
assert.strictEqual(cardBlocks.length, 4, 'Capability cards must remain four separate articles');
cardBlocks.forEach((card, index) => {
  assert.strictEqual((card.match(/class="project-repo-link capability-card-action"/g) || []).length, 1, `Capability card ${index + 1} must have exactly one detail button`);
});

for (const id of ['capability-fde', 'capability-product', 'capability-vibe', 'capability-tools']) {
  assert(cards.includes(`data-experience-dialog-open="${id}"`), `Missing capability trigger: ${id}`);
  assert(html.includes(`id="${id}"`), `Missing capability dialog: ${id}`);
}
assert(!capabilityDialogs.includes('class="experience-detail-kicker"'), 'Capability dialogs should not show a category kicker above the title');
assert(capabilityDialogs.includes('把 AI 能力交付到真实业务'), 'FDE dialog title is missing or not updated');

for (const [label, url] of [
  ['🎬 查看优质 SKILL 录屏', 'https://ocnlnp1ta2t2.feishu.cn/drive/folder/PJOlfq516lOiwEdmBNEcFe7DnA5'],
  ['🖼️ 查看客户成功案例截图', 'https://ocnlnp1ta2t2.feishu.cn/docx/QH4odZEIyoTFWcxOBGfcgqIon1c'],
  ['📝 查看 AI 产品文档', 'https://ocnlnp1ta2t2.feishu.cn/drive/folder/IQpbfRtCTlfJcDdnEKAcmB9Znbe'],
  ['🎨 查看产品原型', 'https://ocnlnp1ta2t2.feishu.cn/drive/folder/XOLOf3TUGlqEYsd8f0Ac16uZnBd'],
  ['🎬 播放点餐小程序演示', 'https://ocnlnp1ta2t2.feishu.cn/file/Bv1yb4UBHoRueaxM9sectZ5HnCg'],
  ['📝 查看 Vibe Coding 方法论', 'https://ocnlnp1ta2t2.feishu.cn/docx/JW0ld2ZnuoEmbwxfi8NcO5Iunid'],
  ['🎥 查看 AI 生视频全流程', 'https://ocnlnp1ta2t2.feishu.cn/drive/folder/NmESfzgROl6eqad0ZQBcaHCPnYf'],
  ['💼 查看办公 AI 化', 'https://ocnlnp1ta2t2.feishu.cn/docx/ME4LdxQqQodxJ6xr544ckyHmnhr']
]) {
  assert(html.includes(label), `Missing capability resource label: ${label}`);
  assert(html.includes(url), `Missing capability resource URL: ${url}`);
}

assert.strictEqual((html.match(/data-video-resource/g) || []).length, 3, 'Exactly three video resources need the quality reminder');
assert(html.includes('id="video-quality-dialog"'), 'Video quality reminder dialog is missing');
assert(html.includes('src="assets/video-quality-reminder.png"'), 'Uploaded reminder image is missing from the video dialog');
assert.strictEqual((html.match(/src="assets\/video-quality-reminder\.png"/g) || []).length, 1, 'Reminder image must only appear in the video quality dialog');
assert(!html.includes('观看前温馨提示'), 'Video quality dialog kicker should be removed');
assert(html.includes('右下角将 360p 调整为原画'), 'Video quality reminder must explain the quality switch');
assert(script.includes('function initVideoQualityDialog()'), 'Video quality dialog behavior is missing');
assert(script.includes('initVideoQualityDialog();'), 'Video quality dialog is not initialized');
assert(styles.includes('.capability-card-actions'), 'Capability card action styles are missing');
assert(styles.includes('.capability-resource-grid'), 'Capability resource grid styles are missing');
assert(styles.includes('.capability-detail-dialog .experience-detail-header > div'), 'Capability dialog title alignment styles are missing');
assert(styles.includes('.capability-detail-dialog .experience-detail-header h2'), 'Capability dialog title centering styles are missing');
assert(styles.includes('.video-quality-dialog .experience-detail-header > div'), 'Video dialog title alignment styles are missing');
assert(styles.includes('.video-quality-dialog .experience-detail-header h2'), 'Video dialog title centering styles are missing');
assert(styles.includes('.video-quality-image'), 'Video quality image styles are missing');

console.log('Capability detail dialogs, portfolio links, and video quality reminder verification passed.');
