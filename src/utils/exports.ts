import { Customer, Expense } from '../types';
import { calcPending, todayStr } from './helpers';

// Helper to escape CSV fields
function escapeCSV(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportExcel(customers: Customer[]) {
  if (customers.length === 0) {
    alert('Koi data nahi hai export karne ke liye!');
    return;
  }

  let csv = '\uFEFF'; // BOM for UTF-8 support in Excel

  csv += 'CUSTOMERS\n';
  csv += 'Naam,Phone,Address,Unke Paas Jar,Monthly Plan,Rate Per Jar,Agent,Notes\n';
  customers.forEach(c => {
    csv += [
      escapeCSV(c.name),
      escapeCSV(c.phone || ''),
      escapeCSV(c.address),
      c.jarsAtCustomer || 0,
      c.monthlyPlan || 0,
      c.ratePerJar || 0,
      escapeCSV(c.agent || ''),
      escapeCSV(c.notes || ''),
    ].join(',') + '\n';
  });

  csv += '\nDELIVERY HISTORY\n';
  csv += 'Customer Naam,Date,Deliver Hue,Wapas Liye,Amount (Rs)\n';
  customers.forEach(c => {
    (c.deliveries || []).forEach(d => {
      csv += [
        escapeCSV(c.name),
        d.date || '',
        d.delivered || 0,
        d.collected || 0,
        d.amount || 0,
      ].join(',') + '\n';
    });
  });

  const totalAmt = customers.reduce(
    (s, c) => s + (c.deliveries || []).reduce((ss, d) => ss + (d.amount || 0), 0),
    0
  );
  const totalJar = customers.reduce(
    (s, c) => s + (c.deliveries || []).reduce((ss, d) => ss + (d.delivered || 0), 0),
    0
  );

  csv += `\nSUMMARY\n`;
  csv += `Total Kamai,Rs ${totalAmt}\n`;
  csv += `Total Jar Deliver Hue,${totalJar}\n`;
  csv += `Total Customers,${customers.length}\n`;

  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  const a = document.createElement('a');
  a.setAttribute('href', dataUri);
  a.setAttribute('download', `JarBusiness_${todayStr()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    if (navigator.share) {
      const file = new File([csv], `JarBusiness_${todayStr()}.csv`, { type: 'text/csv' });
      navigator.share({ files: [file], title: 'Jar Business Data' }).catch(() => {});
    }
  }, 500);
}

export function exportPDF(allCustomers: Customer[], fromDate: string, toDate: string) {
  if (allCustomers.length === 0) {
    alert('Koi data nahi hai export karne ke liye!');
    return;
  }

  function inRange(dateStr: string) {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  }

  const rangeLabel =
    fromDate && toDate
      ? `${fromDate} se ${toDate}`
      : fromDate
      ? `${fromDate} ke baad`
      : toDate
      ? `${toDate} tak`
      : 'Poora Data';

  const customers = allCustomers
    .map(c => ({
      ...c,
      deliveries: (c.deliveries || []).filter(d => inRange(d.date)),
      payments: (c.payments || []).filter(p => inRange(p.date)),
    }))
    .filter(
      c => c.deliveries.length > 0 || c.payments.length > 0 || (!fromDate && !toDate)
    );

  const totalAmt = customers.reduce(
    (s, c) => s + c.deliveries.reduce((ss, d) => ss + (d.amount || 0), 0),
    0
  );
  const totalJar = customers.reduce(
    (s, c) => s + c.deliveries.reduce((ss, d) => ss + (d.delivered || 0), 0),
    0
  );
  const totalJarsOut = allCustomers.reduce((s, c) => s + (c.jarsAtCustomer || 0), 0);

  const rows = customers
    .map((c, i) => {
      const cTotal = c.deliveries.reduce((s, d) => s + (d.amount || 0), 0);
      const cJars = c.deliveries.reduce((s, d) => s + (d.delivered || 0), 0);
      const last = c.deliveries[0];
      return `
      <tr>
        <td>${i + 1}</td>
        <td><b>${c.name || ''}</b><br><span style="color:#607d8b;font-size:11px;">${
        c.phone || ''
      }</span></td>
        <td>${c.address || ''}</td>
        <td style="text-align:center;">${c.jarsAtCustomer || 0}</td>
        <td style="text-align:center;">${c.monthlyPlan || 0}/mo</td>
        <td style="text-align:center;">${cJars}</td>
        <td style="text-align:center;color:#1B5E20;font-weight:700;">Rs ${cTotal}</td>
        <td style="text-align:center;color:#607d8b;font-size:11px;">${
          last ? last.date : '—'
        }</td>
      </tr>`;
    })
    .join('');

  let deliveryRows = '';
  customers.forEach(c => {
    c.deliveries.forEach(d => {
      const displayAmt = d.amount > 0 ? d.amount : (d.delivered || 0) * (c.ratePerJar || 0);
      deliveryRows += `
        <tr>
          <td>${d.date || ''}</td>
          <td><b>${c.name || ''}</b></td>
          <td style="text-align:center;">${d.delivered || 0}</td>
          <td style="text-align:center;">${d.collected || 0}</td>
          <td style="text-align:center;color:#1B5E20;font-weight:700;">Rs ${displayAmt}</td>
          <td style="text-align:center;${
            d.paidStatus === 'pending'
              ? 'color:#C62828;font-weight:700;'
              : 'color:#2E7D32;font-weight:700;'
          }">${d.paidStatus === 'pending' ? '⚠️ Pending' : '✅ Paid'}</td>
        </tr>`;
    });
  });

  let paymentRows = '';
  let totalPaymentsAmt = 0;
  customers.forEach(c => {
    c.payments.forEach(p => {
      totalPaymentsAmt += p.amount || 0;
      paymentRows += `
        <tr>
          <td>${p.date || ''}</td>
          <td><b>${c.name || ''}</b></td>
          <td style="text-align:center;">${c.phone || '—'}</td>
          <td style="text-align:center;color:#1B5E20;font-weight:700;">Rs ${p.amount || 0}</td>
          <td style="color:#607d8b;font-size:11px;">${p.note || ''}</td>
        </tr>`;
    });
  });

  let pendingRows = '';
  let grandPending = 0;
  allCustomers.forEach(c => {
    const rate = c.ratePerJar || 0;
    const cashPaid = (c.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const grossPending = (c.deliveries || [])
      .filter(d => d.paidStatus === 'pending')
      .reduce((s, d) => s + (d.amount > 0 ? d.amount : (d.delivered || 0) * rate), 0);
    const pending = Math.max(0, grossPending - cashPaid);
    if (pending > 0) {
      grandPending += pending;
      pendingRows += `<tr><td><b>${c.name || ''}</b></td><td>${
        c.phone || '—'
      }</td><td style="text-align:center;color:#C62828;font-weight:700;">Rs ${pending}</td></tr>`;
    }
  });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Jar Business Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #1a1a2e; font-size: 13px; }
    h1 { color: #1565C0; margin-bottom: 4px; }
    .meta { color: #607d8b; font-size: 12px; margin-bottom: 4px; }
    .range-badge { display:inline-block; background:#E3F2FD; color:#1565C0; border-radius:8px; padding:4px 12px; font-size:13px; font-weight:700; margin-bottom:16px; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .sum-box { background: #E3F2FD; border-radius: 10px; padding: 12px 18px; min-width: 120px; }
    .sum-num { font-size: 22px; font-weight: 800; color: #1565C0; }
    .sum-label { font-size: 11px; color: #607d8b; }
    h2 { color: #1565C0; margin: 20px 0 8px; border-bottom: 2px solid #E3F2FD; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #1565C0; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
    td { padding: 7px 10px; border-bottom: 1px solid #f0f4f8; font-size: 12px; }
    tr:nth-child(even) td { background: #f9fbfc; }
    .footer { margin-top:30px; text-align:center; font-size:11px; color:#90a4ae; }
    @media print { body { margin: 10px; } }
  </style></head><body>
  <h1>💧 Jar Business Report</h1>
  <div class="meta">Generated: ${todayStr()}</div>
  <div class="range-badge">📅 Period: ${rangeLabel}</div>
  <div class="summary">
    <div class="sum-box"><div class="sum-num">Rs ${totalAmt.toLocaleString(
      'en-IN'
    )}</div><div class="sum-label">💰 Kamai (Is Period)</div></div>
    <div class="sum-box"><div class="sum-num">${totalJar}</div><div class="sum-label">📦 Jar Deliver (Is Period)</div></div>
    <div class="sum-box"><div class="sum-num">${totalJarsOut}</div><div class="sum-label">📦 Abhi Customers Ke Paas</div></div>
    <div class="sum-box"><div class="sum-num">${
      allCustomers.length
    }</div><div class="sum-label">👥 Total Customers</div></div>
  </div>

  <h2>👥 Customer List</h2>
  <table>
    <tr><th>#</th><th>Naam / Phone</th><th>Address</th><th>Jar Paas</th><th>Plan</th><th>Total Jar</th><th>Total Kamai</th><th>Last Delivery</th></tr>
    ${rows || '<tr><td colspan="8" style="text-align:center;color:#90a4ae;">Is period mein koi delivery nahi</td></tr>'}
  </table>

  <h2>📜 Delivery History</h2>
  <table>
    <tr><th>Date</th><th>Customer</th><th>Deliver Hue</th><th>Wapas Liye</th><th>Amount</th><th>Status</th></tr>
    ${deliveryRows || '<tr><td colspan="6" style="text-align:center;color:#90a4ae;">Koi delivery nahi</td></tr>'}
  </table>

  ${
    paymentRows
      ? `
  <h2>💵 Customer Payment Entries</h2>
  <table>
    <tr><th>Date</th><th>Customer</th><th>Phone</th><th>Amount Liya</th><th>Note</th></tr>
    ${paymentRows}
    <tr style="background:#E8F5E9;"><td colspan="3"><b>Total Payments Received</b></td><td style="font-weight:800;color:#1B5E20;">Rs ${totalPaymentsAmt.toLocaleString(
      'en-IN'
    )}</td><td></td></tr>
  </table>`
      : '<p style="color:#607d8b;font-size:13px;">💵 Koi alag payment entry nahi hai.</p>'
  }

  ${
    pendingRows
      ? `
  <h2>⚠️ Pending Payments (Sabhi)</h2>
  <table>
    <tr><th>Customer</th><th>Phone</th><th>Pending Amount</th></tr>
    ${pendingRows}
    <tr style="background:#FFEBEE;"><td colspan="2"><b>Total Pending</b></td><td style="font-weight:800;color:#C62828;">Rs ${grandPending.toLocaleString(
      'en-IN'
    )}</td></tr>
  </table>`
      : '<p style="color:#2E7D32;font-size:13px;font-weight:700;">✅ Koi pending payment nahi hai!</p>'
  }

  <div class="footer">💧 Jar Business Manager &nbsp;|&nbsp; Generated on ${new Date().toLocaleString(
    'en-IN'
  )}</div>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function downloadCustomerPDF(c: Customer, fromDate: string, toDate: string) {
  function inRange(dateStr: string) {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  }

  const rangeLabel =
    fromDate && toDate
      ? `${fromDate} se ${toDate}`
      : fromDate
      ? `${fromDate} ke baad`
      : toDate
      ? `${toDate} tak`
      : 'Poora Data';

  const rate = c.ratePerJar || 0;
  const filteredDeliveries = (c.deliveries || []).filter(d => inRange(d.date));
  const filteredPayments = (c.payments || []).filter(p => inRange(p.date));

  const totalDelivered = filteredDeliveries.reduce((s, d) => s + (d.delivered || 0), 0);
  const totalCollected = filteredDeliveries.reduce((s, d) => s + (d.collected || 0), 0);
  const totalDeliveryAmt = filteredDeliveries.reduce((s, d) => s + (d.amount || 0), 0);
  const cashPaid = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);

  const pendingCalc = calcPending(c);
  const pendingAmt = pendingCalc.total;

  const deliveryRows = filteredDeliveries
    .map((d, i) => {
      const amt = d.amount || (d.delivered || 0) * rate;
      const statusColor = d.paidStatus === 'pending' ? '#C62828' : '#2E7D32';
      const statusText = d.paidStatus === 'pending' ? 'Pending' : 'Paid';
      return `<tr>
      <td style="text-align:center;">${filteredDeliveries.length - i}</td>
      <td>${d.date || ''}</td>
      <td style="text-align:center;">${d.delivered || 0}</td>
      <td style="text-align:center;">${d.collected || 0}</td>
      <td style="text-align:right;">Rs.${amt}</td>
      <td style="text-align:center;color:${statusColor};font-weight:700;">${statusText}</td>
    </tr>`;
    })
    .join('');

  const paymentRows = filteredPayments
    .map(
      p => `
    <tr>
      <td>${p.date || ''}</td>
      <td style="text-align:right;color:#2E7D32;font-weight:700;">Rs.${p.amount || 0}</td>
      <td>${p.note || '—'}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><head>
  <meta charset="UTF-8"/>
  <title>Statement - ${c.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 24px; background: white; }
    .header { background: linear-gradient(135deg, #1565C0, #0288D1); color: white; border-radius: 12px; padding: 18px 20px; margin-bottom: 18px; }
    .header h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .header p  { font-size: 12px; opacity: 0.85; }
    .info-box { background: #f0f4f8; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; line-height: 1.9; }
    .info-box b { color: #1565C0; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
    .sum-box { border-radius: 10px; padding: 12px 14px; text-align: center; }
    .sum-box .num { font-size: 22px; font-weight: 800; margin-bottom: 2px; }
    .sum-box .lbl { font-size: 11px; font-weight: 600; opacity: 0.8; }
    .sum-blue   { background: #E3F2FD; color: #1565C0; }
    .sum-green  { background: #E8F5E9; color: #2E7D32; }
    .sum-red    { background: #FFEBEE; color: #C62828; }
    .sum-orange { background: #FFF3E0; color: #E65100; }
    .sum-purple { background: #F3E5F5; color: #6A1B9A; }
    section-title { display: block; font-size: 13px; font-weight: 800; color: #1565C0; margin: 18px 0 8px; letter-spacing: 0.5px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
    th { background: #1565C0; color: white; padding: 8px 10px; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #eceff1; }
    tr:nth-child(even) td { background: #f9fbfc; }
    .footer { margin-top: 24px; border-top: 2px solid #e0e0e0; padding-top: 12px; font-size: 11px; color: #90a4ae; text-align: center; }
    .pending-box { background: #FFEBEE; border: 2px solid #FFCDD2; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
    .pending-box .big { font-size: 24px; font-weight: 800; color: #C62828; }
    .clear-box { background: #E8F5E9; border: 2px solid #C8E6C9; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; color: #2E7D32; font-weight: 700; }
    @media print { body { padding: 10px; } }
  </style>
  </head><body>

  <div class="header">
    <h1>💧 Jar Business — Customer Statement</h1>
    <p>Printed: ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}</p>
    <p style="margin-top:6px;background:rgba(255,255,255,0.2);display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">📅 Period: ${rangeLabel}</p>
  </div>

  <div class="info-box">
    <div><b>👤 Name:</b> ${c.name || '—'}</div>
    <div><b>📞 Phone:</b> ${c.phone || '—'}</div>
    <div><b>📍 Address:</b> ${c.address || '—'}</div>
    <div><b>💰 Rate:</b> Rs.${rate} per Jar</div>
    <div><b>💳 Payment Type:</b> ${c.payType === 'monthly' ? 'Monthly' : 'Per Delivery'}</div>
    ${c.agent ? `<div><b>🚚 Agent:</b> ${c.agent}</div>` : ''}
    ${c.notes ? `<div><b>📝 Note:</b> ${c.notes}</div>` : ''}
  </div>

  <!-- SUMMARY -->
  <div class="summary-grid">
    <div class="sum-box sum-blue"><div class="num">${totalDelivered}</div><div class="lbl">📦 Total Jar Diye</div></div>
    <div class="sum-box sum-orange"><div class="num">${totalCollected}</div><div class="lbl">🔄 Jar Wapas Liye</div></div>
    <div class="sum-box sum-blue"><div class="num">${
      c.jarsAtCustomer || 0
    }</div><div class="lbl">📦 Abhi unke paas</div></div>
    <div class="sum-box sum-green"><div class="num">Rs.${totalDeliveryAmt.toLocaleString(
      'en-IN'
    )}</div><div class="lbl">💰 Total Kamai</div></div>
    <div class="sum-box sum-purple"><div class="num">Rs.${cashPaid.toLocaleString(
      'en-IN'
    )}</div><div class="lbl">💵 Cash Payments</div></div>
    <div class="sum-box ${
      pendingAmt > 0 ? 'sum-red' : 'sum-green'
    }"><div class="num">Rs.${pendingAmt.toLocaleString('en-IN')}</div><div class="lbl">${
    pendingAmt > 0 ? '⚠️ Pending' : '✅ Clear'
  }</div></div>
  </div>

  ${
    pendingAmt > 0
      ? `<div class="pending-box">⚠️ <b>Baaki Baccha Hai:</b> <span class="big">Rs.${pendingAmt.toLocaleString(
          'en-IN'
        )}</span> — Ye amount abhi tak nahi mila</div>`
      : `<div class="clear-box">✅ Koi pending payment nahi hai! Sab clear hai.</div>`
  }

  ${
    filteredDeliveries.length > 0
      ? `
  <section-title>📜 Delivery History (${filteredDeliveries.length} entries)</section-title>
  <table>
    <tr>
      <th>#</th><th>Date</th><th>Jar Diye</th><th>Jar Liye</th><th>Amount</th><th>Status</th>
    </tr>
    ${deliveryRows}
    <tr style="background:#E3F2FD;">
      <td colspan="2"><b>TOTAL</b></td>
      <td style="text-align:center;font-weight:800;">${totalDelivered}</td>
      <td style="text-align:center;font-weight:800;">${totalCollected}</td>
      <td style="text-align:right;font-weight:800;">Rs.${totalDeliveryAmt.toLocaleString(
        'en-IN'
      )}</td>
      <td></td>
    </tr>
  </table>`
      : '<p style="color:#90a4ae;margin-bottom:16px;">Is period mein koi delivery record nahi hai.</p>'
  }

  <!-- PAYMENT RECORDS -->
  ${
    filteredPayments.length > 0
      ? `
  <section-title>💵 Cash Payment Records (${filteredPayments.length} entries)</section-title>
  <table>
    <tr><th>Date</th><th>Amount</th><th>Note</th></tr>
    ${paymentRows}
    <tr style="background:#E8F5E9;">
      <td><b>TOTAL</b></td>
      <td style="text-align:right;font-weight:800;color:#2E7D32;">Rs.${cashPaid.toLocaleString(
        'en-IN'
      )}</td>
      <td></td>
    </tr>
  </table>`
      : ''
  }

  <div class="footer">💧 Jar Business Manager &nbsp;|&nbsp; Generated on ${new Date().toLocaleString(
    'en-IN'
  )}</div>

  <script>window.onload = () => window.print();<\/script>
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function downloadCustomerExcel(c: Customer, fromDate: string, toDate: string) {
  function inRange(dateStr: string) {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  }

  const rangeLabel =
    fromDate && toDate
      ? `${fromDate}_to_${toDate}`
      : fromDate || toDate || 'All';
  const rate = c.ratePerJar || 0;

  const filteredDeliveries = (c.deliveries || []).filter(d => inRange(d.date));
  const filteredPayments = (c.payments || []).filter(p => inRange(p.date));

  let csv = '\uFEFF';
  csv += `CUSTOMER STATEMENT — ${c.name}\n`;
  csv += `Period: ${fromDate || 'Shuru'} se ${toDate || 'Aaj'} tak\n\n`;

  csv += 'CUSTOMER INFO\n';
  csv += `Naam,${c.name || ''}\n`;
  csv += `Phone,${c.phone || ''}\n`;
  csv += `Address,${escapeCSV(c.address)}\n`;
  csv += `Rate Per Jar,${rate}\n`;
  csv += `Payment Type,${c.payType || 'perDelivery'}\n\n`;

  csv += 'DELIVERY HISTORY\n';
  csv += 'Date,Jar Diye,Jar Wapas,Amount (Rs),Status\n';
  filteredDeliveries.forEach(d => {
    const amt = d.amount || (d.delivered || 0) * rate;
    csv += `${d.date || ''},${d.delivered || 0},${d.collected || 0},${amt},${
      d.paidStatus || 'paid'
    }\n`;
  });

  const totalDel = filteredDeliveries.reduce((s, d) => s + (d.delivered || 0), 0);
  const totalAmt = filteredDeliveries.reduce(
    (s, d) => s + (d.amount || (d.delivered || 0) * rate),
    0
  );
  csv += `TOTAL,${totalDel},,${totalAmt},\n\n`;

  if (filteredPayments.length > 0) {
    csv += 'CASH PAYMENTS\n';
    csv += 'Date,Amount (Rs),Note\n';
    filteredPayments.forEach(p => {
      csv += `${p.date || ''},${p.amount || 0},${escapeCSV(p.note || '')}\n`;
    });
    const cashTotal = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
    csv += `TOTAL,,${cashTotal},\n`;
  }

  const fname = `${c.name.replace(/[^a-zA-Z0-9]/g, '_')}_${rangeLabel}.csv`;
  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  const a = document.createElement('a');
  a.setAttribute('href', dataUri);
  a.setAttribute('download', fname);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    if (navigator.share) {
      const file = new File([csv], fname, { type: 'text/csv' });
      navigator.share({ files: [file], title: `${c.name} Statement` }).catch(() => {});
    }
  }, 500);
}

export function shareOnWhatsApp(customers: Customer[]) {
  if (customers.length === 0) {
    alert('Koi data nahi hai!');
    return;
  }

  const totalAmt = customers.reduce(
    (s, c) => s + (c.deliveries || []).reduce((ss, d) => ss + (d.amount || 0), 0),
    0
  );
  const totalJar = customers.reduce(
    (s, c) => s + (c.deliveries || []).reduce((ss, d) => ss + (d.delivered || 0), 0),
    0
  );
  const totalJarsOut = customers.reduce((s, c) => s + (c.jarsAtCustomer || 0), 0);

  let msg = `💧 *JAR BUSINESS REPORT*\n`;
  msg += `📅 Date: ${todayStr()}\n\n`;
  msg += `📊 *SUMMARY*\n`;
  msg += `💰 Poori Kamai: Rs ${totalAmt}\n`;
  msg += `📦 Total Jar Deliver: ${totalJar}\n`;
  msg += `📦 Customers ke paas: ${totalJarsOut} Jar\n`;
  msg += `👥 Total Customers: ${customers.length}\n\n`;
  msg += `👥 *CUSTOMERS*\n`;

  customers.forEach((c, i) => {
    const cAmt = (c.deliveries || []).reduce((s, d) => s + (d.amount || 0), 0);
    const cJar = (c.deliveries || []).reduce((s, d) => s + (d.delivered || 0), 0);
    msg += `${i + 1}. *${c.name}* — ${c.phone || '—'}\n`;
    msg += `   📍 ${c.address || '—'}\n`;
    msg += `   📦 Jar: ${c.jarsAtCustomer} | 🚚 Deliver: ${cJar} | 💰 Rs ${cAmt}\n\n`;
  });

  const encoded = encodeURIComponent(msg);
  window.open('https://wa.me/?text=' + encoded, '_blank');
}
