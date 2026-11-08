(function () {
  var selected = null;
  var els = {};

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function state() { return WW3Game.state; }
  function isPlayer(nid) { return state() && nid === state().playerNationId; }

  function renderHUD() {
    var s = state(); if (!s) return;
    var res = s.nations[s.playerNationId].resources;
    els.resMoney.textContent = 'Money: ' + res.money;
    els.resManpower.textContent = 'Manpower: ' + res.manpower;
    els.resIndustry.textContent = 'Industry: ' + res.industry;
    var inc = WW3Game.getIncome();
    els.turnInfo.textContent = 'Turn: ' + s.turn + ' (+' + inc.money + '/' + inc.manpower + '/' + inc.industry + ' per turn)';
    var b = els.banner;
    if (s.winner) {
      b.className = 'banner ' + (s.winner.type === 'defeat' ? 'defeat' : '');
      b.textContent = s.winner.msg;
    } else {
      b.className = 'banner hidden';
      b.textContent = '';
    }
    els.endTurnBtn.disabled = !!s.winner;
  }

  function ownerClass(rid) {
    var s = state(); var o = s.owners[rid];
    if (o === s.playerNationId) return 'player';
    return 'ai';
  }

  function renderMap() {
    var s = state(); if (!s) return;
    els.map.innerHTML = '';
    WW3Map.regions.forEach(function (r) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'region ' + ownerClass(r.id) + (selected === r.id ? ' selected' : '');
      var u = s.units[r.id] || {infantry:0,armor:0};
      var own = isPlayer(s.owners[r.id]) ? 'YOU' : 'AI';
      btn.innerHTML = '<div class="name">' + esc(r.name) + '</div>' +
        '<div class="meta">' + own + ' &middot; Inf ' + u.infantry + ' Arm ' + u.armor + '</div>' +
        '<div class="meta small">+$' + r.income.money + ' M' + r.income.manpower + ' I' + r.income.industry + '</div>';
      btn.addEventListener('click', function () { selected = r.id; render(); });
      els.map.appendChild(btn);
    });
  }

  function renderLog() {
    var s = state(); if (!s) return;
    els.log.innerHTML = s.log.slice(0, 40).map(function (e) {
      return '<div class="entry">[T' + e.turn + '] ' + esc(e.msg) + '</div>';
    }).join('');
  }

  function actionHtml() {
    var s = state(); if (!s || !selected) return '';
    var r = WW3Map.get(selected); var u = s.units[selected] || {infantry:0,armor:0};
    var own = s.owners[selected];
    var html = '<div><strong>' + esc(r.name) + '</strong></div>' +
      '<div class="small">Owner: ' + (isPlayer(own) ? 'You' : 'AI/opponent') + '</div>' +
      '<div>Units: Infantry <strong>' + u.infantry + '</strong>, Armor <strong>' + u.armor + '</strong></div>' +
      '<div class="small">Income if owned: Money ' + r.income.money + ', Manpower ' + r.income.manpower + ', Industry ' + r.income.industry + '</div>';
    if (s.winner) { els.selection.innerHTML = html; return ''; }
    if (isPlayer(own)) {
      html += '<div style="margin-top:8px"><label>Recruit (in this region)</label><div class="row">' +
        '<button type="button" data-act="recruit" data-type="infantry"' + (WW3Game.canRecruit(selected,'infantry')?'':' disabled') + '>Infantry (20M/10P)</button>' +
        '<button type="button" data-act="recruit" data-type="armor"' + (WW3Game.canRecruit(selected,'armor')?'':' disabled') + '>Armor (60M/20P/20I)</button>' +
        '</div></div>';
      var adjs = r.adj.filter(function (id) { return WW3Map.get(id); });
      if (adjs.length) {
        html += '<div style="margin-top:8px"><label>Target (adjacent)</label><select id="targetSel">' +
          adjs.map(function (id) { var tr=WW3Map.get(id); var toOwn=isPlayer(s.owners[id]); return '<option value="'+id+'">' + esc(tr.name) + (toOwn?' (move)':' (attack)') + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="row" style="margin-top:6px">' +
          '<button type="button" class="secondary" data-act="send" data-type="infantry" data-count="1"' + (u.infantry<1?' disabled':'') + '>Send 1 Inf</button>' +
          '<button type="button" class="secondary" data-act="send" data-type="infantry" data-count="all"' + (u.infantry<1?' disabled':'') + '>Send All Inf</button>' +
          '<button type="button" class="secondary" data-act="send" data-type="armor" data-count="1"' + (u.armor<1?' disabled':'') + '>Send 1 Arm</button>' +
          '<button type="button" class="secondary" data-act="send" data-type="armor" data-count="all"' + (u.armor<1?' disabled':'') + '>Send All Arm</button>' +
          '</div>';
      }
    } else {
      html += '<div class="small" style="margin-top:8px">Select an adjacent region you own to attack this target.</div>';
    }
    els.selection.innerHTML = html;
    // bind
    Array.prototype.forEach.call(els.selection.querySelectorAll('[data-act="recruit"]'), function (b) {
      b.addEventListener('click', function () { WW3Game.recruit(selected, b.getAttribute('data-type')); render(); });
    });
    Array.prototype.forEach.call(els.selection.querySelectorAll('[data-act="send"]'), function (b) {
      b.addEventListener('click', function () {
        var tsel = $('targetSel'); if (!tsel) return;
        var to = tsel.value; var type = b.getAttribute('data-type'); var c = b.getAttribute('data-count');
        var count = c === 'all' ? (s.units[selected][type]||0) : 1;
        WW3Game.moveOrAttack(selected, to, type, count);
        render();
      });
    });
    return '';
  }

  function render() {
    renderHUD();
    renderMap();
    actionHtml();
    renderLog();
  }

  function newGame() {
    WW3Game.newGame('na_e');
    selected = WW3Game.state.playerNationId;
    render();
  }

  function init() {
    els = {
      map: $('map'), selection: $('selection'), actions: $('actions'), log: $('log'),
      resMoney: $('resMoney'), resManpower: $('resManpower'), resIndustry: $('resIndustry'),
      turnInfo: $('turnInfo'), banner: $('banner'), newGameBtn: $('newGameBtn'), endTurnBtn: $('endTurnBtn')
    };
    els.newGameBtn.addEventListener('click', newGame);
    els.endTurnBtn.addEventListener('click', function () { WW3Game.endTurn(); render(); });
    newGame();
  }

  window.WW3UI = { init: init, render: render };
})();
