(function () {
  // v1: comprehensive country roster with simplified adjacencies (group-based + bridges).
  // Antarctica is unclaimed with high "oil" value (money/industry), no manpower.
  function C(id, name, group, money, manpower, industry, opts) {
    var o = opts || {};
    return { id:id, name:name, group:group, adj:[], income:{money:money, manpower:manpower, industry:industry}, unclaimed: !!o.unclaimed, playable: o.playable !== false };
  }
  var countries = [
    // North America
    C('US','United States','NA',12,8,12),C('CA','Canada','NA',8,5,7),C('MX','Mexico','NA',6,7,5),C('GT','Guatemala','NA',2,3,1),C('BZ','Belize','NA',1,1,1),C('SV','El Salvador','NA',2,3,1),C('HN','Honduras','NA',2,3,1),C('NI','Nicaragua','NA',2,2,1),C('CR','Costa Rica','NA',2,2,1),C('PA','Panama','NA',3,2,2),C('CU','Cuba','NA',2,3,2),C('JM','Jamaica','NA',1,1,1),C('HT','Haiti','NA',1,3,1),C('DO','Dominican Republic','NA',2,3,2),C('BS','Bahamas','NA',1,1,1),C('TT','Trinidad and Tobago','NA',2,1,2),
    // South America
    C('CO','Colombia','SA',4,6,3),C('VE','Venezuela','SA',4,4,3),C('GY','Guyana','SA',1,1,1),C('SR','Suriname','SA',1,1,1),C('EC','Ecuador','SA',3,4,2),C('PE','Peru','SA',4,5,3),C('BR','Brazil','SA',8,9,7),C('BO','Bolivia','SA',2,3,2),C('PY','Paraguay','SA',2,2,1),C('UY','Uruguay','SA',2,1,2),C('AR','Argentina','SA',5,5,4),C('CL','Chile','SA',4,3,4),
    // Europe
    C('IS','Iceland','EU',2,1,2),C('IE','Ireland','EU',4,2,4),C('GB','United Kingdom','EU',9,5,8),C('PT','Portugal','EU',3,2,3),C('ES','Spain','EU',6,4,6),C('FR','France','EU',9,5,9),C('BE','Belgium','EU',4,2,4),C('NL','Netherlands','EU',5,2,5),C('LU','Luxembourg','EU',2,1,2),C('DE','Germany','EU',10,6,10),C('CH','Switzerland','EU',5,1,5),C('IT','Italy','EU',7,5,7),C('AT','Austria','EU',4,2,4),C('DK','Denmark','EU',4,1,4),C('NO','Norway','EU',5,1,5),C('SE','Sweden','EU',5,2,5),C('FI','Finland','EU',4,1,4),C('EE','Estonia','EU',2,1,2),C('LV','Latvia','EU',2,1,2),C('LT','Lithuania','EU',2,1,2),C('PL','Poland','EU',6,5,6),C('CZ','Czechia','EU',4,2,4),C('SK','Slovakia','EU',3,2,3),C('HU','Hungary','EU',3,2,3),C('SI','Slovenia','EU',2,1,2),C('HR','Croatia','EU',2,2,2),C('BA','Bosnia and Herzegovina','EU',1,2,1),C('RS','Serbia','EU',2,2,2),C('ME','Montenegro','EU',1,1,1),C('AL','Albania','EU',1,1,1),C('MK','North Macedonia','EU',1,1,1),C('GR','Greece','EU',3,2,3),C('BG','Bulgaria','EU',2,2,2),C('RO','Romania','EU',4,4,4),C('MD','Moldova','EU',1,1,1),C('UA','Ukraine','EU',5,6,4),C('BY','Belarus','EU',3,3,3),
    // Russia & Caucasus
    C('RU','Russia','RU',11,9,10),C('GE','Georgia','RU',2,2,1),C('AM','Armenia','RU',1,1,1),C('AZ','Azerbaijan','RU',3,2,3),
    // Middle East
    C('TR','Turkey','ME',6,6,6),C('CY','Cyprus','ME',2,1,2),C('SY','Syria','ME',2,4,2),C('LB','Lebanon','ME',2,2,1),C('IL','Israel','ME',5,2,5),C('PS','Palestine','ME',1,2,1),C('JO','Jordan','ME',2,2,2),C('IQ','Iraq','ME',4,5,4),C('IR','Iran','ME',6,7,5),C('KW','Kuwait','ME',3,1,3),C('SA','Saudi Arabia','ME',8,4,7),C('BH','Bahrain','ME',2,1,2),C('QA','Qatar','ME',4,1,4),C('AE','United Arab Emirates','ME',6,2,6),C('OM','Oman','ME',3,2,3),C('YE','Yemen','ME',1,4,1),
    // Central Asia
    C('KZ','Kazakhstan','CA',5,4,4),C('UZ','Uzbekistan','CA',3,5,3),C('TM','Turkmenistan','CA',3,2,3),C('KG','Kyrgyzstan','CA',1,2,1),C('TJ','Tajikistan','CA',1,2,1),C('AF','Afghanistan','CA',1,5,1),
    // South Asia
    C('PK','Pakistan','SA2',4,9,4),C('IN','India','SA2',9,12,8),C('NP','Nepal','SA2',1,4,1),C('BT','Bhutan','SA2',1,1,1),C('BD','Bangladesh','SA2',4,8,3),C('LK','Sri Lanka','SA2',2,3,2),C('MV','Maldives','SA2',1,1,1),
    // East & SE Asia
    C('MN','Mongolia','EA',2,2,2),C('CN','China','EA',12,12,12),C('KP','North Korea','EA',2,4,2),C('KR','South Korea','EA',7,4,8),C('JP','Japan','EA',9,5,10),C('TW','Taiwan','EA',5,2,6),C('MM','Myanmar','EA',2,5,2),C('TH','Thailand','EA',4,5,4),C('LA','Laos','EA',1,2,1),C('KH','Cambodia','EA',2,3,1),C('VN','Vietnam','EA',4,6,4),C('MY','Malaysia','EA',4,4,4),C('SG','Singapore','EA',4,1,4),C('BN','Brunei','EA',2,1,2),C('ID','Indonesia','EA',6,9,5),C('TL','Timor-Leste','EA',1,1,1),C('PH','Philippines','EA',4,6,3),
    // Oceania
    C('AU','Australia','OC',7,3,6),C('NZ','New Zealand','OC',3,1,3),C('PG','Papua New Guinea','OC',2,3,1),C('FJ','Fiji','OC',1,1,1),C('SB','Solomon Islands','OC',1,1,1),C('VU','Vanuatu','OC',1,1,1),C('WS','Samoa','OC',1,1,1),C('TO','Tonga','OC',1,1,1),
    // North Africa
    C('MA','Morocco','NAF',3,4,3),C('DZ','Algeria','NAF',4,5,4),C('TN','Tunisia','NAF',2,2,2),C('LY','Libya','NAF',3,2,3),C('EG','Egypt','NAF',5,7,4),C('SD','Sudan','NAF',2,5,2),C('MR','Mauritania','NAF',1,2,1),
    // West Africa
    C('ML','Mali','WAF',1,3,1),C('NE','Niger','WAF',1,3,1),C('TD','Chad','WAF',1,3,1),C('SN','Senegal','WAF',2,3,1),C('GM','Gambia','WAF',1,1,1),C('GW','Guinea-Bissau','WAF',1,1,1),C('GN','Guinea','WAF',2,3,1),C('SL','Sierra Leone','WAF',1,2,1),C('LR','Liberia','WAF',1,2,1),C('CI','Cote d\'Ivoire','WAF',2,4,2),C('BF','Burkina Faso','WAF',1,3,1),C('GH','Ghana','WAF',3,4,2),C('TG','Togo','WAF',1,2,1),C('BJ','Benin','WAF',1,2,1),C('NG','Nigeria','WAF',5,10,4),C('CM','Cameroon','WAF',2,4,2),
    // Central/East/Southern Africa
    C('CF','Central African Republic','CAF',1,2,1),C('GQ','Equatorial Guinea','CAF',2,1,2),C('GA','Gabon','CAF',2,1,2),C('CG','Republic of the Congo','CAF',1,2,1),C('CD','DR Congo','CAF',3,9,2),C('SS','South Sudan','CAF',1,3,1),C('ET','Ethiopia','CAF',3,8,2),C('ER','Eritrea','CAF',1,1,1),C('DJ','Djibouti','CAF',1,1,1),C('SO','Somalia','CAF',1,3,1),C('KE','Kenya','CAF',3,6,2),C('UG','Uganda','CAF',2,5,1),C('RW','Rwanda','CAF',1,2,1),C('BI','Burundi','CAF',1,2,1),C('TZ','Tanzania','CAF',2,6,2),C('AO','Angola','CAF',3,4,3),C('ZM','Zambia','CAF',2,3,2),C('MW','Malawi','CAF',1,3,1),C('MZ','Mozambique','CAF',2,4,1),C('MG','Madagascar','CAF',2,4,1),C('NA','Namibia','CAF',2,1,2),C('BW','Botswana','CAF',2,1,2),C('ZW','Zimbabwe','CAF',1,3,1),C('ZA','South Africa','CAF',5,6,5),C('LS','Lesotho','CAF',1,1,1),C('SZ','Eswatini','CAF',1,1,1),C('KM','Comoros','CAF',1,1,1),C('MU','Mauritius','CAF',1,1,1),C('SC','Seychelles','CAF',1,1,1),
    // Antarctica - unclaimed, oil/resources (high money+industry, no manpower)
    C('AQ','Antarctica','AN',15,0,10,{unclaimed:true, playable:false})
  ];

  // Build adjacency: connect within group (ring + neighbor skip for connectivity) and add bridges.
  var byId = {};
  var groups = {};
  countries.forEach(function (c) { byId[c.id]=c; (groups[c.group]=groups[c.group]||[]).push(c.id); });
  function link(a,b){ if(!a||!b||a===b) return; var A=byId[a],B=byId[b]; if(!A||!B) return; if(A.adj.indexOf(b)===-1) A.adj.push(b); if(B.adj.indexOf(a)===-1) B.adj.push(a); }
  Object.keys(groups).forEach(function (g) {
    var arr = groups[g];
    for (var i=0;i<arr.length;i++){ link(arr[i], arr[(i+1)%arr.length]); if(arr.length>3) link(arr[i], arr[(i+2)%arr.length]); }
  });
  // Inter-group bridges (simplified plausible links)
  [['US','RU'],['CA','GL']?null:null,['US','JP'],['MX','CO'],['BR','NA'],['NA','PT'],['MA','ES'],['DZ','FR'],['TN','IT'],['LY','GR'],['EG','SA'],['EG','IL'],['TR','GR'],['TR','BG'],['TR','GE'],['TR','SY'],['TR','IR'],['RU','FI'],['RU','PL'],['RU','UA'],['RU','KZ'],['RU','MN'],['RU','CN'],['RU','KP'],['RU','JP'],['IL','JO'],['SA','YE'],['SA','IQ'],['SA','QA'],['IR','PK'],['IR','AF'],['AF','PK'],['KZ','CN'],['IN','CN'],['IN','MM'],['MM','TH'],['TH','MY'],['MY','ID'],['ID','PG'],['PG','AU'],['AU','NZ'],['AU','AQ'],['ZA','AQ'],['AR','AQ'],['CL','AQ'],['NZ','AQ'],['NG','TD'],['ET','SA'],['KE','IN'],['GB','IS'],['GB','FR'],['ES','FR'],['DE','FR'],['IT','FR'],['CN','JP'],['CN','TW'],['PH','TW'],['PH','US'],['CU','US'],['PA','CO'],['EG','SD'],['SD','CF'],['CD','AO'],['TZ','MZ']].forEach(function(p){ if(p) link(p[0],p[1]); });
  // Ensure Antarctica is linked (already added) and connected; ensure every country has >=1 adjacency
  countries.forEach(function(c){ if(!c.adj.length && countries.length>1){ var other=countries.find(function(x){return x.id!==c.id;}); if(other) link(c.id, other.id); }});

  window.WW3Map = {
    regions: countries,
    get: function (id) { return byId[id] || null; },
    areAdjacent: function (a, b) { var r = byId[a]; return !!(r && r.adj.indexOf(b) !== -1); },
    regionIds: function () { return countries.map(function (r) { return r.id; }); },
    playableIds: function () { return countries.filter(function(r){ return r.playable && !r.unclaimed; }).map(function(r){ return r.id; }); }
  };
})();
