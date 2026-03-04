const $ = (id) => document.getElementById(id);

const LS_KEY = "terminal_price_compare_v1";
const rowsEl = $("rows");
const summaryEl = $("summary");
const sortEl = $("sort");
const clearBtn = $("clear");
const clockEl = $("clock");
const form = $("addForm");

function nowClock(){
  const d = new Date();
  clockEl.textContent = d.toLocaleString();
}
setInterval(nowClock, 1000);
nowClock();

function loadItems(){
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function saveItems(items){
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function money(n){
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString(undefined, { style:"currency", currency:"USD" });
}

function normalizeUrl(u){
  const s = (u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "https://" + s;
}

function getSorted(items){
  const v = sortEl.value;
  const copy = [...items];

  copy.sort((a,b) => {
    if (v === "price_asc") return a.price - b.price;
    if (v === "price_desc") return b.price - a.price;
    if (v === "store_asc") return a.store.localeCompare(b.store);
    if (v === "name_asc") return a.name.localeCompare(b.name);
    return 0;
  });

  return copy;
}

function render(){
  const items = loadItems();
  const sorted = getSorted(items);

  rowsEl.innerHTML = "";

  if (sorted.length === 0){
    summaryEl.textContent = "no items yet… add one above.";
    return;
  }

  const bestPrice = Math.min(...sorted.map(x => x.price));
  const best = sorted.find(x => x.price === bestPrice);

  summaryEl.textContent = `best_deal => ${best.name} @ ${best.store} : ${money(best.price)} | items=${sorted.length}`;

  for (const it of sorted){
    const tr = document.createElement("tr");
    const isBest = it.price === bestPrice;
    if (isBest) tr.classList.add("rowBest");

    tr.innerHTML = `
      <td>${isBest ? `<span class="badgeBest">BEST</span>` : ""}</td>
      <td>${escapeHtml(it.name)}</td>
      <td>${escapeHtml(it.store)}</td>
      <td class="right">${money(it.price)}</td>
      <td>${it.url ? `<a class="link" href="${it.url}" target="_blank" rel="noreferrer">open</a>` : `<span class="muted">—</span>`}</td>
      <td class="right"><button class="btn ghost" data-del="${it.id}" type="button">X</button></td>
    `;
    rowsEl.appendChild(tr);
  }

  // bind deletes
  rowsEl.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const next = loadItems().filter(x => x.id !== id);
      saveItems(next);
      render();
    });
  });
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("name").value.trim();
  const store = $("store").value.trim();
  const priceRaw = $("price").value.trim();
  const url = normalizeUrl($("url").value);

  const price = Number(priceRaw);
  if (!name || !store || !Number.isFinite(price)){
    alert("enter product, store, and a valid price.");
    return;
  }

  const items = loadItems();
  items.push({
    id: crypto.randomUUID(),
    name,
    store,
    price,
    url,
    addedAt: Date.now()
  });
  saveItems(items);

  form.reset();
  $("name").focus();
  render();
});

sortEl.addEventListener("change", render);

clearBtn.addEventListener("click", () => {
  if (confirm("clear all saved items?")){
    saveItems([]);
    render();
  }
});

render();
