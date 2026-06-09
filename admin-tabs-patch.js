// Makes admin sub-tab selection highlight immediately when tapped.
(function(){
  function highlightAdminTab(panel){
    document.querySelectorAll('.adminTab').forEach(function(tab){
      const onclick = tab.getAttribute('onclick') || '';
      const active = onclick.includes("adminPanel('" + panel + "')") || onclick.includes('adminPanel("' + panel + '")');
      tab.classList.toggle('active', active);
    });
  }

  const originalAdminPanel = window.adminPanel || (typeof adminPanel !== 'undefined' ? adminPanel : null);
  window.adminPanel = function(panel){
    if(typeof state !== 'undefined') state.adminPanel = panel;
    if(typeof save === 'function') save();
    highlightAdminTab(panel);
    if(typeof drawAdmin === 'function') drawAdmin();
    requestAnimationFrame(function(){ highlightAdminTab(panel); });
  };

  if(typeof adminPanel !== 'undefined') adminPanel = window.adminPanel;

  document.addEventListener('click', function(event){
    const tab = event.target.closest('.adminTab');
    if(!tab) return;
    const onclick = tab.getAttribute('onclick') || '';
    const match = onclick.match(/adminPanel\(['"]([^'"]+)['"]\)/);
    if(match) requestAnimationFrame(function(){ highlightAdminTab(match[1]); });
  });
})();
