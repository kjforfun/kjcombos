let allData=[],bladeOptions=[],ratchetOptions=[],bitOptions=[];
const deckForms=document.getElementById("deckForms");
const generateBtn=document.getElementById("generateBtn");
const clearBtn=document.getElementById("clearBtn");
const message=document.getElementById("message");
const outputSection=document.getElementById("outputSection");
const deckOutput=document.getElementById("deckOutput");

fetch("data.json").then(r=>{if(!r.ok)throw new Error("找不到 data.json");return r.json()})
.then(data=>{allData=Array.isArray(data)?data:[];prepareOptions();renderForms();bindEvents()})
.catch(err=>{console.error(err);message.textContent="data.json 讀取失敗"});

function clean(v){return String(v||"").trim()}
function removeCode(name){return clean(name).replace(/\s+(BX|UX|CX|BXA|BXC|BXG|BXH)-?\d+$/i,"").replace(/\s+BX-00$/i,"").trim()}
function displayBladeName(item){return removeCode(clean(item["上蓋"])||clean(item["英文"]))}

function prepareOptions(){
  const bladeMap=new Map(),ratchetMap=new Map(),bitMap=new Map();
  allData.forEach(item=>{
    const en=clean(item["英文"]),blade=displayBladeName(item),ratchet=clean(item["固鎖"]),bit=clean(item["軸"]);
    if(en&&blade&&!bladeMap.has(en))bladeMap.set(en,blade);
    if(ratchet&&/^\d{1,2}-\d{2}$/.test(ratchet))ratchetMap.set(ratchet,(ratchetMap.get(ratchet)||0)+1);
    if(bit)bitMap.set(bit,(bitMap.get(bit)||0)+1);
  });
  bladeOptions=[...bladeMap.entries()].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,"zh-Hant"));
  ratchetOptions=[...ratchetMap.keys()].sort(sortRatchet);
  bitOptions=[...bitMap.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([k])=>k);
}

function sortRatchet(a,b){
  const aa=parseRatchet(a),bb=parseRatchet(b);
  if(aa.main!==bb.main)return aa.main-bb.main;
  if(aa.height!==bb.height)return aa.height-bb.height;
  return a.localeCompare(b);
}
function parseRatchet(v){const m=String(v).match(/^(\d+)-(\d+)/);return{main:m?Number(m[1]):999,height:m?Number(m[2]):999}}

function renderForms(){
  deckForms.innerHTML="";
  for(let i=1;i<=3;i++){
    deckForms.innerHTML+=`
      <div class="combo-form" data-index="${i}">
        <div class="combo-title">Combo ${i}</div>
        <div class="form-grid">
          <div>
            <label>上蓋</label>
            <div class="blade-wrap">
              <select class="blade-select" data-index="${i}">
                <option value="">請選上蓋</option>
                ${bladeOptions.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("")}
                <option value="__custom__">自行輸入</option>
              </select>
              <input class="custom-input" data-index="${i}" placeholder="自行輸入上蓋名稱">
            </div>
          </div>
          <div>
            <label>固鎖</label>
            <select class="ratchet-select" data-index="${i}">
              <option value="">請選固鎖</option>
              ${ratchetOptions.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>軸</label>
            <select class="bit-select" data-index="${i}">
              <option value="">請選軸</option>
              ${bitOptions.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>`;
  }
}

function bindEvents(){
  deckForms.addEventListener("change",e=>{
    if(e.target.classList.contains("blade-select")){
      const idx=e.target.dataset.index;
      const input=document.querySelector(`.custom-input[data-index="${idx}"]`);
      input.classList.toggle("show",e.target.value==="__custom__");
    }
    updateHint();
  });
  deckForms.addEventListener("input",updateHint);
  generateBtn.addEventListener("click",generateDeck);
  clearBtn.addEventListener("click",clearAll);
}

function getCombos(){
  const combos=[];
  for(let i=1;i<=3;i++){
    const bs=document.querySelector(`.blade-select[data-index="${i}"]`);
    const ci=document.querySelector(`.custom-input[data-index="${i}"]`);
    const rs=document.querySelector(`.ratchet-select[data-index="${i}"]`);
    const bits=document.querySelector(`.bit-select[data-index="${i}"]`);
    let blade="";
    if(bs.value==="__custom__")blade=clean(ci.value);
    else blade=(bs.value&&bs.options[bs.selectedIndex])?clean(bs.options[bs.selectedIndex].textContent):"";
    combos.push({no:i,blade,ratchet:clean(rs.value),bit:clean(bits.value)});
  }
  return combos;
}

function validate(combos,partial=false){
  if(!partial){
    for(const c of combos)if(!c.blade||!c.ratchet||!c.bit)return"三隻都要選完上蓋、固鎖、軸";
  }
  for(const field of [{k:"blade",n:"上蓋"},{k:"ratchet",n:"固鎖"},{k:"bit",n:"軸"}]){
    const used=new Set();
    for(const c of combos){
      const v=c[field.k];
      if(!v)continue;
      if(used.has(v))return`${field.n}不能重複`;
      used.add(v);
    }
  }
  return"";
}

function updateHint(){message.textContent=validate(getCombos(),true)}

function generateDeck(){
  const combos=getCombos(),err=validate(combos,false);
  if(err){message.textContent=err;outputSection.classList.add("hidden");return}
  message.textContent="";
  outputSection.classList.remove("hidden");
  const cards=combos.map(c=>`
    <div class="deck-card">
      <div class="deck-card-header">
        <div class="deck-no">Combo ${c.no}</div>
        <div class="deck-blade">${esc(c.blade)}</div>
      </div>
      <div class="deck-combo">
        <div class="part"><div class="part-label">固鎖</div><div class="part-value">${esc(c.ratchet)}</div></div>
        <div class="part"><div class="part-label">軸</div><div class="part-value">${esc(c.bit)}</div></div>
      </div>
    </div>`).join("");
  const textList=combos.map(c=>`${c.no}. ${c.blade} ${c.ratchet}${c.bit}`).join("\n");
  deckOutput.innerHTML=`<div class="deck-output">${cards}</div><div class="share-box">My Deck\n${esc(textList)}</div>`;
}

function clearAll(){
  document.querySelectorAll("select").forEach(s=>s.value="");
  document.querySelectorAll("input").forEach(i=>{i.value="";i.classList.remove("show")});
  message.textContent="";
  outputSection.classList.add("hidden");
}
function esc(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
