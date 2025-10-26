/* NOVAFLOW v3 - script.js (corregido e interactividad mejorada)
   - Hamburgesa funcional (responsive)
   - Compartir ubicación
   - WhatsApp actualizado
   - Carrusel destacado auto-scroll
   - Carrito interactivo (qty buttons, remove)
   - Mejoras de accesibilidad y handlers
*/

/* ------------- CONFIG & DATA ------------- */
const EVENT_ISO = '2025-12-26T16:00:00-06:00';
const TIMEZONE = 'America/Mexico_City';
const CART_KEY = 'novaflow_cart_v3';
const REVIEWS_KEY = 'novaflow_reviews_v3';
const ORDERS_KEY = 'novaflow_orders_v3';
const FAVS_KEY = 'novaflow_favs_v3';
// Número actualizado: +52 56 5459 5169 -> wa.me/525654595169
const WHATSAPP_NUMBER = '525654595169';
const WHATSAPP_MESSAGE_BASE = 'Hola, quiero consultar sobre un producto de NOVAFLOW.';

const CATEGORIES = ['snacks','postres','ropa y moda','de coleccion','bebidas','snacks frios'];

const PRODUCTS = [
  { id:'s1', title:'Chips NovaCrunch', price:45, category:'snacks', desc:'Bolsa 120g, sabor clásico', img:'img/product_chips.jpg', provider:'Sabores MX' },
  { id:'s2', title:'NovaPop Palomitas', price:35, category:'snacks', desc:'Palomitas artesanales', img:'img/product_palomitas.jpg', provider:'PopHouse' },
  { id:'p1', title:'Brownie NOVAFLOW', price:70, category:'postres', desc:'Brownie casero con nuez', img:'img/product_brownie.jpg', provider:'DulceArte' },
  { id:'p2', title:'Cheesecake Mini', price:85, category:'postres', desc:'Porción individual', img:'img/product_cheesecake.jpg', provider:'La Pastelería' },
  { id:'r1', title:'Playera NOVAFLOW', price:450, category:'ropa y moda', desc:'Algodón orgánico', img:'img/product_playera.jpg', provider:'Textil Nova' },
  { id:'r2', title:'Gorra NovaCap', price:220, category:'ropa y moda', desc:'Unisex, bordado', img:'img/product_gorra.jpg', provider:'Headwear Co' },
  { id:'c1', title:'Figura NovaBot', price:1299, category:'de coleccion', desc:'Edición limitada', img:'img/product_figura.jpg', provider:'Collectibles MX' },
  { id:'c2', title:'Tarjeta Autografiada', price:350, category:'de coleccion', desc:'Serie numerada', img:'img/product_tarjeta.jpg', provider:'Merch Studio' },
  { id:'d1', title:'Café filtrado', price:45, category:'bebidas', desc:'12oz', img:'img/product_cafe.jpg', provider:'Café Central' },
  { id:'d2', title:'Jugo Natural', price:55, category:'bebidas', desc:'Jugo recién exprimido', img:'img/product_jugo.jpg', provider:'GreenJuice' },
  { id:'sf1', title:'Ensalada Nova', price:120, category:'snacks frios', desc:'Ensalada fresca', img:'img/product_ensalada.jpg', provider:'FreshCorner' },
  { id:'sf2', title:'Wrap Frío', price:95, category:'snacks frios', desc:'Wrap de pollo frío', img:'img/product_wrap.jpg', provider:'Delicias Rápidas' }
];
const FEATURED_IDS = ['r1','c1','d1','p1'];

/* ------------- STATE ------------- */
let cart = {};
let reviews = {};
let favs = {};
let deferredPrompt = null;

/* ------------- Helpers ------------- */
function load(key, fallback={}){ try{ return JSON.parse(localStorage.getItem(key)) || fallback; }catch(e){ return fallback; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function createElementFromHTML(html){ const div = document.createElement('div'); div.innerHTML = html.trim(); return div.firstChild; }
function showToast(message, timeout = 3000){
  const wrap = document.getElementById('toast-wrap');
  if(wrap){
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = message;
    t.style.padding = '8px 12px'; t.style.borderRadius = '8px'; t.style.background = 'rgba(0,0,0,0.6)';
    t.style.color = '#fff'; t.style.backdropFilter = 'blur(6px)';
    wrap.appendChild(t);
    setTimeout(()=> t.remove(), timeout);
    return;
  }
  console.log('TOAST:', message);
}
function debounce(fn, delay){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=> fn(...args), delay); }; }
function fmtMoney(n){ return `$${Number(n).toFixed(2)}`; }
function capitalize(s){ return String(s).split(' ').map(w=> w[0]?.toUpperCase()+w.slice(1)).join(' '); }

