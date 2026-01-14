/**
 * Provincial Map Fill - Region Data
 * Contains data for US States, Canadian Provinces, Japanese Prefectures, and Irish Counties
 */

// US States data
export const US_STATES = {
  id: 'us-states',
  name: 'US States',
  icon: '🇺🇸',
  description: 'Fill in all 50 US states on the map',
  geoJsonUrl: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
  viewBox: '-130 -50 70 30',
  nameProperty: 'name',
  regions: [
    { code: 'AL', name: 'Alabama', aliases: ['al', 'bama'] },
    { code: 'AK', name: 'Alaska', aliases: ['ak'] },
    { code: 'AZ', name: 'Arizona', aliases: ['az'] },
    { code: 'AR', name: 'Arkansas', aliases: ['ar'] },
    { code: 'CA', name: 'California', aliases: ['ca', 'cali'] },
    { code: 'CO', name: 'Colorado', aliases: ['co'] },
    { code: 'CT', name: 'Connecticut', aliases: ['ct', 'conn'] },
    { code: 'DE', name: 'Delaware', aliases: ['de'] },
    { code: 'FL', name: 'Florida', aliases: ['fl', 'fla'] },
    { code: 'GA', name: 'Georgia', aliases: ['ga'] },
    { code: 'HI', name: 'Hawaii', aliases: ['hi'] },
    { code: 'ID', name: 'Idaho', aliases: ['id'] },
    { code: 'IL', name: 'Illinois', aliases: ['il'] },
    { code: 'IN', name: 'Indiana', aliases: ['in'] },
    { code: 'IA', name: 'Iowa', aliases: ['ia'] },
    { code: 'KS', name: 'Kansas', aliases: ['ks'] },
    { code: 'KY', name: 'Kentucky', aliases: ['ky'] },
    { code: 'LA', name: 'Louisiana', aliases: ['la'] },
    { code: 'ME', name: 'Maine', aliases: ['me'] },
    { code: 'MD', name: 'Maryland', aliases: ['md'] },
    { code: 'MA', name: 'Massachusetts', aliases: ['ma', 'mass'] },
    { code: 'MI', name: 'Michigan', aliases: ['mi', 'mich'] },
    { code: 'MN', name: 'Minnesota', aliases: ['mn', 'minn'] },
    { code: 'MS', name: 'Mississippi', aliases: ['ms', 'miss'] },
    { code: 'MO', name: 'Missouri', aliases: ['mo'] },
    { code: 'MT', name: 'Montana', aliases: ['mt', 'mont'] },
    { code: 'NE', name: 'Nebraska', aliases: ['ne', 'neb'] },
    { code: 'NV', name: 'Nevada', aliases: ['nv', 'nev'] },
    { code: 'NH', name: 'New Hampshire', aliases: ['nh'] },
    { code: 'NJ', name: 'New Jersey', aliases: ['nj'] },
    { code: 'NM', name: 'New Mexico', aliases: ['nm'] },
    { code: 'NY', name: 'New York', aliases: ['ny'] },
    { code: 'NC', name: 'North Carolina', aliases: ['nc'] },
    { code: 'ND', name: 'North Dakota', aliases: ['nd'] },
    { code: 'OH', name: 'Ohio', aliases: ['oh'] },
    { code: 'OK', name: 'Oklahoma', aliases: ['ok', 'okla'] },
    { code: 'OR', name: 'Oregon', aliases: ['or', 'ore'] },
    { code: 'PA', name: 'Pennsylvania', aliases: ['pa', 'penn', 'penna'] },
    { code: 'RI', name: 'Rhode Island', aliases: ['ri'] },
    { code: 'SC', name: 'South Carolina', aliases: ['sc'] },
    { code: 'SD', name: 'South Dakota', aliases: ['sd'] },
    { code: 'TN', name: 'Tennessee', aliases: ['tn', 'tenn'] },
    { code: 'TX', name: 'Texas', aliases: ['tx', 'tex'] },
    { code: 'UT', name: 'Utah', aliases: ['ut'] },
    { code: 'VT', name: 'Vermont', aliases: ['vt'] },
    { code: 'VA', name: 'Virginia', aliases: ['va'] },
    { code: 'WA', name: 'Washington', aliases: ['wa', 'wash'] },
    { code: 'WV', name: 'West Virginia', aliases: ['wv'] },
    { code: 'WI', name: 'Wisconsin', aliases: ['wi', 'wis', 'wisc'] },
    { code: 'WY', name: 'Wyoming', aliases: ['wy', 'wyo'] },
  ],
};

