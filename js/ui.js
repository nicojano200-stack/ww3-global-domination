(function () {
  window.WW3UI = {
    init: function () {
      var el = document.getElementById('selection');
      if (el) el.textContent = 'Prototype scaffold ready. Game logic loading in next steps...';
      var log = document.getElementById('log');
      if (log) log.innerHTML = '<div class="entry">WW3: Global Domination scaffold loaded.</div>';
    }
  };
})();
