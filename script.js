/* NOVAFLOW - script.js (PWA + funciones completas)
   - Contiene: reloj, countdown, productos, carrito persistente,
     checkout simulado, historial en localStorage, carrito -> WhatsApp,
     geolocalización, chat simulado, PWA install prompt, service worker interactions,
     notificaciones locales simuladas (Notification API).
*/

/* ---------------- CONFIG ---------------- */
const EVENT_ISO = '2025-12-26T16:00:00-06:00';
const TIMEZONE = 'America/Mexico_City';
const CART_KEY = 'novaflow_cart_pwa_v1';
const ORDERS_KEY = 'novaflow_orders_pwa_v1';
const WHATSAPP_NUMBER = '525654595169'; // wa.me format without +
const WHATSAPP_MESSAGE_BASE = 'Hola, quiero consultar sobre un producto de NOVAFLOW.';

/* Productos (usa tus imágenes en img/) */
const PRODUCTS = [
  { id:'f1', title:'Producto', price:65, category:'food', desc:'Taco tradicional. 1 pieza.', img:'img/product_taco.jpg' },
  { id:'f2', title:'Producto', price:120, category:'food', desc:'Bowl con vegetales y proteína.', img:'img/product_bowl.jpg' },
  { id:'d1', title:'Producto', price:45, category:'drinks', desc:'Café filtrado 12oz.', img:'img/product_cafe.jpg' },
  { id:'d2', title:'Producto', price:55, category:'drinks', desc:'Jugo recién exprimido.', img:'img/product_jugo.jpg' },
  { id:'c1', title:'Producto', price:450, category:'clothing', desc:'Edición 2025, algodón.', img:'img/product_tee.jpg' },
  { id:'c2', title:'Producto', price:850, category:'clothing', desc:'Capucha, logo bordado.', img:'img/product_hoodie.jpg' },
  { id:'col1', title:'Producto', price:1200, category:'collectibles', desc:'Edición limitada.', img:'img/product_fig.jpg' },
  { id:'col2', title:'Producto', price:350, category:'collectibles', desc:'Serie numerada.', img:'img/product_card.jpg' }
];

const FEATURED = [PRODUCTS[4], PRODUCTS[5], PRODUCTS[6]];

/* estado */
let cart = {};
let lastKnownLocation = null;
let deferredPrompt = null;

/* --------------- boot --------------- */
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initCountdown();
  renderProducts(PRODUCTS);
  initSearchAndFilters();
  initNav();
  initCart();
  initFeaturedCarousel();
  initChat();
  initWhatsAppButtons();
  initPWAInstall();
  requestNotificationPermission();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* --------------- Clock --------------- */
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
  tick(); setInterval(tick, 1000);
}

/* --------------- Countdown --------------- */
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
  update(); setInterval(update, 1000);
}
function setText(id, n){ const el = document.getElementById(id); if(el) el.textContent = String(n).padStart(2,'0'); }
function pad(n){ return String(n).padStart(2,'0'); }

/* --------------- Nav & scroll --------------- */
function initNav(){
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => { scrollToSection(btn.dataset.target); document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n===btn)); });
  });
  window.addEventListener('scroll', () => {
    const ids = ['home','catalog','featured','events','contact'];
    let found = 'home';
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      const rect = el.getBoundingClientRect();
      if(rect.top <= 140) found = id;
    });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === found));
  });
}
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  toggleCart(false);
}

/* --------------- Products rendering --------------- */
function renderProducts(list){
  const root = document.getElementById('products');
  root.innerHTML = '';
  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product card';
    // use image if exists (user will provide img/ files)
    const imgHtml = p.img ? `<div class="thumb" aria-hidden="true" style="background-image:url('${p.img}');background-size:cover;background-position:center"></div>` : `<div class="thumb">${p.category.toUpperCase()}</div>`;
    div.innerHTML = `
      ${imgHtml}
      <h3>${p.title}</h3>
      <div class="desc">${p.desc}</div>
      <div class="meta">
        <div class="price">$${p.price.toFixed(2)}</div>
        <div><button class="btn-outline add-btn" data-id="${p.id}">Añadir</button></div>
      </div>
    `;
    root.appendChild(div);
  });
  document.querySelectorAll('.add-btn').forEach(b => b.addEventListener('click', (e) => addToCart(e.currentTarget.dataset.id, 1)));
}

