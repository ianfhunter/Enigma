// Japanese words for Shiritori
// Each word has: hiragana, romaji (for input), and English meaning
// Words are grouped by their starting kana for efficient lookup

const japaneseWords = [
  // あ (a)
  { hiragana: 'あめ', romaji: 'ame', meaning: 'rain/candy' },
  { hiragana: 'あさ', romaji: 'asa', meaning: 'morning' },
  { hiragana: 'あお', romaji: 'ao', meaning: 'blue' },
  { hiragana: 'あか', romaji: 'aka', meaning: 'red' },
  { hiragana: 'あき', romaji: 'aki', meaning: 'autumn' },
  { hiragana: 'あし', romaji: 'ashi', meaning: 'leg/foot' },
  { hiragana: 'あたま', romaji: 'atama', meaning: 'head' },
  { hiragana: 'あに', romaji: 'ani', meaning: 'older brother' },
  { hiragana: 'あね', romaji: 'ane', meaning: 'older sister' },
  { hiragana: 'あひる', romaji: 'ahiru', meaning: 'duck' },
  { hiragana: 'あいす', romaji: 'aisu', meaning: 'ice cream' },
  { hiragana: 'あそび', romaji: 'asobi', meaning: 'play' },

  // い (i)
  { hiragana: 'いぬ', romaji: 'inu', meaning: 'dog' },
  { hiragana: 'いえ', romaji: 'ie', meaning: 'house' },
  { hiragana: 'いし', romaji: 'ishi', meaning: 'stone' },
  { hiragana: 'いろ', romaji: 'iro', meaning: 'color' },
  { hiragana: 'いす', romaji: 'isu', meaning: 'chair' },
  { hiragana: 'いけ', romaji: 'ike', meaning: 'pond' },
  { hiragana: 'いか', romaji: 'ika', meaning: 'squid' },
  { hiragana: 'いと', romaji: 'ito', meaning: 'thread' },
  { hiragana: 'いちご', romaji: 'ichigo', meaning: 'strawberry' },
  { hiragana: 'いもうと', romaji: 'imouto', meaning: 'younger sister' },

  // う (u)
  { hiragana: 'うみ', romaji: 'umi', meaning: 'sea' },
  { hiragana: 'うま', romaji: 'uma', meaning: 'horse' },
  { hiragana: 'うた', romaji: 'uta', meaning: 'song' },
  { hiragana: 'うし', romaji: 'ushi', meaning: 'cow' },
  { hiragana: 'うさぎ', romaji: 'usagi', meaning: 'rabbit' },
  { hiragana: 'うで', romaji: 'ude', meaning: 'arm' },
  { hiragana: 'うえ', romaji: 'ue', meaning: 'above/top' },
  { hiragana: 'うちわ', romaji: 'uchiwa', meaning: 'fan' },
  { hiragana: 'うどん', romaji: 'udon', meaning: 'udon noodles' }, // ends in ん - lose!

  // え (e)
  { hiragana: 'えき', romaji: 'eki', meaning: 'station' },
  { hiragana: 'えび', romaji: 'ebi', meaning: 'shrimp' },
  { hiragana: 'えだ', romaji: 'eda', meaning: 'branch' },
  { hiragana: 'えほん', romaji: 'ehon', meaning: 'picture book' }, // ends in ん
  { hiragana: 'えんぴつ', romaji: 'enpitsu', meaning: 'pencil' },

  // お (o)
  { hiragana: 'おに', romaji: 'oni', meaning: 'demon' },
  { hiragana: 'おか', romaji: 'oka', meaning: 'hill' },
  { hiragana: 'おかし', romaji: 'okashi', meaning: 'sweets' },
  { hiragana: 'おちゃ', romaji: 'ocha', meaning: 'tea' },
  { hiragana: 'おと', romaji: 'oto', meaning: 'sound' },
  { hiragana: 'おとこ', romaji: 'otoko', meaning: 'man' },
  { hiragana: 'おんな', romaji: 'onna', meaning: 'woman' },
  { hiragana: 'おかね', romaji: 'okane', meaning: 'money' },

  // か (ka)
  { hiragana: 'かさ', romaji: 'kasa', meaning: 'umbrella' },
  { hiragana: 'かわ', romaji: 'kawa', meaning: 'river' },
  { hiragana: 'かぜ', romaji: 'kaze', meaning: 'wind' },
  { hiragana: 'かお', romaji: 'kao', meaning: 'face' },
  { hiragana: 'かみ', romaji: 'kami', meaning: 'paper/god/hair' },
  { hiragana: 'かめ', romaji: 'kame', meaning: 'turtle' },
  { hiragana: 'かに', romaji: 'kani', meaning: 'crab' },
  { hiragana: 'からす', romaji: 'karasu', meaning: 'crow' },
  { hiragana: 'かれー', romaji: 'karee', meaning: 'curry' },
  { hiragana: 'かいしゃ', romaji: 'kaisha', meaning: 'company' },
  { hiragana: 'かばん', romaji: 'kaban', meaning: 'bag' }, // ends in ん
  { hiragana: 'かえる', romaji: 'kaeru', meaning: 'frog' },

  // き (ki)
  { hiragana: 'きつね', romaji: 'kitsune', meaning: 'fox' },
  { hiragana: 'きもの', romaji: 'kimono', meaning: 'kimono' },
  { hiragana: 'きって', romaji: 'kitte', meaning: 'stamp' },
  { hiragana: 'きた', romaji: 'kita', meaning: 'north' },
  { hiragana: 'きく', romaji: 'kiku', meaning: 'chrysanthemum' },
  { hiragana: 'きり', romaji: 'kiri', meaning: 'fog' },
  { hiragana: 'きんぎょ', romaji: 'kingyo', meaning: 'goldfish' },

  // く (ku)
  { hiragana: 'くも', romaji: 'kumo', meaning: 'cloud/spider' },
  { hiragana: 'くち', romaji: 'kuchi', meaning: 'mouth' },
  { hiragana: 'くつ', romaji: 'kutsu', meaning: 'shoes' },
  { hiragana: 'くび', romaji: 'kubi', meaning: 'neck' },
  { hiragana: 'くすり', romaji: 'kusuri', meaning: 'medicine' },
  { hiragana: 'くるま', romaji: 'kuruma', meaning: 'car' },
  { hiragana: 'くに', romaji: 'kuni', meaning: 'country' },

  // け (ke)
  { hiragana: 'けいたい', romaji: 'keitai', meaning: 'cellphone' },
  { hiragana: 'けむり', romaji: 'kemuri', meaning: 'smoke' },
  { hiragana: 'けしごむ', romaji: 'keshigomu', meaning: 'eraser' },
  { hiragana: 'けが', romaji: 'kega', meaning: 'injury' },

  // こ (ko)
  { hiragana: 'こども', romaji: 'kodomo', meaning: 'child' },
  { hiragana: 'こえ', romaji: 'koe', meaning: 'voice' },
  { hiragana: 'こおり', romaji: 'koori', meaning: 'ice' },
  { hiragana: 'こめ', romaji: 'kome', meaning: 'rice' },
  { hiragana: 'こい', romaji: 'koi', meaning: 'carp/love' },
  { hiragana: 'ここ', romaji: 'koko', meaning: 'here' },
  { hiragana: 'ころも', romaji: 'koromo', meaning: 'clothes' },

  // さ (sa)
  { hiragana: 'さかな', romaji: 'sakana', meaning: 'fish' },
  { hiragana: 'さくら', romaji: 'sakura', meaning: 'cherry blossom' },
  { hiragana: 'さとう', romaji: 'satou', meaning: 'sugar' },
  { hiragana: 'さる', romaji: 'saru', meaning: 'monkey' },
  { hiragana: 'さら', romaji: 'sara', meaning: 'plate' },
  { hiragana: 'さむらい', romaji: 'samurai', meaning: 'samurai' },

  // し (shi)
  { hiragana: 'しま', romaji: 'shima', meaning: 'island' },
  { hiragana: 'しろ', romaji: 'shiro', meaning: 'white/castle' },
  { hiragana: 'しお', romaji: 'shio', meaning: 'salt' },
  { hiragana: 'した', romaji: 'shita', meaning: 'below/tongue' },
  { hiragana: 'しか', romaji: 'shika', meaning: 'deer' },

  // す (su)
  { hiragana: 'すし', romaji: 'sushi', meaning: 'sushi' },
  { hiragana: 'すな', romaji: 'suna', meaning: 'sand' },
  { hiragana: 'すいか', romaji: 'suika', meaning: 'watermelon' },
  { hiragana: 'すずめ', romaji: 'suzume', meaning: 'sparrow' },

  // せ (se)
  { hiragana: 'せかい', romaji: 'sekai', meaning: 'world' },
  { hiragana: 'せなか', romaji: 'senaka', meaning: 'back (body)' },
  { hiragana: 'せみ', romaji: 'semi', meaning: 'cicada' },

  // そ (so)
  { hiragana: 'そら', romaji: 'sora', meaning: 'sky' },
  { hiragana: 'そば', romaji: 'soba', meaning: 'buckwheat noodles' },
  { hiragana: 'そと', romaji: 'soto', meaning: 'outside' },

  // た (ta)
  { hiragana: 'たこ', romaji: 'tako', meaning: 'octopus/kite' },
  { hiragana: 'たまご', romaji: 'tamago', meaning: 'egg' },
  { hiragana: 'たべもの', romaji: 'tabemono', meaning: 'food' },
  { hiragana: 'たいよう', romaji: 'taiyou', meaning: 'sun' },
  { hiragana: 'たき', romaji: 'taki', meaning: 'waterfall' },
  { hiragana: 'たけ', romaji: 'take', meaning: 'bamboo' },
  { hiragana: 'たね', romaji: 'tane', meaning: 'seed' },
  { hiragana: 'たぬき', romaji: 'tanuki', meaning: 'raccoon dog' },

  // ち (chi)
  { hiragana: 'ちず', romaji: 'chizu', meaning: 'map' },
  { hiragana: 'ちから', romaji: 'chikara', meaning: 'power' },
  { hiragana: 'ちち', romaji: 'chichi', meaning: 'father' },
  { hiragana: 'ちかてつ', romaji: 'chikatetsu', meaning: 'subway' },

  // つ (tsu)
  { hiragana: 'つき', romaji: 'tsuki', meaning: 'moon' },
  { hiragana: 'つち', romaji: 'tsuchi', meaning: 'earth/soil' },
  { hiragana: 'つくえ', romaji: 'tsukue', meaning: 'desk' },
  { hiragana: 'つな', romaji: 'tsuna', meaning: 'rope' },
  { hiragana: 'つばさ', romaji: 'tsubasa', meaning: 'wing' },

  // て (te)
  { hiragana: 'てがみ', romaji: 'tegami', meaning: 'letter' },
  { hiragana: 'てんき', romaji: 'tenki', meaning: 'weather' },
  { hiragana: 'てら', romaji: 'tera', meaning: 'temple' },
  { hiragana: 'てつ', romaji: 'tetsu', meaning: 'iron' },

  // と (to)
  { hiragana: 'とり', romaji: 'tori', meaning: 'bird' },
  { hiragana: 'とけい', romaji: 'tokei', meaning: 'clock' },
  { hiragana: 'ともだち', romaji: 'tomodachi', meaning: 'friend' },
  { hiragana: 'とびら', romaji: 'tobira', meaning: 'door' },
  { hiragana: 'とうふ', romaji: 'toufu', meaning: 'tofu' },

  // な (na)
  { hiragana: 'なつ', romaji: 'natsu', meaning: 'summer' },
  { hiragana: 'なみ', romaji: 'nami', meaning: 'wave' },
  { hiragana: 'なす', romaji: 'nasu', meaning: 'eggplant' },
  { hiragana: 'なまえ', romaji: 'namae', meaning: 'name' },
  { hiragana: 'なか', romaji: 'naka', meaning: 'inside' },

  // に (ni)
  { hiragana: 'にく', romaji: 'niku', meaning: 'meat' },
  { hiragana: 'にじ', romaji: 'niji', meaning: 'rainbow' },
  { hiragana: 'にわ', romaji: 'niwa', meaning: 'garden' },
  { hiragana: 'にほん', romaji: 'nihon', meaning: 'Japan' }, // ends in ん

  // ぬ (nu)
  { hiragana: 'ぬの', romaji: 'nuno', meaning: 'cloth' },
  { hiragana: 'ぬま', romaji: 'numa', meaning: 'swamp' },

  // ね (ne)
  { hiragana: 'ねこ', romaji: 'neko', meaning: 'cat' },
  { hiragana: 'ねずみ', romaji: 'nezumi', meaning: 'mouse' },

  // の (no)
  { hiragana: 'のり', romaji: 'nori', meaning: 'seaweed/glue' },
  { hiragana: 'のみもの', romaji: 'nomimono', meaning: 'drink' },

  // は (ha)
  { hiragana: 'はな', romaji: 'hana', meaning: 'flower/nose' },
  { hiragana: 'はし', romaji: 'hashi', meaning: 'bridge/chopsticks' },
  { hiragana: 'はる', romaji: 'haru', meaning: 'spring' },
  { hiragana: 'はれ', romaji: 'hare', meaning: 'sunny' },
  { hiragana: 'はこ', romaji: 'hako', meaning: 'box' },
  { hiragana: 'はち', romaji: 'hachi', meaning: 'bee/eight' },
  { hiragana: 'はと', romaji: 'hato', meaning: 'pigeon' },

  // ひ (hi)
  { hiragana: 'ひと', romaji: 'hito', meaning: 'person' },
  { hiragana: 'ひかり', romaji: 'hikari', meaning: 'light' },
  { hiragana: 'ひる', romaji: 'hiru', meaning: 'noon/daytime' },
  { hiragana: 'ひま', romaji: 'hima', meaning: 'free time' },
  { hiragana: 'ひつじ', romaji: 'hitsuji', meaning: 'sheep' },

  // ふ (fu)
  { hiragana: 'ふゆ', romaji: 'fuyu', meaning: 'winter' },
  { hiragana: 'ふね', romaji: 'fune', meaning: 'ship' },
  { hiragana: 'ふく', romaji: 'fuku', meaning: 'clothes' },
  { hiragana: 'ふじ', romaji: 'fuji', meaning: 'Mt. Fuji/wisteria' },
  { hiragana: 'ふろ', romaji: 'furo', meaning: 'bath' },

  // へ (he)
  { hiragana: 'へや', romaji: 'heya', meaning: 'room' },
  { hiragana: 'へび', romaji: 'hebi', meaning: 'snake' },

  // ほ (ho)
  { hiragana: 'ほし', romaji: 'hoshi', meaning: 'star' },
  { hiragana: 'ほね', romaji: 'hone', meaning: 'bone' },
  { hiragana: 'ほん', romaji: 'hon', meaning: 'book' }, // ends in ん

  // ま (ma)
  { hiragana: 'まど', romaji: 'mado', meaning: 'window' },
  { hiragana: 'まつり', romaji: 'matsuri', meaning: 'festival' },
  { hiragana: 'まち', romaji: 'machi', meaning: 'town' },
  { hiragana: 'まめ', romaji: 'mame', meaning: 'bean' },
  { hiragana: 'まくら', romaji: 'makura', meaning: 'pillow' },

  // み (mi)
  { hiragana: 'みず', romaji: 'mizu', meaning: 'water' },
  { hiragana: 'みち', romaji: 'michi', meaning: 'road' },
  { hiragana: 'みなと', romaji: 'minato', meaning: 'harbor' },
  { hiragana: 'みせ', romaji: 'mise', meaning: 'shop' },
  { hiragana: 'みかん', romaji: 'mikan', meaning: 'orange' }, // ends in ん
  { hiragana: 'みみ', romaji: 'mimi', meaning: 'ear' },
  { hiragana: 'みそ', romaji: 'miso', meaning: 'miso' },

  // む (mu)
  { hiragana: 'むし', romaji: 'mushi', meaning: 'bug' },
  { hiragana: 'むら', romaji: 'mura', meaning: 'village' },
  { hiragana: 'むね', romaji: 'mune', meaning: 'chest' },
  { hiragana: 'むすめ', romaji: 'musume', meaning: 'daughter' },

  // め (me)
  { hiragana: 'めがね', romaji: 'megane', meaning: 'glasses' },
  { hiragana: 'め', romaji: 'me', meaning: 'eye' },

  // も (mo)
  { hiragana: 'もり', romaji: 'mori', meaning: 'forest' },
  { hiragana: 'もも', romaji: 'momo', meaning: 'peach' },
  { hiragana: 'もち', romaji: 'mochi', meaning: 'rice cake' },
  { hiragana: 'もの', romaji: 'mono', meaning: 'thing' },

  // や (ya)
  { hiragana: 'やま', romaji: 'yama', meaning: 'mountain' },
  { hiragana: 'やね', romaji: 'yane', meaning: 'roof' },
  { hiragana: 'やさい', romaji: 'yasai', meaning: 'vegetable' },
  { hiragana: 'やすみ', romaji: 'yasumi', meaning: 'holiday/rest' },

  // ゆ (yu)
  { hiragana: 'ゆき', romaji: 'yuki', meaning: 'snow' },
  { hiragana: 'ゆめ', romaji: 'yume', meaning: 'dream' },
  { hiragana: 'ゆび', romaji: 'yubi', meaning: 'finger' },
  { hiragana: 'ゆか', romaji: 'yuka', meaning: 'floor' },

  // よ (yo)
  { hiragana: 'よる', romaji: 'yoru', meaning: 'night' },
  { hiragana: 'よこ', romaji: 'yoko', meaning: 'side' },
  { hiragana: 'よろい', romaji: 'yoroi', meaning: 'armor' },

  // ら (ra)
  { hiragana: 'らいおん', romaji: 'raion', meaning: 'lion' }, // ends in ん
  { hiragana: 'らーめん', romaji: 'raamen', meaning: 'ramen' }, // ends in ん

  // り (ri)
  { hiragana: 'りんご', romaji: 'ringo', meaning: 'apple' },
  { hiragana: 'りょうり', romaji: 'ryouri', meaning: 'cooking' },
  { hiragana: 'りす', romaji: 'risu', meaning: 'squirrel' },

  // る (ru)
  { hiragana: 'るす', romaji: 'rusu', meaning: 'absence' },

  // れ (re)
  { hiragana: 'れきし', romaji: 'rekishi', meaning: 'history' },
  { hiragana: 'れいぞうこ', romaji: 'reizouko', meaning: 'refrigerator' },

  // ろ (ro)
  { hiragana: 'ろうそく', romaji: 'rousoku', meaning: 'candle' },
  { hiragana: 'ろば', romaji: 'roba', meaning: 'donkey' },

  // わ (wa)
  { hiragana: 'わに', romaji: 'wani', meaning: 'crocodile' },
  { hiragana: 'わた', romaji: 'wata', meaning: 'cotton' },
  { hiragana: 'わし', romaji: 'washi', meaning: 'eagle' },
  { hiragana: 'わらび', romaji: 'warabi', meaning: 'bracken fern' },

  // を (wo) - rarely starts words

  // が (ga)
  { hiragana: 'がっこう', romaji: 'gakkou', meaning: 'school' },
  { hiragana: 'がま', romaji: 'gama', meaning: 'toad' },

  // ぎ (gi)
  { hiragana: 'ぎんこう', romaji: 'ginkou', meaning: 'bank' },

  // ぐ (gu)
  { hiragana: 'ぐも', romaji: 'gumo', meaning: 'cloud (in compound)' },

  // げ (ge)
  { hiragana: 'げた', romaji: 'geta', meaning: 'wooden clogs' },
  { hiragana: 'げんき', romaji: 'genki', meaning: 'energetic/healthy' },

  // ご (go)
  { hiragana: 'ごはん', romaji: 'gohan', meaning: 'rice/meal' }, // ends in ん
  { hiragana: 'ごま', romaji: 'goma', meaning: 'sesame' },
  { hiragana: 'ごみ', romaji: 'gomi', meaning: 'trash' },

  // ざ (za)
  { hiragana: 'ざる', romaji: 'zaru', meaning: 'basket/colander' },

  // じ (ji)
  { hiragana: 'じかん', romaji: 'jikan', meaning: 'time' }, // ends in ん
  { hiragana: 'じしょ', romaji: 'jisho', meaning: 'dictionary' },
  { hiragana: 'じてんしゃ', romaji: 'jitensha', meaning: 'bicycle' },
  { hiragana: 'じんじゃ', romaji: 'jinja', meaning: 'shrine' },

  // ず (zu)
  { hiragana: 'ずぼん', romaji: 'zubon', meaning: 'pants' }, // ends in ん

  // ぜ (ze)
  { hiragana: 'ぜんぶ', romaji: 'zenbu', meaning: 'everything' },

  // ぞ (zo)
  { hiragana: 'ぞう', romaji: 'zou', meaning: 'elephant' },

  // だ (da)
  { hiragana: 'だいこん', romaji: 'daikon', meaning: 'radish' }, // ends in ん
  { hiragana: 'だるま', romaji: 'daruma', meaning: 'daruma doll' },

  // ぢ (di/ji) - rarely starts words

  // づ (dzu) - rarely starts words

  // で (de)
  { hiragana: 'でんわ', romaji: 'denwa', meaning: 'telephone' },
  { hiragana: 'でんしゃ', romaji: 'densha', meaning: 'train' },

  // ど (do)
  { hiragana: 'どうぶつ', romaji: 'doubutsu', meaning: 'animal' },
  { hiragana: 'どあ', romaji: 'doa', meaning: 'door' },

  // ば (ba)
  { hiragana: 'ばす', romaji: 'basu', meaning: 'bus' },
  { hiragana: 'ばなな', romaji: 'banana', meaning: 'banana' },
  { hiragana: 'ばら', romaji: 'bara', meaning: 'rose' },

  // び (bi)
  { hiragana: 'びじゅつ', romaji: 'bijutsu', meaning: 'art' },

  // ぶ (bu)
  { hiragana: 'ぶた', romaji: 'buta', meaning: 'pig' },

  // べ (be)
  { hiragana: 'べんきょう', romaji: 'benkyou', meaning: 'study' },

  // ぼ (bo)
  { hiragana: 'ぼうし', romaji: 'boushi', meaning: 'hat' },
  { hiragana: 'ぼく', romaji: 'boku', meaning: 'I (male)' },

  // ぱ (pa)
  { hiragana: 'ぱん', romaji: 'pan', meaning: 'bread' }, // ends in ん
  { hiragana: 'ぱんだ', romaji: 'panda', meaning: 'panda' },

  // ぴ (pi)
  { hiragana: 'ぴあの', romaji: 'piano', meaning: 'piano' },

  // ぷ (pu)
  { hiragana: 'ぷーる', romaji: 'puuru', meaning: 'pool' },

  // ぺ (pe)
  { hiragana: 'ぺん', romaji: 'pen', meaning: 'pen' }, // ends in ん

  // ぽ (po)
  { hiragana: 'ぽすと', romaji: 'posuto', meaning: 'mailbox' },
];

