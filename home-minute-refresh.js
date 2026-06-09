// Updates the Home clock/countdown on the minute boundary.
(function(){
  function msToNextMinute(){
    var n=new Date();
    return 60000-(n.getSeconds()*1000+n.getMilliseconds())+25;
  }
  function refreshHomeMinute(){
    if((state.view==='home'||state.view==='clock')&&typeof renderHome==='function'){
      renderHome();
    }
    window.__homeMinuteTimer=setTimeout(refreshHomeMinute,msToNextMinute());
  }
  clearTimeout(window.__homeMinuteTimer);
  window.__homeMinuteTimer=setTimeout(refreshHomeMinute,msToNextMinute());
})();
