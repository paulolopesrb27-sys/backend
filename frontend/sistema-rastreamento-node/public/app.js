/**
 * Lógica do Frontend - Sistema de Rastreamento com Leaflet.js
 */

// Configuração da URL Base da API (usa a própria origem do Node.js ou localhost:3000 como fallback)
const API_BASE_URL = window.location.origin && window.location.origin.startsWith("http")
  ? window.location.origin 
  : "http://localhost:3000";

// Elementos do DOM
const searchForm = document.getElementById("search-form");
const trackingInput = document.getElementById("tracking-input");
const btnSearch = document.getElementById("btn-search");
const alertBox = document.getElementById("alert-message");

const emptyState = document.getElementById("empty-state");
const trackingCard = document.getElementById("tracking-card");

const displayCode = document.getElementById("display-code");
const statusBadge = document.getElementById("status-badge");
const displayDestinatario = document.getElementById("display-destinatario");
const displayAtualizacao = document.getElementById("display-atualizacao");
const displayOrder = document.getElementById("display-order");
const displayOrderDate = document.getElementById("display-order-date");
const displayAddress = document.getElementById("display-address");
const timelineList = document.getElementById("timeline-list");
const productsList = document.getElementById("products-list");
const trackingCodes = document.getElementById("tracking-codes");
const btnDownloadPdf = document.getElementById("btn-download-pdf");

// Variáveis de Controle do Leaflet
let map;
let currentMarker = null;
let currentCircle = null;

/**
 * Inicializa o Mapa Interativo Leaflet
 */
