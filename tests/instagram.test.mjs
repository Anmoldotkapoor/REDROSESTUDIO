import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normaliseFeed, selectPosts, postCode, INSTAGRAM_PROFILE } from '../instagram-data.mjs';
import { approvedMediaUrl, fallbackMarkup, parsePublicProfile, syncInstagram } from '../scripts/sync-instagram.mjs';

const base='https://example.com/studio/';
const post=id=>({id,permalink:`https://www.instagram.com/p/${id}/`,image:`assets/instagram/${id}.jpg`,type:'IMAGE',caption:'A royal rose',timestamp:'2026-11-06'});
const feed=posts=>({version:1,username:'royalrosestudiobygagan',posts});
const bytes=Buffer.from([255,216,255,224,1,2,3]);
const item=(code,type=1)=>({code,user:{username:'royalrosestudiobygagan'},display_uri:'https://scontent.cdninstagram.com/preview.jpg',media_type:type,accessibility_caption:'Photo by Royal Rose Studio on November 06, 2026.',caption:{text:'Makeup by Royal Rose'}});
const page=(items,{privateAccount=false,count=items.length}={})=>`<html><script type="application/json">${JSON.stringify({profile:{username:'royalrosestudiobygagan',is_private:privateAccount,all_media_count:count},edges:items.map(node=>({node}))})}</script></html>`;
const mockFetch=items=>async(url,options)=>{
  assert.equal(options.redirect,'error');
  if(url===INSTAGRAM_PROFILE){assert(!options.headers.Authorization);assert(!options.headers.Cookie);return new Response(page(items),{headers:{'content-type':'text/html'}});}
  return new Response(bytes,{headers:{'content-type':'image/jpeg'}});
};

test('public page parser extracts only the exact account, deduplicates posts and distinguishes reels and carousels',()=>{
  const result=parsePublicProfile(page([item('One'),item('Two',2),item('Three',8),item('One'),{...item('Other'),user:{username:'someoneelse'}}]));
  assert.equal(result.length,3);assert.equal(result[0].timestamp,'2026-11-06');
  assert.deepEqual(result.map(p=>p.type),['IMAGE','VIDEO','CAROUSEL_ALBUM']);
  assert.equal(result[1].permalink,'https://www.instagram.com/reel/Two/');
  assert.equal(result[0].caption,'Makeup by Royal Rose');
});
test('login walls or schema changes preserve the gallery, while a private or genuinely empty profile clears previews',()=>{
  assert.throws(()=>parsePublicProfile('<html>Please log in</html>'),/preserved/);
  assert.throws(()=>parsePublicProfile(page([],{count:9})),/preserved/);
  assert.deepEqual(parsePublicProfile(page([])),[]);
  assert.deepEqual(parsePublicProfile(page([item('One')],{privateAccount:true})),[]);
  assert.throws(()=>parsePublicProfile('x'.repeat(4*1024*1024+1)),/unsupported/);
});
test('gallery accepts valid Instagram links and safe locally hosted images only',()=>{
  const posts=normaliseFeed(feed([post('One'),post('One'),{...post('Two'),permalink:'https://instagram.com.evil/p/Two/'},{...post('Three'),image:'https://evil/photo.jpg'},{...post('Four'),image:'assets/instagram/../secret.jpg'},{...post('Five'),permalink:'javascript:alert(1)'}]),base);
  assert.equal(posts.length,1);assert.equal(posts[0].image,base+'assets/instagram/One.jpg');
  assert.equal(postCode('https://www.instagram.com/royalrosestudiobygagan/reel/A-b_1/'),'A-b_1');
  assert.equal(postCode('https://u:p@www.instagram.com/p/A/'),null);
  assert.deepEqual(normaliseFeed({...feed([post('One')]),username:'someoneelse'},base),[]);
});
test('random compositions contain five unique posts, keep their source intact and avoid repeating the previous order',()=>{
  const source=Array.from({length:7},(_,i)=>post('Post'+i));const original=JSON.stringify(source);
  const previous=selectPosts(source,[],()=>0.99);const next=selectPosts(source,previous.map(p=>p.id),()=>0.99);
  assert.equal(previous.length,5);assert.equal(new Set(next.map(p=>p.id)).size,5);assert.notDeepEqual(previous,next);assert.equal(JSON.stringify(source),original);
  assert.deepEqual(selectPosts([]),[]);assert.deepEqual(selectPosts([source[0]],[source[0].id]),[source[0]]);
});
test('preview download hosts are restricted to Instagram’s public image CDNs',()=>{
  assert.equal(approvedMediaUrl('https://scontent.cdninstagram.com/a.jpg'),true);
  assert.equal(approvedMediaUrl('https://scontent.xx.fbcdn.net/a.jpg'),true);
  for(const url of ['http://cdninstagram.com/a','https://cdninstagram.com.evil/a','https://127.0.0.1/a','https://user@fbcdn.net/a','https://fbcdn.net:4433/a'])assert.equal(approvedMediaUrl(url),false);
});
test('HTML fallback escapes text from Instagram and links to the original post',()=>{
  const html=fallbackMarkup([{...post('One'),alt:'A "look" <img onerror="bad"> & more'}]);
  assert(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));assert(!html.includes('<img onerror='));
  assert(html.includes('href="https://www.instagram.com/p/One/"'));assert(fallbackMarkup([]).includes(INSTAGRAM_PROFILE));
});
test('anonymous sync writes hashed local images, avoids unnecessary commits and removes posts no longer in the public snapshot',async t=>{
  const root=await mkdtemp(join(tmpdir(),'royal-instagram-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const result=await syncInstagram({root,fetcher:mockFetch([item('One'),item('Two',2)]),now:1800000000000});
  assert.equal(result.changed,true);assert.equal(result.count,2);
  const data=JSON.parse(await readFile(join(root,'data/instagram-feed.json'),'utf8'));
  assert.match(data.posts[0].image,/One-[a-f0-9]{12}\.jpg$/);assert(!JSON.stringify(data).includes('cdninstagram.com'));
  assert.equal((await syncInstagram({root,fetcher:mockFetch([item('One'),item('Two',2)])})).changed,false);
  await syncInstagram({root,fetcher:mockFetch([item('Two',2)])});assert.equal((await readdir(join(root,'assets/instagram'))).length,1);
  await syncInstagram({root,fetcher:mockFetch([])});assert.deepEqual(await readdir(join(root,'assets/instagram')),[]);
  assert.deepEqual(JSON.parse(await readFile(join(root,'data/instagram-feed.json'),'utf8')).posts,[]);
});
test('blocked Instagram access and failed image downloads leave the prior known-good snapshot unchanged',async t=>{
  const root=await mkdtemp(join(tmpdir(),'royal-instagram-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await syncInstagram({root,fetcher:mockFetch([item('Old')])});const before=await readFile(join(root,'data/instagram-feed.json'),'utf8');
  await assert.rejects(syncInstagram({root,fetcher:async()=>new Response('Limited',{status:429})}),/preserved/);
  await assert.rejects(syncInstagram({root,fetcher:async()=>new Response('<html>Log in</html>',{headers:{'content-type':'text/html'}})}),/preserved/);
  const bad=mockFetch([{...item('New'),display_uri:'https://evil.test/a.jpg'}]);
  await assert.rejects(syncInstagram({root,fetcher:bad}),/unsupported media host/);
  assert.equal(await readFile(join(root,'data/instagram-feed.json'),'utf8'),before);
});
