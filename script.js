let municipios = [];
let editId = null;
let toastTimer;

/* ─── UTILS ─────────────────────────────────── */

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── RENDER ─────────────────────────────────── */

function render() {
  const q   = (document.getElementById('search').value || '').toLowerCase().trim();
  const uf  = document.getElementById('ufFilter').value;

  const filtered = municipios.filter(m => {
    const matchQ =
      !q ||
      m.nome.toLowerCase().includes(q) ||
      (m.prefeito || '').toLowerCase().includes(q) ||
      (m.ibge || '').includes(q);
    const matchUF = !uf || m.uf === uf;
    return matchQ && matchUF;
  });

  updateStats();

  const empty = document.getElementById('emptyState');
  const table = document.getElementById('muniTable');

  if (municipios.length === 0) {
    empty.style.display = '';
    table.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  table.style.display = '';

  const tbody = document.getElementById('muniBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="no-results">
          Nenhum município encontrado para os filtros aplicados.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(m => `
    <tr>
      <td class="muni-name">${esc(m.nome)}</td>
      <td><span class="uf-badge">${esc(m.uf)}</span></td>
      <td style="color:var(--text-2)">${esc(m.prefeito || '—')}</td>
      <td class="muni-ibge">${esc(m.ibge || '—')}</td>
      <td style="color:var(--text-2)">${m.pop ? parseInt(m.pop).toLocaleString('pt-BR') : '—'}</td>
      <td style="color:var(--text-2)">${m.area ? parseFloat(m.area).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—'}</td>
      <td style="color:var(--text-2)">${esc(m.regiao || '—')}</td>
      <td class="td-actions">
        <button class="btn-edit" onclick="editMuni('${esc(m.id)}')">Editar</button>
        <button class="btn-del"  onclick="deleteMuni('${esc(m.id)}')">Excluir</button>
      </td>
    </tr>`).join('');
}

function updateStats() {
  const totalPop  = municipios.reduce((s, m) => s + (parseInt(m.pop)   || 0), 0);
  const totalArea = municipios.reduce((s, m) => s + (parseFloat(m.area) || 0), 0);

  document.getElementById('statCount').textContent = municipios.length.toLocaleString('pt-BR');
  document.getElementById('statPop').textContent   = totalPop.toLocaleString('pt-BR');
  document.getElementById('statArea').textContent  = totalArea.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/* ─── MODAL ──────────────────────────────────── */

function openModal(id) {
  editId = id || null;
  document.getElementById('modalTitle').textContent = id ? 'Editar município' : 'Novo município';

  clearForm();

  if (id) {
    const m = municipios.find(x => x.id === id);
    if (m) {
      document.getElementById('fNome').value    = m.nome;
      document.getElementById('fUF').value      = m.uf;
      document.getElementById('fRegiao').value  = m.regiao   || '';
      document.getElementById('fPrefeito').value = m.prefeito || '';
      document.getElementById('fIBGE').value    = m.ibge     || '';
      document.getElementById('fPop').value     = m.pop      || '';
      document.getElementById('fArea').value    = m.area     || '';
    }
  }

  document.getElementById('formError').style.display = 'none';
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('fNome').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editId = null;
}

function onOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function clearForm() {
  ['fNome', 'fPrefeito', 'fIBGE', 'fPop', 'fArea'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fUF').value     = '';
  document.getElementById('fRegiao').value = '';
}

function saveModal() {
  const nome = document.getElementById('fNome').value.trim();
  const uf   = document.getElementById('fUF').value;

  if (!nome) { showError('O nome do município é obrigatório.'); return; }
  if (!uf)   { showError('Selecione o estado (UF).');           return; }

  document.getElementById('formError').style.display = 'none';

  const obj = {
    id:       editId || uid(),
    nome,
    uf,
    regiao:   document.getElementById('fRegiao').value,
    prefeito: document.getElementById('fPrefeito').value.trim(),
    ibge:     document.getElementById('fIBGE').value.trim(),
    pop:      document.getElementById('fPop').value,
    area:     document.getElementById('fArea').value,
  };

  if (editId) {
    municipios = municipios.map(m => m.id === editId ? obj : m);
    showToast('Município atualizado com sucesso!');
  } else {
    municipios.push(obj);
    showToast('Município cadastrado com sucesso!');
  }

  saveData();
  closeModal();
  render();
}

/* ─── CRUD ───────────────────────────────────── */

function editMuni(id) {
  openModal(id);
}

function deleteMuni(id) {
  const m = municipios.find(x => x.id === id);
  if (!m) return;
  if (!confirm(`Deseja excluir "${m.nome}"? Esta ação não pode ser desfeita.`)) return;
  municipios = municipios.filter(x => x.id !== id);
  saveData();
  showToast('Município excluído.');
  render();
}

/* ─── FEEDBACK ───────────────────────────────── */

function showError(msg) {
  const el = document.getElementById('formError');
  el.textContent    = msg;
  el.style.display  = 'block';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─── KEYBOARD SHORTCUTS ─────────────────────── */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (document.getElementById('modalOverlay').classList.contains('open')) saveModal();
  }
});

/* ─── PERSISTENCE ────────────────────────────── */

function saveData() {
  localStorage.setItem('municipios_db', JSON.stringify(municipios));
}

function loadData() {
  const data = localStorage.getItem('municipios_db');
  if (data) {
    try {
      municipios = JSON.parse(data);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      municipios = [];
    }
  }
}

/* ─── INIT ───────────────────────────────────── */

loadData();
render();
