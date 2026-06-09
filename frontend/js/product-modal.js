/**
 * product-modal.js
 * Opens a full-detail product overlay on card click.
 * No page navigation. Works for guests and logged-in customers.
 */
import { api, assetUrl } from './api.js';
import { auth } from './auth.js';
import { cartStore } from './cart-store.js';
import { toast } from './toast.js';

// ── Build modal DOM once ──────────────────────────────────────────────────────
const overlay = document.createElement('div');
overlay.id = 'productModal';
overlay.setAttribute('role', 'dialog');
overlay.setAttribute('aria-modal', 'true');
overlay.style.cssText = `
  display:none;position:fixed;inset:0;z-index:500;
  background:rgba(0,0,0,.75);backdrop-filter:blur(8px);
  align-items:center;justify-content:center;padding:1rem;
`;

overlay.innerHTML = `
  <div id="modalBox" style="
    background:#0f0820;border:1px solid rgba(255,215,0,.25);
    border-radius:20px;width:100%;max-width:860px;max-height:90vh;
    overflow-y:auto;position:relative;animation:fadeUp .25s ease both;
    box-shadow:0 0 40px rgba(138,43,226,.3);
  ">
    <button id="modalClose" aria-label="Close" style="
      position:sticky;top:0;float:right;margin:.75rem .75rem 0 0;
      background:rgba(138,43,226,.15);border:1px solid rgba(138,43,226,.4);
      color:#e8deff;width:34px;height:34px;border-radius:50%;cursor:pointer;
      font-size:1.2rem;line-height:1;display:flex;align-items:center;justify-content:center;
      z-index:10;
    ">×</button>
    <div id="modalBody" style="padding:1.5rem;clear:both;"></div>
  </div>`;

document.body.appendChild(overlay);

const stars = r => '★'.repeat(Math.max(0,Math.min(5,Math.round(r)))) + '☆'.repeat(5-Math.max(0,Math.min(5,Math.round(r))));

function close() {
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  window.history.replaceState(null, '', location.pathname); // clean URL
}

document.getElementById('modalClose').addEventListener('click', close);
overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

