/* script.js - NOVAFLOW (actualizado)
   - Categorías con productos y proveedor
   - Reviews (stars + texto) guardadas en localStorage
   - Carrusel mejorado con swipe (sin flechas)
   - Modal de producto con agregar reseña
   - Carrito persistente, checkout simulado
   - Countdown y reloj
   - WhatsApp + ubicación
   - Chat simulado
*/

/* ---------------- CONFIG & STORAGE KEYS ---------------- */
const EVENT_ISO = '2025-12-26T16:00:00-06:00';
const TIMEZONE = 'America/Mexico_City';
const CART_KEY = 'novaflow_cart_vfinal';
const REVIEWS_KEY = 'novaflow_reviews_v1';
const ORDERS_KEY = 'novaflow_orders_v1';
const WHATSAPP_NUMBER = '525654595169';
const WHATSAPP_MESSAGE_BASE = 'Hola, quiero consultar sobre un producto de NOVAFLOW.';

/* ---------------- CATEGORIES & PRODUCTS (prepopulados) ----------------
   Cada producto tiene: id, title, price, category, desc, img, provider
*/
const CATEGORIES = ['snacks', 'postres', 'ropa y moda', 'de coleccion', 'bebidas', 'snacks frios'];

const PRODUCTS = [
  // SNACKS
  { id:'s1', title:'Chips NovaCrunch', price:45, category:'snacks', desc:'Bolsa 120g, sabor clásico', img:'img/product_chips.jpg', provider:'Sabores MX' },
  { id:'s2', title:'NovaPop Palomitas', price:35, category:'snacks', desc:'Palomitas artesanales', img:'img/product_palomitas.jpg', provider:'PopHouse' },

  // POSTRES
  { id:'p1', title:'Brownie NOVAFLOW', price:70, category:'postres', desc:'Brownie casero con nuez', img:'img/product_brownie.jpg', provider:'DulceArte' },
  { id:'p2', title:'Cheesecake Mini', price:85, category:'postres', desc:'Porción individual', img:'img/product_cheesecake.jpg', provider:'La Pastelería' },

  // ROPA Y MODA
  { id:'r1', title:'Playera NOVAFLOW', price:450, category:'ropa y moda', desc:'Algodón orgánico, edición 2025', img:'img/product_playera.jpg', provider:'Textil Nova' },
  { id:'r2', title:'Gorra NovaCap', price:220, category:'ropa y moda', desc:'Unisex, bordado', img:'img/product_gorra.jpg', provider:'Headwear Co' },

  // DE COLECCION
  { id:'c1', title:'Figura NovaBot', price:1299, category:'de coleccion', desc:'Figura edición limitada #7', img:'img/product_figura.jpg', provider:'Collectibles MX' },
  { id:'c2', title:'Tarjeta Autografiada', price:350, category:'de coleccion', desc:'Serie numerada 2025', img:'img/product_tarjeta.jpg', provider:'Merch Studio' },

  // BEBIDAS
  { id:'d1', title:'Café filtrado', price:45, category:'bebidas', desc:'Café filtrado 12oz', img:'img/product_cafe.jpg', provider:'Café Central' },
  { id:'d2', title:'Jugo Natural', price:55, category:'bebidas', desc:'Jugo recién exprimido', img:'img/product_jugo.jpg', provider:'GreenJuice' },

  // SNACKS FRIOS
  { id:'sf1', title:'Ensalada Nova', price:120, category:'snacks frios', desc:'Ensalada fresca con aderezo', img:'img/product_ensalada.jpg', provider:'FreshCorner' },
  { id:'sf2', title:'Wrap Frío', price:95, category:'snacks frios', desc:'Wrap de pollo frío', img:'img/product_wrap.jpg', provider:'Delicias Rápidas' }
];

/* Featured: algunos ids */
const FEATURED_IDS = ['r1','c1','d1','p1'];