// Canadian Provinces and Territories
export const CANADIAN_PROVINCES = {
  id: 'canada-provinces',
  name: 'Canadian Provinces',
  icon: '🇨🇦',
  description: 'Fill in all 13 Canadian provinces and territories',
  geoJsonUrl: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson',
  viewBox: '-145 -85 85 45',
  nameProperty: 'name',
  regions: [
    { code: 'AB', name: 'Alberta', aliases: ['ab', 'alta'] },
    { code: 'BC', name: 'British Columbia', aliases: ['bc'] },
    { code: 'MB', name: 'Manitoba', aliases: ['mb', 'man'] },
    { code: 'NB', name: 'New Brunswick', aliases: ['nb'] },
    { code: 'NL', name: 'Newfoundland and Labrador', aliases: ['nl', 'nfld', 'newfoundland', 'labrador'] },
    { code: 'NS', name: 'Nova Scotia', aliases: ['ns'] },
    { code: 'NT', name: 'Northwest Territories', aliases: ['nt', 'nwt'] },
    { code: 'NU', name: 'Nunavut', aliases: ['nu'] },
    { code: 'ON', name: 'Ontario', aliases: ['on', 'ont'] },
    { code: 'PE', name: 'Prince Edward Island', aliases: ['pe', 'pei'] },
    { code: 'QC', name: 'Quebec', aliases: ['qc', 'que', 'québec'] },
    { code: 'SK', name: 'Saskatchewan', aliases: ['sk', 'sask'] },
    { code: 'YT', name: 'Yukon', aliases: ['yt', 'yukon territory'] },
  ],
};