// Create index by starting hiragana for fast lookup
const wordsByStartKana = {};
japaneseWords.forEach(word => {
  const startKana = word.hiragana[0];
  if (!wordsByStartKana[startKana]) {
    wordsByStartKana[startKana] = [];
  }
  wordsByStartKana[startKana].push(word);
});

// Get the last kana of a word (handles small kana)
export function getLastKana(hiragana) {
  // Small kana (ゃゅょっぁぃぅぇぉ) combine with previous kana
  const smallKana = 'ゃゅょっぁぃぅぇぉ';
  const lastChar = hiragana[hiragana.length - 1];
  
  if (smallKana.includes(lastChar) && hiragana.length > 1) {
    // Return the combo (e.g., 'きょ' from 'とうきょ')
    return hiragana.slice(-2);
  }
  
  // Handle long vowel mark ー
  if (lastChar === 'ー' && hiragana.length > 1) {
    return hiragana[hiragana.length - 2];
  }
  
  return lastChar;
}

// Check if word ends in ん (which means you lose!)
export function endsInN(hiragana) {
  return hiragana[hiragana.length - 1] === 'ん';
}

// Check if word starts with the required kana
export function startsWithKana(word, requiredKana) {
  // Handle small kana combos
  if (requiredKana.length === 2) {
    return word.hiragana.startsWith(requiredKana);
  }
  return word.hiragana[0] === requiredKana;
}

