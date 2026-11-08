import { configureInstagramLinks } from './instagram-links.mjs?v=27bca4c578';

configureInstagramLinks();
const themeButton = document.querySelector('#hub-theme');
const root = document.documentElement;
const themeMeta = document.querySelector('meta[name="theme-color"]');
function applyTheme() {
  const light = root.dataset.theme === 'light';
  themeButton.setAttribute('aria-label', 'Switch to ' + (light ? 'dark' : 'light') + ' mode');
  themeButton.setAttribute('aria-pressed', String(light));
  themeMeta.content = light ? '#faf3ed' : '#210d16';
}
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('royal-rose-theme', root.dataset.theme); } catch {}
  applyTheme();
});
applyTheme();
document.querySelector('#hub-year').textContent = String(new Date().getFullYear());

const status = document.querySelector('#hub-status');
const hubUrl = document.querySelector('link[rel="canonical"]').href;
async function copyPageLink() {
  try {
    await navigator.clipboard.writeText(hubUrl);
    status.textContent = 'Link copied. Share a little Royal Rose.';
  } catch {
    status.textContent = 'Copy this address: ' + hubUrl;
  }
}
document.querySelector('#copy-links').addEventListener('click', copyPageLink);
document.querySelector('#share-links').addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({title:'Royal Rose Studio by Gagan',text:'Makeup & Hair Artistry. Book, learn and connect with Gagan.',url:hubUrl});
      status.textContent = 'A little beauty, shared.';
    } catch (error) { if (error.name !== 'AbortError') await copyPageLink(); }
  } else await copyPageLink();
});

document.querySelector('#save-contact').addEventListener('click', () => {
  const card = [
    'BEGIN:VCARD','VERSION:3.0','N:;Gagan;;;','FN:Gagan - Royal Rose Studio',
    'ORG:Royal Rose Studio','TITLE:Makeup & Hair Artistry',
    'TEL;TYPE=CELL,VOICE:+19162179247','EMAIL;TYPE=WORK:bookings.royalrosebygagan@outlook.com',
    'URL:https://royalrosebygagan.com/',
    'X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/royalrosestudiobygagan/',
    'X-SOCIALPROFILE;TYPE=tiktok:https://www.tiktok.com/@royalrosestudiobygagan',
    'X-SOCIALPROFILE;TYPE=snapchat:https://www.snapchat.com/add/royalrosestudio',
    'NOTE:Makeup and Hair Artistry. Enquiries in Yuba City / Lincoln / Sacramento / Elk Grove / Surrey BC Canada.',
    'END:VCARD',''
  ].map(line => line.match(/.{1,75}/g)?.join('\r\n ') || '').join('\r\n');
  const url = URL.createObjectURL(new Blob([card],{type:'text/vcard;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url; link.download = 'Royal-Rose-Studio-Gagan.vcf';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  status.textContent = 'Contact card ready. Open it to save Gagan’s details.';
});

const facebookDialog = document.querySelector('#facebook-dialog');
const facebookButton = document.querySelector('#hub-facebook');
facebookButton.addEventListener('click', () => facebookDialog.showModal());
facebookDialog.querySelector('.dialog-close').addEventListener('click', () => facebookDialog.close());
facebookDialog.addEventListener('click', event => {
  if (event.target !== facebookDialog) return;
  const r = facebookDialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) facebookDialog.close();
});
facebookDialog.addEventListener('close', () => facebookButton.focus());