// Japanese Prefectures (都道府県)
export const JAPANESE_PREFECTURES = {
  id: 'japan-prefectures',
  name: 'Japanese Prefectures',
  icon: '🇯🇵',
  description: 'Fill in all 47 Japanese prefectures (都道府県)',
  geoJsonUrl: 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson',
  viewBox: '127 -46 20 18',
  nameProperty: 'nam_ja',
  regions: [
    { code: 'JP-01', name: 'Hokkaido', aliases: ['北海道', 'hokkaidou'] },
    { code: 'JP-02', name: 'Aomori', aliases: ['青森', '青森県', 'aomori-ken'] },
    { code: 'JP-03', name: 'Iwate', aliases: ['岩手', '岩手県', 'iwate-ken'] },
    { code: 'JP-04', name: 'Miyagi', aliases: ['宮城', '宮城県', 'miyagi-ken'] },
    { code: 'JP-05', name: 'Akita', aliases: ['秋田', '秋田県', 'akita-ken'] },
    { code: 'JP-06', name: 'Yamagata', aliases: ['山形', '山形県', 'yamagata-ken'] },
    { code: 'JP-07', name: 'Fukushima', aliases: ['福島', '福島県', 'fukushima-ken'] },
    { code: 'JP-08', name: 'Ibaraki', aliases: ['茨城', '茨城県', 'ibaraki-ken'] },
    { code: 'JP-09', name: 'Tochigi', aliases: ['栃木', '栃木県', 'tochigi-ken'] },
    { code: 'JP-10', name: 'Gunma', aliases: ['群馬', '群馬県', 'gunma-ken'] },
    { code: 'JP-11', name: 'Saitama', aliases: ['埼玉', '埼玉県', 'saitama-ken'] },
    { code: 'JP-12', name: 'Chiba', aliases: ['千葉', '千葉県', 'chiba-ken'] },
    { code: 'JP-13', name: 'Tokyo', aliases: ['東京', '東京都', 'toukyou', 'tokyo-to'] },
    { code: 'JP-14', name: 'Kanagawa', aliases: ['神奈川', '神奈川県', 'kanagawa-ken'] },
    { code: 'JP-15', name: 'Niigata', aliases: ['新潟', '新潟県', 'niigata-ken'] },
    { code: 'JP-16', name: 'Toyama', aliases: ['富山', '富山県', 'toyama-ken'] },
    { code: 'JP-17', name: 'Ishikawa', aliases: ['石川', '石川県', 'ishikawa-ken'] },
    { code: 'JP-18', name: 'Fukui', aliases: ['福井', '福井県', 'fukui-ken'] },
    { code: 'JP-19', name: 'Yamanashi', aliases: ['山梨', '山梨県', 'yamanashi-ken'] },
    { code: 'JP-20', name: 'Nagano', aliases: ['長野', '長野県', 'nagano-ken'] },
    { code: 'JP-21', name: 'Gifu', aliases: ['岐阜', '岐阜県', 'gifu-ken'] },
    { code: 'JP-22', name: 'Shizuoka', aliases: ['静岡', '静岡県', 'shizuoka-ken'] },
    { code: 'JP-23', name: 'Aichi', aliases: ['愛知', '愛知県', 'aichi-ken'] },
    { code: 'JP-24', name: 'Mie', aliases: ['三重', '三重県', 'mie-ken'] },
    { code: 'JP-25', name: 'Shiga', aliases: ['滋賀', '滋賀県', 'shiga-ken'] },
    { code: 'JP-26', name: 'Kyoto', aliases: ['京都', '京都府', 'kyouto', 'kyoto-fu'] },
    { code: 'JP-27', name: 'Osaka', aliases: ['大阪', '大阪府', 'oosaka', 'osaka-fu'] },
    { code: 'JP-28', name: 'Hyogo', aliases: ['兵庫', '兵庫県', 'hyougo', 'hyogo-ken'] },
    { code: 'JP-29', name: 'Nara', aliases: ['奈良', '奈良県', 'nara-ken'] },
    { code: 'JP-30', name: 'Wakayama', aliases: ['和歌山', '和歌山県', 'wakayama-ken'] },
    { code: 'JP-31', name: 'Tottori', aliases: ['鳥取', '鳥取県', 'tottori-ken'] },
    { code: 'JP-32', name: 'Shimane', aliases: ['島根', '島根県', 'shimane-ken'] },
    { code: 'JP-33', name: 'Okayama', aliases: ['岡山', '岡山県', 'okayama-ken'] },
    { code: 'JP-34', name: 'Hiroshima', aliases: ['広島', '広島県', 'hiroshima-ken'] },
    { code: 'JP-35', name: 'Yamaguchi', aliases: ['山口', '山口県', 'yamaguchi-ken'] },
    { code: 'JP-36', name: 'Tokushima', aliases: ['徳島', '徳島県', 'tokushima-ken'] },
    { code: 'JP-37', name: 'Kagawa', aliases: ['香川', '香川県', 'kagawa-ken'] },
    { code: 'JP-38', name: 'Ehime', aliases: ['愛媛', '愛媛県', 'ehime-ken'] },
    { code: 'JP-39', name: 'Kochi', aliases: ['高知', '高知県', 'kouchi', 'kochi-ken'] },
    { code: 'JP-40', name: 'Fukuoka', aliases: ['福岡', '福岡県', 'fukuoka-ken'] },
    { code: 'JP-41', name: 'Saga', aliases: ['佐賀', '佐賀県', 'saga-ken'] },
    { code: 'JP-42', name: 'Nagasaki', aliases: ['長崎', '長崎県', 'nagasaki-ken'] },
    { code: 'JP-43', name: 'Kumamoto', aliases: ['熊本', '熊本県', 'kumamoto-ken'] },
    { code: 'JP-44', name: 'Oita', aliases: ['大分', '大分県', 'ooita', 'oita-ken'] },
    { code: 'JP-45', name: 'Miyazaki', aliases: ['宮崎', '宮崎県', 'miyazaki-ken'] },
    { code: 'JP-46', name: 'Kagoshima', aliases: ['鹿児島', '鹿児島県', 'kagoshima-ken'] },
    { code: 'JP-47', name: 'Okinawa', aliases: ['沖縄', '沖縄県', 'okinawa-ken'] },
  ],
};

