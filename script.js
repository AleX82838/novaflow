/* NOVAFLOW v3 - script.js (corregido y funcional para intro + UI básica) */

/* ------------- CONFIG & DATA ------------- */
const EVENT_ISO = '2025-12-26T16:00:00-06:00';
const TIMEZONE = 'America/Mexico_City';
const CART_KEY = 'novaflow_cart_v3';
const REVIEWS_KEY = 'novaflow_reviews_v3';
const ORDERS_KEY = 'novaflow_orders_v3';
const FAVS_KEY = 'novaflow_favs_v3';
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

/* ------------- Persistence helpers ------------- */
function load(key, fallback={}){ try{ return JSON.parse(localStorage.getItem(key)) || fallback; }catch(e){ return fallback; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

/* ------------- Utility functions (creadas si faltaban) ------------- */
function createElementFromHTML(html){
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstChild;
}
function showToast(message){
  // simple toast appended to #toast-wrap if present
  const wrap = document.getElementById('toast-wrap');
  if(wrap){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    t.style.padding = '8px 12px';
    t.style.borderRadius = '8px';
    t.style.background = 'rgba(0,0,0,0.6)';
    t.style.color = '#fff';
    wrap.appendChild(t);
    setTimeout(()=> t.remove(), 2800);
    return;
  }
  // fallback
  console.log('TOAST:', message);
}
function debounce(fn, delay){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=> fn(...args), delay);
  };
}
function fmtMoney(n){ return `$${Number(n).toFixed(2)}`; }
function capitalize(s){ return String(s).split(' ').map(w=> w[0]?.toUpperCase()+w.slice(1)).join(' '); }

/* ------------- Init ------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  cart = load(CART_KEY,{});
  reviews = load(REVIEWS_KEY,{});
  favs = load(FAVS_KEY,{});
  bindUI();           // event handlers
  initIntro();        // intro first
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
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ------------- Intro flow & username ------------- */
function initIntro(){
  const overlay = document.getElementById('intro-overlay');
  const video = document.getElementById('intro-video');
  const text = document.getElementById('intro-overlay-text');
  const app = document.getElementById('app');
  const username = localStorage.getItem('novaflow_username');

  // safety defaults
  if(!overlay || !video){ document.body.classList.add('loaded'); return; }

  video.controls = false;
  video.addEventListener('contextmenu', (e)=> e.preventDefault());
  video.addEventListener('keydown', (e)=> e.preventDefault());

  // If user already saved name, show personalized text when ending
  video.addEventListener('ended', ()=>{
    if(username){
      text.textContent = `Bienvenido de nuevo, ${username}`;
    } else {
      text.textContent = `Bienvenido a NOVAFLOW`;
    }
    // wait a bit so user sees text, then fade
    setTimeout(()=>{
      overlay.classList.add('fade-out');
      setTimeout(()=> {
        overlay.style.display = 'none';
        document.body.classList.add('loaded');
        // if no username, show name prompt
        if(!username) showNameCapture();
      }, 1000);
    }, 900);
  });

  // Fallback: if video errors or doesn't start, remove overlay after timeout
  video.addEventListener('error', ()=>{
    overlay.classList.add('fade-out');
    setTimeout(()=> {
      overlay.style.display = 'none';
      document.body.classList.add('loaded');
      if(!username) showNameCapture();
    }, 800);
  });

  // Safety max wait (if browser blocks autoplay or takes too long)
  setTimeout(()=>{
    if(!document.body.classList.contains('loaded')){
      overlay.classList.add('fade-out');
      setTimeout(()=> {
        overlay.style.display = 'none';
        document.body.classList.add('loaded');
        if(!username) showNameCapture();
      }, 800);
    }
  }, 8000);
}

