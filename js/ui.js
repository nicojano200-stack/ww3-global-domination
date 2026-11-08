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

  function selectBySearch(q) {
    if (!q) return false;
    q = q.toLowerCase();
    var r = WW3Map.regions.find(function(x){ return x.name.toLowerCase()===q || x.id.toLowerCase()===q; }) ||
            WW3Map.regions.find(function(x){ return x.name.toLowerCase().indexOf(q)!==-1 || x.id.toLowerCase().indexOf(q)!==-1; });
    return r || null;
  }

  function renderWorldMap(opts) {
    opts = opts || {};
    var s = state();
    var q = (mapFilter||'');
    var html = '<div class="map-toolbar"><input id="mapSearch" type="search" placeholder="Search countries (real map)..." value="'+esc(q)+'" />' +
      '<span class="small">'+WW3Map.regions.length+' countries</span></div><div id="mapHost"></div>';
    els.map.innerHTML = html;
    var host = $('mapHost');
    var usedReal = false;
    if (window.WW3RealMap && WW3RealMap.available()) {
      usedReal = WW3RealMap.render(host, {
        state: s, selected: selected, pickMode: !!opts.pickMode,
        onSelect: function (rid) {
          var r = WW3Map.get(rid);
          if (opts.pickMode) { selected = rid; if (r && r.playable && !r.unclaimed) pickedId = rid; showCountryPicker(true); }
          else { selected = rid; render(); }
        }
      });
    }
    if (!usedReal) {
      // schematic fallback (markers)
      var ql = q.toLowerCase();
      var regions = WW3Map.regions.filter(function(r){ if(!ql) return true; return r.name.toLowerCase().indexOf(ql)!==-1 || r.id.toLowerCase().indexOf(ql)!==-1; });
      var fh = '<div class="map-stage" id="mapStage">' + WORLD_SVG;
      regions.forEach(function(r){
        var pos = r.pos || {x:50,y:50};
        var cls = 'marker neutral';
        if (s) cls = 'marker ' + ownerClass(r.id) + (selected===r.id?' selected':'');
        else if (opts.pickMode) cls = 'marker ' + ((r.unclaimed)?'neutral':(pickedId===r.id?'player':'ai')) + (selected===r.id?' selected':'');
        var showLabel = selected===r.id || pickedId===r.id || (ql && r.name.toLowerCase().indexOf(ql)!==-1);
        fh += '<button type="button" class="'+cls+'" data-rid="'+esc(r.id)+'" style="left:'+pos.x+'%;top:'+pos.y+'%" title="'+esc(r.name)+'">' + (showLabel?esc(r.id):'') + '</button>';
      });
      fh += '</div><div class="small" style="margin-top:6px">Schematic fallback map. Antarctica unclaimed (oil-rich).</div>';
      host.innerHTML = fh;
      Array.prototype.forEach.call(host.querySelectorAll('[data-rid]'), function (btn) {
        btn.addEventListener('click', function () {
          var rid = btn.getAttribute('data-rid'); var r = WW3Map.get(rid);
          if (opts.pickMode) { selected = rid; if (r && r.playable && !r.unclaimed) pickedId = rid; showCountryPicker(true); }
          else { selected = rid; render(); }
        });
      });
    }
    var ms = $('mapSearch');
    if (ms) ms.addEventListener('keydown', function(e){
      if (e.key === 'Enter') {
        var r = selectBySearch(ms.value);
        if (r) { mapFilter = ms.value; if (opts.pickMode) { selected=r.id; if(r.playable&&!r.unclaimed) pickedId=r.id; showCountryPicker(true);} else { selected=r.id; render(); } }
      }
    });
    if (ms) ms.addEventListener('input', function(){ mapFilter = ms.value; /* keep map stable; Enter selects */ });
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