// Irish Counties (26 Republic of Ireland counties)
export const IRISH_COUNTIES = {
  id: 'ireland-counties',
  name: 'Irish Counties',
  icon: '🇮🇪',
  description: 'Fill in all 26 counties of the Republic of Ireland',
  geoJsonUrl: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/ireland-counties.geojson',
  viewBox: '-10.7 -55.5 5 4.5',
  nameProperty: 'name',
  regions: [
    // Province of Leinster
    { code: 'IE-CW', name: 'Carlow', aliases: ['ceatharlach', 'county carlow', 'co. carlow'] },
    { code: 'IE-D', name: 'Dublin', aliases: ['baile átha cliath', 'áth cliath', 'county dublin', 'co. dublin', 'dublin city', 'dublin county', 'dún laoghaire-rathdown', 'dun laoghaire-rathdown', 'dún laoghaire rathdown', 'fingal', 'south dublin'] },
    { code: 'IE-KE', name: 'Kildare', aliases: ['cill dara', 'county kildare', 'co. kildare'] },
    { code: 'IE-KK', name: 'Kilkenny', aliases: ['cill chainnigh', 'county kilkenny', 'co. kilkenny'] },
    { code: 'IE-LS', name: 'Laois', aliases: ['laoighis', "queen's county", 'county laois', 'co. laois', 'leix', 'laoighis'] },
    { code: 'IE-LD', name: 'Longford', aliases: ['longphort', 'county longford', 'co. longford'] },
    { code: 'IE-LH', name: 'Louth', aliases: ['lú', 'county louth', 'co. louth'] },
    { code: 'IE-MH', name: 'Meath', aliases: ['mí', 'an mhí', 'county meath', 'co. meath'] },
    { code: 'IE-OY', name: 'Offaly', aliases: ['uíbh fhailí', "king's county", 'county offaly', 'co. offaly'] },
    { code: 'IE-WH', name: 'Westmeath', aliases: ['an iarmhí', 'county westmeath', 'co. westmeath'] },
    { code: 'IE-WX', name: 'Wexford', aliases: ['loch garman', 'county wexford', 'co. wexford'] },
    { code: 'IE-WW', name: 'Wicklow', aliases: ['cill mhantáin', 'county wicklow', 'co. wicklow'] },
    // Province of Munster
    { code: 'IE-CE', name: 'Clare', aliases: ['an clár', 'county clare', 'co. clare'] },
    { code: 'IE-CO', name: 'Cork', aliases: ['corcaigh', 'county cork', 'co. cork', 'cork county', 'cork city'] },
    { code: 'IE-KY', name: 'Kerry', aliases: ['ciarraí', 'county kerry', 'co. kerry'] },
    { code: 'IE-LK', name: 'Limerick', aliases: ['luimneach', 'county limerick', 'co. limerick', 'limerick county', 'limerick city'] },
    { code: 'IE-TA', name: 'Tipperary', aliases: ['tiobraid árann', 'county tipperary', 'co. tipperary', 'tipperary county', 'north tipperary', 'south tipperary'] },
    { code: 'IE-WA', name: 'Waterford', aliases: ['port láirge', 'county waterford', 'co. waterford', 'waterford county', 'waterford city'] },
    // Province of Connacht
    { code: 'IE-G', name: 'Galway', aliases: ['gaillimh', 'county galway', 'co. galway', 'galway county', 'galway city'] },
    { code: 'IE-LM', name: 'Leitrim', aliases: ['liatroim', 'county leitrim', 'co. leitrim'] },
    { code: 'IE-MO', name: 'Mayo', aliases: ['maigh eo', 'county mayo', 'co. mayo'] },
    { code: 'IE-RN', name: 'Roscommon', aliases: ['ros comáin', 'county roscommon', 'co. roscommon'] },
    { code: 'IE-SO', name: 'Sligo', aliases: ['sligeach', 'county sligo', 'co. sligo'] },
    // Province of Ulster (Republic of Ireland portion)
    { code: 'IE-CN', name: 'Cavan', aliases: ['an cabhán', 'county cavan', 'co. cavan'] },
    { code: 'IE-DL', name: 'Donegal', aliases: ['dún na ngall', 'tír chonaill', 'county donegal', 'co. donegal'] },
    { code: 'IE-MN', name: 'Monaghan', aliases: ['muineachán', 'county monaghan', 'co. monaghan'] },
  ],
};