function showNameCapture(){
  // simple inline prompt in the welcomeContainer that you already have in HTML
  const welcome = document.getElementById('welcomeContainer');
  const input = document.getElementById('usernameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const welcomeMsg = document.getElementById('welcomeMessage');

  if(!welcome || !input || !saveBtn || !welcomeMsg) return;

  welcome.classList.remove('hidden');
  welcome.setAttribute('aria-hidden','false');

  saveBtn.addEventListener('click', ()=>{
    const nm = input.value.trim();
    if(!nm){ showToast('Ingresa tu nombre'); return; }
    localStorage.setItem('novaflow_username', nm);
    welcomeMsg.textContent = `¡Bienvenido, ${nm}!`;
    setTimeout(()=>{
      welcome.classList.add('hidden');
      welcome.setAttribute('aria-hidden','true');
    }, 1600);
  });
}

/* ------------- UI & Navigation binding ------------- */
function bindUI(){
  // Menu navigation
  document.querySelectorAll('.menu-item').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const tgt = btn.dataset.target;
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      const el = document.getElementById(tgt);
      if(el) el.classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    });
  });

  // hamburger collapse
  const menuCollapse = document.getElementById('menu-collapse');
  if(menuCollapse) menuCollapse.addEventListener('click', ()=> document.body.classList.toggle('sidebar-collapsed'));

  // search
  const search = document.getElementById('search');
  const searchClear = document.getElementById('search-clear');
  if(search && searchClear){
    searchClear.addEventListener('click', ()=> { search.value=''; renderProducts(); });
    search.addEventListener('input', debounce(()=> renderProducts(), 220));
  }

  // save name in welcomeContainer (extra safety)
  const saveNameBtn = document.getElementById('saveNameBtn');
  if(saveNameBtn){
    saveNameBtn.addEventListener('click', ()=> {
      const nm = document.getElementById('usernameInput').value.trim();
      if(nm){ localStorage.setItem('novaflow_username', nm); showToast(`¡Bienvenido, ${nm}!`); }
      else showToast('Ingresa tu nombre');
    });
  }
}

/* ------------- THEME ------------- */
function initTheme(){
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  // keep data-theme on body if present
  btn?.addEventListener('click', ()=>{
    const cur = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', cur);
    showToast(`Tema ${cur}`);
  });
}

/* ------------- CLOCK ------------- */
function initClock(){
  const el = document.getElementById('live-clock');
  if(!el) return;
  function tick(){
    try {
      const now = new Date();
      el.textContent = now.toLocaleString('es-MX', { timeZone: TIMEZONE, hour:'2-digit', minute:'2-digit', second:'2-digit' });
    } catch(e){
      el.textContent = new Date().toLocaleTimeString();
    }
  }
  tick(); setInterval(tick,1000);
}

/* ------------- COUNTDOWN ------------- */
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

    const tpl = (d,h,m,s)=> {
      return `
        <div class="cd-piece"><span>${String(d).padStart(2,'0')}</span><small>DÍAS</small></div>
        <div class="cd-piece"><span>${String(h).padStart(2,'0')}</span><small>HORAS</small></div>
        <div class="cd-piece"><span>${String(m).padStart(2,'0')}</span><small>MIN</small></div>
        <div class="cd-piece"><span>${String(s).padStart(2,'0')}</span><small>SEG</small></div>
      `;
    };
    if(big) big.innerHTML = tpl(days,hours,mins,secs);
    if(small) small.innerHTML = tpl(days,hours,mins,secs);
  }
  update(); setInterval(update,1000);
}

/* ------------- CATEGORY CHIPS & FEATURED PER CATEGORY ------------- */
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

/* ------------- RENDER PRODUCTS ------------- */
function renderProducts(searchQuery = '', category = null){
  const root = document.getElementById('products');
  if(!root) return;
  root.innerHTML = '';
  let list = PRODUCTS.slice();

  // category from active chip if not provided
  const activeChip = document.querySelector('.chip.active');
  if(!category && activeChip && activeChip.dataset.cat !== 'all') category = activeChip.dataset.cat;
  if(category) list = list.filter(p => p.category === category);

  const q = (searchQuery || document.getElementById('search')?.value || '').trim().toLowerCase();
  if(q){
    list = list.filter(p => (p.title + ' ' + p.desc + ' ' + p.provider).toLowerCase().includes(q));
  }

  if(list.length === 0){
    root.innerHTML = `<div class="card muted">No se encontraron productos.</div>`;
    return;
  }

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

  // attach add buttons
  root.querySelectorAll('.btn-add').forEach(b=>{
    b.addEventListener('click', ()=> openProductModal(b.dataset.id));
  });
}

/* ------------- Product modal (simple) ------------- */
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
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');

  document.getElementById('close-modal').addEventListener('click', ()=> {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  });

  document.getElementById('add-to-cart').addEventListener('click', ()=>{
    addToCart(p.id, 1);
    showToast(`${p.title} añadido al carrito`);
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  });
}

