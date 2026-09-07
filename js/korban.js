document.addEventListener('DOMContentLoaded', async () => {
  const sb = window.sb; // Supabase client
  
  const loader = document.getElementById('loader');
  const grid = document.getElementById('campaigns-grid');
  const regFormCard = document.getElementById('registration-form-card');
  const korbanForm = document.getElementById('korbanForm');
  
  const selectedCampaignId = document.getElementById('selectedCampaignId');
  const pricePerPartInput = document.getElementById('pricePerPart');
  
  const sumType = document.getElementById('sum-type');
  const sumQty = document.getElementById('sum-qty');
  const sumPrice = document.getElementById('sum-price');
  const sumTotal = document.getElementById('sum-total');
  const kParts = document.getElementById('kParts');
  const btnSubmit = document.getElementById('btnSubmit');
  const redirectModal = document.getElementById('redirectModal');
  const receiptModal = document.getElementById('receiptModal');
  const failedModal = document.getElementById('failedModal');

  // Check if returning from ToyyibPay
  const urlParams = new URLSearchParams(window.location.search);
  const statusId = urlParams.get('status_id');
  
  if (statusId) {
    // Hide form entirely if we are just showing the receipt
    document.querySelector('.qurban-container').style.display = 'none';
    
    if (statusId === '1') {
      // Payment submitted – status stays PENDING until admin approves
      const billcode = urlParams.get('billcode') || '-';
      document.getElementById('receipt-ref').textContent = billcode;

      // Show PENDING badge in the receipt modal
      const statusBadge = document.getElementById('receipt-status');
      if (statusBadge) {
        statusBadge.textContent = '⏳ PENDING VERIFICATION';
        statusBadge.style.cssText = 'display:inline-block; background:rgba(234,179,8,0.15); color:#eab308; border:1px solid rgba(234,179,8,0.4); padding:0.4rem 1rem; border-radius:6px; font-weight:700; font-size:0.9rem; margin-bottom:0.5rem;';
      }
      const statusNote = document.getElementById('receipt-status-note');
      if (statusNote) statusNote.style.display = 'block';

      document.getElementById('receiptModal').style.display = 'flex';

      // Update database status to 'pending' and fetch amount
      const regId = billcode.replace('SIM-', '');
      if (regId && window.sb) {
        window.sb.from('korban_participants')
          .update({ payment_status: 'pending' })
          .eq('id', regId)
          .select('parts_qty, korban_campaigns(price_per_part)')
          .then(({ data }) => {
            if (data && data.length > 0) {
              const qty   = data[0].parts_qty;
              const price = data[0].korban_campaigns?.price_per_part || 0;
              document.getElementById('receipt-amount').textContent = `RM ${(qty * price).toFixed(2)}`;
            }
          });
      }
    } else {
      // User cancelled payment — update DB record to 'cancelled'
      const billcode = urlParams.get('billcode') || '';
      const regId    = billcode.replace('SIM-', '');
      if (regId && window.sb) {
        window.sb.from('korban_participants')
          .update({ payment_status: 'cancelled' })
          .eq('id', regId)
          .then(() => {});
      }
      document.getElementById('failedModal').style.display = 'flex';
      document.querySelector('.qurban-container').style.display = 'block';
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  let activeCampaigns = [];
  let selectedCampaign = null;
  let userProfile = null;
  
  try {
    const data = localStorage.getItem('imasjid_profile');
    if (data) userProfile = JSON.parse(data);
  } catch(e) {}

  if (!userProfile) {
    loader.style.display = 'none';
    document.getElementById('login-required').style.display = 'block';
    return; // Halt execution for unauthenticated users
  }

  // Fallback data in case Supabase is empty or fails
  const fallbackCampaigns = [
    { id: 1, animal_type: 'Lembu (Cow)', price_per_part: 750.00, total_parts: 35 },
    { id: 2, animal_type: 'Kambing (Goat)', price_per_part: 950.00, total_parts: 10 }
  ];

  try {
    const { data, error } = await sb.from('korban_campaigns').select('*').order('id', { ascending: true });
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Deduplicate by animal_type in case the SQL seed script was run multiple times
      const uniqueCampaigns = [];
      const seenTypes = new Set();
      for (const c of data) {
        if (!seenTypes.has(c.animal_type)) {
          seenTypes.add(c.animal_type);
          uniqueCampaigns.push(c);
        }
      }
      activeCampaigns = uniqueCampaigns;
    } else {
      activeCampaigns = fallbackCampaigns;
    }
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    activeCampaigns = fallbackCampaigns;
  }

  loader.style.display = 'none';
  grid.style.display = 'grid';

  if (userProfile) {
    document.getElementById('kName').value = userProfile.first_name + ' ' + (userProfile.last_name || '').trim();
    if (userProfile.phone_number) {
      document.getElementById('kPhone').value = userProfile.phone_number;
    }
    fetchUserHistory(userProfile.phone_number || userProfile.email);
  }

  activeCampaigns.forEach(c => {
    const card = document.createElement('div');
    card.className = 'campaign-card';
    card.dataset.id = c.id;
    
    const actualIcon = c.animal_type.toLowerCase().includes('kambing') ? 'fa-paw' : 'fa-cow';

    card.innerHTML = `
      <i class="fa-solid ${actualIcon} c-icon"></i>
      <div class="c-title">${c.animal_type}</div>
      <div class="c-price">RM ${parseFloat(c.price_per_part).toFixed(2)}</div>
      <div class="c-info">Per Portion (Bahagian)</div>
    `;

    card.addEventListener('click', () => {
      // Remove selected from all
      document.querySelectorAll('.campaign-card').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      
      selectedCampaign = c;
      selectedCampaignId.value = c.id;
      pricePerPartInput.value = c.price_per_part;
      
      // Update Summary
      sumType.textContent = `Selected: ${c.animal_type}`;
      sumPrice.textContent = `RM ${parseFloat(c.price_per_part).toFixed(2)}`;
      updateSummary();
      
      regFormCard.style.display = 'block';
      // Smooth scroll to form
      regFormCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    grid.appendChild(card);
  });

  kParts.addEventListener('change', updateSummary);

  function updateSummary() {
    if (!selectedCampaign) return;
    const parts  = parseInt(kParts.value);
    const price  = parseFloat(selectedCampaign.price_per_part);
    const subtotal = parts * price;
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'full';

    const fee6   = parseFloat((subtotal * 0.015).toFixed(2));
    const total6 = parseFloat((subtotal + fee6).toFixed(2));
    const total3 = subtotal;

    // Update price cards
    const fullPriceEl = document.getElementById('pm-full-price');
    const pm3El       = document.getElementById('pm-3-price');
    const pm6El       = document.getElementById('pm-6-price');
    if (fullPriceEl) fullPriceEl.textContent = `RM ${subtotal.toFixed(2)}`;
    if (pm3El)  pm3El.innerHTML  = `RM ${(total3 / 3).toFixed(2)}<br><span style="font-size:0.75rem;font-weight:400;">/month</span>`;
    if (pm6El)  pm6El.innerHTML  = `RM ${(total6 / 6).toFixed(2)}<br><span style="font-size:0.75rem;font-weight:400;">/month</span>`;

    sumQty.textContent = `${parts} Portion${parts > 1 ? 's' : ''}`;

    const feeRow     = document.getElementById('sum-fee-row');
    const feeEl      = document.getElementById('sum-fee');
    const monthlyRow = document.getElementById('sum-monthly-row');
    const monthlyEl  = document.getElementById('sum-monthly');
    const labelEl    = document.getElementById('sum-total-label');

    if (method === 'full') {
      sumTotal.textContent = `RM ${subtotal.toFixed(2)}`;
      if (feeRow) feeRow.style.display = 'none';
      if (monthlyRow) monthlyRow.style.display = 'none';
      if (labelEl) labelEl.textContent = 'Total Payable';
    } else if (method === 'installment_3') {
      sumTotal.textContent = `RM ${total3.toFixed(2)}`;
      if (feeRow) feeRow.style.display = 'none';
      if (monthlyRow) { monthlyRow.style.display = 'flex'; }
      if (monthlyEl)  monthlyEl.textContent = `RM ${(total3 / 3).toFixed(2)} / month × 3`;
      if (labelEl) labelEl.textContent = 'Total (3 months)';
    } else if (method === 'installment_6') {
      sumTotal.textContent = `RM ${total6.toFixed(2)}`;
      if (feeRow) { feeRow.style.display = 'flex'; }
      if (feeEl)  feeEl.textContent = `+RM ${fee6.toFixed(2)}`;
      if (monthlyRow) { monthlyRow.style.display = 'flex'; }
      if (monthlyEl)  monthlyEl.textContent = `RM ${(total6 / 6).toFixed(2)} / month × 6`;
      if (labelEl) labelEl.textContent = 'Total incl. fee (6 months)';
    }
  }

  // ── Payment method radio selector ──────────────────────────────
  window.selectPaymentMethod = function(method) {
    const configs = {
      'full':          { labelId: 'pm-full-label', dotId: 'pm-full-dot', dotColor: 'var(--color-primary)',  borderColor: 'var(--color-primary)',  bg: 'rgba(6,182,212,0.08)',   filledBg: 'var(--color-primary)' },
      'installment_3': { labelId: 'pm-3-label',    dotId: 'pm-3-dot',    dotColor: '#22c55e',              borderColor: '#22c55e',              bg: 'rgba(34,197,94,0.06)',   filledBg: '#22c55e' },
      'installment_6': { labelId: 'pm-6-label',    dotId: 'pm-6-dot',    dotColor: '#f59e0b',              borderColor: '#f59e0b',              bg: 'rgba(245,158,11,0.06)', filledBg: '#f59e0b' },
    };
    // Reset all
    ['full','installment_3','installment_6'].forEach(m => {
      const cfg = configs[m];
      const lbl = document.getElementById(cfg.labelId);
      const dot = document.getElementById(cfg.dotId);
      if (lbl) { lbl.style.borderColor = 'rgba(255,255,255,0.1)'; lbl.style.background = 'rgba(255,255,255,0.02)'; }
      if (dot) { dot.style.background = 'transparent'; dot.innerHTML = ''; }
    });
    // Select active
    const sel = configs[method];
    if (sel) {
      const lbl = document.getElementById(sel.labelId);
      const dot = document.getElementById(sel.dotId);
      if (lbl) { lbl.style.borderColor = sel.borderColor; lbl.style.background = sel.bg; }
      if (dot) { dot.style.background = sel.filledBg; dot.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:#0f172a;"></div>'; }
    }
    const radio = document.getElementById(`pm-${method === 'full' ? 'full' : method === 'installment_3' ? '3' : '6'}`);
    if (radio) radio.checked = true;
    updateSummary();
  };

  korbanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    btnSubmit.disabled = true;

    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'full';
    const parts  = parseInt(kParts.value);
    const price  = parseFloat(selectedCampaign.price_per_part);
    const subtotal = parts * price;
    const fee6   = method === 'installment_6' ? parseFloat((subtotal * 0.015).toFixed(2)) : 0;
    const totalAmount = parseFloat((subtotal + fee6).toFixed(2));
    const installMonths = method === 'installment_3' ? 3 : method === 'installment_6' ? 6 : null;

    const payload = {
      campaign_id:        selectedCampaignId.value,
      name:               document.getElementById('kName').value,
      phone_number:       document.getElementById('kPhone').value,
      parts_qty:          parts,
      payment_status:     'pending',
      payment_method:     method,
      installment_months: installMonths,
      charge_fee:         fee6
    };

    try {
      // Insert to Supabase
      let insertedId = 'TEST-' + Math.floor(Math.random()*10000);
      const { data, error } = await sb.from('korban_participants').insert([payload]).select();
      
      if (error) {
        if(error.message.includes('relation "public.korban_participants" does not exist')){
           console.warn("Table doesn't exist yet, proceeding locally.");
        } else {
           throw error;
        }
      } else if (data && data.length > 0) {
        insertedId = data[0].id;
      }
      
      // Show redirecting loader
      redirectModal.style.display = 'flex';
      
      const totalAmount = parseInt(kParts.value) * parseFloat(selectedCampaign.price_per_part);
      
      // Redirect to Simulated ToyyibPay Gateway
      setTimeout(() => {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `mock-toyyibpay.html?amount=${totalAmount}&reg_id=${insertedId}&return_url=${returnUrl}&method=${method}&months=${installMonths || 0}&fee=${fee6}`;
      }, 1500);

    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration failed. Please try again or contact the admin.');
      btnSubmit.innerHTML = '<i class="fa-solid fa-lock"></i> Register & Proceed to Payment';
      btnSubmit.disabled = false;
    }
  });

  async function fetchUserHistory(identifier) {
    if (!identifier) return;
    try {
      const { data, error } = await sb.from('korban_participants')
        .select(`
          id,
          parts_qty,
          payment_status,
          registered_at,
          korban_campaigns ( animal_type, year, price_per_part )
        `)
        .eq('phone_number', identifier)
        .order('registered_at', { ascending: false });

      if (error) {
        console.warn("Could not fetch history. Table might be empty or missing.");
        return;
      }
      
      if (data && data.length > 0) {
        document.getElementById('history-section').style.display = 'block';
        // Campaign grid and form remain visible so user can purchase additional portions

        const list = document.getElementById('history-list');
        list.innerHTML = '';
        
        data.forEach(reg => {
          const c = reg.korban_campaigns || { animal_type: 'Unknown', year: '2026', price_per_part: 0 };
          const isPaid      = reg.payment_status === 'paid';
          const isRejected  = reg.payment_status === 'rejected';
          const isCancelled = reg.payment_status === 'cancelled';
          const statusColor  = isPaid ? '#22c55e' : isRejected ? '#ef4444' : isCancelled ? '#94a3b8' : '#eab308';
          const statusBg     = isPaid ? 'rgba(34,197,94,0.12)' : isRejected ? 'rgba(239,68,68,0.12)' : isCancelled ? 'rgba(148,163,184,0.12)' : 'rgba(234,179,8,0.12)';
          const statusBorder = isPaid ? 'rgba(34,197,94,0.35)' : isRejected ? 'rgba(239,68,68,0.35)' : isCancelled ? 'rgba(148,163,184,0.35)' : 'rgba(234,179,8,0.35)';
          const statusLabel  = isPaid ? '✅ PAID' : isRejected ? '❌ REJECTED' : isCancelled ? '🚫 CANCELLED' : '⏳ PENDING VERIFICATION';
          const statusNote   = isPaid ? ''
            : isRejected
              ? '<p style="font-size:0.78rem; color:#ef4444; margin-top:0.6rem; background:rgba(239,68,68,0.08); border-radius:6px; padding:0.4rem 0.7rem;">❌ Your payment was <strong>rejected</strong> by the admin. Please contact the mosque office.</p>'
              : isCancelled
                ? '<p style="font-size:0.78rem; color:#94a3b8; margin-top:0.6rem; background:rgba(148,163,184,0.08); border-radius:6px; padding:0.4rem 0.7rem;">🚫 You <strong>cancelled</strong> this payment. You may register again to proceed.</p>'
                : '<p style="font-size:0.78rem; color:#eab308; margin-top:0.6rem; background:rgba(234,179,8,0.08); border-radius:6px; padding:0.4rem 0.7rem;">⚠️ Awaiting admin payment verification. Your registration is confirmed.</p>';
          const icon = c.animal_type.toLowerCase().includes('kambing') ? 'fa-paw' : 'fa-cow';

          list.innerHTML += `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-card-border); border-radius: 12px; padding: 1.2rem; position: relative;">
              <div style="position: absolute; top: 1rem; right: 1rem; color: ${statusColor}; font-weight: bold; font-size: 0.75rem; background: ${statusBg}; border: 1px solid ${statusBorder}; padding: 0.3rem 0.6rem; border-radius: 4px;">
                ${statusLabel}
              </div>
              <div style="display:flex; align-items:center; gap: 1rem; margin-bottom: 1rem;">
                <div style="background: rgba(6,182,212,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                  <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                  <div style="font-weight: 700;">${c.animal_type} ${c.year}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${new Date(reg.registered_at).toLocaleDateString('en-MY', {day:'2-digit',month:'short',year:'numeric'})}</div>
                </div>
              </div>
              <div style="font-size: 0.9rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.3rem;">
                  <span style="color:var(--color-text-muted);">Portions:</span>
                  <span>${reg.parts_qty} Bahagian</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--color-text-muted);">Total:</span>
                  <strong style="color:var(--color-primary);">RM ${(reg.parts_qty * c.price_per_part).toFixed(2)}</strong>
                </div>
              </div>
              ${statusNote}
            </div>
          `;
        });
      }
    } catch(err) {
      console.error(err);
    }
  }

});
