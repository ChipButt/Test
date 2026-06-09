// Final profile save handler: admin-safe, saves fields and returns to the user's profile page.
(function(){
  function byId(id){return document.getElementById(id)}
  function val(id,fallback=''){var el=byId(id);return el?el.value:fallback}
  function num(id,fallback=0){var n=Number(val(id,fallback));return Number.isFinite(n)?n:fallback}
  function checked(id,fallback=false){var el=byId(id);return el?!!el.checked:fallback}
  function currentProfileUser(){return (state.users||[]).find(function(u){return u.id===state.profileUserId}) || (typeof profileUser==='function'?profileUser():null) || (typeof me==='function'?me():null)}
  window.saveProfileEdit=function(e){
    if(e)e.preventDefault();
    var u=currentProfileUser();
    if(!u)return alert('User profile could not be found.');
    var adminEdit=typeof can==='function' ? can('manageUsers') : false;
    var self=typeof me==='function' ? u.id===me().id : false;
    var canOwn=typeof can==='function' ? can('editOwnPersonal') : false;

    if(adminEdit){
      u.firstName=val('edit_firstName',u.firstName||'').trim();
      u.lastName=val('edit_lastName',u.lastName||'').trim();
      u.name=[u.firstName,u.lastName].filter(Boolean).join(' ') || u.name || 'Unknown';
      u.email=val('edit_email',u.email||'').trim();
      u.wage=num('edit_wage',Number(u.wage||0));
      u.jobArea=val('edit_jobArea',u.jobArea||'');
      u.permissionSetId=val('edit_permissionSetId',u.permissionSetId||'staff');
      u.holidayAllowanceDays=num('edit_holidayAllowanceDays',Number(u.holidayAllowanceDays||0));
      u.holidayCarriedDays=num('edit_holidayCarriedDays',Number(u.holidayCarriedDays||0));
      u.holidayAdjustmentDays=num('edit_holidayAdjustmentDays',Number(u.holidayAdjustmentDays||0));
      u.payType=val('edit_payType',u.payType||'hourly');
      u.salaryWeeklyAmount=num('edit_salaryWeeklyAmount',Number(u.salaryWeeklyAmount||0));
      u.contractedHoursPerWeek=num('edit_contractedHoursPerWeek',Number(u.contractedHoursPerWeek||37.5));
    }

    if(adminEdit || (self&&canOwn)){
      u.nickname=val('edit_nickname',u.nickname||'').trim();
      u.dob=val('edit_dob',u.dob||'');
      u.address=val('edit_address',u.address||'').trim();
      u.mobile=val('edit_mobile',u.mobile||'').trim();
      u.pronouns=val('edit_pronouns',u.pronouns||'').trim();
      u.upcomingShiftAlerts=checked('edit_upcomingShiftAlerts',u.upcomingShiftAlerts!==false);
    }

    if(u.email && u.accountStatus==='no_email')u.accountStatus='uninvited';
    state.profileUserId=u.id;
    state.profilePanel='home';
    state.view='profile';
    if(typeof save==='function')save();
    if(typeof render==='function')render();
    setTimeout(function(){window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;},0);
    return false;
  };
  try{saveProfileEdit=window.saveProfileEdit}catch(e){}
})();

// Minute-boundary refresh for Home clock/countdown.
(function(){
  function delay(){var n=new Date();return 60000-(n.getSeconds()*1000+n.getMilliseconds())+50}
  function tick(){
    if((state.view==='home'||state.view==='clock')&&typeof renderHome==='function')renderHome();
    window.__homeMinuteRefresh=setTimeout(tick,delay());
  }
  clearTimeout(window.__homeMinuteRefresh);
  window.__homeMinuteRefresh=setTimeout(tick,delay());
})();
