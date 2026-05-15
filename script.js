/* ============================================================
   MIE PEDAS — JavaScript
   script.js
   ============================================================ */

/* ---- State ---- */
let cart        = [];
let modalItem   = {};
let modalQtyVal = 1;
let selectedSpicy = 'Tidak Pedas';
let deliveryFee   = 5000;
let discount      = 0;

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Format angka ke format Rupiah Indonesia.
 * @param {number} n
 * @returns {string}
 */
function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

/* ============================================================
   DELIVERY TYPE
   ============================================================ */



/* ============================================================
   FILTER KATEGORI
   ============================================================ */

/**
 * Filter tampilan menu berdasarkan kategori.
 * @param {string}      cat - kode kategori, atau 'all'
 * @param {HTMLElement} el  - elemen sidebar yang diklik
 */
function filterCat(cat, el) {
  document.querySelectorAll('.cat-item').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  document.querySelectorAll('.menu-category').forEach(mc => {
    mc.style.display = (cat === 'all' || mc.dataset.cat === cat) ? '' : 'none';
  });
}

/* ============================================================
   MODAL — DETAIL MENU
   ============================================================ */

/**
 * Buka modal detail menu.
 * @param {string}  name     - nama menu
 * @param {string}  desc     - deskripsi menu
 * @param {string}  emoji    - emoji representasi menu
 * @param {number}  price    - harga satuan (Rupiah)
 * @param {string}  cat      - kategori menu
 * @param {boolean} hasSpicy - apakah menu punya pilihan pedas
 */
function openModal(name, desc, emoji, price, cat, hasSpicy) {
  modalItem     = { name, desc, emoji, price, cat, hasSpicy };
  modalQtyVal   = 1;
  selectedSpicy = 'Tidak Pedas';

  document.getElementById('modalName').textContent  = name;
  document.getElementById('modalDesc').textContent  = desc;
  document.getElementById('modalImg').textContent   = emoji;
  document.getElementById('modalImg').style.background = 'linear-gradient(135deg,#FFF3E0,#FFECB3)';
  document.getElementById('modalQty').textContent   = 1;
  document.getElementById('modalPrice').textContent = formatRp(price);
  document.getElementById('spicySection').style.display = hasSpicy ? '' : 'none';

  /* Reset pilihan level pedas ke default (Tidak Pedas) */
  document.querySelectorAll('.modal-spicy-btn').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });

  document.getElementById('modalOverlay').classList.add('open');
}

/**
 * Tutup modal. Bisa dipanggil dari tombol X atau klik overlay.
 * @param {Event} [e]
 */
function closeModal(e) {
  const overlay = document.getElementById('modalOverlay');
  if (!e || e.target === overlay || e.currentTarget.classList.contains('close-btn')) {
    overlay.classList.remove('open');
  }
}

/**
 * Set level pedas yang dipilih di modal.
 * @param {HTMLElement} btn   - tombol level yang diklik
 * @param {string}      level - label level pedas
 */
function setSpicy(btn, level) {
  document.querySelectorAll('.modal-spicy-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSpicy = level;
}

/**
 * Ubah kuantitas di modal.
 * @param {number} d - delta (+1 atau -1)
 */
function changeModalQty(d) {
  modalQtyVal = Math.max(1, modalQtyVal + d);
  document.getElementById('modalQty').textContent   = modalQtyVal;
  document.getElementById('modalPrice').textContent = formatRp(modalItem.price * modalQtyVal);
}

/**
 * Tambahkan item dari modal ke keranjang lalu tutup modal.
 */
function addFromModal() {
  for (let i = 0; i < modalQtyVal; i++) {
    addToCart(modalItem.name, modalItem.price, modalItem.emoji, selectedSpicy);
  }
  document.getElementById('modalOverlay').classList.remove('open');
}

/* ============================================================
   KERANJANG (CART)
   ============================================================ */

/**
 * Tambah item ke keranjang tanpa membuka modal (tombol "+").
 * @param {string} name  - nama menu
 * @param {number} price - harga satuan
 * @param {string} emoji - emoji menu
 */
function quickAdd(name, price, emoji) {
  addToCart(name, price, emoji, 'Tidak Pedas');
}

/**
 * Tambah item ke keranjang. Jika sudah ada (nama + level pedas sama),
 * cukup tambah qty-nya.
 * @param {string} name  - nama menu
 * @param {number} price - harga satuan
 * @param {string} emoji - emoji menu
 * @param {string} spicy - level pedas
 */
function addToCart(name, price, emoji, spicy) {
  const existing = cart.find(i => i.name === name && i.spicy === spicy);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, emoji, spicy, qty: 1 });
  }

  updateCart();

  /* Animasi bounce pada tombol keranjang di header */
  const btn = document.querySelector('.cart-btn');
  btn.style.transform = 'scale(1.15)';
  setTimeout(() => { btn.style.transform = ''; }, 200);
}

