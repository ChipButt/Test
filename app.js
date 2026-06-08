(function () {
  'use strict';

  var STORAGE_KEY = 'planuf-budget-builder-v1';
  var data = window.PLANUF_DATA || { equipment: [], productionTemplates: [], defaults: {} };
  var app = document.getElementById('app');

  var state = loadState();

  function money(value) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function cloneEquipment() {
    return data.equipment.map(function (item, index) {
      return {
        id: 'eq-' + index,
        category: item.category,
        item: item.item,
        qty: item.qty,
        unit: item.unit,
        url: item.url,
        decision: item.owned ? 'owned' : 'buy'
      };
    });
  }

  function loadState() {
    var fallback = {
      activeTab: 'setup',
      productionType: 'one-shot',
      projectName: 'Untitled Planuf Production',
      episodes: 1,
      shootDays: 1,
      editDays: 1,
      crewDayRate: data.defaults.crewDayRate || 300,
      locationHirePerDay: data.defaults.locationHirePerDay || 250,
      castCostPerEpisode: data.defaults.castCostPerEpisode || 20,
      editCostPerDay: data.defaults.editCostPerDay || 160,
      contingencyPercent: data.defaults.contingencyPercent || 10,
      equipment: cloneEquipment()
    };

    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return fallback;
      saved.equipment = Array.isArray(saved.equipment) && saved.equipment.length ? saved.equipment : fallback.equipment;
      return Object.assign(fallback, saved);
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setValue(key, value) {
    state[key] = value;
    saveState();
    render();
  }

  function numeric(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function chooseTemplate(id) {
    var template = data.productionTemplates.find(function (item) { return item.id === id; });
    if (!template) return;
    state.productionType = id;
    state.episodes = template.episodes;
    state.shootDays = template.shootDays;
    state.editDays = template.editDays;
    saveState();
    render();
  }

  function updateEquipment(id, key, value) {
    state.equipment = state.equipment.map(function (row) {
      if (row.id !== id) return row;
      var next = Object.assign({}, row);
      next[key] = key === 'qty' || key === 'unit' ? numeric(value) : value;
      return next;
    });
    saveState();
    render();
  }

  function resetAll() {
    if (!confirm('Reset this local budget draft? This only clears this browser, not any live Firebase or GitHub data.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    render();
  }

  function calculations() {
    var production = {
      crew: numeric(state.shootDays) * numeric(state.crewDayRate),
      location: numeric(state.shootDays) * numeric(state.locationHirePerDay),
      cast: numeric(state.episodes) * numeric(state.castCostPerEpisode),
      edit: numeric(state.editDays) * numeric(state.editCostPerDay)
    };
    production.subtotal = production.crew + production.location + production.cast + production.edit;

    var equipment = state.equipment.reduce(function (total, row) {
      var rowTotal = numeric(row.qty) * numeric(row.unit);
      return total + (row.decision === 'buy' ? rowTotal : 0);
    }, 0);

    var contingency = Math.round((production.subtotal + equipment) * (numeric(state.contingencyPercent) / 100));
    return {
      production: production,
      equipment: equipment,
      contingency: contingency,
      total: production.subtotal + equipment + contingency
    };
  }

  function statusClass(decision) {
    if (decision === 'owned') return 'status-owned';
    if (decision === 'hire') return 'status-hire';
    if (decision === 'company') return 'status-company';
    return 'status-buy';
  }

  function statusLabel(decision) {
    if (decision === 'owned') return 'Already owned';
    if (decision === 'hire') return 'Hire / borrow';
    if (decision === 'company') return 'Company decision';
    return 'Need to buy';
  }

  function html(strings) {
    var values = Array.prototype.slice.call(arguments, 1);
    return strings.reduce(function (result, part, index) {
      return result + part + (values[index] == null ? '' : values[index]);
    }, '');
  }

  function render() {
    var totals = calculations();
    app.innerHTML = html`
      <section class="hero">
        <div>
          <p class="eyebrow">Planuf Productions</p>
          <h1>Budget Builder</h1>
          <p class="subhead">Build a simple production budget, separate owned kit from things that need buying, and get a clean total you can check on your phone.</p>
        </div>
        <aside class="total-card">
          <p class="total-label">Current required spend</p>
          <p class="total-value">${money(totals.total)}</p>
          <p class="total-note">Includes production costs, buy-only equipment, and contingency.</p>
        </aside>
      </section>

      <nav class="tabs" aria-label="Budget sections">
        ${tabButton('setup', '1. Setup')}
        ${tabButton('equipment', '2. Equipment')}
        ${tabButton('summary', '3. Summary')}
      </nav>

      ${state.activeTab === 'setup' ? renderSetup(totals) : ''}
      ${state.activeTab === 'equipment' ? renderEquipment(totals) : ''}
      ${state.activeTab === 'summary' ? renderSummary(totals) : ''}
    `;

    bindEvents();
  }

  function tabButton(id, label) {
    return '<button class="tab ' + (state.activeTab === id ? 'active' : '') + '" data-tab="' + id + '">' + label + '</button>';
  }

  function renderSetup(totals) {
    return html`
      <section class="grid">
        <div class="panel">
          <h2>Production setup</h2>
          <p class="note">Pick one of the three production shapes, then adjust the numbers. This is a planning estimate, not a locked invoice.</p>
          <div class="form-grid">
            <label>Project name
              <input data-field="projectName" value="${escapeAttr(state.projectName)}" />
            </label>
            <label>Production shape
              <select data-template>
                ${data.productionTemplates.map(function (template) {
                  return '<option value="' + template.id + '" ' + (template.id === state.productionType ? 'selected' : '') + '>' + template.name + '</option>';
                }).join('')}
              </select>
            </label>
            <label>Episodes
              <input type="number" min="1" data-number="episodes" value="${state.episodes}" />
            </label>
            <label>Shoot days
              <input type="number" min="1" data-number="shootDays" value="${state.shootDays}" />
            </label>
            <label>Edit days
              <input type="number" min="0" data-number="editDays" value="${state.editDays}" />
            </label>
            <label>Crew day rate
              <input type="number" min="0" data-number="crewDayRate" value="${state.crewDayRate}" />
            </label>
            <label>Location hire per day
              <input type="number" min="0" data-number="locationHirePerDay" value="${state.locationHirePerDay}" />
            </label>
            <label>Cast cost per episode
              <input type="number" min="0" data-number="castCostPerEpisode" value="${state.castCostPerEpisode}" />
            </label>
            <label>Edit cost per day
              <input type="number" min="0" data-number="editCostPerDay" value="${state.editCostPerDay}" />
            </label>
            <label>Contingency %
              <input type="number" min="0" data-number="contingencyPercent" value="${state.contingencyPercent}" />
            </label>
          </div>
          <div class="actions">
            <button data-tab="equipment">Continue to Equipment</button>
            <button class="secondary" data-reset>Reset local draft</button>
          </div>
        </div>
        <aside class="panel">
          <h2>Live estimate</h2>
          ${summaryList([
            ['Crew', totals.production.crew],
            ['Location', totals.production.location],
            ['Cast / contributors', totals.production.cast],
            ['Editing', totals.production.edit],
            ['Production subtotal', totals.production.subtotal]
          ])}
        </aside>
      </section>
    `;
  }

  function renderEquipment(totals) {
    return html`
      <section class="panel">
        <h2>Equipment reconciliation</h2>
        <p class="note">Mark each item as already owned, needs buying, hire/borrow, or company decision. Only items marked “Need to buy” are added to the required spend.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Item</th><th>Qty</th><th>Unit</th><th>Status</th><th>Total</th><th>Link</th></tr></thead>
            <tbody>
              ${state.equipment.map(function (row) {
                return '<tr>' +
                  '<td>' + escapeHtml(row.category) + '</td>' +
                  '<td>' + escapeHtml(row.item) + '</td>' +
                  '<td><input type="number" min="0" value="' + row.qty + '" data-eq="' + row.id + '" data-eq-key="qty"></td>' +
                  '<td><input type="number" min="0" value="' + row.unit + '" data-eq="' + row.id + '" data-eq-key="unit"></td>' +
                  '<td><select data-eq="' + row.id + '" data-eq-key="decision">' + decisionOptions(row.decision) + '</select><br><span class="status-pill ' + statusClass(row.decision) + '">' + statusLabel(row.decision) + '</span></td>' +
                  '<td>' + money(numeric(row.qty) * numeric(row.unit)) + '</td>' +
                  '<td><a href="' + row.url + '" target="_blank" rel="noopener">Buy link</a></td>' +
                '</tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="mobile-card-list">
          ${state.equipment.map(function (row) {
            return '<article class="equipment-card">' +
              '<strong>' + escapeHtml(row.item) + '</strong>' +
              '<div class="mini">' + escapeHtml(row.category) + ' · Line total ' + money(numeric(row.qty) * numeric(row.unit)) + '</div>' +
              '<div class="card-controls">' +
                '<label>Qty<input type="number" min="0" value="' + row.qty + '" data-eq="' + row.id + '" data-eq-key="qty"></label>' +
                '<label>Unit £<input type="number" min="0" value="' + row.unit + '" data-eq="' + row.id + '" data-eq-key="unit"></label>' +
              '</div>' +
              '<label>Status<select data-eq="' + row.id + '" data-eq-key="decision">' + decisionOptions(row.decision) + '</select></label>' +
              '<p><span class="status-pill ' + statusClass(row.decision) + '">' + statusLabel(row.decision) + '</span></p>' +
              '<a href="' + row.url + '" target="_blank" rel="noopener">Open buying link</a>' +
            '</article>';
          }).join('')}
        </div>
        <div class="actions">
          <button data-tab="summary">Continue to Summary</button>
          <button class="secondary" data-tab="setup">Back to Setup</button>
        </div>
      </section>
    `;
  }

  function renderSummary(totals) {
    var buyItems = state.equipment.filter(function (row) { return row.decision === 'buy'; });
    return html`
      <section class="grid">
        <div class="panel">
          <h2>Budget summary</h2>
          <p><strong>${escapeHtml(state.projectName)}</strong></p>
          ${summaryList([
            ['Production subtotal', totals.production.subtotal],
            ['Equipment to buy now', totals.equipment],
            ['Contingency', totals.contingency],
            ['Total required spend', totals.total]
          ])}
          <div class="actions">
            <button data-copy>Copy summary</button>
            <button class="secondary" data-tab="equipment">Back to Equipment</button>
          </div>
        </div>
        <aside class="panel">
          <h2>Need to buy now</h2>
          ${buyItems.length ? '<ul class="summary-list">' + buyItems.map(function (row) {
            return '<li><span>' + escapeHtml(row.item) + ' × ' + row.qty + '</span><strong>' + money(numeric(row.qty) * numeric(row.unit)) + '</strong></li>';
          }).join('') + '</ul>' : '<p class="note">Nothing is marked as “Need to buy” at the moment.</p>'}
        </aside>
      </section>
    `;
  }

  function summaryList(rows) {
    return '<ul class="summary-list">' + rows.map(function (row) {
      return '<li><span>' + row[0] + '</span><strong>' + money(row[1]) + '</strong></li>';
    }).join('') + '</ul>';
  }

  function decisionOptions(current) {
    var options = [
      ['owned', 'Already owned'],
      ['buy', 'Need to buy'],
      ['hire', 'Hire / borrow'],
      ['company', 'Company decision']
    ];
    return options.map(function (option) {
      return '<option value="' + option[0] + '" ' + (current === option[0] ? 'selected' : '') + '>' + option[1] + '</option>';
    }).join('');
  }

  function bindEvents() {
    app.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () { setValue('activeTab', button.dataset.tab); });
    });

    app.querySelectorAll('[data-field]').forEach(function (input) {
      input.addEventListener('change', function () { setValue(input.dataset.field, input.value); });
    });

    app.querySelectorAll('[data-number]').forEach(function (input) {
      input.addEventListener('change', function () { setValue(input.dataset.number, numeric(input.value)); });
    });

    app.querySelectorAll('[data-template]').forEach(function (select) {
      select.addEventListener('change', function () { chooseTemplate(select.value); });
    });

    app.querySelectorAll('[data-eq]').forEach(function (input) {
      input.addEventListener('change', function () { updateEquipment(input.dataset.eq, input.dataset.eqKey, input.value); });
    });

    var reset = app.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', resetAll);

    var copy = app.querySelector('[data-copy]');
    if (copy) copy.addEventListener('click', copySummary);
  }

  function copySummary() {
    var totals = calculations();
    var lines = [
      'Planuf Productions Budget Summary',
      'Project: ' + state.projectName,
      'Episodes: ' + state.episodes,
      'Shoot days: ' + state.shootDays,
      'Edit days: ' + state.editDays,
      'Production subtotal: ' + money(totals.production.subtotal),
      'Equipment to buy now: ' + money(totals.equipment),
      'Contingency: ' + money(totals.contingency),
      'Total required spend: ' + money(totals.total)
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(function () {
      alert('Budget summary copied.');
    }).catch(function () {
      alert(lines.join('\n'));
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  render();
})();
