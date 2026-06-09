// Stacked full-width admin menu buttons.
(function(){
  const panels=[
    ['shift','Add / Edit Shifts','Create and amend shifts'],
    ['sections','Sections','Manage rota areas'],
    ['users','Users','Manage profiles and costs'],
    ['permissions','Permission Sets','Control access'],
    ['timesheets','Timesheets','All shift records']
  ];
  function html(){return '<div class="adminMenuStack">'+panels.map(function(p){return '<button class="adminMenuButton '+(state.adminPanel===p[0]?'active':'')+'" data-admin-panel="'+p[0]+'"><span>'+p[1]+'</span><small>'+p[2]+'</small></button>';}).join('')+'</div>';}
  function wire(){document.querySelectorAll('[data-admin-panel]').forEach(function(btn){btn.onclick=function(){state.adminPanel=this.dataset.adminPanel;save();renderAdmin();window.scrollTo({top:0,behavior:'smooth'});};});}
  const oldRenderAdmin=window.renderAdmin||renderAdmin;
  window.renderAdmin=function(){oldRenderAdmin();var tabs=document.querySelector('.adminTabs');if(tabs){tabs.outerHTML=html();wire();}};
  renderAdmin=window.renderAdmin;
})();