/**
 * Ubah kuantitas item di keranjang. Jika qty <= 0, item dihapus.
 * @param {number} idx - index item dalam array cart
 * @param {number} d   - delta (+1 atau -1)
 */
function changeQty(idx, d) {
  cart[idx].qty += d;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }
  updateCart();
}

/**
 * Render ulang seluruh tampilan keranjang dan perbarui total harga.
 */
function updateCart() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count    = cart.reduce((s, i) => s + i.qty, 0);
  const isEmpty  = cart.length === 0;

  /* Badge count di header */
  document.getElementById('cartCount').textContent      = count;
  document.getElementById('cartItemsCount').textContent = count + ' item';

  /* Tampil/sembunyikan empty state & summary */
  document.getElementById('cartEmpty').style.display   = isEmpty ? '' : 'none';
  document.getElementById('cartSummary').style.display = isEmpty ? 'none' : '';

  /* Render daftar item */
  const cartContent = document.getElementById('cartContent');
  const emptyEl     = document.getElementById('cartEmpty');

  if (!isEmpty) {
    const listHtml = '<div class="cart-list">' +
      cart.map((item, idx) => `
        <div class="cart-item">
          <div class="cart-item-emoji">${item.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            ${item.spicy && item.spicy !== 'Tidak Pedas'
              ? `<div class="cart-item-spicy">🌶️ ${item.spicy}</div>`
              : ''}
            <div class="cart-item-price">${formatRp(item.price * item.qty)}</div>
          </div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
            <div class="qty-num">${item.qty}</div>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          </div>
        </div>
      `).join('<hr class="cart-divider">') +
    '</div>';

    cartContent.innerHTML = listHtml;
    cartContent.prepend(emptyEl); /* empty state tetap ada di DOM, cukup disembunyikan */
  } else {
    cartContent.innerHTML = '';
    cartContent.appendChild(emptyEl);
  }

  /* Update angka ringkasan */
  document.getElementById('subtotalVal').textContent = formatRp(subtotal);

  const grandTotal = subtotal + deliveryFee - discount;
  document.getElementById('totalVal').textContent = formatRp(grandTotal > 0 ? grandTotal : subtotal);
}

/* ============================================================
   PROMO CODE
   ============================================================ */

/**
 * Terapkan kode promo yang dimasukkan pengguna.
 * Kode yang valid: GRATIS (gratis ongkir) dan DISKON20 (diskon 20%).
 */
function applyPromo() {
  const code = document.getElementById('promoInput').value.trim().toUpperCase();

  if (code === 'GRATIS') {
    deliveryFee = 0;
    document.getElementById('deliveryVal').textContent  = 'Gratis';
    document.getElementById('discountRow').style.display = '';
    document.getElementById('discountVal').textContent  = '- Gratis Ongkir';
    discount = 0;
    alert('✅ Promo GRATIS berhasil! Ongkir digratiskan.');

  } else if (code === 'DISKON20') {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    discount = Math.round(subtotal * 0.2);
    document.getElementById('discountRow').style.display = '';
    document.getElementById('discountVal').textContent  = '- ' + formatRp(discount);
    alert('✅ Promo DISKON20 berhasil! Diskon 20% diterapkan.');

  } else {
    alert('❌ Kode promo tidak valid. Coba: GRATIS atau DISKON20');
  }

  updateCart();
}

/* ============================================================
   CHECKOUT
   ============================================================ */

/**
 * Proses checkout — tampilkan modal sukses dengan nomor order acak.
 */
function checkout() {
  if (cart.length === 0) {
    alert("Keranjang kosong!");
    return;
  }

  // hitung total dari cart
  let total = cart.reduce((sum, item) => {
    return sum + (item.price * item.qty);
  }, 0);

  fetch('http://localhost:3000/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: cart,
      total: total,
      notes: document.getElementById('notesInput').value
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);

    // tampilkan order ID dari backend
    document.getElementById('orderId').textContent = data.orderId;

    // tampilkan popup sukses
    document.getElementById('successOverlay').classList.add('open');
  })
  .catch(err => {
    console.error(err);
    alert("Gagal kirim pesanan 😢");
  });
}
/**
 * Tutup modal sukses dan reset seluruh state keranjang.
 */
function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('open');

  /* Reset state */
  cart        = [];
  discount    = 0;
  deliveryFee = 5000;

  document.getElementById('promoInput').value           = '';
  document.getElementById('discountRow').style.display  = 'none';
  document.getElementById('deliveryVal').textContent    = formatRp(5000);

  updateCart();
}

/* ============================================================
   SCROLL TO CART (tombol keranjang di header)
   ============================================================ */

/**
 * Scroll halaman ke bagian keranjang.
 */
function toggleCart() {
  document.getElementById('cartSidebar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   INIT
   ============================================================ */
updateCart();
