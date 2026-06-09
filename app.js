let allData = [];
let selectedRank = "";

const bladeSelect = document.getElementById("bladeSelect");
const ratchetSelect = document.getElementById("ratchetSelect");
const bitSelect = document.getElementById("bitSelect");
const resultTable = document.getElementById("resultTable");
const resultCount = document.getElementById("resultCount");
const topCombos = document.getElementById("topCombos");
const popularBlades = document.getElementById("popularBlades");
const popularRatchets = document.getElementById("popularRatchets");
const popularBits = document.getElementById("popularBits");

fetch("data.json")
  .then(res => {
    if (!res.ok) throw new Error("找不到 data.json");
    return res.json();
  })
  .then(data => {
    allData = Array.isArray(data) ? data : [];
    renderSelects();
    renderAll();


    bindEvents();
  })
  .catch(err => {
    console.error(err);
    alert("data.json 讀取失敗，請確認 JSON 格式正確");
  });

function bindEvents() {
  bladeSelect.addEventListener("change", () => {
    clearRankOnly();
    renderSelects();
    renderAll();
  });

  ratchetSelect.addEventListener("change", () => {
    clearRankOnly();
    renderSelects();
    renderAll();
  });

  bitSelect.addEventListener("change", () => {
    clearRankOnly();
    renderSelects();
    renderAll();
  });

  document.getElementById("clearBlade").addEventListener("click", () => {
    bladeSelect.value = "";
    clearRankOnly();
    renderSelects();
    renderAll();
  });

  document.getElementById("clearRatchet").addEventListener("click", () => {
    ratchetSelect.value = "";
    clearRankOnly();
    renderSelects();
    renderAll();
  });

  document.getElementById("clearBit").addEventListener("click", () => {
    bitSelect.value = "";
    clearRankOnly();
    renderSelects();
    renderAll();
  });

  document.getElementById("clearBtn").addEventListener("click", clearAll);

  document.querySelectorAll("[data-rank]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedRank = selectedRank === btn.dataset.rank ? "" : btn.dataset.rank;
      updateRankButtons();
      renderSelects();
      renderAll();
    });
  });
}

function clean(v) {
  return String(v || "").trim();
}

function bladeKey(item) {
  return clean(item["英文"]);
}

function bladeLabel(item) {
  const zh = clean(item["上蓋"]);
  const en = clean(item["英文"]);
  return zh || (en ? `(?)${en}` : "未知上蓋");
}

function getFilteredData(options = {}) {
  const ignore = options.ignore || "";
  const useRank = options.useRank !== false;

  const blade = bladeSelect.value;
  const ratchet = ratchetSelect.value;
  const bit = bitSelect.value;

  return allData.filter(item => {
    const okBlade = ignore === "blade" || !blade || bladeKey(item) === blade;
    const okRatchet = ignore === "ratchet" || !ratchet || clean(item["固鎖"]) === ratchet;
    const okBit = ignore === "bit" || !bit || clean(item["軸"]) === bit;
    const okRank = !useRank || !selectedRank || clean(item["名次"]) === selectedRank;

    return okBlade && okRatchet && okBit && okRank;
  });
}

function renderSelects() {
  const oldBlade = bladeSelect.value;
  const oldRatchet = ratchetSelect.value;
  const oldBit = bitSelect.value;

  const hasFilter = oldBlade || oldRatchet || oldBit;

  const bladeData = allData.filter(item => {
    const okRatchet = !oldRatchet || clean(item["固鎖"]) === oldRatchet;
    const okBit = !oldBit || clean(item["軸"]) === oldBit;
    return okRatchet && okBit;
  });

  const ratchetData = allData.filter(item => {
    const okBlade = !oldBlade || bladeKey(item) === oldBlade;
    const okBit = !oldBit || clean(item["軸"]) === oldBit;
    return okBlade && okBit;
  });

  const bitData = allData.filter(item => {
    const okBlade = !oldBlade || bladeKey(item) === oldBlade;
    const okRatchet = !oldRatchet || clean(item["固鎖"]) === oldRatchet;
    return okBlade && okRatchet;
  });

  renderBladeSelect(bladeData, oldBlade);
  renderPartSelect(
    ratchetSelect,
    ratchetData,
    "固鎖",
    "全部固鎖",
    hasFilter ? sortByCount : sortRatchets,
    oldRatchet
  );
  renderPartSelect(
    bitSelect,
    bitData,
    "軸",
    "全部軸心",
    sortByCount,
    oldBit
  );

  bladeSelect.value = optionExists(bladeSelect, oldBlade) ? oldBlade : "";
  ratchetSelect.value = optionExists(ratchetSelect, oldRatchet) ? oldRatchet : "";
  bitSelect.value = optionExists(bitSelect, oldBit) ? oldBit : "";
}

