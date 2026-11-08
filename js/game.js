(function () {
  window.WW3Game = {
    state: null,
    newGame: function () {},
    endTurn: function () {},
    canRecruit: function () { return false; },
    recruit: function () { return false; },
    canMove: function () { return false; },
    moveOrAttack: function () { return { ok: false }; }
  };
})();
