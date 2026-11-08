(function () {
  var selected = null, pickedId = null, els = {}, mapFilter = '';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function state() { return WW3Game.state; }
  function isPlayer(nid) { var s=state(); return s && nid && nid === s.playerNationId; }
  function ownerLabel(rid) {
    var s=state(); if(!s) return '';
    var o=s.owners[rid];
    if (o === null || o === undefined) return 'UNCLAIMED';
    if (o === s.playerNationId) return 'YOU';
    var r = WW3Map.get(o); return r ? r.name : o;
  }
  function ownerClass(rid) {
    var s=state(); if(!s) return 'neutral';
    var o=s.owners[rid];
    if (o === null || o === undefined) return 'neutral';
    if (o === s.playerNationId) return 'player';
    return 'ai';
  }

  var WORLD_SVG = '<svg class="map-svg" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">'
    + '<rect width="1000" height="500" fill="#081a33"/>'
    + '<ellipse class="land" cx="180" cy="150" rx="110" ry="80"/><ellipse class="land" cx="220" cy="240" rx="45" ry="35"/>'
    + '<ellipse class="land" cx="290" cy="320" rx="55" ry="90"/><ellipse class="land" cx="490" cy="140" rx="45" ry="55"/>'
    + '<ellipse class="land" cx="540" cy="170" rx="70" ry="50"/><ellipse class="land" cx="500" cy="250" rx="90" ry="70"/>'
    + '<ellipse class="land" cx="560" cy="330" rx="70" ry="80"/><ellipse class="land" cx="700" cy="150" rx="140" ry="70"/>'
    + '<ellipse class="land" cx="740" cy="240" rx="90" ry="55"/><ellipse class="land" cx="790" cy="210" rx="55" ry="45"/>'
    + '<ellipse class="land" cx="820" cy="300" rx="45" ry="35"/><ellipse class="land" cx="860" cy="360" rx="55" ry="35"/>'
    + '<ellipse class="land" cx="500" cy="455" rx="220" ry="30"/>'
    + '</svg>';

  function renderWorldMap(opts) {
    opts = opts || {};
    var s = state();
    var q = (mapFilter||'').toLowerCase();
    var showAll = !!opts.showAllLabels;
    var regions = WW3Map.regions.filter(function(r){
      if (opts.pickMode && r.playable === false) return true; // show Antarctica
      if (!q) return true;
      return r.name.toLowerCase().indexOf(q)!==-1 || r.id.toLowerCase().indexOf(q)!==-1 || (r.group||'').toLowerCase().indexOf(q)!==-1;
    });
    var html = '<div class="map-toolbar"><input id="mapSearch" type="search" placeholder="Search all countries (map + list)..." value="'+esc(mapFilter)+'" />' +
      '<span class="small">'+regions.length+'/'+WW3Map.regions.length+'</span></div>';
    html += '<div class="map-stage" id="mapStage">' + WORLD_SVG;
    regions.forEach(function(r){
      var pos = r.pos || {x:50,y:50};
      var cls = 'marker neutral';
      var label = r.id;
      var title = r.name;
      if (s) {
        cls = 'marker ' + ownerClass(r.id) + (selected===r.id?' selected':'');
        if (ownerClass(r.id)==='player') label = r.id;
      } else if (opts.pickMode) {
        if (r.unclaimed) cls = 'marker neutral' + (selected===r.id?' selected':'');
        else cls = 'marker ' + (pickedId===r.id?'player selected':'ai');
      }
      var showLabel = showAll || selected===r.id || pickedId===r.id || (q && r.name.toLowerCase().indexOf(q)!==-1);
      if (r.unclaimed) showLabel = showLabel || selected===r.id || !!q;
      html += '<button type="button" class="'+cls+'" data-rid="'+esc(r.id)+'" style="left:'+pos.x+'%;top:'+pos.y+'%" title="'+esc(title)+'">' + (showLabel?esc(r.id):'') + '</button>';
    });
    html += '</div><div class="small" style="margin-top:6px">Stylized strategic map (simplified). Click markers or search; Antarctica is unclaimed/oil-rich. Use the side panel for full actions.</div>';
    els.map.innerHTML = html;
    var ms = $('mapSearch');
    if (ms) ms.addEventListener('input', function(){ mapFilter = ms.value; var p=ms.selectionStart; renderWorldMap(opts); var ms2=$('mapSearch'); if(ms2){ms2.focus(); try{ms2.setSelectionRange(p,p);}catch(e){}} });
    Array.prototype.forEach.call(els.map.querySelectorAll('[data-rid]'), function (btn) {
      btn.addEventListener('click', function () {
        var rid = btn.getAttribute('data-rid'); var r = WW3Map.get(rid);
        if (opts.pickMode) {
          selected = rid;
          if (r && r.playable && !r.unclaimed) pickedId = rid;
          showCountryPicker(true); // refresh sidebar/map state
        } else {
          selected = rid; render();
        }
      });
    });
  }

  function renderHUD() {
    var s = state(); if (!s) return;
    var n = s.nations[s.playerNationId];
    var res = n ? n.resources : {money:0,manpower:0,industry:0};
    els.resMoney.textContent = 'Money: ' + res.money;
    els.resManpower.textContent = 'Manpower: ' + res.manpower;
    els.resIndustry.textContent = 'Industry: ' + res.industry;
    var inc = WW3Game.getIncome();
    els.turnInfo.textContent = 'Turn: ' + s.turn + ' (+' + inc.money + '/' + inc.manpower + '/' + inc.industry + '/turn)';
    var b = els.banner;
    if (s.winner) { b.className = 'banner ' + (s.winner.type === 'defeat' ? 'defeat' : ''); b.textContent = s.winner.msg; }
    else { b.className = 'banner hidden'; b.textContent = ''; }
    els.endTurnBtn.disabled = !!s.winner;
  }

  function renderSelection() {
    var s = state(); if (!s) return;
    if (!selected || !WW3Map.get(selected)) { els.selection.innerHTML = 'Click a country on the strategic map or search by name. Antarctica is unclaimed (oil-rich).'; return; }
    var r = WW3Map.get(selected); var u = s.units[selected] || {infantry:0,armor:0};
    var own = s.owners[selected];
    var html = '<div><strong>' + esc(r.name) + '</strong> <span class="small">('+esc(r.group||'')+')</span></div>' +
      '<div class="small">Owner: ' + esc(ownerLabel(selected)) + (r.unclaimed?' &mdash; unclaimed, oil-rich':'') + '</div>' +
      '<div>Units: Infantry <strong>' + u.infantry + '</strong>, Armor <strong>' + u.armor + '</strong></div>' +
      '<div class="small">Income: Money ' + r.income.money + ', Manpower ' + r.income.manpower + ', Industry ' + r.income.industry + '</div>';
    if (s.winner) { els.selection.innerHTML = html; return; }
    if (isPlayer(own)) {
      html += '<div style="margin-top:8px"><label>Recruit</label><div class="row">' +
        '<button type="button" data-act="recruit" data-type="infantry"' + (WW3Game.canRecruit(selected,'infantry')?'':' disabled') + '>Infantry (20M/10P)</button>' +
        '<button type="button" data-act="recruit" data-type="armor"' + (WW3Game.canRecruit(selected,'armor')?'':' disabled') + '>Armor (60M/20P/20I)</button></div></div>';
      var adjs = r.adj.filter(function (id) { return WW3Map.get(id); });
      if (adjs.length) {
        html += '<div style="margin-top:8px"><label>Target (adjacent, simplified links)</label><select id="targetSel">' +
          adjs.map(function (id) { var tr=WW3Map.get(id); var unc=(s.owners[id]===null||s.owners[id]===undefined); return '<option value="'+id+'">' + esc(tr.name) + (isPlayer(s.owners[id])?' (move)':(unc?' (capture unclaimed)':' (attack)')) + '</option>'; }).join('') +
          '</select></div><div class="row" style="margin-top:6px">' +
          '<button type="button" class="secondary" data-act="send" data-type="infantry" data-count="1"' + (u.infantry<1?' disabled':'') + '>Send 1 Inf</button>' +
          '<button type="button" class="secondary" data-act="send" data-type="infantry" data-count="all"' + (u.infantry<1?' disabled':'') + '>Send All Inf</button>' +
          '<button type="button" class="secondary" data-act="send" data-type="armor" data-count="1"' + (u.armor<1?' disabled':'') + '>Send 1 Arm</button>' +
          '<button type="button" class="secondary" data-act="send" data-type="armor" data-count="all"' + (u.armor<1?' disabled':'') + '>Send All Arm</button></div>';
      }
    } else {
      html += '<div class="small" style="margin-top:8px">Select an adjacent country you own to move/attack here.</div>';
    }
    els.selection.innerHTML = html;
    Array.prototype.forEach.call(els.selection.querySelectorAll('[data-act="recruit"]'), function (b) {
      b.addEventListener('click', function () { WW3Game.recruit(selected, b.getAttribute('data-type')); render(); });
    });
    Array.prototype.forEach.call(els.selection.querySelectorAll('[data-act="send"]'), function (b) {
      b.addEventListener('click', function () {
        var tsel = $('targetSel'); if (!tsel) return;
        var to = tsel.value, type = b.getAttribute('data-type'), c = b.getAttribute('data-count');
        var count = c === 'all' ? (state().units[selected][type]||0) : 1;
        WW3Game.moveOrAttack(selected, to, type, count); render();
      });
    });
  }

  function renderLog() {
    var s = state(); if (!s) return;
    els.log.innerHTML = s.log.slice(0, 50).map(function (e) { return '<div class="entry">[T' + e.turn + '] ' + esc(e.msg) + '</div>'; }).join('');
  }
  function render() { renderHUD(); renderWorldMap({}); renderSelection(); renderLog(); }

  function showCountryPicker(fromMap) {
    var c = pickedId ? WW3Map.get(pickedId) : null;
    var html = '<div><strong>Choose your country (strategic map)</strong><div class="small">Click a country on the map or search, then press <strong>Play</strong>. Antarctica is unclaimed (oil-rich).</div></div>' +
      '<div id="pickedBox" class="small" style="margin-top:8px;padding:8px;border:1px solid #374151;border-radius:6px;background:#111827">' + (c?'Selected: <strong>'+esc(c.name)+'</strong>':'Click a playable country marker/list result') + '</div>' +
      '<div class="row" style="margin-top:8px"><button id="playCountryBtn" type="button"'+(pickedId?'':' disabled')+'>Play' + (c?' as '+esc(c.name):'') + '</button></div>' +
      '<div id="pickList" style="max-height:220px;overflow:auto;margin-top:8px"></div>';
    els.selection.innerHTML = html;
    function drawPickList() {
      var q = (mapFilter||'').toLowerCase();
      var playable = (WW3Map.playableIds ? WW3Map.playableIds() : WW3Map.regionIds()).map(function(id){return WW3Map.get(id);}).filter(Boolean)
        .filter(function(x){ return !q || x.name.toLowerCase().indexOf(q)!==-1 || x.id.toLowerCase().indexOf(q)!==-1; }).sort(function(a,b){return a.name.localeCompare(b.name);}).slice(0,80);
      $('pickList').innerHTML = '<div class="small" style="margin-bottom:4px">Search results / quick pick:</div>' + playable.map(function(x){
        return '<button type="button" class="region '+(x.id===pickedId?'selected player':'neutral')+'" data-pick="'+esc(x.id)+'" style="width:100%;margin-bottom:4px;min-height:0;padding:6px"><div class="name">'+esc(x.name)+'</div></button>';
      }).join('');
      Array.prototype.forEach.call($('pickList').querySelectorAll('[data-pick]'), function(b){
        b.addEventListener('click', function(){ pickedId=b.getAttribute('data-pick'); selected=pickedId; showCountryPicker(true); });
      });
    }
    $('playCountryBtn').addEventListener('click', function(){ if(pickedId) startGame(pickedId); });
    drawPickList();
    renderWorldMap({pickMode:true});
  }

  function startGame(playerId) {
    WW3Game.newGame(playerId); selected = WW3Game.state.playerNationId; mapFilter = ''; render();
  }

  function init() {
    els = { map:$('map'), selection:$('selection'), actions:$('actions'), log:$('log'), resMoney:$('resMoney'), resManpower:$('resManpower'), resIndustry:$('resIndustry'), turnInfo:$('turnInfo'), banner:$('banner'), newGameBtn:$('newGameBtn'), endTurnBtn:$('endTurnBtn') };
    if (els.newGameBtn) els.newGameBtn.addEventListener('click', function(){ pickedId=null; selected=null; mapFilter=''; WW3Game.state=null; showCountryPicker(); });
    if (els.endTurnBtn) els.endTurnBtn.addEventListener('click', function(){ WW3Game.endTurn(); render(); });
    WW3Game.state = null; pickedId=null; selected=null;
    els.log.innerHTML = '<div class="entry">Welcome to WW3: Global Domination. Choose a country on the strategic map.</div>';
    els.banner.className = 'banner hidden';
    showCountryPicker();
  }

  window.WW3UI = { init:init, render:render };
})();
