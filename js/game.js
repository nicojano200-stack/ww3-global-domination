(function () {
  var COST = {
    infantry: { money: 20, manpower: 10, industry: 0 },
    armor:    { money: 60, manpower: 20, industry: 20 }
  };
  var STRENGTH = { infantry: 1, armor: 3 };
  var START_RES = { money: 120, manpower: 80, industry: 60 };
  var DOMINATION_PCT = 0.7;

  function cloneResources(r) { return { money: r.money, manpower: r.manpower, industry: r.industry }; }
  function emptyUnits() { return { infantry: 0, armor: 0 }; }
  function unitTotal(u) { return (u.infantry || 0) + (u.armor || 0); }
  function log(state, msg) { state.log.unshift({ turn: state.turn, msg: msg }); if (state.log.length > 120) state.log.length = 120; }

  function allNationIds() {
    // v0: each region starts as its own "nation" owner id (simplification); player controls one.
    return WW3Map.regionIds();
  }

  function getIncome(state, nationId) {
    var inc = { money: 0, manpower: 0, industry: 0 };
    WW3Map.regionIds().forEach(function (rid) {
      if (state.owners[rid] !== nationId) return;
      var r = WW3Map.get(rid);
      if (!r) return;
      inc.money += r.income.money; inc.manpower += r.income.manpower; inc.industry += r.income.industry;
    });
    return inc;
  }

  function addIncome(state, nationId) {
    var inc = getIncome(state, nationId);
    var n = state.nations[nationId];
    if (!n) return;
    n.resources.money += inc.money; n.resources.manpower += inc.manpower; n.resources.industry += inc.industry;
  }

  function checkWinner(state) {
    if (state.winner) return state.winner;
    var ids = WW3Map.regionIds();
    var playerOwned = 0;
    ids.forEach(function (rid) { if (state.owners[rid] === state.playerNationId) playerOwned++; });
    if (playerOwned === 0) { state.winner = { type: 'defeat', msg: 'Your forces were eliminated. AI dominates.' }; }
    else if (playerOwned >= Math.ceil(ids.length * DOMINATION_PCT)) { state.winner = { type: 'victory', msg: 'Domination achieved! You control most of the world.' }; }
    return state.winner;
  }

  function newGame(playerRegionId) {
    var ids = WW3Map.regionIds();
    var player = playerRegionId && ids.indexOf(playerRegionId) !== -1 ? playerRegionId : 'na_e';
    var state = {
      turn: 1,
      playerNationId: player,
      nations: {},
      owners: {},
      units: {},
      log: [],
      winner: null
    };
    ids.forEach(function (rid) {
      state.owners[rid] = rid; // each starts self-owned
      state.units[rid] = emptyUnits();
      state.nations[rid] = { resources: cloneResources(START_RES), alive: true };
    });
    // Starting forces: everyone gets 2 infantry at home; player gets a small boost.
    ids.forEach(function (rid) { state.units[rid].infantry = 2; });
    state.units[player].infantry = 4; state.units[player].armor = 1;
    log(state, 'New game started. You control ' + regionName(player) + '.');
    return state;
  }

  function regionName(id) { var r = WW3Map.get(id); return r ? r.name : id; }

  function canRecruit(state, regionId, type) {
    if (!state || state.winner) return false;
    if (state.owners[regionId] !== state.playerNationId) return false;
    var cost = COST[type]; if (!cost) return false;
    var res = state.nations[state.playerNationId].resources;
    return res.money >= cost.money && res.manpower >= cost.manpower && res.industry >= cost.industry;
  }

  function recruit(state, regionId, type) {
    if (!canRecruit(state, regionId, type)) return false;
    var cost = COST[type];
    var res = state.nations[state.playerNationId].resources;
    res.money -= cost.money; res.manpower -= cost.manpower; res.industry -= cost.industry;
    state.units[regionId][type] = (state.units[regionId][type] || 0) + 1;
    log(state, 'Recruited 1 ' + type + ' in ' + regionName(regionId) + '.');
    return true;
  }

  function canMove(state, from, to, unitType, count, nationId) {
    nationId = nationId || state.playerNationId;
    if (!state || state.winner) return false;
    if (!WW3Map.areAdjacent(from, to)) return false;
    if (state.owners[from] !== nationId) return false;
    count = Math.floor(count || 0);
    if (count < 1) return false;
    var have = (state.units[from] && state.units[from][unitType]) || 0;
    if (have < count) return false;
    // must leave at least 0 (ok), but avoid moving last defender accidentally? allow it.
    return true;
  }

  function applyLosses(units, lossPoints) {
    // Remove weakest first (infantry), simple.
    var rem = Math.max(0, Math.floor(lossPoints));
    var takeI = Math.min(units.infantry, rem); units.infantry -= takeI; rem -= takeI;
    var takeA = Math.min(units.armor, rem); units.armor -= takeA; rem -= takeA;
  }

  function moveOrAttack(state, from, to, unitType, count, nationId) {
    nationId = nationId || state.playerNationId;
    if (!canMove(state, from, to, unitType, count, nationId)) return { ok: false, reason: 'Invalid move.' };
    count = Math.floor(count);
    state.units[from][unitType] -= count;
    var moving = { infantry: 0, armor: 0 }; moving[unitType] = count;
    var toOwner = state.owners[to];
    if (toOwner === nationId) {
      state.units[to][unitType] = (state.units[to][unitType] || 0) + count;
      if (nationId === state.playerNationId) log(state, 'Moved ' + count + ' ' + unitType + ' from ' + regionName(from) + ' to ' + regionName(to) + '.');
      return { ok: true, moved: true };
    }
    // Combat
    var atkStr = moving.infantry * STRENGTH.infantry + moving.armor * STRENGTH.armor;
    var def = state.units[to] || emptyUnits();
    var defStr = (def.infantry || 0) * STRENGTH.infantry + (def.armor || 0) * STRENGTH.armor;
    var randA = 0.85 + Math.random() * 0.3;
    var randD = 0.85 + Math.random() * 0.3;
    var atkPow = atkStr * randA;
    var defPow = Math.max(0.5, defStr * randD); // undefended still has minimal resistance
    var atkLoss = defStr === 0 ? 0 : Math.min(count, Math.round(count * (defPow / (atkPow + defPow))));
    var defLossPts = Math.round((def.infantry + def.armor) * (atkPow / (atkPow + defPow + 0.01)));
    applyLosses(moving, atkLoss);
    var defCopy = { infantry: def.infantry || 0, armor: def.armor || 0 };
    applyLosses(defCopy, defLossPts);
    state.units[to] = defCopy;
    var attackersLeft = unitTotal(moving);
    var defendersLeft = unitTotal(defCopy);
    if (defendersLeft <= 0 && attackersLeft > 0) {
      state.owners[to] = nationId;
      state.units[to] = moving;
      if (nationId === state.playerNationId) log(state, 'Captured ' + regionName(to) + ' from ' + regionName(from) + ' (' + attackersLeft + ' survived).');
      else if (toOwner === state.playerNationId) log(state, 'Lost ' + regionName(to) + ' to an attack from ' + regionName(from) + '.');
      else log(state, regionName(from) + ' captured ' + regionName(to) + '.');
    } else {
      // attacker returns survivors to source
      state.units[from].infantry += moving.infantry; state.units[from].armor += moving.armor;
      if (nationId === state.playerNationId) log(state, 'Attack on ' + regionName(to) + ' failed (' + attackersLeft + ' returned, defenders ' + defendersLeft + ').');
      else if (toOwner === state.playerNationId) log(state, 'Defended ' + regionName(to) + ' against ' + regionName(from) + '.');
    }
    checkWinner(state);
    return { ok: true, combat: true };
  }

  function endTurn(state) {
    if (!state || state.winner) return false;
    // Player income
    addIncome(state, state.playerNationId);
    log(state, '--- Turn ' + state.turn + ' ended. Income collected. ---');
    // AI turns
    if (window.WW3AI && WW3AI.takeTurn) WW3AI.takeTurn(state);
    state.turn += 1;
    checkWinner(state);
    return true;
  }

  window.WW3Game = {
    COST: COST,
    STRENGTH: STRENGTH,
    state: null,
    newGame: function (playerRegionId) { this.state = newGame(playerRegionId); return this.state; },
    getIncome: function (nationId) { return getIncome(this.state, nationId || this.state.playerNationId); },
    endTurn: function () { return endTurn(this.state); },
    canRecruit: function (regionId, type) { return canRecruit(this.state, regionId, type); },
    recruit: function (regionId, type) { return recruit(this.state, regionId, type); },
    canMove: function (from, to, unitType, count) { return canMove(this.state, from, to, unitType, count); },
    moveOrAttack: function (from, to, unitType, count, nationId) { return moveOrAttack(this.state, from, to, unitType, count, nationId); },
    regionName: regionName,
    checkWinner: function () { return checkWinner(this.state); },
    _stateInternal: function () { return this.state; }
  };
})();