function initModalHandlers(){
  const modalClose = document.getElementById('modal-close');
  modalClose?.addEventListener('click', ()=>{
    const modal = document.getElementById('product-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  });
}

/* ------------- CART ------------- */
function initCart(){
  renderCart();
  document.getElementById('cart-toggle')?.addEventListener('click', ()=> {
    const cartEl = document.getElementById('cart');
    cartEl.classList.toggle('show');
  });
  document.getElementById('close-cart')?.addEventListener('click', ()=> {
    document.getElementById('cart')?.classList.remove('show');
  });
  document.getElementById('clear-cart')?.addEventListener('click', ()=> {
    cart = {}; save(CART_KEY, cart); renderCart();
  });
}

function addToCart(id, qty=1){
  if(!cart[id]) cart[id] = 0;
  cart[id] += qty;
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
  ids.forEach(id=>{
    const p = PRODUCTS.find(x=> x.id === id);
    if(!p) return;
    const q = cart[id];
    subtotal += p.price * q;
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.padding = '8px 0';
    row.innerHTML = `<div>${p.title} x${q}</div><div style="font-weight:800">${fmtMoney(p.price * q)}</div>`;
    itemsWrap.appendChild(row);
  });
  document.getElementById('subtotal') && (document.getElementById('subtotal').textContent = fmtMoney(subtotal));
  document.getElementById('shipping') && (document.getElementById('shipping').textContent = fmtMoney(0));
  document.getElementById('grandtotal') && (document.getElementById('grandtotal').textContent = fmtMoney(subtotal));
  if(cartCount) cartCount.textContent = ids.reduce((s,k)=> s + (cart[k]||0), 0);
}

/* ------------- FEATURED carousel (simple rendering) ------------- */
function initFeaturedCarousel(){
  const track = document.getElementById('carousel-track');
  if(!track) return;
  track.innerHTML = '';
  FEATURED_IDS.forEach(id=>{
    const p = PRODUCTS.find(x=> x.id === id);
    if(!p) return;
    const itm = document.createElement('div');
    itm.className = 'carousel-item';
    itm.innerHTML = `
      <div style="width:100%;height:140px;overflow:hidden;border-radius:8px"><img src="${p.img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"></div>
      <div style="font-weight:800;margin-left:8px">${p.title}</div>
    `;
    track.appendChild(itm);
  });
}

/* ------------- Chat (básico) ------------- */
function initChat(){
  const chatFloat = document.getElementById('chat-floating');
  const chatWidget = document.getElementById('chat-widget');
  const openChat = document.getElementById('open-chat');
  const closeChat = document.getElementById('close-chat');
  if(chatFloat && chatWidget) chatFloat.addEventListener('click', ()=> chatWidget.classList.toggle('show'));
  if(openChat && chatWidget) openChat.addEventListener('click', ()=> chatWidget.classList.add('show'));
  if(closeChat && chatWidget) closeChat.addEventListener('click', ()=> chatWidget.classList.remove('show'));
  // send basic message
  document.getElementById('send-chat')?.addEventListener('click', ()=>{
    const input = document.getElementById('chat-text');
    if(!input || !input.value) return;
    const messages = document.getElementById('chat-messages');
    const m = document.createElement('div'); m.className = 'chat-message user'; m.textContent = input.value;
    messages.appendChild(m);
    input.value = '';
    setTimeout(()=> {
      const bot = document.createElement('div'); bot.className = 'chat-message bot'; bot.textContent = 'Gracias por tu mensaje. Pronto te contestaremos.';
      messages.appendChild(bot);
      messages.scrollTop = messages.scrollHeight;
    }, 600);
  });
}

/* ------------- WhatsApp buttons (simple) ------------- */
function initWhatsAppButtons(){
  document.getElementById('whatsapp-send-event')?.addEventListener('click', ()=>{
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero info del bazar NOVAFLOW')}`;
    window.open(url,'_blank');
  });
  document.getElementById('whatsapp-cart')?.addEventListener('click', ()=>{
    const items = Object.keys(cart).map(id=>{
      const p = PRODUCTS.find(x=>x.id===id);
      return p ? `${p.title} x${cart[id]}` : '';
    }).join(', ');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE_BASE + ' Pedido: ' + items)}`;
    window.open(url,'_blank');
  });
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

/* ------------- Misc helpers ------------- */
function noop(){}

/* ------------- Export (optional) ------------- */
// Puedes agregar funciones para exportar pedidos, simular pago, etc.
// Por ahora todo está básico y estable.