// ── Open modal for a product id ───────────────────────────────────────────────
export async function openProductModal(productId) {
  const body = document.getElementById('modalBody');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  body.innerHTML = `<div style="display:flex;justify-content:center;padding:4rem"><div class="spinner"></div></div>`;

  try {
    const { data: p } = await api.get(`/products/${productId}`);

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.75rem;align-items:start;">

        <!-- Gallery -->
        <div>
          <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(138,43,226,.25);background:#0a0512">
            <img id="mImg" src="${assetUrl(p.imageUrls?.[0])||'https://placehold.co/600x400/0a0512/8a2be2?text=No+Image'}"
              style="width:100%;max-height:340px;object-fit:cover;display:block;transition:opacity .2s">
          </div>
          <div style="display:flex;gap:.5rem;margin-top:.6rem;flex-wrap:wrap">
            ${(p.imageUrls||[]).map(url=>`
              <img src="${assetUrl(url)}" data-large="${assetUrl(url)}"
                style="width:60px;height:60px;object-fit:cover;border-radius:8px;
                       border:1px solid rgba(138,43,226,.3);cursor:pointer;transition:border-color .15s"
                onmouseover="this.style.borderColor='var(--gold)'"
                onmouseout="this.style.borderColor='rgba(138,43,226,.3)'">`).join('')}
          </div>
        </div>

        <!-- Details -->
        <div style="display:flex;flex-direction:column;gap:.9rem">
          <span style="font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
                       color:var(--purple);text-shadow:0 0 8px var(--purple)">${p.category}</span>
          <h2 style="font-size:1.5rem;font-weight:800;line-height:1.15;letter-spacing:-.02em;
                     color:#e8deff;margin:0">${p.title}</h2>
          <div style="display:flex;align-items:center;gap:.6rem">
            <span style="color:var(--gold-hot);font-size:1rem">${stars(p.ratingsAvg)}</span>
            <span style="font-size:.8rem;color:#7a6a9a">${p.ratingsAvg.toFixed(1)} · ${p.ratingsCount} reviews</span>
          </div>
          <p style="font-size:1.9rem;font-weight:800;letter-spacing:-.02em;
                    color:var(--gold);text-shadow:0 0 12px rgba(255,215,0,.4);margin:0">
            $${Number(p.price).toFixed(2)}
          </p>
          <p style="font-size:.875rem;color:#7a6a9a;line-height:1.65;margin:0">${p.description||''}</p>
          <p style="font-size:.85rem;font-weight:700;${p.stockQty>0?'color:#34d399':'color:#f87171'}">
            ${p.stockQty>0?`✓ ${p.stockQty} in stock`:'✕ Out of stock'}
          </p>

          <div style="display:flex;gap:.65rem;align-items:center">
            <input id="mQty" type="number" min="1" max="${p.stockQty}" value="1"
              style="width:72px;text-align:center;background:rgba(138,43,226,.07);
                     border:1px solid rgba(138,43,226,.3);border-radius:10px;
                     padding:.5rem;color:#e8deff;font-size:.9rem;font-family:inherit"
              ${p.stockQty===0?'disabled':''}>
            <button id="mAddBtn" style="flex:1;padding:.65rem 1rem;font-size:.95rem;font-weight:700;
                    background:linear-gradient(135deg,#ffaa00,#ffd700);color:#0a0512;
                    border:none;border-radius:10px;cursor:pointer;
                    transition:filter .15s,box-shadow .2s;font-family:inherit"
              ${p.stockQty===0?'disabled':''}>
              ${p.stockQty===0?'Out of Stock':'🛒 Add to Cart'}
            </button>
          </div>

          <div style="font-size:.8rem;color:#7a6a9a;padding:.6rem .85rem;
                      background:rgba(255,215,0,.05);border:1px solid rgba(255,215,0,.12);border-radius:10px">
            Sold by <span style="color:var(--gold);font-weight:700">${p.vendor?.storeName||'Unknown'}</span>
          </div>
        </div>
      </div>

      <!-- Reviews -->
      ${p.reviews?.length ? `
      <div style="margin-top:2rem;border-top:1px solid rgba(138,43,226,.15);padding-top:1.5rem">
        <h3 style="font-size:1rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
                   color:#e8deff;margin:0 0 1rem">Customer Reviews</h3>
        <div style="display:flex;flex-direction:column;gap:.65rem">
          ${p.reviews.map(r=>`
            <div style="background:rgba(15,8,32,.6);border:1px solid rgba(138,43,226,.12);
                        border-radius:10px;padding:.85rem">
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.3rem">
                <span style="color:var(--gold-hot);font-size:.9rem">${stars(r.rating)}</span>
                <span style="font-size:.82rem;font-weight:700;color:#e8deff">${r.customer?.name||'Customer'}</span>
                <span style="font-size:.72rem;color:#7a6a9a;margin-left:auto">${new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p style="font-size:.85rem;color:#7a6a9a;margin:0">${r.comment||''}</p>
            </div>`).join('')}
        </div>
      </div>` : ''}`;

    // Thumbnail click
    body.querySelectorAll('[data-large]').forEach(img =>
      img.addEventListener('click', () => {
        const main = document.getElementById('mImg');
        main.style.opacity = '0';
        setTimeout(() => { main.src = img.dataset.large; main.style.opacity = '1'; }, 150);
      })
    );

    // Add to cart button
    document.getElementById('mAddBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const user = auth.getUser();
      if (user && user.role !== 'CUSTOMER') {
        toast('Switch to a customer account to shop', 'error'); return;
      }
      const qty = parseInt(document.getElementById('mQty').value) || 1;
      const btn = document.getElementById('mAddBtn');
      btn.disabled = true; btn.textContent = 'Adding…';
      try {
        await cartStore.add(p.id, qty);
        toast(`"${p.title}" added to cart ✓`);
        btn.textContent = '✓ Added!';
        setTimeout(() => { btn.disabled = false; btn.textContent = '🛒 Add to Cart'; }, 1500);
      } catch (ex) {
        toast(ex.message, 'error');
        btn.disabled = false; btn.textContent = '🛒 Add to Cart';
      }
    });

  } catch {
    body.innerHTML = '<p style="color:#f87171;text-align:center;padding:3rem">Failed to load product.</p>';
  }
}