/* ---------------- STATE ---------------- */
let cart = {};
let reviews = {}; // loaded from localStorage
let lastKnownLocation = null;

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  initData();
  initTheme();
  initClock();
  initCountdown();
  initCategoryChips();
  renderProductsByCategory(); // initial render -> all
  initFeaturedCarousel();
  initCart();
  initModalHandlers();
  initChat();
  initWhatsAppButtons();
  initInstallPrompt();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------------- Persistence helpers ---------------- */
function loadReviews(){ try { reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {}; } catch(e){ reviews = {}; } }
function saveReviews(){ localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); }
function loadCart(){ try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch(e){ cart = {}; } }
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

/* initialize data */
function initData(){ loadReviews(); loadCart(); }

/* ---------------- THEME ---------------- */
function initTheme(){
  // already default dark; toggle functionality (kept for future)
  const btn = document.getElementById('theme-toggle');
  btn.addEventListener('click', () => {
    document.getElementById('app').classList.toggle('theme-dark');
  });
}

/* ---------------- CLOCK ---------------- */
function initClock(){
  const el = document.getElementById('live-clock');
  function tick(){
    try {
      const now = new Date();
      el.textContent = now.toLocaleString('es-MX', { timeZone: TIMEZONE, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    } catch(e){
      el.textContent = new Date().toLocaleTimeString();
    }
  }
  tick(); setInterval(tick,1000);
}

/* ---------------- COUNTDOWN ---------------- */
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
    setText('cd-days', days); setText('cd-hours', hours); setText('cd-mins', mins); setText('cd-secs', secs);
    const big = document.getElementById('countdown-large');
    if(big) big.innerHTML = `
      <div class="cd-piece"><span>${pad(days)}</span><small>DÍAS</small></div>
      <div class="cd-piece"><span>${pad(hours)}</span><small>HORAS</small></div>
      <div class="cd-piece"><span>${pad(mins)}</span><small>MIN</small></div>
      <div class="cd-piece"><span>${pad(secs)}</span><small>SEG</small></div>
    `;
  }
  update(); setInterval(update,1000);
}
function setText(id, n){ const el = document.getElementById(id); if(el) el.textContent = String(n).padStart(2,'0'); }
function pad(n){ return String(n).padStart(2,'0'); }

/* ---------------- CATEGORIES UI ---------------- */
function initCategoryChips(){
  const container = document.getElementById('category-chips');
  container.innerHTML = '';
  // Add 'Todas' chip
  const allChip = createChip('all','Todas', true);
  container.appendChild(allChip);
  CATEGORIES.forEach(cat => {
    const chip = createChip(cat, capitalize(cat), false);
    container.appendChild(chip);
  });
}
function createChip(key, label, active=false){
  const btn = document.createElement('button');
  btn.className = 'chip' + (active?' active':'');
  btn.dataset.cat = key;
  btn.textContent = label;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderProductsByCategory(key === 'all' ? null : key);
  });
  return btn;
}
function capitalize(s){ return s.split(' ').map(w => w[0].toUpperCase()+w.slice(1)).join(' '); }

/* ---------------- RENDER PRODUCTS ---------------- */
function renderProductsByCategory(category = null){
  const root = document.getElementById('products');
  root.innerHTML = '';
  // filter products
  const list = category ? PRODUCTS.filter(p => p.category === category) : PRODUCTS.slice();
  list.forEach(p => {
    const card = document.createElement('div'); card.className = 'product card';
    // thumb with image
    const thumb = document.createElement('div'); thumb.className = 'thumb';
    const img = document.createElement('img');
    img.src = p.img || '';
    img.alt = p.title;
    img.onerror = () => { img.style.display = 'none'; thumb.textContent = p.category.toUpperCase(); };
    thumb.appendChild(img);

    const h3 = document.createElement('h3'); h3.textContent = p.title;
    const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = p.desc;
    const provider = document.createElement('div'); provider.className = 'provider'; provider.textContent = `Proveedor: ${p.provider}`;
    const price = document.createElement('div'); price.className = 'price'; price.textContent = `$${p.price.toFixed(2)}`;

    // rating display
    const ratingWrap = document.createElement('div'); ratingWrap.className = 'rating';
    const avg = getAverageRating(p.id);
    const stars = document.createElement('div'); stars.className = 'stars';
    for(let i=1;i<=5;i++){
      const s = document.createElement('span'); s.className = 'star' + (i<=Math.round(avg) ? ' filled' : ''); s.innerHTML = '★';
      stars.appendChild(s);
    }
    const rateLabel = document.createElement('div'); rateLabel.textContent = `${avg.toFixed(1)} (${getReviewCount(p.id)})`; rateLabel.style.marginLeft='8px'; rateLabel.style.color='var(--muted)';
    ratingWrap.appendChild(stars); ratingWrap.appendChild(rateLabel);

    // actions
    const meta = document.createElement('div'); meta.className = 'meta';
    const addBtn = document.createElement('button'); addBtn.className = 'btn-outline add-btn'; addBtn.textContent = 'Añadir'; addBtn.dataset.id = p.id;
    addBtn.addEventListener('click', ()=> addToCart(p.id,1));
    const viewBtn = document.createElement('button'); viewBtn.className = 'btn-primary'; viewBtn.textContent='Ver'; viewBtn.addEventListener('click', ()=> openProductModal(p.id));
    meta.appendChild(price); meta.appendChild(addBtn); meta.appendChild(viewBtn);

    card.appendChild(thumb); card.appendChild(h3); card.appendChild(desc); card.appendChild(provider); card.appendChild(ratingWrap); card.appendChild(meta);
    root.appendChild(card);
  });
}

/* ---------------- REVIEWS & RATINGS ---------------- */
function getAverageRating(productId){
  const r = reviews[productId] || [];
  if(r.length===0) return 0;
  return r.reduce((s,x)=>s+x.rating,0)/r.length;
}
function getReviewCount(productId){ return (reviews[productId]||[]).length; }
function addReview(productId, author, text, rating){
  if(!reviews[productId]) reviews[productId] = [];
  reviews[productId].unshift({ author, text, rating, createdAt: new Date().toISOString() });
  saveReviews();
  renderProductsByCategory(); // update ratings displayed
  // if modal open for same product, refresh reviews area
  const modal = document.getElementById('product-modal');
  if(modal && modal.classList.contains('show') && modal.dataset.current === productId){
    renderModalContent(productId);
  }
}