function renderBladeSelect(data, selectedValue) {
  const map = new Map();

  data.forEach(item => {
    const key = bladeKey(item);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: bladeLabel(item),
        count: 0
      });
    }

    map.get(key).count++;
  });

  const list = [...map.values()].sort((a, b) => {
    return b.count - a.count || a.label.localeCompare(b.label, "zh-Hant");
  });

  bladeSelect.innerHTML = `<option value="">全部上蓋</option>`;

  list.forEach(item => {
    const text = item.key === selectedValue
      ? `${item.label}（已選定）`
      : `${item.label}（${item.count}）`;

    bladeSelect.innerHTML += `
      <option value="${esc(item.key)}">${esc(text)}</option>
    `;
  });
}

function renderPartSelect(select, data, field, defaultText, sorter, selectedValue) {
  const map = new Map();

  data.forEach(item => {
    const key = clean(item[field]);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  let list = [...map.entries()].map(([key, count]) => ({ key, count }));
  list = sorter(list);

  select.innerHTML = `<option value="">${defaultText}</option>`;

  list.forEach(item => {
    const text = item.key === selectedValue
      ? `${item.key}（已選定）`
      : `${item.key}（${item.count}）`;

    select.innerHTML += `
      <option value="${esc(item.key)}">${esc(text)}</option>
    `;
  });
}

function renderAll() {
  const data = getFilteredData();

  function renderTopComboTitle() {
  const title = document.getElementById("topComboTitle");
  if (!title) return;

  const bladeText =
    bladeSelect.selectedOptions[0]?.textContent
      .replace(/（.*?）/g, "")
      .trim() || "";

  const ratchet = ratchetSelect.value;
  const bit = bitSelect.value;

  if (bladeSelect.value && ratchet && !bit) {
    title.textContent = `${bladeText} ${ratchet} 熱門軸心`;
    return;
  }

  if (bladeSelect.value && !ratchet && bit) {
    title.textContent = `${bladeText} ${bit} 熱門固鎖`;
    return;
  }

  if (bladeSelect.value && !ratchet && !bit) {
    title.textContent = `${bladeText} 熱門搭配`;
    return;
  }

  if (!bladeSelect.value && ratchet && bit) {
    title.textContent = `${ratchet}${bit} 熱門上蓋`;
    return;
  }

  if (!bladeSelect.value && ratchet && !bit) {
    title.textContent = `${ratchet} 熱門搭配`;
    return;
  }

  if (!bladeSelect.value && !ratchet && bit) {
    title.textContent = `${bit} 熱門搭配`;
    return;
  }

  if (bladeSelect.value && ratchet && bit) {
    title.textContent = `${bladeText} ${ratchet}${bit}`;
    return;
  }

  title.textContent = "熱門得獎組合";
}

  renderTopComboTitle();
  renderTopCombos(data);
  renderPopular(data);
  renderTable(data);
}


function renderTopCombos(data) {
  const map = new Map();

  data.forEach(item => {
    const ratchet = clean(item["固鎖"]);
    const bit = clean(item["軸"]);
    if (!ratchet || !bit) return;

    const key = `${bladeKey(item)}|${ratchet}|${bit}`;

    if (!map.has(key)) {
      map.set(key, {
        blade: bladeLabel(item),
        bladeKey: bladeKey(item),
        ratchet,
        bit,
        total: 0,
        first: 0
      });
    }

    const obj = map.get(key);
    obj.total++;

    if (clean(item["名次"]) === "1st") {
      obj.first++;
    }
  });

  const list = [...map.values()]
    .sort((a, b) => b.total - a.total || b.first - a.first)
    .slice(0, 3);

  if (!list.length) {
    topCombos.innerHTML = `<p>沒有符合資料</p>`;
    return;
  }

  topCombos.innerHTML = list.map(item => {
    const display = getComboDisplay(item);

    return `
      <div class="combo-card">
        ${display.top ? `<div class="combo-name">${esc(display.top)}</div>` : ""}
        ${display.main ? `<div class="combo-combo">${esc(display.main)}</div>` : ""}
        <div class="combo-sub">${item.total}次(🏆${item.first})</div>
      </div>
    `;
  }).join("");
}

function getComboDisplay(item) {

  const blade = bladeSelect.value;
  const ratchet = ratchetSelect.value;
  const bit = bitSelect.value;

  // 全部沒選
  if (!blade && !ratchet && !bit) {
    return {
      top: item.blade,
      main: item.ratchet + item.bit
    };
  }

  // 只選上蓋
  if (blade && !ratchet && !bit) {
    return {
      top: "",
      main: item.ratchet + item.bit
    };
  }

  // 上蓋 + 固鎖
  if (blade && ratchet && !bit) {
    return {
      top: "",
      main: item.bit
    };
  }

  // 上蓋 + 軸
  if (blade && !ratchet && bit) {
    return {
      top: "",
      main: item.ratchet
    };
  }

  // 固鎖 + 軸
  if (!blade && ratchet && bit) {
    return {
      top: "",
      main: item.blade
    };
  }

  // 只選固鎖
  if (!blade && ratchet && !bit) {
    return {
      top: item.blade,
      main: item.bit
    };
  }

  // 只選軸
  if (!blade && !ratchet && bit) {
    return {
      top: item.blade,
      main: item.ratchet
    };
  }

  // 全選
  return {
    top: item.blade,
    main: item.ratchet + item.bit
  };
}
function renderPopular(data) {

  const titles = document.querySelectorAll(".popular-block h3");

  if (titles.length >= 3) {

    titles[0].innerHTML = bladeSelect.value
      ? '上蓋 <span class="popular-clear" onclick="clearPopularFilter(\'blade\')">✕</span>'
      : '上蓋';

    titles[1].innerHTML = ratchetSelect.value
      ? '固鎖 <span class="popular-clear" onclick="clearPopularFilter(\'ratchet\')">✕</span>'
      : '固鎖';

    titles[2].innerHTML = bitSelect.value
      ? '軸心 <span class="popular-clear" onclick="clearPopularFilter(\'bit\')">✕</span>'
      : '軸心';

  }

  renderPopularList(
    popularBlades,
    data,
    item => bladeLabel(item),
    "blade"
  );

  renderPopularList(
    popularRatchets,
    data,
    item => clean(item["固鎖"]),
    "ratchet"
  );

  renderPopularList(
    popularBits,
    data,
    item => clean(item["軸"]),
    "bit"
  );
}

function renderPopularList(container, data, getter, type) {
  const map = new Map();

  data.forEach(item => {
    const label = getter(item);
    if (!label) return;

    let value = label;

    if (type === "blade") {
      value = bladeKey(item);
    }

    if (!map.has(value)) {
      map.set(value, {
        label,
        value,
        count: 0
      });
    }

    map.get(value).count++;
  });

  const total = data.length || 1;

  const list = [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (!list.length) {
    container.innerHTML = `<p>無資料</p>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const percent = Math.round((item.count / total) * 100);
    return `
      <div class="popular-item clickable" data-type="${esc(type)}" data-value="${esc(item.value)}">
        <span>${esc(item.label)}</span>
        <span>${percent}%</span>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".popular-item").forEach(el => {
    el.addEventListener("click", () => {
      applyPopularSelection(el.dataset.type, el.dataset.value);
    });
  });
}

function applyPopularSelection(type, value) {
  if (!value) return;

  if (type === "blade") {
    bladeSelect.value = value;
  }

  if (type === "ratchet") {
    ratchetSelect.value = value;
  }

  if (type === "bit") {
    bitSelect.value = value;
  }

  clearRankOnly();
  renderSelects();
  renderAll();
}
function clearPopularFilter(type) {

  if (type === "blade") {
    bladeSelect.value = "";
  }

  if (type === "ratchet") {
    ratchetSelect.value = "";
  }

  if (type === "bit") {
    bitSelect.value = "";
  }

  clearRankOnly();
  renderSelects();
  renderAll();
}


function renderTable(data) {
  resultCount.textContent = `共 ${data.length} 筆資料`;

  resultTable.innerHTML = data.map(item => {
    let rank = clean(item["名次"]);

    if (rank === "1st") {
      rank = "🏆";
    }

    if (!rank) {
      rank = "-";
    }

    const blade = bladeLabel(item);
    const combo = clean(item["固鎖"]) + clean(item["軸"]);
    const date = clean(item["日期"]) || "-";

    const rowClass =
      clean(item["名次"]) === "1st"
        ? "rank-gold"
        : "";

    return `
      <tr class="${rowClass}">
        <td>${esc(rank)}</td>
        <td>${esc(blade)}</td>
        <td class="combo-green">${esc(combo)}</td>
        <td class="date-cell">${esc(date)}</td>
      </tr>
    `;
  }).join("");
}

function clearRankOnly() {
  selectedRank = "";
  updateRankButtons();
}

function updateRankButtons() {
  document.querySelectorAll("[data-rank]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.rank === selectedRank);
  });
}

function clearAll() {
  bladeSelect.value = "";
  ratchetSelect.value = "";
  bitSelect.value = "";
  selectedRank = "";
  updateRankButtons();
  renderSelects();
  renderAll();
}

function sortByCount(list) {
  return list.sort((a, b) => {
    return b.count - a.count || a.key.localeCompare(b.key);
  });
}

function sortRatchets(list) {
  return list.sort((a, b) => {
    const aa = parseRatchet(a.key);
    const bb = parseRatchet(b.key);

    if (aa.main !== bb.main) return aa.main - bb.main;
    if (aa.height !== bb.height) return aa.height - bb.height;

    return a.key.localeCompare(b.key);
  });
}

function parseRatchet(str) {
  const match = String(str).match(/^(\d+)-(\d+)/);

  return {
    main: match ? Number(match[1]) : 999,
    height: match ? Number(match[2]) : 999
  };
}

function optionExists(select, value) {
  return [...select.options].some(opt => opt.value === value);
}

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



