
const CONFIG_PATH = 'data/site-config.json';
let siteConfig = null;

const waLink = (phone, text='Hola iBoost Studio, quiero información sobre sus servicios tecnológicos.') =>
  `https://wa.me/52${String(phone).replace(/\D/g,'')}?text=${encodeURIComponent(text)}`;

async function loadConfig(){
  const res = await fetch(CONFIG_PATH + '?v=' + Date.now());
  siteConfig = await res.json();
  renderSite();
}
function $(id){ return document.getElementById(id); }
function renderSite(){
  document.querySelectorAll('.whatsapp-main').forEach(a => a.href = waLink(siteConfig.business.contacts[0].whatsapp));
  document.querySelectorAll('[data-field]').forEach(el=>{
    const val = el.dataset.field.split('.').reduce((o,k)=>o?.[k], siteConfig);
    if(val) el.textContent = val;
  });
  renderServices(); renderPromotions(); renderAds('sponsorsGrid',siteConfig.sponsors); renderAds('alliesGrid',siteConfig.allies);
  renderTestimonials(); renderFaq(); renderMedia();
}
function renderServices(){
  $('servicesGrid').innerHTML = siteConfig.services.map(s=>`
    <article class="card"><div class="card-icon">${s.icon||'✨'}</div><h3>${s.title}</h3><p>${s.description}</p></article>`).join('');
}
function renderPromotions(){
  $('promotionsList').innerHTML = siteConfig.promotions.map(p=>`<article><h3>${p.title}</h3><p>${p.description}</p></article>`).join('');
}
function renderAds(id, arr){
  $(id).innerHTML = arr.map(a=>`
    <article class="card ad-card">
      <img src="${a.flyer||'assets/img/logo.png'}" alt="${a.name}">
      <div class="ad-content">
        <span class="tag">${a.category||'Publicidad'}</span>
        <h3>${a.name}</h3><p>${a.description||''}</p>
        <div class="ad-links">
          ${a.phone?`<a href="tel:${a.phone.replace(/\s/g,'')}">📞 ${a.phone}</a>`:''}
          ${a.whatsapp?`<a href="${waLink(a.whatsapp,'Hola, vi tu anuncio en iBoost Studio y quiero información.')}" target="_blank">WhatsApp</a>`:''}
          ${a.email?`<a href="mailto:${a.email}">Correo</a>`:''}
          ${a.website?`<a href="${a.website}" target="_blank">Web</a>`:''}
        </div>
      </div>
    </article>`).join('');
}
function renderTestimonials(){
  $('testimonialsGrid').innerHTML = siteConfig.testimonials.map(t=>`
    <article class="card testimonial-card"><img src="${t.image||'assets/img/logo.png'}" alt="${t.name}"><div><h3>${t.name}</h3><p>“${t.text}”</p></div></article>`).join('');
}
function renderFaq(){
  $('faqList').innerHTML = siteConfig.faqs.map((f,i)=>`
    <article class="faq-item ${i===0?'open':''}"><button type="button">${f.q}<span>+</span></button><p>${f.a}</p></article>`).join('');
  document.querySelectorAll('.faq-item button').forEach(btn=>btn.onclick=()=>btn.parentElement.classList.toggle('open'));
}
function renderMedia(){
  const audio = $('siteAudio'), pdf = $('pdfLink');
  if(siteConfig.media?.music){ audio.src=siteConfig.media.music; audio.hidden=false; }
  if(siteConfig.media?.pdf){ pdf.href=siteConfig.media.pdf; pdf.hidden=false; }
}
document.querySelector('.menu-toggle')?.addEventListener('click',()=>document.querySelector('.nav').classList.toggle('open'));
$('contactForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const msg = `Hola iBoost Studio.%0A%0ANombre: ${d.name}%0ANegocio: ${d.business}%0AWhatsApp: ${d.phone}%0ANecesito: ${d.message}`;
  window.open(waLink(siteConfig.business.contacts[0].whatsapp, decodeURIComponent(msg)), '_blank');
});
loadConfig();
