
const ADMIN_PASSWORD = '1A972df8$';
const AUTH_KEY = 'iboost-admin-auth';

function lockAdmin(){
  sessionStorage.removeItem(AUTH_KEY);
  document.body.classList.remove('admin-unlocked');
  document.body.classList.add('admin-locked');
  const input = document.getElementById('adminPassword');
  if(input){ input.value = ''; setTimeout(()=>input.focus(), 60); }
}

function unlockAdmin(){
  sessionStorage.setItem(AUTH_KEY, 'ok');
  document.body.classList.remove('admin-locked');
  document.body.classList.add('admin-unlocked');
}

function setupAdminAuth(){
  if(sessionStorage.getItem(AUTH_KEY) === 'ok') unlockAdmin();
  else document.body.classList.add('admin-locked');

  const form = document.getElementById('authForm');
  const error = document.getElementById('authError');
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const pass = document.getElementById('adminPassword').value;
    if(pass === ADMIN_PASSWORD){
      if(error) error.textContent = '';
      unlockAdmin();
    }else{
      if(error) error.textContent = 'Contraseña incorrecta.';
      document.getElementById('adminPassword').select();
    }
  });

  document.getElementById('logoutAdmin')?.addEventListener('click', ()=>{
    lockAdmin();
    location.hash = '';
  });

  window.addEventListener('pagehide', ()=>sessionStorage.removeItem(AUTH_KEY));
}
setupAdminAuth();



let cfg = {};
const CONFIG_FILE = 'data/site-config.json';
const $ = id => document.getElementById(id);
const setStatus = m => $('status').textContent = m;
const getPath = (obj,path)=>path.split('.').reduce((o,k)=>o?.[k],obj);
const setPath = (obj,path,val)=>{ const a=path.split('.'); let o=obj; a.slice(0,-1).forEach(k=>o=o[k]??={}); o[a.at(-1)]=val; };

async function init(){
  const saved = JSON.parse(localStorage.getItem('iboost-gh')||'{}');
  ['ghOwner','ghRepo','ghBranch','ghToken'].forEach(id=>$(id).value=saved[id]||($(id).value||''));
  const res = await fetch(CONFIG_FILE+'?v='+Date.now()); cfg = await res.json();
  bindStatic(); renderEditors();
}
function bindStatic(){
  document.querySelectorAll('[data-path]').forEach(el=>{
    el.value = getPath(cfg, el.dataset.path) || '';
    el.oninput = () => setPath(cfg, el.dataset.path, el.value);
  });
}
function renderEditors(){
  renderList('servicesEditor','services',['icon','title','description']);
  renderList('testimonialsEditor','testimonials',['name','text','image']);
  renderList('sponsorsEditor','sponsors',['name','category','description','phone','whatsapp','email','website','flyer']);
  renderList('alliesEditor','allies',['name','category','description','phone','whatsapp','email','website','flyer']);
}
function renderList(container, key, fields){
  $(container).innerHTML = (cfg[key]||[]).map((item,idx)=>`
    <div class="edit-card">
      <div class="admin-grid">
      ${fields.map(f=>`<label>${f}<input value="${escapeHtml(item[f]||'')}" oninput="cfg['${key}'][${idx}]['${f}']=this.value"></label>`).join('')}
      </div>
      <div class="row-actions"><button class="btn danger" onclick="removeItem('${key}',${idx})">Eliminar</button></div>
    </div>`).join('');
}
function escapeHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function addItem(key){
  const templates = {
    services:{icon:'✨',title:'Nuevo servicio',description:'Descripción del servicio.'},
    testimonials:{name:'Nuevo testimonio',text:'Comentario del cliente.',image:'assets/img/logo.png'},
    sponsors:{name:'Nuevo patrocinador',category:'Publicidad',description:'Descripción',phone:'',whatsapp:'',email:'',website:'#',flyer:'assets/img/logo.png'},
    allies:{name:'Nuevo aliado',category:'Aliado',description:'Descripción',phone:'',whatsapp:'',email:'',website:'#',flyer:'assets/img/logo.png'}
  };
  cfg[key].push(templates[key]); renderEditors();
}
function removeItem(key,idx){ cfg[key].splice(idx,1); renderEditors(); }

function ghInfo(){
  return {
    owner:$('ghOwner').value.trim(), repo:$('ghRepo').value.trim(), branch:$('ghBranch').value.trim()||'main', token:$('ghToken').value.trim()
  };
}
async function githubGet(path){
  const g=ghInfo();
  const r = await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path}?ref=${g.branch}`, {
    headers:{Authorization:`Bearer ${g.token}`,Accept:'application/vnd.github+json'}
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function githubPut(path, content, message){
  const g=ghInfo(); let sha;
  try{ sha=(await githubGet(path)).sha; }catch(e){}
  const body = {message, content:btoa(unescape(encodeURIComponent(content))), branch:g.branch};
  if(sha) body.sha=sha;
  const r = await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path}`, {
    method:'PUT', headers:{Authorization:`Bearer ${g.token}`,Accept:'application/vnd.github+json'}, body:JSON.stringify(body)
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function uploadSelected(inputId, folder){
  const file = $(inputId).files[0]; if(!file) return setStatus('Selecciona un archivo primero.');
  const path = `${folder}/${safeName(file.name)}`;
  const b64 = await fileToBase64(file);
  const g=ghInfo(); let sha;
  try{ sha=(await githubGet(path)).sha; }catch(e){}
  const body = {message:`Upload ${path}`, content:b64.split(',')[1], branch:g.branch}; if(sha) body.sha=sha;
  const r = await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path}`, {
    method:'PUT', headers:{Authorization:`Bearer ${g.token}`,Accept:'application/vnd.github+json'}, body:JSON.stringify(body)
  });
  if(!r.ok) throw new Error(await r.text());
  setStatus(`Archivo subido:\n${path}\nCopia esta ruta en el campo correspondiente.`);
}
const fileToBase64 = f => new Promise((res,rej)=>{const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(f);});
const safeName = n => n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');

$('saveSettings').onclick=()=>{ localStorage.setItem('iboost-gh', JSON.stringify(ghInfo())); setStatus('Conexión guardada localmente en este navegador.'); };
$('loadGithub').onclick=async()=>{ try{ const f=await githubGet(CONFIG_FILE); cfg=JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g,''))))); bindStatic(); renderEditors(); setStatus('JSON cargado desde GitHub.'); }catch(e){setStatus('Error al cargar:\n'+e.message);} };
$('pushGithub').onclick=async()=>{ try{ await githubPut(CONFIG_FILE, JSON.stringify(cfg,null,2), 'Update iBoost Studio content'); setStatus('Cambios sincronizados a GitHub correctamente.'); }catch(e){setStatus('Error al sincronizar:\n'+e.message);} };
$('uploadImageBtn').onclick=()=>uploadSelected('imageUpload','assets/img').catch(e=>setStatus('Error al subir imagen:\n'+e.message));
$('uploadFileBtn').onclick=()=>uploadSelected('fileUpload',$('fileUpload').files[0]?.name.toLowerCase().endsWith('.pdf')?'assets/docs':'assets/music').catch(e=>setStatus('Error al subir archivo:\n'+e.message));
$('downloadJson').onclick=()=>{ const blob=new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='site-config.json'; a.click(); };
init();