// Find words starting with a specific kana
export function getWordsByStartKana(kana) {
  // For combo kana (きょ, etc.), we need to check properly
  if (kana.length === 2) {
    return japaneseWords.filter(w => w.hiragana.startsWith(kana));
  }
  return wordsByStartKana[kana] || [];
}

// Convert romaji to hiragana (exported for potential future use)
export const romajiMap = {
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を', 'n': 'ん',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  '-': 'ー', 'aa': 'ああ', 'ii': 'いい', 'uu': 'うう', 'ee': 'ええ', 'oo': 'おお',
  'ou': 'おう',
  'si': 'し', 'ti': 'ち', 'tu': 'つ', 'hu': 'ふ',
};

// Look up word by romaji
export function findWordByRomaji(romaji) {
  const lower = romaji.toLowerCase();
  return japaneseWords.find(w => w.romaji === lower);
}

// Look up word by hiragana
export function findWordByHiragana(hiragana) {
  return japaneseWords.find(w => w.hiragana === hiragana);
}

// Check if input matches a valid word (by romaji or hiragana)
export function isValidJapaneseWord(input) {
  const lower = input.toLowerCase();
  return japaneseWords.some(w => w.romaji === lower || w.hiragana === lower);
}

// Get word data by input (romaji or hiragana)
export function getWordData(input) {
  const lower = input.toLowerCase();
  return japaneseWords.find(w => w.romaji === lower || w.hiragana === lower);
}

// Get all words
export function getAllWords() {
  return japaneseWords;
}

// Get safe starting words (don't end in ん)
export function getSafeStartWords() {
  return japaneseWords.filter(w => !endsInN(w.hiragana));
}

export default japaneseWords;