/* --------------- Search & Filters --------------- */
function initSearchAndFilters(){
  const searchInput = document.getElementById('search');
  const chips = document.querySelectorAll('.chip');
  const sortSel = document.getElementById('sort');

  function applyFilters(){
    const q = searchInput.value.trim().toLowerCase();
    const cat = document.querySelector('.chip.active')?.dataset.cat || 'all';
    let filtered = PRODUCTS.slice();
    if(cat !== 'all') filtered = filtered.filter(p => p.category === cat);
    if(q) filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q));
    const sort = sortSel.value;
    if(sort === 'price-asc') filtered.sort((a,b)=>a.price-b.price);
    if(sort === 'price-desc') filtered.sort((a,b)=>b.price-a.price);
    renderProducts(filtered);
  }

  searchInput.addEventListener('input', debounce(applyFilters, 160));
  chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); applyFilters(); }));
  sortSel.addEventListener('change', applyFilters);
}

/* --------------- Cart --------------- */
function initCart(){
  loadCart(); renderCartCount();
  document.getElementById('cart-toggle').addEventListener('click', () => toggleCart(true));
  document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
  document.getElementById('clear-cart').addEventListener('click', () => { if(confirm('¿Vaciar carrito?')) { cart = {}; saveCart(); renderCart(); renderCartCount(); updateEstimate(); }});
  document.getElementById('checkout').addEventListener('click', handleCheckout);
  document.getElementById('whatsapp-cart').addEventListener('click', handleWhatsAppCart);
  renderCart(); updateEstimate();
}
function loadCart(){ try{ cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch(e){ cart = {}; } }
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function addToCart(id, qty=1){
  cart[id] = (cart[id] || 0) + qty;
  if(cart[id] <= 0) delete cart[id];
  saveCart(); renderCartCount(); renderCart(); updateEstimate(); showToast('Artículo añadido al carrito');
}
function renderCartCount(){ const count = Object.values(cart).reduce((s,n)=>s+n,0); document.getElementById('cart-count').textContent = count; }
function toggleCart(show){ const bar = document.getElementById('cart'); if(show){ bar.classList.add('show'); bar.setAttribute('aria-hidden','false'); } else { bar.classList.remove('show'); bar.setAttribute('aria-hidden','true'); } }
function renderCart(){
  const container = document.getElementById('cart-items'); container.innerHTML = '';
  const ids = Object.keys(cart); if(ids.length === 0){ container.innerHTML = '<div class="muted">Tu carrito está vacío.</div>'; updateTotals(0); return; }
  let subtotal = 0;
  ids.forEach(id => {
    const p = PRODUCTS.find(x=>x.id===id);
    const qty = cart[id];
    const sub = p.price * qty;
    subtotal += sub;
    const item = document.createElement('div'); item.className='cart-item';
    item.innerHTML = `
      <div style="flex:1">
        <div><strong>${p.title}</strong></div>
        <div class="muted small">${p.category}</div>
      </div>
      <div style="text-align:right">
        <div>$${sub.toFixed(2)}</div>
        <div class="qty" style="margin-top:8px">
          <button class="icon-btn small dec" data-id="${id}">−</button>
          <span>${qty}</span>
          <button class="icon-btn small inc" data-id="${id}">+</button>
          <button class="icon-btn small rem" data-id="${id}" title="Eliminar">🗑️</button>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
  container.querySelectorAll('.inc').forEach(b => b.addEventListener('click', e => addToCart(e.currentTarget.dataset.id, 1)));
  container.querySelectorAll('.dec').forEach(b => b.addEventListener('click', e => addToCart(e.currentTarget.dataset.id, -1)));
  container.querySelectorAll('.rem').forEach(b => b.addEventListener('click', e => { delete cart[e.currentTarget.dataset.id]; saveCart(); renderCart(); renderCartCount(); updateEstimate(); }));
  updateTotals(subtotal);
}
function updateTotals(subtotal){
  const shipping = subtotal > 1000 ? 0 : (subtotal === 0 ? 0 : 35);
  const grand = subtotal + shipping;
  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
  document.getElementById('grandtotal').textContent = `$${grand.toFixed(2)}`;
}

/* --------------- Checkout & order simulation --------------- */
function handleCheckout(){
  const ids = Object.keys(cart);
  if(ids.length === 0){ showToast('El carrito está vacío'); return; }
  const name = prompt('Nombre para el pedido:') || 'Cliente';
  const email = prompt('Correo electrónico (opcional):') || '';
  const phone = prompt('Teléfono (opcional):') || '';
  const items = ids.map(id => { const p = PRODUCTS.find(x=>x.id===id); return { id:p.id, title:p.title, qty:cart[id], price:p.price }; });
  const subtotal = items.reduce((s,i)=>s + i.qty*i.price, 0);
  const shipping = subtotal>1000?0: (subtotal===0?0:35);
  const estimate = calculateEstimateMinutes(items);
  const order = { id: 'ORD_' + Date.now().toString(36), createdAt: new Date().toISOString(), name, email, phone, items, subtotal, shipping, total: subtotal+shipping, estimate, status:'Registrado' };
  saveOrder(order);
  cart = {}; saveCart(); renderCart(); renderCartCount(); updateEstimate(); toggleCart(false);
  showToast(`Pedido registrado. Tiempo estimado: ${estimate} min`);
  // simulate order progress and notifications
  simulateOrderProgress(order.id);
}
function saveOrder(order){
  try{ const arr = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); arr.unshift(order); localStorage.setItem(ORDERS_KEY, JSON.stringify(arr)); } catch(e){}
}
function calculateEstimateMinutes(items){
  let base = 25;
  if(items.some(it => { const p = PRODUCTS.find(pp=>pp.id===it.id); return p?.category === 'food'; })) base += 10;
  base += items.reduce((s,it) => s + Math.min(6, Math.floor(it.qty)), 0);
  base += Math.floor((Math.random()*7)-3);
  return Math.max(15, Math.round(base));
}

/* simulate order progress and local notifications */
function simulateOrderProgress(orderId){
  // After 10s: Preparando, after 20s: En ruta, after 35s: Entregado (timings shortened for demo)
  setTimeout(()=> updateOrderStatus(orderId, 'Preparando', true), 10000);
  setTimeout(()=> updateOrderStatus(orderId, 'En ruta', true), 20000);
  setTimeout(()=> updateOrderStatus(orderId, 'Entregado', true), 35000);
}
function updateOrderStatus(orderId, status, notify=false){
  try{
    const arr = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const idx = arr.findIndex(o=>o.id===orderId);
    if(idx>=0){ arr[idx].status = status; localStorage.setItem(ORDERS_KEY, JSON.stringify(arr)); }
    if(notify) sendLocalNotification(`Pedido ${orderId}: ${status}`, `Tu pedido está ${status.toLowerCase()}.`);
  } catch(e){}
}

/* ================================
   🛍️ PRODUCTOS DESTACADOS
================================== */

// Lista de productos destacados (puedes cambiar las imágenes y datos)
const productosDestacados = [
  {
    nombre: "Camiseta NOVAFLOW Edición Limitada",
    precio: 499,
    imagen: "img/producto1.jpg",
  },
  {
    nombre: "Bebida Energética NovaFuel",
    precio: 89,
    imagen: "img/producto2.jpg",
  },
  {
    nombre: "Figura Coleccionable NovaBot",
    precio: 1299,
    imagen: "img/producto3.jpg",
  },
  {
    nombre: "Combo NovaSnack + Drink",
    precio: 249,
    imagen: "img/producto4.jpg",
  },
  {
    nombre: "Sudadera Premium NOVAFLOW",
    precio: 699,
    imagen: "img/producto5.jpg",
  },
];

// Contenedor del carrusel
const destacadosCarousel = document.getElementById("destacadosCarousel");

// Renderiza los productos destacados
function mostrarProductosDestacados() {
  destacadosCarousel.innerHTML = "";
  productosDestacados.forEach((producto, index) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}">
      <h3>${producto.nombre}</h3>
      <p>$${producto.precio}</p>
      <button onclick="agregarAlCarrito(${index})">Agregar al carrito</button>
    `;
    destacadosCarousel.appendChild(card);
  });
}
mostrarProductosDestacados();

// ===== Carrusel funcional =====
let currentIndex = 0;
const cardWidth = 320; // ancho aproximado con margen

function moverCarrusel(direccion) {
  const maxIndex = productosDestacados.length - 1;
  currentIndex += direccion;
  if (currentIndex < 0) currentIndex = maxIndex;
  if (currentIndex > maxIndex) currentIndex = 0;

  const offset = -(currentIndex * cardWidth);
  destacadosCarousel.style.transform = `translateX(${offset}px)`;
}

document.getElementById("prevBtn").addEventListener("click", () => moverCarrusel(-1));
document.getElementById("nextBtn").addEventListener("click", () => moverCarrusel(1));

// Desplazamiento automático cada 5 segundos
setInterval(() => moverCarrusel(1), 5000);

// 🛒 Función para agregar al carrito
function agregarAlCarrito(index) {
  const producto = productosDestacados[index];
  alert(`"${producto.nombre}" agregado al carrito 🛒`);
  // Aquí puedes conectar con tu función real de carrito si ya existe
}

/* --------------- Chat simulado --------------- */
function initChat(){
  const openBtn = document.getElementById('open-chat'); const floatBtn = document.getElementById('chat-floating');
  const chat = document.getElementById('chat-widget'); const close = document.getElementById('close-chat');
  const send = document.getElementById('send-chat'); const input = document.getElementById('chat-text'); const messages = document.getElementById('chat-messages');
  const canned = [
    { q:'horarios', a:'Nuestros eventos suelen ser fines de semana; el próximo es el 26 de diciembre de 2025 a las 4:00 PM.'},
    { q:'envio', a:'El envío estándar tarda entre 30 y 50 minutos según ubicación.'},
    { q:'contacto', a:'Escribe a contacto@novaflow.example para colaboraciones.'}
  ];

  function openChat(){ chat.classList.add('show'); chat.setAttribute('aria-hidden','false'); pushBot('Hola 👋 Soy NOVABOT. ¿En qué puedo ayudarte?'); }
  function closeChat(){ chat.classList.remove('show'); chat.setAttribute('aria-hidden','true'); }
  function pushUser(text){ const div=document.createElement('div'); div.className='chat-message user'; div.textContent=text; messages.appendChild(div); messages.scrollTop=messages.scrollHeight; }
  function pushBot(text){ const div=document.createElement('div'); div.className='chat-message bot'; div.textContent=text; messages.appendChild(div); messages.scrollTop=messages.scrollHeight; }

  openBtn.addEventListener('click', openChat); floatBtn.addEventListener('click', openChat); close.addEventListener('click', closeChat);
  send.addEventListener('click', ()=> {
    const txt = input.value.trim(); if(!txt) return;
    pushUser(txt); input.value='';
    setTimeout(()=> {
      const key = txt.toLowerCase();
      const found = canned.find(c => key.includes(c.q));
      if(found) pushBot(found.a); else pushBot('Gracias por tu mensaje. Nuestro equipo te contactará pronto vía WhatsApp o correo.');
    }, 600);
  });
}

/* --------------- WhatsApp & Geolocation --------------- */
function buildWhatsAppUrl(messageText, coords=null){
  let text = messageText || WHATSAPP_MESSAGE_BASE;
  if(coords){
    const maps = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;
    text += ` Mi ubicación: ${maps}`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
function initWhatsAppButtons(){
  const quick = document.getElementById('whatsapp-quick'); quick.addEventListener('click', (e)=>{ e.preventDefault(); const url = buildWhatsAppUrl(WHATSAPP_MESSAGE_BASE, lastKnownLocation); window.open(url,'_blank'); });
  const eventBtn = document.getElementById('whatsapp-send-event'); if(eventBtn) eventBtn.addEventListener('click', ()=> window.open(buildWhatsAppUrl(WHATSAPP_MESSAGE_BASE, lastKnownLocation),'_blank'));
  const shareBtn = document.getElementById('share-location-btn'); if(shareBtn) shareBtn.addEventListener('click', async ()=>{
    try { showToast('Solicitando ubicación...'); const pos = await getCurrentPositionPromise({ enableHighAccuracy:true, timeout:10000 }); lastKnownLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude }; showToast('Ubicación obtenida. Puedes compartirla por WhatsApp.'); } catch(e){ showToast('No se pudo obtener ubicación. Revisa permisos.'); }
  });

  document.getElementById('whatsapp-cart').addEventListener('click', async ()=> {
    const ids = Object.keys(cart); if(ids.length===0){ showToast('El carrito está vacío'); return; }
    let itemsText = ids.map(id => { const p = PRODUCTS.find(x=>x.id===id); return `${cart[id]}× ${p.title} ($${(p.price*cart[id]).toFixed(2)})`; }).join('\n');
    const subtotal = ids.reduce((s,id)=> s + PRODUCTS.find(p=>p.id===id).price*cart[id], 0);
    const shipping = subtotal>1000?0:35;
    const total = subtotal + shipping;
    const confirmWithLocation = confirm('¿Incluir tu ubicación en el mensaje de WhatsApp?');
    if(confirmWithLocation){
      try { const pos = await getCurrentPositionPromise({ enableHighAccuracy:true, timeout:10000 }); lastKnownLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude }; } catch(e){ showToast('No se pudo obtener la ubicación.'); }
    }
    let message = `${WHATSAPP_MESSAGE_BASE}\n\nPedido:\n${itemsText}\n\nSubtotal: $${subtotal.toFixed(2)}\nEnvío: $${shipping.toFixed(2)}\nTotal: $${total.toFixed(2)}`;
    if(lastKnownLocation){ const maps = `https://www.google.com/maps/search/?api=1&query=${lastKnownLocation.lat},${lastKnownLocation.lon}`; message += `\n\nUbicación: ${maps}`; }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url,'_blank');
  });
}
function getCurrentPositionPromise(options={}){ return new Promise((resolve,reject)=>{ if(!navigator.geolocation) return reject(new Error('Geolocalización no soportada')); navigator.geolocation.getCurrentPosition(resolve,reject,options); }); }