/* ---------------- PRODUCT MODAL ---------------- */
function initModalHandlers(){
  document.getElementById('modal-close').addEventListener('click', closeProductModal);
  document.getElementById('product-modal').addEventListener('click', (e)=> {
    if(e.target.id === 'product-modal') closeProductModal();
  });
}
function openProductModal(productId){
  const modal = document.getElementById('product-modal');
  modal.dataset.current = productId;
  renderModalContent(productId);
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function closeProductModal(){
  const modal = document.getElementById('product-modal');
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
  delete modal.dataset.current;
}
function renderModalContent(productId){
  const p = PRODUCTS.find(x=>x.id===productId);
  const cont = document.getElementById('modal-content');
  cont.innerHTML = '';
  if(!p) return;
  const wrapper = document.createElement('div'); wrapper.className = 'product-detail';
  const left = document.createElement('div'); left.className = 'detail-left';
  const right = document.createElement('div'); right.className = 'detail-right';

  const imgBig = document.createElement('div'); imgBig.className = 'img-big';
  const img = document.createElement('img'); img.src = p.img || ''; img.alt = p.title;
  img.onerror = ()=> { img.style.display='none'; imgBig.textContent = p.title; imgBig.style.display='flex'; imgBig.style.alignItems='center'; imgBig.style.justifyContent='center' };
  imgBig.appendChild(img);

  left.appendChild(imgBig);

  const h3 = document.createElement('h3'); h3.textContent = p.title;
  const desc = document.createElement('div'); desc.className='desc'; desc.textContent = p.desc;
  const provider = document.createElement('div'); provider.className='provider'; provider.textContent = `Proveedor: ${p.provider}`;
  const price = document.createElement('div'); price.className='price'; price.textContent = `$${p.price.toFixed(2)}`;

  const addBtn = document.createElement('button'); addBtn.className='btn-primary'; addBtn.textContent='Añadir al carrito'; addBtn.addEventListener('click', ()=> { addToCart(p.id,1); });

  // review form
  const reviewSection = document.createElement('div'); reviewSection.className='reviews';
  const reviewsList = document.createElement('div'); reviewsList.id = 'reviews-list';
  updateReviewsList(productId, reviewsList);

  const reviewForm = document.createElement('div'); reviewForm.style.marginTop='12px';
  reviewForm.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">Dejar reseña</div>
    <input id="rv-author" placeholder="Tu nombre" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04)"/>
    <textarea id="rv-text" placeholder="Escribe tu opinión..." style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);margin-top:8px"></textarea>
    <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
      <div id="rv-stars"></div>
      <button id="rv-submit" class="btn-primary">Enviar</button>
    </div>
  `;

  // stars input
  const starsDiv = reviewForm.querySelector('#rv-stars');
  let selectedRating = 5;
  for(let i=1;i<=5;i++){
    const sp = document.createElement('span'); sp.className='star filled'; sp.innerHTML='★'; sp.dataset.v=i;
    sp.addEventListener('click', ()=> {
      selectedRating = Number(sp.dataset.v);
      [...starsDiv.children].forEach(ch => ch.classList.toggle('filled', Number(ch.dataset.v) <= selectedRating));
    });
    sp.dataset.v = i;
    starsDiv.appendChild(sp);
  }

  reviewForm.querySelector('#rv-submit').addEventListener('click', ()=> {
    const author = reviewForm.querySelector('#rv-author').value.trim() || 'Anónimo';
    const text = reviewForm.querySelector('#rv-text').value.trim() || '';
    addReview(productId, author, text, selectedRating);
    reviewForm.querySelector('#rv-author').value = ''; reviewForm.querySelector('#rv-text').value='';
    showToast('Gracias por tu reseña');
  });

  right.appendChild(h3); right.appendChild(provider); right.appendChild(price); right.appendChild(addBtn); right.appendChild(reviewSection);
  reviewSection.appendChild(reviewsList); reviewSection.appendChild(reviewForm);

  wrapper.appendChild(left); wrapper.appendChild(right);
  cont.appendChild(wrapper);
}

/* update reviews list element */
function updateReviewsList(productId, container){
  container.innerHTML = '';
  const list = (reviews[productId]||[]);
  if(list.length === 0) { container.innerHTML = '<div class="muted">Aún no hay reseñas</div>'; return; }
  list.forEach(r => {
    const it = document.createElement('div'); it.className='review-item';
    it.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${escapeHTML(r.author)}</strong><div class="rating">${'★'.repeat(r.rating)}</div></div>
                    <div style="margin-top:6px;color:var(--muted);font-size:13px">${escapeHTML(r.text)}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:6px">${new Date(r.createdAt).toLocaleString()}</div>`;
    container.appendChild(it);
  });
}

