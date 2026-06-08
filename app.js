(function(){
  'use strict';
  var DATA = window.PLANUF_DATA || { equipment: [], productionTemplates: [], crewRoles: [], defaults: {} };
  var app = document.getElementById('app');
  var state = {
    projectName: 'Test',
    productionType: 'mini-series',
    episodes: 6,
    episodesPerShootDay: 6,
    editDaysPerEpisode: 1,
    locationHirePerDay: DATA.defaults.locationHirePerDay || 250,
    castCostPerEpisode: DATA.defaults.castCostPerEpisode || 20,
    contingencyPercent: DATA.defaults.contingencyPercent || 10,
    tab: 'setup',
    crew: (DATA.crewRoles || []).map(function(r){ return Object.assign({}, r); }),
    equipment: (DATA.equipment || []).map(function(e, i){ return { id: 'eq' + i, category: e.category, item: e.item, qty: e.qty, unit: e.unit, url: e.url, decision: e.owned ? 'owned' : 'buy' }; })
  };

  try {
    var saved = JSON.parse(localStorage.getItem('planuf-budget-builder-safe'));
    if (saved) state = Object.assign(state, saved);
  } catch(e) {}

  function save(){ localStorage.setItem('planuf-budget-builder-safe', JSON.stringify(state)); }
  function num(v){ v = Number(v); return isFinite(v) ? v : 0; }
  function cash(v){ return new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP', maximumFractionDigits:0 }).format(num(v)); }
  function esc(v){ return String(v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function shootDays(){ return Math.max(1, Math.ceil(Math.max(1, num(state.episodes)) / Math.max(1, num(state.episodesPerShootDay)))); }
  function editDays(){ return Math.max(0, Math.ceil(num(state.episodes) * num(state.editDaysPerEpisode))); }
  function buyEquipmentTotal(){ return state.equipment.reduce(function(t, e){ return t + (e.decision === 'buy' ? num(e.qty) * num(e.unit) : 0); }, 0); }
  function crewTotal(){
    var sd = shootDays();
    var ed = editDays();
    return state.crew.reduce(function(t, r){
      if (!r.enabled) return t;
      var mult = r.phase === 'edit' ? ed : r.phase === 'episode' ? num(state.episodes) : sd;
      return t + num(r.qty) * num(r.rate) * mult;
    }, 0);
  }
  function totals(){
    var crew = crewTotal();
    var loc = shootDays() * num(state.locationHirePerDay);
    var cast = num(state.episodes) * num(state.castCostPerEpisode);
    var equip = buyEquipmentTotal();
    var sub = crew + loc + cast;
    var cont = Math.round((sub + equip) * (num(state.contingencyPercent) / 100));
    return { crew: crew, loc: loc, cast: cast, equip: equip, sub: sub, cont: cont, total: sub + equip + cont };
  }
  function templateOptions(){
    return DATA.productionTemplates.map(function(t){ return '<option value="' + t.id + '" ' + (state.productionType === t.id ? 'selected' : '') + '>' + esc(t.name) + '</option>'; }).join('');
  }
  function applyTemplate(id){
    var t = DATA.productionTemplates.find(function(x){ return x.id === id; });
    if (!t) return;
    state.productionType = id;
    state.episodes = t.episodes;
    state.episodesPerShootDay = t.episodesPerShootDay;
    state.editDaysPerEpisode = t.editDaysPerEpisode;
    save();
    render();
  }
  function tabs(){
    return ['setup','crew','equipment','summary'].map(function(t, i){ return '<button class="tab ' + (state.tab === t ? 'active' : '') + '" data-tab="' + t + '">' + (i+1) + '. ' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>'; }).join('');
  }
  function header(T){
    return '<section class="hero"><div><p class="eyebrow">Planuf Productions</p><h1>Budget Builder</h1><p class="subhead">Automated planning estimate. Episode count now drives shoot days, edit days, crew labour, location hire and total spend.</p></div><aside class="total-card"><p class="total-label">Current required spend</p><p class="total-value">' + cash(T.total) + '</p><p class="total-note">' + state.episodes + ' episodes · ' + shootDays() + ' shoot days · ' + editDays() + ' edit days</p></aside></section><nav class="tabs">' + tabs() + '</nav>';
  }
  function setupView(){
    return '<section class="grid"><div class="panel"><h2>Production setup</h2><p class="note">Example rule: 15 episodes at 6 episodes per shoot day becomes 3 shoot days automatically.</p><div class="form-grid">' +
    field('Project name','projectName',state.projectName,'text') +
    '<label>Production shape<select id="productionType">' + templateOptions() + '</select></label>' +
    field('Episodes','episodes',state.episodes,'number') +
    field('Episodes possible per shoot day','episodesPerShootDay',state.episodesPerShootDay,'number') +
    readonly('Calculated shoot days', shootDays()) +
    field('Edit days per episode','editDaysPerEpisode',state.editDaysPerEpisode,'number') +
    readonly('Calculated edit days', editDays()) +
    field('Location hire per shoot day','locationHirePerDay',state.locationHirePerDay,'number') +
    field('Cast/contributor cost per episode','castCostPerEpisode',state.castCostPerEpisode,'number') +
    field('Contingency %','contingencyPercent',state.contingencyPercent,'number') +
    '</div><div class="actions"><button data-tab="crew">Continue to Crew</button><button class="secondary" id="resetBtn">Reset local draft</button></div></div>' +
    '<aside class="panel"><h2>Automation check</h2><ul class="summary-list"><li><span>Episodes</span><strong>' + state.episodes + '</strong></li><li><span>Episodes per shoot day</span><strong>' + state.episodesPerShootDay + '</strong></li><li><span>Calculated shoot days</span><strong>' + shootDays() + '</strong></li><li><span>Calculated edit days</span><strong>' + editDays() + '</strong></li></ul></aside></section>';
  }
  function field(label, key, value, type){ return '<label>' + label + '<input data-field="' + key + '" type="' + type + '" value="' + esc(value) + '"></label>'; }
  function readonly(label, value){ return '<label>' + label + '<input disabled value="' + esc(value) + '"></label>'; }
  function crewView(){
    var rows = state.crew.map(function(r, i){
      var mult = r.phase === 'edit' ? editDays() : r.phase === 'episode' ? state.episodes : shootDays();
      var total = r.enabled ? num(r.qty) * num(r.rate) * mult : 0;
      return '<article class="equipment-card"><strong>' + esc(r.role) + '</strong><div class="mini">Multiplier ' + mult + ' · ' + cash(total) + '</div><label>Use<select data-crew="' + i + '" data-key="enabled"><option value="true" ' + (r.enabled?'selected':'') + '>Use</option><option value="false" ' + (!r.enabled?'selected':'') + '>Off</option></select></label><div class="card-controls"><label>Qty<input data-crew="' + i + '" data-key="qty" type="number" value="' + r.qty + '"></label><label>Rate £<input data-crew="' + i + '" data-key="rate" type="number" value="' + r.rate + '"></label></div><label>Charged by<select data-crew="' + i + '" data-key="phase"><option value="shoot" ' + (r.phase==='shoot'?'selected':'') + '>Shoot day</option><option value="edit" ' + (r.phase==='edit'?'selected':'') + '>Edit day</option><option value="episode" ' + (r.phase==='episode'?'selected':'') + '>Episode</option></select></label></article>';
    }).join('');
    return '<section class="panel"><h2>Crew and labour</h2><p class="note">Shoot roles multiply by shoot days. Edit roles multiply by edit days. Episode roles multiply by episode count.</p><div class="mobile-card-list" style="display:grid">' + rows + '</div><div class="actions"><button data-tab="equipment">Continue to Equipment</button><button class="secondary" data-tab="setup">Back to Setup</button></div></section>';
  }
  function equipmentView(){
    var rows = state.equipment.map(function(e, i){ return '<article class="equipment-card"><strong>' + esc(e.item) + '</strong><div class="mini">' + esc(e.category) + ' · ' + cash(num(e.qty)*num(e.unit)) + '</div><div class="card-controls"><label>Qty<input data-eq="' + i + '" data-key="qty" type="number" value="' + e.qty + '"></label><label>Unit £<input data-eq="' + i + '" data-key="unit" type="number" value="' + e.unit + '"></label></div><label>Status<select data-eq="' + i + '" data-key="decision"><option value="owned" ' + (e.decision==='owned'?'selected':'') + '>Already owned</option><option value="buy" ' + (e.decision==='buy'?'selected':'') + '>Need to buy</option><option value="hire" ' + (e.decision==='hire'?'selected':'') + '>Hire / borrow</option><option value="company" ' + (e.decision==='company'?'selected':'') + '>Company decision</option></select></label><a href="' + e.url + '" target="_blank">Open buying link</a></article>'; }).join('');
    return '<section class="panel"><h2>Equipment reconciliation</h2><p class="note">Only “Need to buy” equipment is added to the required spend.</p><div class="mobile-card-list" style="display:grid">' + rows + '</div><div class="actions"><button data-tab="summary">Continue to Summary</button><button class="secondary" data-tab="crew">Back to Crew</button></div></section>';
  }
  function summaryView(T){
    return '<section class="grid"><div class="panel"><h2>Budget summary</h2><p><strong>' + esc(state.projectName) + '</strong></p><ul class="summary-list"><li><span>Episodes</span><strong>' + state.episodes + '</strong></li><li><span>Shoot days</span><strong>' + shootDays() + '</strong></li><li><span>Edit days</span><strong>' + editDays() + '</strong></li><li><span>Crew and labour</span><strong>' + cash(T.crew) + '</strong></li><li><span>Location hire</span><strong>' + cash(T.loc) + '</strong></li><li><span>Cast / contributors</span><strong>' + cash(T.cast) + '</strong></li><li><span>Equipment to buy now</span><strong>' + cash(T.equip) + '</strong></li><li><span>Contingency</span><strong>' + cash(T.cont) + '</strong></li><li><span>Total required spend</span><strong>' + cash(T.total) + '</strong></li></ul><div class="actions"><button data-tab="setup">Back to Setup</button></div></div></section>';
  }
  function render(){
    var T = totals();
    app.innerHTML = header(T) + (state.tab === 'crew' ? crewView() : state.tab === 'equipment' ? equipmentView() : state.tab === 'summary' ? summaryView(T) : setupView());
    bind();
  }
  function bind(){
    app.querySelectorAll('[data-tab]').forEach(function(b){ b.onclick = function(){ state.tab = b.dataset.tab; save(); render(); }; });
    app.querySelectorAll('[data-field]').forEach(function(i){ i.onchange = function(){ state[i.dataset.field] = i.type === 'number' ? num(i.value) : i.value; save(); render(); }; });
    app.querySelectorAll('[data-crew]').forEach(function(i){ i.onchange = function(){ var r = state.crew[num(i.dataset.crew)]; r[i.dataset.key] = i.dataset.key === 'enabled' ? i.value === 'true' : (i.dataset.key === 'qty' || i.dataset.key === 'rate') ? num(i.value) : i.value; save(); render(); }; });
    app.querySelectorAll('[data-eq]').forEach(function(i){ i.onchange = function(){ var e = state.equipment[num(i.dataset.eq)]; e[i.dataset.key] = (i.dataset.key === 'qty' || i.dataset.key === 'unit') ? num(i.value) : i.value; save(); render(); }; });
    var type = document.getElementById('productionType'); if (type) type.onchange = function(){ applyTemplate(type.value); };
    var reset = document.getElementById('resetBtn'); if (reset) reset.onclick = function(){ localStorage.removeItem('planuf-budget-builder-safe'); location.reload(); };
  }
  render();
})();