/* ------------- Init ------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  cart = load(CART_KEY,{});
  reviews = load(REVIEWS_KEY,{});
  favs = load(FAVS_KEY,{});
  bindUI();
  initIntro();
  initTheme();
  initClock();
  initCountdown();
  initCategoryChips();
  renderProducts();
  initFeaturedCarousel();
  initCart();
  initModalHandlers();
  initChat();
  initWhatsAppButtons();
  initInstallPrompt();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ------------- Intro flow with logo + audio ------------- */
function initIntro(){
  const overlay = document.getElementById('intro-overlay');
  const video = document.getElementById('intro-video');
  const logo = document.getElementById('intro-logo');
  const text = document.getElementById('intro-overlay-text');
  const audio = document.getElementById('intro-audio');
  const app = document.getElementById('app');
  const username = localStorage.getItem('novaflow_username');

  if(!overlay || !video){ document.body.classList.add('loaded'); if(app) app.setAttribute('aria-hidden','false'); return; }

  overlay.addEventListener('click', ()=> {
    finishIntro(overlay, logo, text, audio, app);
    try{ video.pause(); video.currentTime = video.duration; }catch(e){}
  });

  video.addEventListener('ended', ()=>{
    if(username) text.textContent = `Bienvenido de nuevo, ${username}`;
    else text.textContent = `Bienvenido a NOVAFLOW`;
    logo.classList.add('show'); logo.setAttribute('aria-hidden','false');

    if(audio){
      audio.currentTime = 0;
      const playPromise = audio.play();
      if(playPromise !== undefined){
        playPromise.catch(()=>{ /* autoplay blocked */ });
      }
    }

    setTimeout(()=> finishIntro(overlay, logo, text, audio, app), 1400);
  });

  video.addEventListener('error', ()=> finishIntro(overlay, logo, text, audio, app));
  setTimeout(()=> {
    if(!document.body.classList.contains('loaded')) finishIntro(overlay, logo, text, audio, app);
  }, 9000);
}

function finishIntro(overlay, logo, text, audio, app){
  if(!overlay) return;
  overlay.classList.add('fade-out');
  setTimeout(()=> {
    overlay.style.display = 'none';
    document.body.classList.add('loaded');
    if(app) { app.setAttribute('aria-hidden','false'); }
    if(audio){
      setTimeout(()=> { try{ audio.pause(); }catch(e){} }, 2800);
    }
  }, 950);
}

/* ------------- UI binding ------------- */
function bindUI(){
  // Menu items -> panels
  document.querySelectorAll('.menu-item').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const tgt = btn.dataset.target;
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      const el = document.getElementById(tgt);
      if(el) el.classList.add('active');
      // close sidebar on small screens when selecting
      if(window.innerWidth <= 900) document.body.classList.remove('sidebar-open');
      window.scrollTo({top:0,behavior:'smooth'});
    });
  });

  // Hamburger behavior (mobile & desktop toggle)
  const menuCollapse = document.getElementById('menu-collapse');
  menuCollapse?.addEventListener('click', ()=> {
    const body = document.body;
    // toggles a class that CSS can use to show/hide sidebar in mobile
    body.classList.toggle('sidebar-open');
    const expanded = body.classList.contains('sidebar-open');
    menuCollapse.setAttribute('aria-expanded', String(expanded));
  });

  // Close sidebar when clicking outside (mobile)
  document.addEventListener('click', (e)=>{
    const body = document.body;
    if(!body.classList.contains('sidebar-open')) return;
    const sidebar = document.querySelector('.sidebar');
    const target = e.target;
    if(sidebar && !sidebar.contains(target) && !document.getElementById('menu-collapse')?.contains(target)){
      body.classList.remove('sidebar-open');
    }
  });

  const search = document.getElementById('search');
  document.getElementById('search-clear')?.addEventListener('click', ()=> { if(search) search.value=''; renderProducts(); });
  if(search) search.addEventListener('input', debounce(()=> renderProducts(), 220));

  document.getElementById('saveNameBtn')?.addEventListener('click', ()=>{
    const nm = document.getElementById('usernameInput')?.value.trim();
    if(nm){ localStorage.setItem('novaflow_username', nm); showToast(`¡Bienvenido, ${nm}!`); document.getElementById('welcomeContainer')?.classList.add('hidden'); }
    else showToast('Ingresa tu nombre');
  });

  document.getElementById('export-orders')?.addEventListener('click', exportOrdersCSV);
  document.getElementById('checkout')?.addEventListener('click', simulateCheckout);

  // share location button
  document.getElementById('share-location-btn')?.addEventListener('click', shareLocation);
}