/* small escape to avoid naive HTML injection */
function escapeHTML(s){ return (s+'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }

/* ---------------- FEATURED CAROUSEL (SWIPE-enabled) ---------------- */
function initFeaturedCarousel(){
  const track = document.getElementById('carousel-track');
  track.innerHTML = '';
  const ids = FEATURED_IDS;
  ids.forEach(id => {
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p) return;
    const item = document.createElement('div'); item.className='carousel-item';
    const thumb = document.createElement('div'); thumb.className='thumb';
    if(p.img){ const iim = document.createElement('img'); iim.src=p.img; iim.alt=p.title; iim.style.width='100%'; iim.style.height='100%'; iim.style.objectFit='cover'; iim.onerror = ()=> { thumb.textContent = p.title; }; thumb.appendChild(iim); }
    else { thumb.textContent = p.title; }
    const right = document.createElement('div'); right.style.flex='1';
    right.innerHTML = `<div style="font-weight:800">${p.title}</div><div class="muted small">${p.desc}</div><div style="margin-top:8px;font-weight:800;color:var(--gold)">$${p.price.toFixed(2)}</div>`;
    item.appendChild(thumb); item.appendChild(right);
    item.addEventListener('click', ()=> openProductModal(p.id));
    track.appendChild(item);
  });

  // dots
  const dotsWrap = document.getElementById('carousel-dots'); dotsWrap.innerHTML = '';
  ids.forEach((_,i)=> { const d = document.createElement('div'); d.className='dot'; d.dataset.idx=i; dotsWrap.appendChild(d); d.addEventListener('click', ()=> goToSlide(i)); });

  makeSwipeable(document.querySelector('.carousel-track-wrapper'), track, ids.length);
  goToSlide(0);
  // autoplay
  clearInterval(window._novaflow_carousel_interval);
  window._novaflow_carousel_interval = setInterval(()=> goToSlide((currentSlideIndex()+1) % ids.length), 5000);
}
let carouselPos = 0;
function currentSlideIndex(){
  const track = document.getElementById('carousel-track');
  const transform = track.style.transform || '';
  const m = transform.match(/translateX\(-?(\d+)px\)/);
  if(!m) return 0;
  const px = Number(m[1]);
  const w = (track.children[0]?.getBoundingClientRect().width || 300) + 12;
  return Math.round(px / w);
}
function goToSlide(i){
  const track = document.getElementById('carousel-track');
  const item = track.children[0];
  if(!item) return;
  const w = item.getBoundingClientRect().width + 12;
  const max = Math.max(0, track.children.length - 1);
  let idx = ((i % (max+1)) + (max+1)) % (max+1);
  track.style.transform = `translateX(-${idx * w}px)`;
  // dots
  document.querySelectorAll('.carousel-dots .dot').forEach((d,di)=> d.classList.toggle('active', di===idx));
}

/* make container swipeable for both touch and mouse drag */
function makeSwipeable(wrapper, track, itemCount){
  let pointerDown = false, startX=0, currentX=0, baseX=0;
  const itemWidth = () => (track.children[0]?.getBoundingClientRect().width || 300) + 12;

  wrapper.addEventListener('pointerdown', (e)=>{
    pointerDown = true; wrapper.setPointerCapture(e.pointerId);
    startX = e.clientX; baseX = getTranslateX(track);
    clearInterval(window._novaflow_carousel_interval);
  });
  window.addEventListener('pointermove', (e)=>{
    if(!pointerDown) return;
    currentX = e.clientX;
    const dx = currentX - startX;
    track.style.transition = 'none';
    track.style.transform = `translateX(${(baseX + dx)}px)`;
  });
  window.addEventListener('pointerup', (e)=>{
    if(!pointerDown) return;
    pointerDown = false;
    const dx = e.clientX - startX;
    const threshold = itemWidth()/4;
    let idx = Math.round(-getTranslateX(track) / itemWidth());
    if(dx > threshold) idx = idx -1;
    if(dx < -threshold) idx = idx +1;
    // clamp
    idx = Math.max(0, Math.min(itemCount-1, idx));
    track.style.transition = '';
    goToSlide(idx);
    // restart autoplay
    clearInterval(window._novaflow_carousel_interval);
    window._novaflow_carousel_interval = setInterval(()=> goToSlide((idx+1) % itemCount), 5000);
  });

  // helper to get translateX numeric value
  function getTranslateX(el){
    const t = window.getComputedStyle(el).transform;
    if(!t || t === 'none') return 0;
    const mat = t.match(/matrix\((.+)\)/);
    if(mat){ const vals = mat[1].split(', '); return Number(vals[4]); }
    const mat3d = t.match(/matrix3d\((.+)\)/);
    if(mat3d){ const vals = mat3d[1].split(', '); return Number(vals[12]); }
    return 0;
  }
}

/* ---------------- CART ---------------- */
function initCart(){
  renderCartCount();
  document.getElementById('cart-toggle').addEventListener('click', ()=> toggleCart(true));
  document.getElementById('close-cart').addEventListener('click', ()=> toggleCart(false));
  document.getElementById('clear-cart').addEventListener('click', ()=> { if(confirm('Vaciar carrito?')) { cart={}; saveCart(); renderCart(); renderCartCount(); updateEstimate(); } });
  document.getElementById('checkout').addEventListener('click', handleCheckout);
  document.getElementById('whatsapp-cart').addEventListener('click', handleWhatsAppCart);
  renderCart();
  updateEstimate();
}
function addToCart(productId, qty=1){
  cart[productId] = (cart[productId] || 0) + qty;
  if(cart[productId] <= 0) delete cart[productId];
  saveCart();
  renderCartCount();
  renderCart();
  updateEstimate();
  showToast('Artículo añadido al carrito');
}
function renderCartCount(){
  const count = Object.values(cart).reduce((s,n)=>s+n,0);
  document.getElementById('cart-count').textContent = count;
}
function toggleCart(show){
  const bar = document.getElementById('cart');
  if(show){ bar.classList.add('show'); bar.setAttribute('aria-hidden','false'); } else { bar.classList.remove('show'); bar.setAttribute('aria-hidden','true'); }
}
function renderCart(){
  const container = document.getElementById('cart-items'); container.innerHTML='';
  const ids = Object.keys(cart);
  if(ids.length===0){ container.innerHTML='<div class="muted">Tu carrito está vacío.</div>'; updateTotals(0); return; }
  let subtotal = 0;
  ids.forEach(id=>{
    const p = PRODUCTS.find(x=>x.id===id);
    const qty = cart[id];
    const sub = p.price * qty;
    subtotal += sub;
    const item = document.createElement('div'); item.className='cart-item';
    item.innerHTML = `<div style="flex:1"><div><strong>${p.title}</strong></div><div class="muted small">${p.provider}</div></div>
      <div style="text-align:right"><div>$${sub.toFixed(2)}</div>
      <div class="qty" style="margin-top:8px">
        <button class="icon-btn small dec" data-id="${id}">−</button>
        <span>${qty}</span>
        <button class="icon-btn small inc" data-id="${id}">+</button>
        <button class="icon-btn small rem" data-id="${id}" title="Eliminar">🗑️</button>
      </div></div>`;
    container.appendChild(item);
  });
  container.querySelectorAll('.inc').forEach(b=>b.addEventListener('click', e=> addToCart(e.currentTarget.dataset.id,1)));
  container.querySelectorAll('.dec').forEach(b=>b.addEventListener('click', e=> addToCart(e.currentTarget.dataset.id,-1)));
  container.querySelectorAll('.rem').forEach(b=> b.addEventListener('click', e=> { delete cart[e.currentTarget.dataset.id]; saveCart(); renderCart(); renderCartCount(); updateEstimate(); }));
  updateTotals(subtotal);
}
function updateTotals(subtotal){
  const shipping = subtotal > 1000 ? 0 : (subtotal === 0 ? 0 : 35);
  const grand = subtotal + shipping;
  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
  document.getElementById('grandtotal').textContent = `$${grand.toFixed(2)}`;
}
function updateEstimate(){ const ids = Object.keys(cart); if(ids.length===0){ document.getElementById('estimate-value').textContent='Sin artículos'; return; } const items = ids.map(id=>({id,qty:cart[id]})); const est = calculateEstimateMinutes(items); document.getElementById('estimate-value').innerHTML=`<strong>${est} min</strong> <div class="muted small">Estimado</div>`; }
function calculateEstimateMinutes(items){ let base = 25; if(items.some(it=> { const p=PRODUCTS.find(pp=>pp.id===it.id); return p?.category==='snacks' || p?.category==='snacks frios' || p?.category==='postres' || p?.category==='bebidas'; })) base += 8; base += items.reduce((s,it)=> s + Math.min(6, Math.floor(it.qty)), 0); base += Math.floor((Math.random()*7)-3); return Math.max(12, Math.round(base)); }

/* ---------------- CHECKOUT & ORDERS (simulate status progression) ---------------- */
function handleCheckout(){
  const ids = Object.keys(cart);
  if(ids.length===0){ showToast('El carrito está vacío'); return; }
  const name = prompt('Nombre para el pedido:') || 'Cliente';
  const email = prompt('Correo (opcional):') || '';
  const phone = prompt('Teléfono (opcional):') || '';
  const items = ids.map(id=> { const p=PRODUCTS.find(x=>x.id===id); return { id:p.id, title:p.title, qty:cart[id], price:p.price }; });
  const subtotal = items.reduce((s,i)=>s + i.qty*i.price, 0);
  const shipping = subtotal>1000?0: (subtotal===0?0:35);
  const estimate = calculateEstimateMinutes(items);
  const order = { id:'ORD_'+Date.now().toString(36), createdAt:new Date().toISOString(), name, email, phone, items, subtotal, shipping, total: subtotal+shipping, estimate, status:'Registrado' };
  // save orders locally
  try { const arr = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); arr.unshift(order); localStorage.setItem(ORDERS_KEY, JSON.stringify(arr)); } catch(e){}
  cart = {}; saveCart(); renderCart(); renderCartCount(); updateEstimate(); toggleCart(false); showToast(`Pedido registrado. Est: ${estimate} min`);
  simulateOrderProgress(order.id);
}
function simulateOrderProgress(orderId){
  setTimeout(()=> updateOrderStatus(orderId,'Preparando',true), 10000);
  setTimeout(()=> updateOrderStatus(orderId,'En ruta',true), 20000);
  setTimeout(()=> updateOrderStatus(orderId,'Entregado',true), 35000);
}
function updateOrderStatus(orderId,status,notify=false){
  try{
    const arr = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const idx = arr.findIndex(o=>o.id===orderId);
    if(idx>=0){ arr[idx].status = status; localStorage.setItem(ORDERS_KEY, JSON.stringify(arr)); }
    if(notify) sendLocalNotification(`Pedido ${orderId}: ${status}`, `Tu pedido está ${status.toLowerCase()}.`);
  } catch(e){}
}