// All region configurations
export const REGION_CONFIGS = {
  'us-states': US_STATES,
  'canada-provinces': CANADIAN_PROVINCES,
  'japan-prefectures': JAPANESE_PREFECTURES,
  'ireland-counties': IRISH_COUNTIES,
};

// Helper function to build lookup map for a region
export function buildLookup(regionConfig) {
  const lookup = {};
  if (!regionConfig?.regions) return lookup;

  const addEntry = (name, code) => {
    if (!name || !code) return;
    lookup[name.toString().trim().toLowerCase()] = code;
  };

  regionConfig.regions.forEach(region => {
    addEntry(region.name, region.code);
    addEntry(region.code, region.code);
    if (region.aliases) {
      region.aliases.forEach(alias => addEntry(alias, region.code));
    }
  });

  if (regionConfig.alternateNames) {
    Object.entries(regionConfig.alternateNames).forEach(([alias, code]) => {
      addEntry(alias, code);
    });
  }

  return lookup;
}

// Helper function to find region code from GeoJSON feature
export function getRegionCode(featureOrName, regionConfigOrLookup) {
  if (!featureOrName) return '';

  // Support simple string lookups for tests and user input
  if (typeof featureOrName === 'string' || typeof featureOrName === 'number') {
    const normalized = featureOrName.toString().trim().toLowerCase();
    const lookup = regionConfigOrLookup?.regions
      ? buildLookup(regionConfigOrLookup)
      : (regionConfigOrLookup || {});
    return lookup[normalized] || '';
  }

  const feature = featureOrName;
  const regionConfig = regionConfigOrLookup;
  if (!regionConfig) return '';

  // Try multiple possible property names
  const props = feature.properties || {};
  const possibleNames = [
    props[regionConfig.nameProperty],
    props.name,
    props.NAME,
    props.Name,
    props.title,
    props.ADMIN,
    props.admin,
    props.COUNTY,
    props.county,
    props.County,
    props.COUNTYNAME,
    props.countyname,
  ].filter(Boolean);

  if (possibleNames.length === 0) return '';

  for (const name of possibleNames) {
    const nameLower = name.toLowerCase().trim();

    // Try to find a matching region
    const region = regionConfig.regions.find(r => {
      const rNameLower = r.name.toLowerCase();
      // Exact match on name
      if (rNameLower === nameLower) return true;
      // Match with "County" prefix (e.g., "County Cork" -> "Cork")
      if (nameLower.startsWith('county ') && rNameLower === nameLower.replace('county ', '')) return true;
      if (nameLower.startsWith('co. ') && rNameLower === nameLower.replace('co. ', '')) return true;
      // Match with "County" suffix (e.g., "Cork County" -> "Cork")
      if (nameLower.endsWith(' county') && rNameLower === nameLower.replace(' county', '')) return true;
      // Match with "City" suffix (e.g., "Cork City" -> "Cork")
      if (nameLower.endsWith(' city') && rNameLower === nameLower.replace(' city', '')) return true;
      // Code match
      if (r.code.toLowerCase() === nameLower) return true;
      // Alias match
      if (r.aliases?.some(a => a.toLowerCase() === nameLower)) return true;
      // Partial match for Japanese kanji
      if (r.aliases?.some(a => nameLower.includes(a.toLowerCase()) || a.toLowerCase().includes(nameLower))) return true;
      return false;
    });

    if (region) return region.code;
  }

  return '';
}
