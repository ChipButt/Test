// Admin Timesheets panel.
(function(){
  function minutes(t){var a=String(t||'00:00').split(':').map(Number);return (a[0]||0)*60+(a[1]||0)}
  function span(s){var a=minutes(s.start),b=minutes(s.end);if(b<=a)b+=1440;return Math.max(0,b-a)}
  function log(id){return state.logs&&state.logs[id]||{in:null,out:null,breaks:[]}}
  function breaks(id,paid){var l=log(id);return (l.breaks||[]).filter(function(b){return b.end&&(paid==null||b.paid===paid)}).reduce(function(t,b){return t+Math.max(0,Math.round((new Date(b.end)-new Date(b.start))/60000))},0)}
  function payable(s){var l=log(s.id);var total=l.in&&l.out?Math.max(0,Math.round((new Date(l.out)-new Date(l.in))/60000)):span(s);return Math.max(0,total-breaks(s.id,false))}
  function staff(id){return (state.users||[]).find(function(u){return u.id===id})}
  function cost(s){var u=staff(s.userId);if(!u||s.userId==='unassigned')return 0;var h=payable(s)/60;if(u.payType==='salary'){var annual=Number(u.salaryAnnualAmount||u.wage||0);return annual/365*(span(s)/60/Math.max(1,Number(u.contractedHoursPerWeek||37.5))*7)}return h*Number(u.wage||0)}
  function status(s){var l=log(s.id);if(l.in&&l.out)return 'Completed';if(l.in&&!l.out)return 'Active';if(s.publishedAt)return 'Scheduled';return 'Planned'}
  function money(n){return '£'+Number(n||0).toFixed(2)}
  function render(){var rows=[].concat(state.shifts||[]).sort(function(a,b){return String(a.date).localeCompare(String(b.date))||String(a.start).localeCompare(String(b.start))});var total={p:0,u:0,c:0};rows.forEach(function(s){total.p+=payable(s);total.u+=breaks(s.id,false);total.c+=cost(s)});return '<h2>Timesheets</h2><p class="muted">All planned, scheduled, active, and completed shift records.</p><div class="timesheetSummaryGrid"><div><strong>'+rows.length+'</strong><span>Shifts</span></div><div><strong>'+(total.p/60).toFixed(2)+'</strong><span>Payable hrs</span></div><div><strong>'+(total.u/60).toFixed(2)+'</strong><span>Unpaid break hrs</span></div><div><strong>'+money(total.c)+'</strong><span>Est. cost</span></div></div><div class="tableWrap"><table><tr><th>Date</th><th>Staff</th><th>Section</th><th>Shift</th><th>Status</th><th>Breaks</th><th>Payable</th><th>Cost</th></tr>'+rows.map(function(s){var u=staff(s.userId);return '<tr><td>'+s.date+'</td><td>'+(s.userId==='unassigned'||!u?'Unassigned':u.name)+'</td><td>'+s.section+'</td><td>'+s.start+'-'+s.end+'</td><td>'+status(s)+'</td><td>Paid '+breaks(s.id,true)+'m<br>Unpaid '+breaks(s.id,false)+'m</td><td>'+(payable(s)/60).toFixed(2)+' hrs</td><td>'+money(cost(s))+'</td></tr>'}).join('')+'</table></div>'}
  const oldDrawAdmin=window.drawAdmin||drawAdmin;
  window.drawAdmin=function(){oldDrawAdmin();if(state.adminPanel==='timesheets'){var el=document.getElementById('adminInner');if(el)el.innerHTML=render();}}
  drawAdmin=window.drawAdmin;
})();
