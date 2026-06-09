// Schedule layout patch: section names become full-width bands; days use full width Monday-Sunday.
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plus=(d,n)=>{d=new Date(d);d.setDate(d.getDate()+n);return d};
  const iso=d=>d.toISOString().slice(0,10);
  const dlab=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
  const mins=t=>{let [h,m]=String(t||'00:00').split(':').map(Number);return (h||0)*60+(m||0)};
  const duration=(a,b)=>{let start=mins(a),end=mins(b);if(end<=start)end+=1440;return Math.round((end-start)/60*100)/100};
  const monday=d=>{d=new Date(d);let offset=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-offset);return d};
  function weekBase(){return typeof weekStart!=='undefined'?weekStart:monday(new Date());}
  function weekDates(){return [0,1,2,3,4,5,6].map(n=>iso(plus(weekBase(),n)));}
  function canRota(){try{return typeof can==='function'?can('manageRota'):true}catch(e){return true}}
  function currentWeekKey(){return weekDates()[0]}
  function isPublished(shift){return !!shift.publishedAt || (state.publishedWeeks?.[currentWeekKey()]?.shiftIds||[]).includes(shift.id)}
  function shiftCard(s){
    const u=(state.users||[]).find(x=>x.id===s.userId);
    const name=s.userId==='unassigned'||!u?'Unassigned':(u.nickname||u.firstName||u.name||'User');
    const status=s.userId==='unassigned'?'unassigned':isPublished(s)?'published':'planned';
    const tap=canRota()?`onclick="openShiftModal('${s.id}')"`:'';
    return `<div class="shiftCard compactShift ${status}" ${tap}><span class="compactName">${esc(name)}</span><span class="compactTime">${esc(s.start)}-${esc(s.end)}</span>${s.notes?`<small>${esc(s.notes)}</small>`:''}</div>`;
  }
  function adminTools(){
    if(!canRota())return '';
    const templates=state.rotaTemplates||[];
    return `<div class="scheduleAdminTools"><h2>Rota planning</h2><p class="muted">Planned shifts are grey. Saved/published shifts are gold. Copy this week, swipe to another week, then paste it there.</p><div class="planningActions scheduleActions"><button onclick="copyCurrentWeek()">Copy current week</button><button class="secondary" onclick="pasteCopiedWeek()">Paste copied week here</button><button class="secondary" onclick="saveCurrentWeekAsTemplate()">Save week as template</button><button onclick="openSaveRotaModal()">Save rota</button></div>${templates.length?`<div class="templateLoadRow"><label>Load template<select id="scheduleTemplateSelect">${templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label><button class="secondary" onclick="loadTemplateToCurrentWeek(document.getElementById('scheduleTemplateSelect').value)">Load template</button></div>`:''}</div>`;
  }
  window.renderRota=function(){
    const days=weekDates();
    const sections=state.sections||[];
    const body=`<div class="toolbar"><button class="secondary" onclick="weekStart=plus(weekStart,-7);renderRota()">Previous</button><strong>${dlab(days[0])} – ${dlab(days[6])}</strong><button class="secondary" onclick="weekStart=plus(weekStart,7);renderRota()">Next</button></div><div id="rotaGrid" class="bandedRota"><div class="bandDayHeader">${days.map(d=>`<div class="bandDayHead"><strong>${dlab(d).split(' ')[0]}</strong><span>${dlab(d).replace(/^\S+\s*/, '')}</span></div>`).join('')}</div>${sections.map(section=>`<section class="rotaSectionBand"><div class="sectionBandTitle">${esc(section)}</div><div class="bandWeekGrid">${days.map(day=>{let shifts=(state.shifts||[]).filter(s=>s.section===section&&s.date===day).sort((a,b)=>String(a.start).localeCompare(String(b.start)));return `<div class="bandDayCell compactDayCell">${shifts.map(shiftCard).join('')||'<span class="muted emptyCell">—</span>'}${canRota()?`<button class="cellAddShift" onclick="openShiftModal('', '${day}', '${esc(section)}')">+</button>`:''}</div>`}).join('')}</div></section>`).join('')}</div><p class="muted swipeHint">Monday–Sunday rota. Swipe left or right to change week.</p>${adminTools()}`;
    shell(body);
    const grid=document.getElementById('rotaGrid');
    if(grid){
      grid.addEventListener('touchstart',e=>window.__rotaSwipeX=e.touches[0].clientX,{passive:true});
      grid.addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-(window.__rotaSwipeX||0);if(Math.abs(dx)>45){weekStart=plus(weekStart,dx<0?7:-7);renderRota()}},{passive:true});
    }
  };
  if(typeof renderRota!=='undefined')renderRota=window.renderRota;
})();
