// Adds Unassigned as a built-in shift assignment option without creating a user profile.
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function userOptions(selected){
    return `<option value="unassigned" ${selected==='unassigned'?'selected':''}>Unassigned</option>` +
      (state.users||[]).map(u=>`<option value="${u.id}" ${u.id===selected?'selected':''}>${esc(u.name)}</option>`).join('');
  }
  function patchSelect(select){
    if(!select || select.dataset.unassignedReady) return;
    const selected = select.value || 'unassigned';
    select.innerHTML = userOptions(selected);
    select.value = selected;
    select.dataset.unassignedReady = '1';
  }
  function patchVisibleShiftSelects(){
    patchSelect(document.getElementById('shiftUser'));
    patchSelect(document.getElementById('modalShiftUser'));
  }

  const oldOpenShiftModal = window.openShiftModal || openShiftModal;
  window.openShiftModal = function(shiftId='', date='', section=''){
    oldOpenShiftModal(shiftId, date, section);
    const shift = (state.shifts||[]).find(s=>s.id===shiftId);
    const select = document.getElementById('modalShiftUser');
    if(select){
      select.innerHTML = userOptions(shift ? shift.userId : 'unassigned');
      select.value = shift ? (shift.userId || 'unassigned') : 'unassigned';
      select.dataset.unassignedReady = '1';
    }
  };
  if(typeof openShiftModal !== 'undefined') openShiftModal = window.openShiftModal;

  const oldDrawAdmin = window.drawAdmin || drawAdmin;
  window.drawAdmin = function(){
    oldDrawAdmin();
    patchVisibleShiftSelects();
  };
  if(typeof drawAdmin !== 'undefined') drawAdmin = window.drawAdmin;

  const oldSaveShift = window.saveShift || saveShift;
  window.saveShift = function(event){
    if(event) event.preventDefault();
    const select = document.getElementById('shiftUser');
    if(select && !select.value) select.value = 'unassigned';
    return oldSaveShift(event);
  };
  if(typeof saveShift !== 'undefined') saveShift = window.saveShift;

  const oldSaveShiftModal = window.saveShiftModal || saveShiftModal;
  window.saveShiftModal = function(event, shiftId){
    if(event) event.preventDefault();
    const select = document.getElementById('modalShiftUser');
    if(select && !select.value) select.value = 'unassigned';
    return oldSaveShiftModal(event, shiftId);
  };
  if(typeof saveShiftModal !== 'undefined') saveShiftModal = window.saveShiftModal;

  const oldRenderRota = window.renderRota || renderRota;
  window.renderRota = function(){
    oldRenderRota();
    document.querySelectorAll('.compactShift.unassigned, .shiftCard.unassigned').forEach(card=>card.title='This shift has not been assigned to a team member yet.');
  };
  if(typeof renderRota !== 'undefined') renderRota = window.renderRota;

  patchVisibleShiftSelects();
})();
