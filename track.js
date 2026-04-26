// bidsmith case-study site — visit + engagement tracking
// posts to the same Apps Script endpoint that handles the brief-submit form.
// no cookies, no third-party vendors. one anonymous "visitor id" per browser localStorage.
(function(){
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbx09f-4aNddxzmVVUStNJwjzVip5u3PqVYN7GSgO83FDz5DqYLEFqy4ysARdZ6oeDo8rA/exec";

  function getVid(){
    try {
      var v = localStorage.getItem('bs_vid');
      if (!v) {
        v = 'v_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('bs_vid', v);
      }
      return v;
    } catch(e) { return 'v_anon'; }
  }

  function send(event, extra){
    var body = {
      product: 'bidsmith-track',
      event: event,
      vid: getVid(),
      page: location.pathname,
      referrer: document.referrer || '',
      qs: location.search || '',
      ts: new Date().toISOString(),
      ua: navigator.userAgent.slice(0, 200),
      vw: window.innerWidth || 0
    };
    if (extra) for (var k in extra) body[k] = extra[k];
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(body),
        keepalive: true
      }).catch(function(){});
    } catch(e){}
  }

  // page view
  send('view');

  // 30s read mark — distinguishes bounces from actual reads
  var read30 = setTimeout(function(){ send('read30'); }, 30000);

  // 60s read mark
  var read60 = setTimeout(function(){ send('read60'); }, 60000);

  // 50% scroll
  var scrolled50 = false;
  function onScroll(){
    if (scrolled50) return;
    var sh = document.documentElement.scrollHeight - window.innerHeight;
    if (sh > 0 && (window.scrollY / sh) > 0.5) {
      scrolled50 = true;
      send('scroll50');
    }
  }
  window.addEventListener('scroll', onScroll, {passive: true});

  // form submit interception (any form on the page tagged briefForm)
  var f = document.getElementById('briefForm');
  if (f) {
    f.addEventListener('submit', function(){ send('form_submit'); });
  }

  // unload — log session
  window.addEventListener('beforeunload', function(){
    clearTimeout(read30); clearTimeout(read60);
    send('unload', {dt_ms: Date.now() - performance.timeOrigin });
  });
})();