/* --------------- Notifications --------------- */
function requestNotificationPermission(){
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission().then(status => console.log('Notificación permiso:', status));
  }
}
function sendLocalNotification(title, body){
  if('Notification' in window && Notification.permission === 'granted'){
    const n = new Notification(title, { body, icon: 'img/icon-192.png' });
    n.onclick = () => window.focus();
  } else {
    // fallback toast
    showToast(body, 6000);
  }
}

/* --------------- PWA Install prompt --------------- */
function initPWAInstall(){
  const installBtn = document.getElementById('install-btn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
    installBtn.addEventListener('click', async () => {
      installBtn.style.display = 'none';
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if(outcome === 'accepted') showToast('Gracias — NOVAFLOW instalado.');
      deferredPrompt = null;
    });
  });
  window.addEventListener('appinstalled', () => { showToast('NOVAFLOW instalado.'); });
}

/* --------------- Utilities --------------- */
function showToast(text, ms=3000){
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div'); t.className='toast'; t.textContent=text;
  Object.assign(t.style, { background:'rgba(2,6,11,0.9)', color:'#fff', padding:'10px 14px', borderRadius:'8px', marginTop:'8px', fontWeight:700 });
  wrap.appendChild(t);
  setTimeout(()=> { t.style.transition='opacity 400ms'; t.style.opacity='0'; setTimeout(()=> wrap.removeChild(t), 450); }, ms);
}
function debounce(fn, wait=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }


