let municipios = [];
let editId = null;
let toastTimer;

/* ─── UTILS ─────────────────────────────────── */
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
    const tbody = document.getElementById('muniBody'); // Verifique se o ID no HTML é muniBody
    const emptyState = document.getElementById('emptyState');
    const muniTable = document.getElementById('muniTable');
    
    tbody.innerHTML = '';

    if (municipios.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (muniTable) muniTable.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        if (muniTable) muniTable.style.display = 'table';
    }

    municipios.forEach((m) => {
        // Fallbacks para compatibilidade com dados antigos e novos
        const estadoExibir = m.estado || m.uf || '---';
        const popExibir = m.populacao || m.pop || 0;
        const areaExibir = m.area_km2 || m.area || 0;
        const ibgeExibir = m.cod_ibge || m.ibge || '-';

        tbody.innerHTML += `
            <tr>
                <td>${esc(m.nome)}</td>
                <td><span class="badge-uf">${esc(estadoExibir)}</span></td>
                <td>${m.prefeito ? esc(m.prefeito) : '-'}</td>
                <td>${esc(ibgeExibir)}</td>
                <td>${Number(popExibir).toLocaleString('pt-BR')}</td>
                <td>${Number(areaExibir).toLocaleString('pt-BR')}</td>
                <td>
                    <button class="btn-edit" onclick="editMuni('${m._id}')">Editar</button>
                    <button class="btn-delete" onclick="deleteMuni('${m._id}')">Excluir</button>
                </td>
            </tr>
        `;
    });
    updateStats(); 
}

function updateStats() {
  const totalPop = municipios.reduce((s, m) => s + (parseInt(m.populacao || m.pop) || 0), 0);
  const totalArea = municipios.reduce((s, m) => s + (parseFloat(m.area_km2 || m.area) || 0), 0);
  
  const elCount = document.getElementById('statCount');
  const elPop = document.getElementById('statPop');
  const elArea = document.getElementById('statArea');

  if (elCount) elCount.textContent = municipios.length.toLocaleString('pt-BR');
  if (elPop) elPop.textContent = totalPop.toLocaleString('pt-BR');
  if (elArea) elArea.textContent = totalArea.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/* ─── MODAL & CRUD ───────────────────────────── */
function openModal(id) {
    editId = id || null;
    document.getElementById('modalTitle').textContent = id ? 'Editar município' : 'Novo município';
    clearForm();

    if (id) {
        const m = municipios.find(x => x._id === id);
        if (m) {
            document.getElementById('fNome').value = m.nome || '';
            document.getElementById('fUF').value = m.estado || m.uf || '';
            document.getElementById('fRegiao').value = m.regiao || '';
            document.getElementById('fPrefeito').value = m.prefeito || '';
            document.getElementById('fIBGE').value = m.cod_ibge || m.ibge || '';
            document.getElementById('fPop').value = m.populacao || m.pop || '';
            document.getElementById('fArea').value = m.area_km2 || m.area || '';
        }
    }
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editId = null;
}

function onOverlayClick(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}

async function saveModal() {
  const nome = document.getElementById('fNome').value.trim();
  const uf = document.getElementById('fUF').value;
  
  if (!nome || !uf) { 
    alert('Preencha os campos obrigatórios (Nome e UF)!'); 
    return; 
  }

  // Objeto montado com os nomes de campos do banco MongoDB
  const obj = {
    nome: nome,
    estado: uf,
    regiao: document.getElementById('fRegiao').value,
    prefeito: document.getElementById('fPrefeito').value.trim(),
    cod_ibge: document.getElementById('fIBGE').value.trim(),
    populacao: Number(document.getElementById('fPop').value) || 0,
    area_km2: Number(document.getElementById('fArea').value) || 0,
    capital: document.getElementById('fCapital') ? document.getElementById('fCapital').checked : false
  };

  try {
    const url = editId ? `http://localhost:3000/municipios/${editId}` : 'http://localhost:3000/cadastrar';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj)
    });

    if (!res.ok) throw new Error('Erro ao salvar dados');

    showToast(editId ? 'Atualizado!' : 'Cadastrado!');
    closeModal();
    loadData(); 
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert('Erro ao conectar com o servidor.');
  }
}

async function deleteMuni(id) {
  if (!confirm('Deseja realmente excluir este município?')) return;

  try {
    const res = await fetch(`http://localhost:3000/municipios/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Erro ao excluir');

    showToast('Excluído com sucesso!');
    loadData();
  } catch (e) {
    console.error("Erro ao excluir:", e);
    alert('Erro ao excluir o município.');
  }
}

async function loadData() {
  try {
    const res = await fetch('http://localhost:3000/municipios');
    municipios = await res.json();
    render();
  } catch (e) {
    console.error("Erro ao carregar dados do servidor:", e);
  }
}

function editMuni(id) { openModal(id); }

function clearForm() {
  const fields = ['fNome', 'fPrefeito', 'fIBGE', 'fPop', 'fArea', 'fUF', 'fRegiao'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cap = document.getElementById('fCapital');
  if (cap) cap.checked = false;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─── INIT ───────────────────────────────────── */
loadData();