function inicializarMapa() {
  const centroAraguaina = [-7.192, -48.204];
  const zoomInicial = 12;

  map = L.map("map", {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView(centroAraguaina, zoomInicial);

  // Adiciona a camada de mapa base do OpenStreetMap
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}

/**
 * Exibe ou esconde mensagens de alerta na interface
 */
function exibirAlerta(mensagem, tipo = "error") {
  if (!mensagem) {
    alertBox.classList.add("hidden");
    alertBox.textContent = "";
    alertBox.className = "alert hidden";
    return;
  }
  alertBox.textContent = mensagem;
  alertBox.className = `alert alert-${tipo}`;
  alertBox.classList.remove("hidden");
}

/**
 * Formata data e hora para o padrão brasileiro
 */
function formatarData(dataIso) {
  if (!dataIso) return "-";
  const data = new Date(dataIso);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Retorna a classe CSS do badge com base no status
 */
function getBadgeClass(status) {
  const s = status.toLowerCase();
  if (s.includes("entregue")) return "badge-entregue";
  if (s.includes("trânsito") || s.includes("transito")) return "badge-transito";
  return "badge-alerta";
}

/**
 * Atualiza o marcador e o raio no mapa do Leaflet
 */
function atualizarMapa(latitude, longitude, dados) {
  const coordenadas = [latitude, longitude];

  // Remove marcador e círculo anteriores se existirem
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }
  if (currentCircle) {
    map.removeLayer(currentCircle);
  }

  // Animação suave até as coordenadas da entrega com zoom aproximado
  map.flyTo(coordenadas, 12, {
    duration: 1.5,
  });

  // Raio circular ilustrativo da área de entrega
  currentCircle = L.circle(coordenadas, {
    color: "#2563eb",
    fillColor: "#3b82f6",
    fillOpacity: 0.15,
    radius: 700,
  }).addTo(map);

  // Ícone personalizado para o marcador
  const customIcon = L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background: #2563eb; 
        color: white; 
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

  // Conteúdo do Popup interativo
  const popupHtml = `
    <div class="custom-popup">
      <strong>${dados.codigo_rastreio}</strong>
      <p><strong>Status:</strong> ${dados.status}</p>
      <p><strong>Endereço informado:</strong> ${dados.endereco}, ${dados.bairro} - ${dados.cidade}/${dados.estado}</p>
      <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Marcador aproximado do município; endereço sem geocodificação.</p>
    </div>
  `;

  // Cria e abre o popup
  currentMarker = L.marker(coordenadas, { icon: customIcon })
    .addTo(map)
    .bindPopup(popupHtml)
    .openPopup();
}

/**
 * Renderiza os dados da encomenda na coluna de detalhes
 */
function renderizarDetalhes(dados) {
  emptyState.classList.add("hidden");
  trackingCard.classList.remove("hidden");

  displayCode.textContent = dados.codigo_rastreio;
  statusBadge.textContent = dados.status;
  statusBadge.className = `badge ${getBadgeClass(dados.status)}`;

  displayDestinatario.textContent = dados.destinatario_nome;
  displayAtualizacao.textContent = formatarData(dados.ultima_atualizacao);
  displayOrder.textContent = `#${dados.pedido.id_pedido}`;
  displayOrderDate.textContent = formatarData(dados.pedido.data_pedido);
  displayAddress.textContent = `${dados.endereco}, ${dados.bairro} - ${dados.cidade}/${dados.estado}`;
  atualizarMapa(-7.192, -48.204, dados);

  // Configura a rota do botão de download de comprovante PDF
  btnDownloadPdf.href = `${API_BASE_URL}/api/entregas/${dados.codigo_rastreio}/comprovante`;

  // Renderiza a Timeline de Histórico
  timelineList.innerHTML = "";
  if (dados.historicos && dados.historicos.length > 0) {
    dados.historicos.forEach((hist) => {
      const item = document.createElement("div");
      item.className = "timeline-item";
      item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-header">
          <span class="timeline-status">${hist.status}</span>
          <span class="timeline-date">${formatarData(hist.data_hora)}</span>
        </div>
        <div class="timeline-location">${hist.localizacao}</div>
        ${hist.observacao ? `<div class="timeline-note">${hist.observacao}</div>` : ""}
      `;
      timelineList.appendChild(item);
    });
  } else {
    timelineList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">Nenhum histórico registrado.</p>`;
  }

  productsList.replaceChildren();
  if (dados.produtos.length === 0) {
    productsList.textContent = "Nenhum produto foi cadastrado nos itens deste pedido.";
    return;
  }
  dados.produtos.forEach((produto) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    const name = document.createElement("strong");
    name.textContent = produto.nome;
    const quantity = document.createElement("span");
    quantity.textContent = `Quantidade: ${produto.quantidade}`;
    item.append(name, quantity);
    productsList.appendChild(item);
  });
}

async function carregarCodigos() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/api/entregas`);
    if (!resposta.ok) throw new Error("Falha ao carregar os códigos.");
    const entregas = await resposta.json();
    trackingCodes.replaceChildren();
    entregas.forEach((entrega) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip-code";
      chip.textContent = entrega.codigo_rastreio;
      chip.addEventListener("click", () => {
        trackingInput.value = entrega.codigo_rastreio;
        buscarRastreamento(entrega.codigo_rastreio);
      });
      trackingCodes.appendChild(chip);
    });
    if (entregas.length === 0) trackingCodes.textContent = "Nenhum código cadastrado.";
  } catch (erro) {
    trackingCodes.textContent = "Não foi possível carregar os códigos.";
  }
}

/**
 * Consulta a API de Rastreamento Python
 */
async function buscarRastreamento(codigo) {
  const codigoLimpo = codigo.trim().toUpperCase();
  if (!codigoLimpo) return;

  exibirAlerta(""); // Limpa alerta anterior
  btnSearch.disabled = true;
  btnSearch.style.opacity = "0.7";

  try {
    const resposta = await fetch(`${API_BASE_URL}/api/entregas/${codigoLimpo}`);

    if (resposta.status === 404) {
      exibirAlerta(`Encomenda "${codigoLimpo}" não encontrada no sistema. Tente um dos códigos de teste.`);
      return;
    }

    if (!resposta.ok) {
      throw new Error(`Erro na consulta (Status: ${resposta.status})`);
    }

    const dados = await resposta.json();
    renderizarDetalhes(dados);

  } catch (erro) {
    console.error("Falha ao consultar API:", erro);
    exibirAlerta("Não foi possível conectar à API de rastreamento. Verifique se o backend Python está em execução.");
  } finally {
    btnSearch.disabled = false;
    btnSearch.style.opacity = "1";
  }
}

// ==========================================
// Event Listeners
// ==========================================

// Envio do formulário de busca
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  buscarRastreamento(trackingInput.value);
});

document.addEventListener("DOMContentLoaded", () => {
  inicializarMapa();
  carregarCodigos();
});
