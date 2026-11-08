(function () {
  var W = 1000, H = 500;
  function project(lon, lat) { return [(lon + 180) * (W / 360), (90 - lat) * (H / 180)]; }
  function ringToPath(ring) {
    var d = '', prev = null, prevLon = null;
    for (var i = 0; i < ring.length; i++) {
      var lon = ring[i][0], lat = ring[i][1];
      var p = project(lon, lat);
      var jump = prevLon != null && Math.abs(lon - prevLon) > 180;
      if (i === 0 || jump) d += 'M' + p[0].toFixed(1) + ',' + p[1].toFixed(1);
      else d += 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1);
      prev = p; prevLon = lon;
    }
    return d ? (d + 'Z') : d;
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
    var svg = '<div class="real-map-wrap rsm-like" style="position:relative;width:100%;max-width:100%;aspect-ratio:2/1;max-height:calc(100vh - 280px);min-height:220px;background:#dceef7;border:1px solid #c2d7e6;border-radius:10px;overflow:hidden">' +
      '<div id="mapTooltip" class="map-tooltip" style="display:none"></div>' +
      '<svg id="realSvg" viewBox="'+vbX+' '+vbY+' '+vbW+' '+vbH+'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;background:#d9edf7" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="-500" y="-500" width="2000" height="1500" fill="#d9edf7"/><g id="countries">';
    feats.forEach(function (f) {
      var rid = f.id;
      var inGame = rid && WW3Map.get(rid);
      var fill = '#e6e9ee';
      var inPlay = !!(state && inGame);
      if (inPlay) {
        var o = state.owners[rid];
        if (o === state.playerNationId) fill = '#4f86d9';
        else if (o === null || o === undefined) fill = '#94a3b8';
        else fill = '#d96b6b';
      } else if (pickMode && inGame) {
        fill = (WW3Map.get(rid).unclaimed) ? '#94a3b8' : '#d7dde5';
      } else if (inGame) {
        fill = '#dfe5ec';
      } else {
        fill = '#eceff3';
      }
      if (selected && rid === selected) fill = '#f4c95d';
      var stroke = '#ffffff';
      var sw = (selected && rid === selected) ? 1.1 : 0.45;
      var data = rid ? ' data-rid="'+rid+'" data-name="'+((f.name||rid||'').replace(/"/g,'&quot;'))+'" class="rsm-geography'+(inGame?' in-game':'')+'"' : ' class="rsm-geography"';
      var op = inGame ? '1' : '0.85';
      svg += '<path d="'+f.path+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" opacity="'+op+'"'+data+'><title>'+ (f.name||rid||'') +'</title></path>';
    });
    svg += '</g></svg>' +
      '<div class="small map-hint" style="position:absolute;left:8px;bottom:6px;background:rgba(255,255,255,.88);color:#334155;padding:4px 8px;border-radius:6px;border:1px solid rgba(148,163,184,.45)">Real borders (simplified) · click a country · search + Enter</div></div>';
    container.innerHTML = svg;
    var tip = container.querySelector('#mapTooltip');
    var wrap = container.querySelector('.real-map-wrap');
    function showTip(ev, name) {
      if (!tip || !wrap) return;
      tip.textContent = name || '';
      tip.style.display = name ? 'block' : 'none';
      if (!name) return;
      var r = wrap.getBoundingClientRect();
      tip.style.left = (ev.clientX - r.left + 10) + 'px';
      tip.style.top = (ev.clientY - r.top - 10) + 'px';
    }
    var paths = container.querySelectorAll('path[data-rid]');
    for (var i=0;i<paths.length;i++) {
      paths[i].style.cursor='pointer';
      paths[i].addEventListener('click', function(ev){ var rid=ev.currentTarget.getAttribute('data-rid'); if(rid) onSelect(rid); });
      paths[i].addEventListener('mousemove', function(ev){ var n=ev.currentTarget.getAttribute('data-name')||''; var rid=ev.currentTarget.getAttribute('data-rid'); var g=WW3Map.get(rid); showTip(ev, (g?g.name:n) || n); });
      paths[i].addEventListener('mouseleave', function(){ showTip({}, ''); });
    }
    return true;
  }

  window.WW3RealMap = { getFeatures:getFeatures, render:render, available:function(){ return !!(window.WW3_TOPOJSON && window.topojson); } };
})();