/* ---------------- WHATSAPP & GEO ---------------- */
function buildWhatsAppUrl(messageText, coords=null){
  let text = messageText || WHATSAPP_MESSAGE_BASE;
  if(coords){
    const maps = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;
    text += ` Mi ubicación: ${maps}`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
function initWhatsAppButtons(){
  document.getElementById('whatsapp-quick').addEventListener('click', (e)=>{ e.preventDefault(); window.open(buildWhatsAppUrl(WHATSAPP_MESSAGE_BASE, lastKnownLocation),'_blank'); });
  const evBtn = document.getElementById('whatsapp-send-event'); if(evBtn) evBtn.addEventListener('click', ()=> window.open(buildWhatsAppUrl(WHATSAPP_MESSAGE_BASE, lastKnownLocation),'_blank'));
  const shareBtn = document.getElementById('share-location-btn'); if(shareBtn) shareBtn.addEventListener('click', async ()=>{
    try { showToast('Solicitando ubicación...'); const pos = await getCurrentPositionPromise({ enableHighAccuracy:true, timeout:10000 }); lastKnownLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude }; showToast('Ubicación guardada. Ahora puedes compartir por WhatsApp.'); } catch(e){ showToast('No se pudo obtener ubicación.'); }
  });
  document.getElementById('whatsapp-cart').addEventListener('click', async ()=>{
    const ids = Object.keys(cart); if(ids.length===0){ showToast('Carrito vacío'); return; }
    let itemsText = ids.map(id => { const p = PRODUCTS.find(x=>x.id===id); return `${cart[id]}× ${p.title} ($${(p.price*cart[id]).toFixed(2)})`; }).join('\n');
    const subtotal = ids.reduce((s,id)=> s + PRODUCTS.find(p=>p.id===id).price * cart[id], 0);
    const shipping = subtotal>1000?0:35;
    const total = subtotal + shipping;
    const confirmWithLocation = confirm('¿Incluir tu ubicación?');
    if(confirmWithLocation){
      try { const pos = await getCurrentPositionPromise({ enableHighAccuracy:true, timeout:10000 }); lastKnownLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude }; } catch(e){ showToast('No se pudo obtener ubicación.'); }
    }
    let message = `${WHATSAPP_MESSAGE_BASE}\n\nPedido:\n${itemsText}\n\nSubtotal: $${subtotal.toFixed(2)}\nEnvío: $${shipping.toFixed(2)}\nTotal: $${total.toFixed(2)}`;
    if(lastKnownLocation){ const maps = `https://www.google.com/maps/search/?api=1&query=${lastKnownLocation.lat},${lastKnownLocation.lon}`; message += `\n\nUbicación: ${maps}`; }
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,'_blank');
  });
}
function getCurrentPositionPromise(options={}){ return new Promise((resolve,reject)=>{ if(!navigator.geolocation) return reject(new Error('No soportado')); navigator.geolocation.getCurrentPosition(resolve,reject,options); }); }

