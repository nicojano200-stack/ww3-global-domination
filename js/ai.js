(function () {
  function ownsAny(state, nationId) {
    var ids = WW3Map.regionIds();
    for (var i = 0; i < ids.length; i++) if (state.owners[ids[i]] === nationId) return true;
    return false;
  }
  function incomeFor(state, nationId) {
    var inc = { money: 0, manpower: 0, industry: 0 };
    WW3Map.regionIds().forEach(function (rid) {
      if (state.owners[rid] !== nationId) return;
      var r = WW3Map.get(rid); if (!r) return;
      inc.money += r.income.money; inc.manpower += r.income.manpower; inc.industry += r.income.industry;
    });
    return inc;
  }
  function addIncome(state, nationId) {
    var inc = incomeFor(state, nationId);
    var n = state.nations[nationId]; if (!n) return;
    n.resources.money += inc.money; n.resources.manpower += inc.manpower; n.resources.industry += inc.industry;
  }
  function canRecruitAI(state, nationId, regionId, type) {
    if (state.owners[regionId] !== nationId) return false;
    var cost = WW3Game.COST[type]; if (!cost) return false;
    var res = state.nations[nationId].resources;
    return res.money >= cost.money && res.manpower >= cost.manpower && res.industry >= cost.industry;
  }
  function recruitAI(state, nationId, regionId, type) {
    if (!canRecruitAI(state, nationId, regionId, type)) return false;
    var cost = WW3Game.COST[type]; var res = state.nations[nationId].resources;
    res.money -= cost.money; res.manpower -= cost.manpower; res.industry -= cost.industry;
    state.units[regionId][type] = (state.units[regionId][type] || 0) + 1;
    return true;
  }
  function totalUnits(u) { return (u.infantry||0) + (u.armor||0)*2; }

  function takeTurn(state) {
    if (!state || state.winner) return;
    var ids = WW3Map.regionIds();
    var nations = Object.keys(state.nations);
    // Shuffle order a bit
    nations.sort(function () { return Math.random() - 0.5; });
    nations.forEach(function (nid) {
      if (state.winner) return;
      if (nid === state.playerNationId) return;
      if (!ownsAny(state, nid)) return;
      addIncome(state, nid);
      var owned = ids.filter(function (rid) { return state.owners[rid] === nid; });
      if (!owned.length) return;
      // Recruit: prefer armor if possible, else infantry, in strongest/first region
      var recruitRegion = owned.slice().sort(function (a,b) { return totalUnits(state.units[b]) - totalUnits(state.units[a]); })[0];
      if (canRecruitAI(state, nid, recruitRegion, 'armor') && Math.random() < 0.35) recruitAI(state, nid, recruitRegion, 'armor');
      else if (canRecruitAI(state, nid, recruitRegion, 'infantry')) recruitAI(state, nid, recruitRegion, 'infantry');
      // Attack: try a few opportunities
      var actions = 0;
      owned.forEach(function (from) {
        if (actions >= 2 || state.winner) return;
        var u = state.units[from]; if (!u) return;
        var region = WW3Map.get(from); if (!region) return;
        var targets = region.adj.filter(function (to) { return state.owners[to] !== nid; });
        // Prefer player-owned, then weak
        targets.sort(function (a,b) {
          var ap = state.owners[a] === state.playerNationId ? 0 : 1;
          var bp = state.owners[b] === state.playerNationId ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return totalUnits(state.units[a]) - totalUnits(state.units[b]);
        });
        for (var t = 0; t < targets.length && actions < 2; t++) {
          var to = targets[t];
          var def = state.units[to] || {infantry:0,armor:0};
          var atkStr = (u.infantry||0) + (u.armor||0)*3;
          var defStr = (def.infantry||0) + (def.armor||0)*3;
          // Attack if advantage or target is empty
          if (atkStr >= 2 && (defStr === 0 || atkStr >= defStr * 1.1 || (state.owners[to] === state.playerNationId && atkStr >= defStr * 0.9 && Math.random()<0.5))) {
            var type = (u.armor||0) > 0 && Math.random()<0.5 ? 'armor' : 'infantry';
            if ((u[type]||0) < 1) type = (u.infantry||0)>0 ? 'infantry' : 'armor';
            var send = Math.max(1, Math.floor((u[type]||0) * 0.7));
            if (send >= 1 && WW3Game && WW3Game.moveOrAttack) {
              WW3Game.moveOrAttack(from, to, type, send, nid);
              actions++;
              u = state.units[from] || {infantry:0,armor:0}; // refresh
            }
          }
        }
      });
    });
    WW3Game.checkWinner();
  }

  window.WW3AI = { takeTurn: takeTurn };
})();