/* ------------- Theme ------------- */
function initTheme(){
  const btn = document.getElementById('theme-toggle');
  btn?.addEventListener('click', ()=>{
    const cur = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', cur);
    showToast(`Tema ${cur}`);
  });
}

/* ------------- Clock ------------- */
function initClock(){
  const el = document.getElementById('live-clock');
  if(!el) return;
  function tick(){ try{ const now = new Date(); el.textContent = now.toLocaleString('es-MX', { timeZone: TIMEZONE, hour:'2-digit', minute:'2-digit', second:'2-digit' }); }catch(e){ el.textContent = new Date().toLocaleTimeString(); } }
  tick(); setInterval(tick,1000);
}

/* ------------- Countdown ------------- */
function initCountdown(){
  const target = new Date(EVENT_ISO);
  function update(){
    const now = new Date();
    let diff = target - now;
    if(diff < 0) diff = 0;
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const mins = Math.floor((diff / (1000*60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    const big = document.getElementById('countdown-large');
    const small = document.getElementById('countdown-small');
    const tpl = (d,h,m,s)=> `
      <div class="cd-piece"><span>${String(d).padStart(2,'0')}</span><small>DÍAS</small></div>
      <div class="cd-piece"><span>${String(h).padStart(2,'0')}</span><small>HORAS</small></div>
      <div class="cd-piece"><span>${String(m).padStart(2,'0')}</span><small>MIN</small></div>
      <div class="cd-piece"><span>${String(s).padStart(2,'0')}</span><small>SEG</small></div>
    `;
    if(big) big.innerHTML = tpl(days,hours,mins,secs);
    if(small) small.innerHTML = tpl(days,hours,mins,secs);
  }
  update(); setInterval(update,1000);
}

/* ------------- Category chips ------------- */
function initCategoryChips(){
  const container = document.getElementById('category-chips');
  if(!container) return;
  container.innerHTML = '';
  const all = createChip('all','Todas', true);
  container.appendChild(all);
  CATEGORIES.forEach(cat => container.appendChild(createChip(cat, capitalize(cat), false)));
}
function createChip(key,label,active=false){
  const btn = document.createElement('button');
  btn.className = 'chip' + (active ? ' active' : '');
  btn.dataset.cat = key;
  btn.textContent = label;
  btn.addEventListener('click', ()=> {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderProducts('', key === 'all' ? null : key);
    renderCategoryFeatured(key === 'all' ? null : key);
  });
  return btn;
}
function renderCategoryFeatured(category){
  const wrap = document.getElementById('category-featured');
  const title = document.getElementById('category-featured-title');
  const carousel = document.getElementById('category-featured-carousel');
  if(!wrap || !carousel || !title) return;
  if(!category){ wrap.style.display='none'; carousel.innerHTML=''; return; }
  const list = PRODUCTS.filter(p=> p.category === category).slice(0,6);
  if(list.length === 0){ wrap.style.display='none'; carousel.innerHTML=''; return; }
  wrap.style.display='block';
  title.textContent = `Lo mejor de ${capitalize(category)}`;
  carousel.innerHTML='';
  list.forEach(p=>{
    const it = document.createElement('div'); it.className='carousel-item';
    it.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;height:100%">
        <div style="width:100%;height:110px;overflow:hidden;border-radius:8px">
          <img src="${p.img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
        </div>
        <div style="font-weight:800;color:var(--gold);margin-top:6px">${p.title}</div>
        <div style="font-size:13px;color:var(--muted)">${fmtMoney(p.price)}</div>
      </div>
    `;
    it.addEventListener('click', ()=> openProductModal(p.id));
    carousel.appendChild(it);
  });
}

/* ------------- Products rendering ------------- */
function renderProducts(searchQuery = '', category = null){
  const root = document.getElementById('products');
  if(!root) return;
  root.innerHTML = '';
  let list = PRODUCTS.slice();
  const activeChip = document.querySelector('.chip.active');
  if(!category && activeChip && activeChip.dataset.cat !== 'all') category = activeChip.dataset.cat;
  if(category) list = list.filter(p => p.category === category);

  const q = (searchQuery || document.getElementById('search')?.value || '').trim().toLowerCase();
  if(q) list = list.filter(p => (p.title + ' ' + p.desc + ' ' + p.provider).toLowerCase().includes(q));

  if(list.length === 0){ root.innerHTML = `<div class="card muted">No se encontraron productos.</div>`; return; }

  list.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'product card';
    el.innerHTML = `
      <div class="thumb"><img src="${p.img}" alt="${p.title}" onerror="this.style.display='none'"></div>
      <h3>${p.title}</h3>
      <div class="meta">
        <div class="muted small">${p.provider}</div>
        <div style="font-weight:800">${fmtMoney(p.price)}</div>
      </div>
      <div style="margin-top:8px"><button class="btn-outline btn-add" data-id="${p.id}">Ver / Añadir</button></div>
    `;
    root.appendChild(el);
  });

  root.querySelectorAll('.btn-add').forEach(b=>{
    b.addEventListener('click', ()=> openProductModal(b.dataset.id));
  });
}

/* ------------- Product modal ------------- */
function openProductModal(id){
  const p = PRODUCTS.find(x=> x.id === id);
  if(!p) return;
  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');
  if(!modal || !content) return;
  content.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div style="flex:1;min-width:220px">
        <img src="${p.img}" alt="${p.title}" style="width:100%;height:220px;object-fit:cover;border-radius:8px" onerror="this.style.display='none'">
      </div>
      <div style="flex:1;min-width:220px">
        <h3>${p.title}</h3>
        <p class="muted small">${p.desc}</p>
        <div style="font-weight:800;margin-top:8px">${fmtMoney(p.price)}</div>
        <div style="margin-top:12px">
          <button id="add-to-cart" class="btn-primary">Añadir al carrito</button>
          <button id="close-modal" class="btn-outline" style="margin-left:8px">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');

  // close handlers
  document.getElementById('close-modal')?.addEventListener('click', closeProductModal);
  document.getElementById('add-to-cart')?.addEventListener('click', ()=> {
    addToCart(p.id,1);
    animateCartButton();
    showToast(`${p.title} añadido al carrito`);
    closeProductModal();
  });

  // allow Esc key to close modal
  const escHandler = (e)=> { if(e.key === 'Escape') closeProductModal(); };
  document.addEventListener('keydown', escHandler, { once: true });
  // remove modal when clicking outside inner
  modal.addEventListener('click', function onOutClick(ev){
    if(ev.target === modal){ closeProductModal(); modal.removeEventListener('click', onOutClick); }
  });
}
function closeProductModal(){
  const modal = document.getElementById('product-modal');
  if(!modal) return;
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
}

/* ------------- Modal basic handlers ------------- */
function initModalHandlers(){
  document.getElementById('modal-close')?.addEventListener('click', ()=> { const modal = document.getElementById('product-modal'); if(modal){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); } });
  // Esc close for global modals
  document.addEventListener('keydown', (e)=> { if(e.key === 'Escape'){ document.querySelectorAll('.modal.show').forEach(m=> { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }); }});
}

/* ------------- Cart ------------- */
function initCart(){
  renderCart();
  document.getElementById('cart-toggle')?.addEventListener('click', ()=> {
    const cartEl = document.getElementById('cart');
    if(cartEl) cartEl.classList.toggle('show');
  });
  document.getElementById('close-cart')?.addEventListener('click', ()=> document.getElementById('cart')?.classList.remove('show'));
  document.getElementById('clear-cart')?.addEventListener('click', ()=> { cart = {}; save(CART_KEY, cart); renderCart(); showToast('Carrito vaciado'); });
}

function addToCart(id, qty=1){
  if(!cart[id]) cart[id]=0;
  cart[id]+=qty;
  if(cart[id] <= 0) delete cart[id];
  save(CART_KEY, cart);
  renderCart();
}

function setCartItemQty(id, qty){
  if(qty <= 0){ delete cart[id]; } else { cart[id] = qty; }
  save(CART_KEY, cart);
  renderCart();
}

function removeCartItem(id){
  delete cart[id];
  save(CART_KEY, cart);
  renderCart();
}

function renderCart(){
  const itemsWrap = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  if(!itemsWrap) return;
  itemsWrap.innerHTML = '';
  let subtotal = 0;
  const ids = Object.keys(cart);
  if(ids.length === 0){
    itemsWrap.innerHTML = `<div class="muted small" style="padding:8px">No hay artículos en el carrito.</div>`;
  }
  ids.forEach(id=>{
    const p = PRODUCTS.find(x=> x.id === id);
    if(!p) return;
    const q = cart[id];
    subtotal += p.price * q;

    // item row with qty controls and remove
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.style.display='flex';
    row.style.justifyContent='space-between';
    row.style.alignItems='center';
    row.style.padding='8px 0';
    row.innerHTML = `
      <div style="flex:1;min-width:0">
        <div style="font-weight:800">${p.title}</div>
        <div class="muted small">${p.provider}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:110px">
        <div style="font-weight:800">${fmtMoney(p.price * q)}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-qty btn-small" data-action="dec" data-id="${id}">−</button>
          <div style="min-width:28px;text-align:center">${q}</div>
          <button class="btn-qty btn-small" data-action="inc" data-id="${id}">+</button>
          <button class="btn-small btn-outline" data-action="remove" data-id="${id}" title="Eliminar">🗑</button>
        </div>
      </div>
    `;
    itemsWrap.appendChild(row);
  });

  // attach qty handlers
  itemsWrap.querySelectorAll('.btn-qty').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const id = b.dataset.id;
      const action = b.dataset.action;
      const current = cart[id] || 0;
      if(action === 'inc') setCartItemQty(id, current + 1);
      else if(action === 'dec') setCartItemQty(id, current - 1);
    });
  });
  itemsWrap.querySelectorAll('[data-action="remove"]').forEach(b=>{
    b.addEventListener('click', ()=> { removeCartItem(b.dataset.id); showToast('Artículo eliminado'); });
  });

  document.getElementById('subtotal') && (document.getElementById('subtotal').textContent = fmtMoney(subtotal));
  document.getElementById('shipping') && (document.getElementById('shipping').textContent = fmtMoney(0));
  document.getElementById('grandtotal') && (document.getElementById('grandtotal').textContent = fmtMoney(subtotal));
  if(cartCount) cartCount.textContent = ids.reduce((s,k)=> s + (cart[k]||0), 0);
}

/* ------------- simple cart button animation (pulse) ------------- */
function animateCartButton(){
  const btn = document.getElementById('cart-toggle');
  if(!btn) return;
  btn.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.06)' },
    { transform: 'scale(1)' }
  ], { duration: 400, easing: 'ease-out' });
}

/* ------------- Featured carousel auto-scroll ------------- */
function initFeaturedCarousel(){
  const track = document.getElementById('carousel-track');
  if(!track) return;
  track.innerHTML = '';
  FEATURED_IDS.forEach(id=>{
    const p = PRODUCTS.find(x=> x.id === id);
    if(!p) return;
    const itm = document.createElement('div'); itm.className='carousel-item';
    itm.innerHTML = `<div style="width:100%;height:140px;overflow:hidden;border-radius:8px"><img src="${p.img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"></div><div style="font-weight:800;margin-left:8px">${p.title}</div>`;
    track.appendChild(itm);
  });

  // Auto-scroll implementation (infinite-like)
  let rafId = null;
  let lastTime = performance.now();
  const speed = 0.5; // pixels per frame-normalized

  function step(now){
    const elapsed = now - lastTime;
    lastTime = now;
    track.scrollLeft += speed * (elapsed / 16);
    if(track.scrollLeft >= (track.scrollWidth - track.clientWidth - 1)){
      track.scrollLeft = 0;
    }
    rafId = requestAnimationFrame(step);
  }

  function startAuto(){ if(!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(step); } }
  function stopAuto(){ if(rafId){ cancelAnimationFrame(rafId); rafId = null; } }

  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);
  track.addEventListener('focusin', stopAuto);
  track.addEventListener('focusout', startAuto);

  startAuto();
}

/* ------------- Chat ------------- */
function initChat(){
  const chatFloat = document.getElementById('chat-floating');
  const chatWidget = document.getElementById('chat-widget');
  const openChat = document.getElementById('open-chat');
  const closeChat = document.getElementById('close-chat');
  if(chatFloat && chatWidget) chatFloat.addEventListener('click', ()=> chatWidget.classList.toggle('show'));
  if(openChat && chatWidget) openChat.addEventListener('click', ()=> chatWidget.classList.add('show'));
  if(closeChat && chatWidget) closeChat.addEventListener('click', ()=> chatWidget.classList.remove('show'));
  document.getElementById('send-chat')?.addEventListener('click', ()=>{
    const input = document.getElementById('chat-text');
    if(!input || !input.value) return;
    const messages = document.getElementById('chat-messages');
    const m = document.createElement('div'); m.className = 'chat-message user'; m.textContent = input.value;
    messages.appendChild(m);
    messages.scrollTop = messages.scrollHeight;
    input.value = '';
    setTimeout(()=> { const bot = document.createElement('div'); bot.className = 'chat-message bot'; bot.textContent = 'Gracias por tu mensaje. Pronto te contestaremos.'; messages.appendChild(bot); messages.scrollTop = messages.scrollHeight; }, 600);
  });
}

/* ------------- WhatsApp buttons ------------- */
function initWhatsAppButtons(){
  document.getElementById('whatsapp-send-event')?.addEventListener('click', ()=>{
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero info del bazar NOVAFLOW')}`;
    window.open(url,'_blank');
  });
  document.getElementById('whatsapp-cart')?.addEventListener('click', ()=>{
    const items = Object.keys(cart).map(id=>{
      const p = PRODUCTS.find(x=>x.id===id);
      return p ? `${p.title} x${cart[id]}` : '';
    }).filter(Boolean).join(', ');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE_BASE + ' Pedido: ' + (items || 'sin artículos'))}`;
    window.open(url,'_blank');
  });
}

/* ------------- Share location (uses geolocation + Web Share / WhatsApp fallback) ------------- */
function shareLocation(){
  if(!navigator.geolocation){
    showToast('Geolocalización no soportada por tu navegador');
    return;
  }
  showToast('Obteniendo ubicación…');
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const { latitude, longitude } = pos.coords;
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    if(navigator.share){
      try{
        await navigator.share({ title: 'Mi ubicación - NOVAFLOW', text: 'Estoy aquí:', url: mapsLink });
        showToast('Ubicación compartida');
        return;
      }catch(e){ /* fallback */ }
    }
    const text = `Hola, comparto mi ubicación: ${mapsLink}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast('Enviando ubicación por WhatsApp');
  }, (err)=>{
    console.warn('Geolocation error:', err);
    if(err.code === 1) showToast('Permiso de ubicación denegado');
    else showToast('No se pudo obtener ubicación');
  }, { enableHighAccuracy:true, timeout:10000, maximumAge:60000 });
}

/* ------------- Install prompt stub (PWA) ------------- */
function initInstallPrompt(){
  window.addEventListener('beforeinstallprompt', (e)=>{
    deferredPrompt = e;
    const btn = document.getElementById('install-btn');
    if(btn) { btn.style.display = 'inline-block'; btn.addEventListener('click', async ()=>{
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.style.display = 'none';
    }); }
  });
}

/* ------------- Export CSV & Checkout simulation ------------- */
function exportOrdersCSV(){
  const rows = [['Producto','Cantidad','Precio unitario','Total']];
  Object.keys(cart).forEach(id=>{
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p) return;
    const q = cart[id];
    rows.push([p.title, q, p.price, (p.price*q).toFixed(2)]);
  });
  const csv = rows.map(r=> r.map(cell=> `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `novaflow_pedido_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  showToast('CSV descargado');
}

function simulateCheckout(){
  const total = Object.keys(cart).reduce((s,k)=> {
    const p = PRODUCTS.find(x=> x.id === k);
    return s + (p ? p.price * cart[k] : 0);
  }, 0);
  if(total === 0){ showToast('El carrito está vacío'); return; }
  showToast('Pago simulado exitoso — Pedido creado');
  const orders = load(ORDERS_KEY, []);
  orders.push({ id: 'order_' + Date.now(), items: cart, total, created: new Date().toISOString() });
  save(ORDERS_KEY, orders);
  cart = {}; save(CART_KEY, cart); renderCart();
}

/* ------------- Misc ------------- */
function noop(){}

/* ------------- End of file ------------- */