/* ---------------- CHAT ---------------- */
function initChat(){
  const openBtn = document.getElementById('open-chat'); const floatBtn = document.getElementById('chat-floating');
  const chat = document.getElementById('chat-widget'); const close = document.getElementById('close-chat');
  const send = document.getElementById('send-chat'); const input = document.getElementById('chat-text'); const messages = document.getElementById('chat-messages');
  const canned = [{ q:'horarios', a:'El próximo bazar es 26 de diciembre de 2025, 4:00 PM.' },{ q:'envio', a:'El envío estándar tarda entre 30 y 50 minutos.' }];
  function openChat(){ chat.classList.add('show'); chat.setAttribute('aria-hidden','false'); pushBot('Hola 👋 Soy NOVABOT. ¿En qué puedo ayudarte?'); }
  function closeChat(){ chat.classList.remove('show'); chat.setAttribute('aria-hidden','true'); }
  function pushUser(t){ const d=document.createElement('div'); d.className='chat-message user'; d.textContent=t; messages.appendChild(d); messages.scrollTop=messages.scrollHeight; }
  function pushBot(t){ const d=document.createElement('div'); d.className='chat-message bot'; d.textContent=t; messages.appendChild(d); messages.scrollTop=messages.scrollHeight; }
  openBtn.addEventListener('click', openChat); floatBtn.addEventListener('click', openChat); close.addEventListener('click', closeChat);
  send.addEventListener('click', ()=> { const txt = input.value.trim(); if(!txt) return; pushUser(txt); input.value=''; setTimeout(()=> { const key=txt.toLowerCase(); const found=canned.find(c=>key.includes(c.q)); if(found) pushBot(found.a); else pushBot('Gracias, nuestro equipo te responderá pronto.'); },600); });
}

