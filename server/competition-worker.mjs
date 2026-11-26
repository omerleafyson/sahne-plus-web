const ROOT='/api/competition', LIMIT=25*1024*1024, VERSION='SP-2026-11-26-v2';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const error=(message,status=400)=>json({message},status);
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
async function hash(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function open(e){return e.APPLICATIONS_OPEN==='true'&&e.APPROVED_TERMS_VERSION===VERSION&&!!(e.DB&&e.VIDEOS&&e.PRO_VIDEOS&&e.TURNSTILE_SECRET&&e.TURNSTILE_SITE_KEY&&e.RESEND_API_KEY&&e.REVIEW_FROM&&e.REVIEW_TO&&e.REVIEW_TOKEN&&e.ALLOWED_ORIGIN)}
async function challenge(e,t){if(typeof t!=='string'||!t||t.length>2048)return false;const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:e.TURNSTILE_SECRET,response:t})});const d=await r.json();return d.success===true&&d.action==='competition_apply'&&d.hostname===new URL(e.ALLOWED_ORIGIN).hostname}
async function notice(e,id){try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+e.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'sahne-plus-application/'+id},body:JSON.stringify({from:e.REVIEW_FROM,to:[e.REVIEW_TO],subject:'Sahne Plus: yeni yarışma başvurusu',text:'Yeni başvuru kayıt numarası: '+id+'. Videoyu ve iletişim bilgisini yalnızca yetkili inceleme arayüzünde açın. Bu e-posta kişisel veri veya video içermez.'})});if(!r.ok)return 'pending';const d=await r.json();if(!d.id)return 'pending';await e.DB.prepare("UPDATE applications SET notification='sent' WHERE id=?").bind(id).run();return 'sent'}catch{return 'pending'}}
async function voter(req,e){if(!e.AUTH||!e.VOTER_HASH_SALT)return null;try{const headers=new Headers();const auth=req.headers.get('Authorization'),cookie=req.headers.get('Cookie');if(auth)headers.set('Authorization',auth);if(cookie)headers.set('Cookie',cookie);const r=await e.AUTH.fetch(new Request('https://auth.internal/competition-identity',{headers}));if(!r.ok)return null;const d=await r.json();return d.verified===true&&typeof d.sub==='string'&&d.sub.length>0&&d.sub.length<300?await hash(e.VOTER_HASH_SALT+'\0'+d.sub):null}catch{return null}}
async function admin(req,e){const token=req.headers.get('Authorization')||'';return typeof e.REVIEW_TOKEN==='string'&&e.REVIEW_TOKEN.length>=32&&(await hash(token))===(await hash('Bearer '+e.REVIEW_TOKEN))}
async function fileHash(file){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function validVideo(file){if(!(file instanceof File)||!file.size||file.size>LIMIT||!['video/mp4','video/webm','video/quicktime'].includes(file.type))return false;const a=new Uint8Array(await file.slice(0,16).arrayBuffer());if(file.type==='video/webm')return a[0]===0x1a&&a[1]===0x45&&a[2]===0xdf&&a[3]===0xa3;return a.length>=12&&String.fromCharCode(...a.slice(4,8))==='ftyp'}
async function videoResponse(req,bucket,row,privateMode=false){const size=row.bytes;let start=0,end=size-1,partial=false;const range=req.headers.get('Range');if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),size-1):size-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});partial=true}const o=await bucket.get(row.object_key,partial?{range:{offset:start,length:end-start+1}}:undefined);if(!o)return error('Video bulunamadı.',404);const headers={'Content-Type':row.mime,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':privateMode?'attachment; filename="performance-video"':'inline'};if(partial)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;return new Response(o.body,{status:partial?206:200,headers})}
export default {async fetch(req,e){const u=new URL(req.url),path=u.pathname,m=req.method;if(!path.startsWith(ROOT+'/'))return e.ASSETS?e.ASSETS.fetch(req):new Response('Not found',{status:404});const p=path.slice(ROOT.length);try{
 if(m==='POST'&&(!e.ALLOWED_ORIGIN||req.headers.get('Origin')!==e.ALLOWED_ORIGIN))return error('Geçersiz istek kaynağı.',403);
 if(p==='/config'&&m==='GET')return json({applicationsOpen:open(e),turnstileSiteKey:open(e)?e.TURNSTILE_SITE_KEY:null});
 if(!e.DB||!e.VIDEOS||!e.PRO_VIDEOS)return error('Yarışma altyapısı henüz bağlı değil.',503);
 if(p==='/applications'&&m==='POST'){
  if(!open(e))return error('Başvurular henüz açılmadı.',503);
  const len=Number(req.headers.get('Content-Length'));if(!Number.isFinite(len)||len<=0||len>LIMIT+65536)return error('Dosya sınırı aşıldı veya yükleme boyutu belirlenemedi.',413);
  if(!req.headers.get('Content-Type')?.startsWith('multipart/form-data'))return error('Geçersiz form.');
  const f=await req.formData(),code=f.get('code'),name=String(f.get('fullName')||'').trim(),phone=String(f.get('phone')||'').replace(/[\s()-]/g,''),file=f.get('video'),category=f.get('category');
  if(!['music','dance','acting','comedy','sport','magic','other'].includes(category)||!uuid(code)||name.length<3||name.length>120||!name.includes(' ')||/[\u0000-\u001f]/.test(name)||!/^\+?\d{10,15}$/.test(phone)||f.get('adult')!=='yes'||f.get('agreement')!=='yes')return error('Ad soyad, telefon ve zorunlu onayları kontrol et.');
  if(!await challenge(e,f.get('challenge')))return error('Güvenlik doğrulaması başarısız.',403);
  const codeHash=await hash(code),prior=await e.DB.prepare('SELECT id,notification FROM applications WHERE code_hash=?').bind(codeHash).first();if(prior)return json({id:prior.id,notification:prior.notification});
  if(!await validVideo(file))return error('Geçersiz video biçimi veya boyutu.');
  const id=crypto.randomUUID(),key='applications/'+id,digest=await fileHash(file);
  await e.VIDEOS.put(key,file.stream(),{httpMetadata:{contentType:file.type}});
  try{await e.DB.prepare('INSERT INTO applications (id,code_hash,full_name,phone,category,object_key,sha256,mime,bytes,agreement_version) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,codeHash,name,phone,category,key,digest,file.type,file.size,VERSION).run()}catch(err){await e.VIDEOS.delete(key);const duplicate=await e.DB.prepare('SELECT id,notification FROM applications WHERE code_hash=?').bind(codeHash).first();if(duplicate)return json({id:duplicate.id,notification:duplicate.notification});throw err}
  return json({id,notification:await notice(e,id)},201);
 }
 if(p==='/status'&&m==='POST'){const d=await req.json();if(!uuid(d.code))return error('Geçerli başvuru kodu gir.');const r=await e.DB.prepare('SELECT status,contacted,invitation_at,invitation_note FROM applications WHERE code_hash=?').bind(await hash(d.code)).first();return r?json({status:r.status,contacted:!!r.contacted,invitationAt:r.invitation_at,invitationNote:r.invitation_note}):error('Başvuru bulunamadı.',404)}
 if(p==='/performances'&&m==='GET'){const r=await e.DB.prepare("SELECT p.id,p.display_name AS displayName,COUNT(v.voter_hash) AS votes FROM official_performances p JOIN applications a ON a.id=p.application_id LEFT JOIN votes v ON p.id=v.performance_id WHERE p.status='published' AND a.status='published' GROUP BY p.id ORDER BY votes DESC,p.id LIMIT 100").all();let last=-1,rank=0;const items=r.results.map((x,i)=>{if(x.votes!==last){rank=i+1;last=x.votes}return {...x,rank}});return json({items,canVote:e.VOTING_OPEN==='true'&&!!await voter(req,e)})}
 if(p==='/vote'&&m==='POST'){if(e.VOTING_OPEN!=='true')return error('Oylama açık değil.',503);const who=await voter(req,e);if(!who)return error('Doğrulanmış kullanıcı girişi gerekli.',401);const d=await req.json();if(!uuid(d.id))return error('Geçersiz performans.');const r=await e.DB.prepare("INSERT OR IGNORE INTO votes(performance_id,voter_hash) SELECT p.id,? FROM official_performances p JOIN applications a ON a.id=p.application_id WHERE p.id=? AND p.status='published' AND a.status='published'").bind(who,d.id).run();return r.meta.changes?json({ok:true}):error('Oy daha önce verilmiş veya performans yayında değil.',409)}
 if(p.startsWith('/video/')&&m==='GET'){const id=p.slice(7);if(!uuid(id))return error('Video bulunamadı.',404);const r=await e.DB.prepare("SELECT p.object_key,p.mime,p.bytes FROM official_performances p JOIN applications a ON a.id=p.application_id WHERE p.id=? AND p.status='published' AND a.status='published'").bind(id).first();return r&&r.object_key.startsWith('official/')?videoResponse(req,e.PRO_VIDEOS,r):error('Video bulunamadı.',404)}
 if(p.startsWith('/admin/')){
  if(!await admin(req,e))return error('Yetkisiz işlem.',401);
  if(p==='/admin/list'&&m==='GET'){const r=await e.DB.prepare('SELECT a.id,a.full_name,a.phone,a.category,a.mime,a.bytes,a.status,a.notification,a.contacted,a.created_at,a.agreement_version,a.invitation_at,a.invitation_note,p.id AS performance_id FROM applications a LEFT JOIN official_performances p ON a.id=p.application_id ORDER BY a.created_at DESC LIMIT 100').all();return json({items:r.results})}
  if(p.startsWith('/admin/video/')&&m==='GET'){const id=p.slice(13);if(!uuid(id))return error('Video bulunamadı.',404);const r=await e.DB.prepare('SELECT object_key,mime,bytes FROM applications WHERE id=?').bind(id).first();return r&&r.object_key.startsWith('applications/')?videoResponse(req,e.VIDEOS,r,true):error('Video bulunamadı.',404)}
  if(p==='/admin/official-upload'&&m==='POST'){
   const len=Number(req.headers.get('Content-Length'));if(!Number.isFinite(len)||len<=0||len>LIMIT+65536)return error('Pilot video sınırı aşıldı.',413);
   if(!req.headers.get('Content-Type')?.startsWith('multipart/form-data'))return error('Geçersiz form.');
   const f=await req.formData(),appId=f.get('id'),file=f.get('video');
   if(!uuid(appId)||f.get('professionalConfirmed')!=='yes'||!await validVideo(file)||!['video/mp4','video/webm'].includes(file.type))return error('Profesyonel çekim onayı ve geçerli MP4/WebM dosyası gerekli.');
   const app=await e.DB.prepare("SELECT sha256 FROM applications WHERE id=? AND status='invited' AND contacted=1").bind(appId).first();
   if(!app)return error('Önce başvuruyu onayla, iletişimi kaydet ve çekim daveti oluştur.',409);
   const digest=await fileHash(file);if(digest===app.sha256)return error('Başvuru videosu resmî performans olarak kullanılamaz.',409);
   const id=crypto.randomUUID(),key='official/'+id;
   await e.PRO_VIDEOS.put(key,file.stream(),{httpMetadata:{contentType:file.type}});
   try{const result=await e.DB.batch([
    e.DB.prepare("INSERT INTO official_performances(id,application_id,object_key,sha256,mime,bytes) SELECT ?,id,?,?,?,? FROM applications WHERE id=? AND status='invited' AND contacted=1").bind(id,key,digest,file.type,file.size,appId),
    e.DB.prepare("UPDATE applications SET status='filmed' WHERE id=? AND status='invited' AND EXISTS(SELECT 1 FROM official_performances WHERE id=? AND application_id=?)").bind(appId,id,appId)
   ]);if(!result[0].meta.changes){await e.PRO_VIDEOS.delete(key);return error('Çekim durumu değişti.',409)}}catch(err){const saved=await e.DB.prepare('SELECT id FROM official_performances WHERE id=?').bind(id).first();if(!saved)await e.PRO_VIDEOS.delete(key);throw err}
   return json({id},201);
  }
  if(p.startsWith('/admin/official-video/')&&m==='GET'){const id=p.slice('/admin/official-video/'.length);if(!uuid(id))return error('Video bulunamadı.',404);const row=await e.DB.prepare('SELECT object_key,mime,bytes FROM official_performances WHERE id=?').bind(id).first();return row&&row.object_key.startsWith('official/')?videoResponse(req,e.PRO_VIDEOS,row,true):error('Video bulunamadı.',404)}
  if(p==='/admin/review'&&m==='POST'){
   const d=await req.json();if(!uuid(d.id))return error('Geçersiz başvuru.');let q,params;
   if(d.action==='approve'||d.action==='reject'){q="UPDATE applications SET status=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'";params=[d.action==='approve'?'approved':'rejected',d.id]}
   else if(d.action==='contacted'){q="UPDATE applications SET contacted=1 WHERE id=? AND status IN ('approved','rejected','invited','filmed','published')";params=[d.id]}
   else if(d.action==='invite'){const date=String(d.invitationAt||''),note=String(d.invitationNote||'').trim();if(!date||!Number.isFinite(Date.parse(date))||!note||note.length>500)return error('Çekim tarihi ve davet bilgisi zorunlu.');q="UPDATE applications SET status='invited',invitation_at=?,invitation_note=? WHERE id=? AND status='approved' AND contacted=1";params=[date,note,d.id]}
   else if(d.action==='publish'){
    const name=String(d.displayName||'').trim();if(!uuid(d.performanceId)||d.rightsConfirmed!==true||d.safetyConfirmed!==true||name.length<2||name.length>60)return error('Ayrı çekim, yayın izni, güvenlik kontrolü ve görünen ad zorunlu.');
    const result=await e.DB.batch([
     e.DB.prepare("UPDATE official_performances SET status='published',display_name=?,published_at=CURRENT_TIMESTAMP WHERE id=? AND application_id=? AND status='draft' AND EXISTS(SELECT 1 FROM applications WHERE id=? AND status='filmed')").bind(name,d.performanceId,d.id,d.id),
     e.DB.prepare("UPDATE applications SET status='published' WHERE id=? AND status='filmed' AND EXISTS(SELECT 1 FROM official_performances WHERE id=? AND application_id=? AND status='published')").bind(d.id,d.performanceId,d.id)
    ]);return result[0].meta.changes?json({ok:true}):error('Profesyonel çekim kaydı yayına uygun değil.',409);
   }else if(d.action==='unpublish'){
    const result=await e.DB.batch([e.DB.prepare("UPDATE official_performances SET status='draft' WHERE application_id=? AND status='published'").bind(d.id),e.DB.prepare("UPDATE applications SET status='filmed' WHERE id=? AND status='published'").bind(d.id)]);return result[0].meta.changes?json({ok:true}):error('Yayında performans yok.',409);
   }else return error('Geçersiz işlem.');
   const result=await e.DB.prepare(q).bind(...params).run();return result.meta.changes?json({ok:true}):error('İşlem mevcut başvuru durumunda yapılamaz.',409);
  }
  if(p==='/admin/notify'&&m==='POST'){const d=await req.json();if(!uuid(d.id)||!open(e))return error('Bildirim yapılandırması eksik.');const r=await e.DB.prepare('SELECT notification FROM applications WHERE id=?').bind(d.id).first();if(!r)return error('Başvuru bulunamadı.',404);return json({notification:r.notification==='sent'?'sent':await notice(e,d.id)})}
 }
 return error('Adres bulunamadı.',404);
 }catch{return error('İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar dene.',503)}}};
