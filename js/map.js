(function () {
  // Simplified world regions (adjacency graph). v0: clarity/playability over geography.
  var regions = [
    { id: 'na_w', name: 'Western N. America', adj: ['na_e','ca','pac'], income: { money: 8, manpower: 6, industry: 7 } },
    { id: 'na_e', name: 'Eastern N. America', adj: ['na_w','ca','natl','gl'], income: { money: 9, manpower: 6, industry: 8 } },
    { id: 'ca', name: 'Central America', adj: ['na_w','na_e','sa_n'], income: { money: 4, manpower: 4, industry: 3 } },
    { id: 'sa_n', name: 'Northern S. America', adj: ['ca','sa_w','sa_e'], income: { money: 5, manpower: 5, industry: 4 } },
    { id: 'sa_w', name: 'Western S. America', adj: ['sa_n','sa_s'], income: { money: 4, manpower: 4, industry: 3 } },
    { id: 'sa_e', name: 'Brazil & Atlantic SA', adj: ['sa_n','sa_s','satl'], income: { money: 6, manpower: 7, industry: 5 } },
    { id: 'sa_s', name: 'Southern Cone', adj: ['sa_w','sa_e'], income: { money: 4, manpower: 3, industry: 3 } },
    { id: 'gl', name: 'Greenland & N. Atlantic', adj: ['na_e','natl','weu','neu'], income: { money: 2, manpower: 1, industry: 1 } },
    { id: 'weu', name: 'Western Europe', adj: ['gl','neu','ceu','med'], income: { money: 9, manpower: 5, industry: 8 } },
    { id: 'neu', name: 'Northern Europe', adj: ['gl','weu','ceu','ru_w'], income: { money: 6, manpower: 4, industry: 6 } },
    { id: 'ceu', name: 'Central/Eastern Europe', adj: ['weu','neu','ru_w','med','me'], income: { money: 6, manpower: 6, industry: 6 } },
    { id: 'ru_w', name: 'Western Russia', adj: ['neu','ceu','ru_e','cas','me'], income: { money: 7, manpower: 7, industry: 7 } },
    { id: 'ru_e', name: 'Siberia & Far East', adj: ['ru_w','cas','ea','pac'], income: { money: 5, manpower: 4, industry: 5 } },
    { id: 'med', name: 'Mediterranean', adj: ['weu','ceu','me','naf'], income: { money: 5, manpower: 4, industry: 4 } },
    { id: 'naf', name: 'North Africa', adj: ['med','me','waf','satl'], income: { money: 4, manpower: 5, industry: 3 } },
    { id: 'waf', name: 'West/Central Africa', adj: ['naf','eaf','saf','satl'], income: { money: 4, manpower: 6, industry: 2 } },
    { id: 'eaf', name: 'East Africa', adj: ['naf','waf','saf','me','ind'], income: { money: 4, manpower: 6, industry: 2 } },
    { id: 'saf', name: 'Southern Africa', adj: ['waf','eaf','satl'], income: { money: 5, manpower: 5, industry: 4 } },
    { id: 'me', name: 'Middle East', adj: ['med','ceu','ru_w','cas','naf','eaf','sa_as'], income: { money: 8, manpower: 5, industry: 5 } },
    { id: 'cas', name: 'Central Asia', adj: ['ru_w','ru_e','me','sa_as','ea'], income: { money: 4, manpower: 4, industry: 3 } },
    { id: 'sa_as', name: 'South Asia', adj: ['me','cas','ea','sea','ind'], income: { money: 6, manpower: 9, industry: 5 } },
    { id: 'ea', name: 'East Asia', adj: ['ru_e','cas','sa_as','sea','pac'], income: { money: 9, manpower: 8, industry: 9 } },
    { id: 'sea', name: 'Southeast Asia', adj: ['sa_as','ea','oc','ind','pac'], income: { money: 6, manpower: 7, industry: 5 } },
    { id: 'oc', name: 'Oceania', adj: ['sea','pac','ind'], income: { money: 5, manpower: 3, industry: 4 } },
    { id: 'pac', name: 'Pacific Ocean Route', adj: ['na_w','ru_e','ea','sea','oc'], income: { money: 2, manpower: 1, industry: 1 } },
    { id: 'natl', name: 'North Atlantic Route', adj: ['na_e','gl','weu'], income: { money: 2, manpower: 1, industry: 1 } },
    { id: 'satl', name: 'South Atlantic Route', adj: ['sa_e','naf','waf','saf'], income: { money: 2, manpower: 1, industry: 1 } },
    { id: 'ind', name: 'Indian Ocean Route', adj: ['eaf','sa_as','sea','oc','me'], income: { money: 2, manpower: 1, industry: 1 } }
  ];
  var byId = {};
  regions.forEach(function (r) { byId[r.id] = r; });

  window.WW3Map = {
    regions: regions,
    get: function (id) { return byId[id] || null; },
    areAdjacent: function (a, b) { var r = byId[a]; return !!(r && r.adj.indexOf(b) !== -1); },
    regionIds: function () { return regions.map(function (r) { return r.id; }); }
  };
})();
