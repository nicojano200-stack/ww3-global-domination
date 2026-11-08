(function () {
  var W = 1000, H = 500;
  function project(lon, lat) { return [(lon + 180) * (W / 360), (90 - lat) * (H / 180)]; }
  function ringToPath(ring) {
    var d = '';
    for (var i = 0; i < ring.length; i++) { var p = project(ring[i][0], ring[i][1]); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }
    return d + 'Z';
  }
  function geomToPath(geom) {
    if (!geom) return '';
    if (geom.type === 'Polygon') return geom.coordinates.map(ringToPath).join(' ');
    if (geom.type === 'MultiPolygon') return geom.coordinates.map(function (poly) { return poly.map(ringToPath).join(' '); }).join(' ');
    return '';
  }
  function featureIdToAlpha2(id) {
    if (id == null) return null;
    var n = String(id).replace(/^0+/, '') || '0';
    return (window.WW3_ISO_NUM && WW3_ISO_NUM[n]) || null;
  }

  function build() {
    if (!window.WW3_TOPOJSON || !window.topojson) return null;
    var obj = WW3_TOPOJSON.objects && (WW3_TOPOJSON.objects.countries || WW3_TOPOJSON.objects.land);
    if (!obj) return null;
    var fc = topojson.feature(WW3_TOPOJSON, obj);
    var features = (fc.features || []).map(function (f) {
      var a2 = featureIdToAlpha2(f.id) || (f.properties && (f.properties['Alpha-2'] || f.properties.ISO_A2 || f.properties.alpha2));
      if (a2 === '-99' || a2 === -99) a2 = null;
      return { id: a2, name: (f.properties && (f.properties.name || f.properties.NAME)) || a2 || String(f.id), path: geomToPath(f.geometry) };
    }).filter(function (f) { return f.path; });
    return features;
  }

  var features = null;
  function getFeatures() { if (!features) features = build(); return features; }

  function render(container, opts) {
    opts = opts || {};
    var feats = getFeatures();
    if (!feats) return false;
    var state = opts.state;
    var selected = opts.selected;
    var pickMode = opts.pickMode;
    var onSelect = opts.onSelect || function(){};
    var vbX=0,vbY=0,vbW=W,vbH=H; // simple (no persisted zoom state in this minimal impl)
    var svg = '<div class="real-map-wrap" style="position:relative;width:100%;max-width:100%;aspect-ratio:2/1;max-height:calc(100vh - 280px);min-height:220px;background:#081a33;border:1px solid #334155;border-radius:8px;overflow:hidden">' +
      '<svg id="realSvg" viewBox="'+vbX+' '+vbY+' '+vbW+' '+vbH+'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="-500" y="-500" width="2000" height="1500" fill="#0a2342"/><g id="countries">';
    feats.forEach(function (f) {
      var rid = f.id;
      var inGame = rid && WW3Map.get(rid);
      var cls = 'c-neutral';
      var fill = '#374151';
      if (state && inGame) {
        var o = state.owners[rid];
        if (o === state.playerNationId) { cls='c-player'; fill='#2563eb'; }
        else if (o === null || o === undefined) { cls='c-neutral'; fill='#6b7280'; }
        else { cls='c-ai'; fill='#b91c1c'; }
      } else if (pickMode && inGame) {
        if (WW3Map.get(rid).unclaimed) fill='#6b7280';
        else fill='#475569';
      } else if (!inGame) {
        fill='#1f2937';
      }
      if (selected && rid === selected) { fill='#f59e0b'; }
      var stroke = inGame ? '#0b1220' : '#0f172a';
      var sw = (selected && rid === selected) ? 1.4 : (inGame ? 0.55 : 0.25);
      var data = rid ? ' data-rid="'+rid+'" class="country'+(inGame?' in-game':'')+'"' : ' class="country"';
      var op = inGame ? '0.96' : '0.45';
      if (selected && rid === selected) { stroke = '#fde68a'; op = '1'; }
      svg += '<path d="'+f.path+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" opacity="'+op+'"'+data+'><title>'+ (f.name||rid||'') +'</title></path>';
    });
    svg += '</g></svg>' +
      '<div class="small" style="position:absolute;left:8px;bottom:6px;background:rgba(2,6,23,.55);color:#cbd5e1;padding:4px 8px;border-radius:6px;border:1px solid rgba(148,163,184,.2)">Real borders (simplified) · click a country · search + Enter</div></div>';
    container.innerHTML = svg;
    var paths = container.querySelectorAll('path[data-rid]');
    for (var i=0;i<paths.length;i++) {
      paths[i].style.cursor='pointer';
      paths[i].addEventListener('click', function(ev){ var rid=ev.currentTarget.getAttribute('data-rid'); if(rid) onSelect(rid); });
    }
    return true;
  }

  window.WW3RealMap = { getFeatures:getFeatures, render:render, available:function(){ return !!(window.WW3_TOPOJSON && window.topojson); } };
})();
