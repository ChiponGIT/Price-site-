const $ = (id) => document.getElementById(id);

const form = $("addForm");
const list = $("list");
const sort = $("sort");
const clearBtn = $("clear");
const summary = $("summary");

const LS_KEY = "price_compare_items_v1";

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
  const v = sort.value;

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

  list.innerHTML = "";

  if (sorted.length === 0){
    summary.textContent = "No items yet. Add your first product above.";
    return;
  }

  // Best deal = lowest price
  const bestPrice = Math.min(...sorted.map(x => x.price));

  sorted.forEach((it) => {
    const card = document.createElement("div");
    card.className = "item";

    if (it.price === bestPrice){
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = "Best deal";
      card.appendChild(badge);
    }

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = it.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<span>${it.store}</span><span>•</span><span>${new Date(it.addedAt).toLocaleString()}</span>`;

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = money(it.price);

    const actions = document.createElement("div");
    actions.className = "meta";

    if (it.url){
      const a = document.createElement("a");
      a.className = "link";
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = "Open link";
      actions.appendChild(a);
    }

    const del = document.createElement("button");
    del.className = "btn ghost";
    del.type = "button";
    del.textContent = "Remove";
    del.addEventListener("click", () => {
      const now = loadItems().filter(x => x.id !== it.id);
      saveItems(now);
      render();
    });

    actions.appendChild(del);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(price);
    card.appendChild(actions);

    list.appendChild(card);
  });

  const cheapest = sorted.reduce((a,b) => (b.price < a.price ? b : a), sorted[0]);
  summary.textContent = `Cheapest: ${cheapest.name} at ${cheapest.store} — ${money(cheapest.price)} (${sorted.length} item${sorted.length===1?"":"s"})`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("name").value.trim();
  const store = $("store").value.trim();
  const priceRaw = $("price").value.trim();
  const url = normalizeUrl($("url").value);

  const price = Number(priceRaw);
  if (!name || !store || !Number.isFinite(price)){
    alert("Please enter name, store, and a valid price.");
    return;
  }

  const items = loadItems();
  items.push({
    id: crypto.randomUUID(),
    name,
    store,
    price,
    url: url || "",
    addedAt: Date.now(),
  });

  saveItems(items);
  form.reset();
  render();
});

sort.addEventListener("change", render);

clearBtn.addEventListener("click", () => {
  if (confirm("Clear all items?")){
    saveItems([]);
    render();
  }
});

render();