/* ---------------- INSTALL PROMPT (PWA) ---------------- */
let deferredPrompt = null;
function initInstallPrompt(){
  const installBtn = document.getElementById('install-btn');
  window.addEventListener('beforeinstallprompt', (e)=> {
    e.preventDefault(); deferredPrompt = e; installBtn.style.display='inline-block';
    installBtn.addEventListener('click', async ()=> {
      installBtn.style.display='none';
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if(choice.outcome === 'accepted') showToast('NOVAFLOW instalado');
      deferredPrompt = null;
    });
  });
  window.addEventListener('appinstalled', ()=> showToast('NOVAFLOW instalado'));
}

/* ---------------- UTIL: Toast / debounce / escape ---------------- */
function showToast(text, ms=3000){
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div'); t.className='toast'; t.textContent=text;
  Object.assign(t.style,{background:'rgba(2,6,11,0.9)',color:'#fff',padding:'10px 14px',borderRadius:'8px',marginTop:'8px',fontWeight:700});
  wrap.appendChild(t); setTimeout(()=> { t.style.transition='opacity 400ms'; t.style.opacity='0'; setTimeout(()=> wrap.removeChild(t), 450); }, ms);
}
function debounce(fn, wait=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }

/* ---------------- HELPERS ---------------- */

function getProductById(id){ return PRODUCTS.find(p=>p.id===id); }
function renderProductsByCategoryWrapper(category){ renderProductsByCategory(category); }

