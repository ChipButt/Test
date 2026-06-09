// Absolute final Home controller: Home first, upcoming shifts, start/end shift and break controls.
(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function iso(d){return new Date(d).toISOString().slice(0,10)}
  function todayStr(){return iso(new Date())}
  function nowIso(){return new Date().toISOString()}
  function timeNow(){return new Date().toTimeString().slice(0,5)}
  function user(){return me()}
  function l(sid){return state.logs[sid]||{in:null,out:null,breaks:[]}}
  function liveShift(){return (state.shifts||[]).find(function(s){var x=l(s.id);return s.userId===state.currentUserId&&x.in&&!x.out})}
  function activeBreak(sid){return (l(sid).breaks||[]).find(function(b){return !b.end})}
  function hasScheduledPaidBreak(s){return !!(s.paidBreakScheduled||s.hasPaidBreak||Number(s.paidBreakMinutes||0)>0)}
  function niceDate(d){return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
  function upcoming(){var t=todayStr();return (state.shifts||[]).filter(function(s){return s.userId===state.currentUserId&&s.date>=t}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))||String(a.start).localeCompare(String(b.start))})}
  function topShell(inner){var u=user(),set=state.permissionSets[u.permissionSetId]||{name:'Staff'};var nav=['<button class="tab '+(state.view==='home'?'active':'')+'" onclick="setView(\'home\')">Home</button>','<button class="tab '+(state.view==='rota'?'active':'')+'" onclick="setView(\'rota\')">Schedule</button>'];if(can('viewPeople')||can('manageUsers'))nav.push('<button class="tab '+(state.view==='people'?'active':'')+'" onclick="setView(\'people\')">People</button>');if(isAdmin())nav.push('<button class="tab '+(state.view==='admin'?'active':'')+'" onclick="setView(\'admin\')">Admin</button>');document.getElementById('app').innerHTML='<header class="topbar"><div><h1>Rota App</h1><p>'+esc(u.name)+' · '+esc(set.name||'Staff')+'</p></div><div class="topActions"><select id="currentUserSelect">'+state.users.map(function(x){return '<option value="'+x.id+'" '+(x.id===state.currentUserId?'selected':'')+'>'+esc(x.nickname||x.name)+' ('+esc((state.permissionSets[x.permissionSetId]||{}).name||'Staff')+')</option>'}).join('')+'</select></div></header><nav class="tabs">'+nav.join('')+'</nav><main>'+inner+'</main>';document.getElementById('currentUserSelect').onchange=function(e){state.currentUserId=e.target.value;save();render()}}
  function shiftButtons(s){var live=liveShift(),x=l(s.id),b=activeBreak(s.id);if(live&&live.id===s.id){if(b)return '<button class="breakEndBtn" onclick="endBreak(\''+s.id+'\')">End Break</button>';return '<button class="endShiftBtn" onclick="clockOut(\''+s.id+'\')">End Shift</button><button class="breakUnpaidBtn" onclick="startBreak(\''+s.id+'\',false)">Start Unpaid Break</button>'+(hasScheduledPaidBreak(s)?'<button class="breakPaidBtn" onclick="startBreak(\''+s.id+'\',true)">Start Paid Break</button>':'')}if(!live&&s.date===todayStr()&&!x.out)return '<button class="startShiftBtn" onclick="clockIn(\''+s.id+'\')">Start Shift</button>';return ''}
  function shiftCard(s){var st=l(s.id),status=st.in&&!st.out?'On shift':st.out?'Completed':s.date===todayStr()?'Today':'Upcoming';return '<div class="homeShiftCard"><div><strong>'+esc(niceDate(s.date))+'</strong><h3>'+esc(s.start)+' - '+esc(s.end)+'</h3><p>'+esc(s.section)+'</p><p class="muted">'+esc(s.notes||status)+'</p></div><div class="homeShiftActions">'+shiftButtons(s)+'</div></div>'}
  window.renderHome=function(){var ss=upcoming(),live=liveShift();var html='<section class="panel homePanel"><h2>Home</h2><div class="workCard"><h3>Start unscheduled shift</h3><p class="muted">Use this if no shift has been added for you.</p><label>Section<select id="unscheduledSection">'+(state.sections||[]).map(function(s){return '<option>'+esc(s)+'</option>'}).join('')+'</select></label><label>Note<input id="unscheduledNote" placeholder="Optional duty note"></label><button '+(live?'disabled':'')+' onclick="startUnscheduledShift()">Start Unscheduled Shift</button></div><h2>Upcoming shifts</h2><div class="homeShiftList">'+(ss.length?ss.map(shiftCard).join(''):'<p class="muted">No upcoming shifts.</p>')+'</div></section>';topShell(html);window.scrollTo(0,0)};
  var oldClockOut=window.clockOut,oldClockIn=window.clockIn,oldStartBreak=window.startBreak,oldEndBreak=window.endBreak,oldUnscheduled=window.startUnscheduledShift;
  window.clockIn=function(id){oldClockIn(id);renderHome()};
  window.clockOut=function(id){oldClockOut(id);renderHome()};
  window.startBreak=function(id,paid){oldStartBreak(id,paid);renderHome()};
  window.endBreak=function(id){oldEndBreak(id);renderHome()};
  window.startUnscheduledShift=function(){oldUnscheduled();renderHome()};
  window.renderClock=window.renderHome;
  window.setView=function(v){state.view=(v==='clock'?'home':v);if(state.view==='admin')state.adminPanel='menu';save();render()};
  window.render=function(){if(state.view==='home'||state.view==='clock')renderHome();else if(state.view==='rota')renderRota();else if(state.view==='people')renderPeople();else if(state.view==='profile')renderProfile();else if(state.view==='profileEdit')renderProfileEdit();else if(state.view==='admin')renderAdmin();else renderHome()};
  try{renderClock=window.renderClock;setView=window.setView;render=window.render}catch(e){}
  if(!state.view||state.view==='rota'||state.view==='clock'){state.view='home';save();}
  render();
})();
