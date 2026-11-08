(function () {
  var selected = null;
  var els = {};
  var mapFilter = '';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function state() { return WW3Game.state; }
  function isPlayer(nid) { var s=state(); return s && nid && nid === s.playerNationId; }

  function ownerLabel(rid) {
    var s=state(); var o=s.owners[rid];
    if (o === null || o === undefined) return 'UNCLAIMED';
    if (o === s.playerNationId) return 'YOU';
    var r = WW3Map.get(o); return r ? r.name : o;
  }
  function ownerClass(rid) {
    var s=state(); var o=s.owners[rid];
    if (o === null || o === undefined) return 'neutral';
    if (o === s.playerNationId) return 'player';
    return 'ai';
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

  function renderMap() {
    var s = state(); if (!s) return;
    var q = (mapFilter||'').toLowerCase();
    var regions = WW3Map.regions.filter(function(r){
      if (!q) return true;
      return r.name.toLowerCase().indexOf(q)!==-1 || r.id.toLowerCase().indexOf(q)!==-1 || (r.group||'').toLowerCase().indexOf(q)!==-1;
    });
    var html = '<div style="margin-bottom:8px"><input id="mapSearch" type="search" placeholder="Search countries/regions..." value="'+esc(mapFilter)+'" style="width:100%;padding:8px;border-radius:6px;border:1px solid #374151;background:#111827;color:#e5e7eb" /></div>';
    html += '<div class="map">';
    regions.forEach(function (r) {
      var u = s.units[r.id] || {infantry:0,armor:0};
      var own = ownerLabel(r.id);
      var cls = 'region ' + ownerClass(r.id) + (selected === r.id ? ' selected' : '');
      var oil = (r.unclaimed && r.income && (r.income.money>=10||r.income.industry>=8)) ? ' <span class="small">[oil/resources]</span>' : '';
      html += '<button type="button" class="'+cls+'" data-rid="'+esc(r.id)+'"><div class="name">' + esc(r.name) + oil + '</div>' +
        '<div class="meta">' + esc(own) + ' &middot; Inf ' + u.infantry + ' Arm ' + u.armor + '</div>' +
        '<div class="meta small">+$' + r.income.money + ' M' + r.income.manpower + ' I' + r.income.industry + '</div></button>';
    });
    html += '</div><div class="small" style="margin-top:6px">Showing '+regions.length+' of '+WW3Map.regions.length+'. Antarctica is unclaimed (oil-rich).</div>';
    els.map.innerHTML = html;
    var ms = $('mapSearch');
    if (ms) { ms.addEventListener('input', function(){ mapFilter = ms.value; var pos=ms.selectionStart; renderMap(); var ms2=$('mapSearch'); if(ms2){ms2.focus(); try{ms2.setSelectionRange(pos,pos);}catch(e){} } }); }
    Array.prototype.forEach.call(els.map.querySelectorAll('[data-rid]'), function (btn) {
      btn.addEventListener('click', function () { selected = btn.getAttribute('data-rid'); render(); });
    });
  }

  function renderSelection() {
    var s = state(); if (!s) return;
    if (!selected || !WW3Map.get(selected)) { els.selection.innerHTML = 'Click a country/region on the map. Use search to find any country (including Antarctica).'; return; }
    var r = WW3Map.get(selected); var u = s.units[selected] || {infantry:0,armor:0};
    var own = s.owners[selected];
    var html = '<div><strong>' + esc(r.name) + '</strong> <span class="small">('+esc(r.group||'')+')</span></div>' +
      '<div class="small">Owner: ' + esc(ownerLabel(selected)) + (r.unclaimed?' &mdash; unclaimed, oil-rich territory':'') + '</div>' +
      '<div>Units: Infantry <strong>' + u.infantry + '</strong>, Armor <strong>' + u.armor + '</strong></div>' +
      '<div class="small">Income: Money ' + r.income.money + ', Manpower ' + r.income.manpower + ', Industry ' + r.income.industry + '</div>';
    if (s.winner) { els.selection.innerHTML = html; return; }
    if (isPlayer(own)) {
      html += '<div style="margin-top:8px"><label>Recruit (in this region)</label><div class="row">' +
        '<button type="button" data-act="recruit" data-type="infantry"' + (WW3Game.canRecruit(selected,'infantry')?'':' disabled') + '>Infantry (20M/10P)</button>' +
        '<button type="button" data-act="recruit" data-type="armor"' + (WW3Game.canRecruit(selected,'armor')?'':' disabled') + '>Armor (60M/20P/20I)</button></div></div>';
      var adjs = r.adj.filter(function (id) { return WW3Map.get(id); });
      if (adjs.length) {
        html += '<div style="margin-top:8px"><label>Target (adjacent, simplified links)</label><select id="targetSel">' +
          adjs.map(function (id) { var tr=WW3Map.get(id); var toOwn=isPlayer(s.owners[id]); var unc=(s.owners[id]===null||s.owners[id]===undefined); return '<option value="'+id+'">' + esc(tr.name) + (toOwn?' (move)':(unc?' (capture unclaimed)':' (attack)')) + '</option>'; }).join('') +
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
        var to = tsel.value; var type = b.getAttribute('data-type'); var c = b.getAttribute('data-count');
        var count = c === 'all' ? (state().units[selected][type]||0) : 1;
        WW3Game.moveOrAttack(selected, to, type, count);
        render();
      });
    });
  }

  function renderLog() {
    var s = state(); if (!s) return;
    els.log.innerHTML = s.log.slice(0, 50).map(function (e) { return '<div class="entry">[T' + e.turn + '] ' + esc(e.msg) + '</div>'; }).join('');
  }

  function render() { renderHUD(); renderMap(); renderSelection(); renderLog(); }

  function showCountryPicker() {
    var playable = (WW3Map.playableIds ? WW3Map.playableIds() : WW3Map.regionIds()).map(function(id){ return WW3Map.get(id); }).filter(Boolean).sort(function(a,b){ return a.name.localeCompare(b.name); });
    var pickedId = null;
    var html = '<div><strong>Choose your country</strong><div class="small">Select a country, then press <strong>Play</strong>. Antarctica starts unclaimed (oil-rich, capturable).</div></div>' +
      '<div id="pickedBox" class="small" style="margin-top:8px;padding:8px;border:1px solid #374151;border-radius:6px;background:#111827">No country selected.</div>' +
      '<div class="row" style="margin-top:8px"><button id="playCountryBtn" type="button" disabled>Play</button></div>' +
      '<div style="margin-top:8px"><input id="countrySearch" type="search" placeholder="Search country..." style="width:100%;padding:8px;border-radius:6px;border:1px solid #374151;background:#111827;color:#e5e7eb" /></div>' +
      '<div id="countryList" style="max-height:320px;overflow:auto;margin-top:8px"></div>';
    els.selection.innerHTML = html;
    els.actions.innerHTML = '';
    function updatePicked() {
      var c = pickedId ? WW3Map.get(pickedId) : null;
      var box = $('pickedBox'); var btn = $('playCountryBtn');
      if (c) { box.innerHTML = 'Selected: <strong>' + esc(c.name) + '</strong> <span class="small">('+esc(c.group||'')+' &middot; +$'+c.income.money+' M'+c.income.manpower+' I'+c.income.industry+')</span>'; btn.disabled = false; btn.textContent = 'Play as ' + c.name; }
      else { box.textContent = 'No country selected.'; btn.disabled = true; btn.textContent = 'Play'; }
    }
    function drawList(q) {
      q=(q||'').toLowerCase();
      var list = playable.filter(function(c){ return !q || c.name.toLowerCase().indexOf(q)!==-1 || c.id.toLowerCase().indexOf(q)!==-1; }).slice(0,400);
      $('countryList').innerHTML = list.map(function(c){
        var sel = c.id === pickedId ? ' selected player' : ' neutral';
        return '<button type="button" class="region'+sel+'" data-pick="'+esc(c.id)+'" style="width:100%;margin-bottom:6px"><div class="name">'+esc(c.name)+'</div><div class="meta small">'+esc(c.group||'')+' &middot; +$'+c.income.money+' M'+c.income.manpower+' I'+c.income.industry+'</div></button>';
      }).join('') || '<div class="small">No matches.</div>';
      Array.prototype.forEach.call($('countryList').querySelectorAll('[data-pick]'), function(b){
        b.addEventListener('click', function(){ pickedId = b.getAttribute('data-pick'); drawList($('countrySearch')?$('countrySearch').value:''); updatePicked(); });
      });
    }
    $('playCountryBtn').addEventListener('click', function(){ if (pickedId) startGame(pickedId); });
    drawList('');
    $('countrySearch').addEventListener('input', function(){ drawList(this.value); });
    updatePicked();
  }

  function startGame(playerId) {
    WW3Game.newGame(playerId);
    selected = WW3Game.state.playerNationId;
    mapFilter = '';
    render();
  }

  function init() {
    els = {
      map:$('map'), selection:$('selection'), actions:$('actions'), log:$('log'),
      resMoney:$('resMoney'), resManpower:$('resManpower'), resIndustry:$('resIndustry'),
      turnInfo:$('turnInfo'), banner:$('banner'), newGameBtn:$('newGameBtn'), endTurnBtn:$('endTurnBtn')
    };
    if (els.newGameBtn) els.newGameBtn.addEventListener('click', showCountryPicker);
    if (els.endTurnBtn) els.endTurnBtn.addEventListener('click', function(){ WW3Game.endTurn(); render(); });
    // initial: show picker
    WW3Game.state = null;
    els.map.innerHTML = '<div class="small">Select your country to begin.</div>';
    els.log.innerHTML = '<div class="entry">Welcome to WW3: Global Domination. Choose a country to start.</div>';
    els.banner.className = 'banner hidden';
    showCountryPicker();
  }

  window.WW3UI = { init:init, render:render };
})();
