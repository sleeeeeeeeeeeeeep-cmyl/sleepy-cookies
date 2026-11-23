/*!
 * Sleepy Cookies v2.2.4 - automation add-on for Cookie Clicker
 * Built and tested against Cookie Clicker 2.058 (web).
 *
 * A dependency-free port of every Frozen Cookies feature (erbkaiser fork, erb-2.052.8,
 * Icehawk78 & contributors), with bugs fixed, plus a stock-market auto-trader and a garden
 * auto-planter that Frozen Cookies doesn't have.
 *
 * HOW TO USE: open Cookie Clicker, wait for it to load, press F12 -> Console,
 * paste this whole script, press Enter. Paste again to reload it.
 * Then click the "Sleepy Cookies" button where the game's Info button was (it moves inside the menu).
 * Unload: SleepyCookies.stop()      Settings are saved in this browser (localStorage).
 */
(function () {
  'use strict';

  if (typeof Game === 'undefined' || !Game.ready) {
    console.warn('[Sleepy Cookies] Cookie Clicker is not loaded yet. Wait for the game to finish loading, then paste again.');
    return;
  }
  if (window.SleepyCookies && typeof window.SleepyCookies.stop === 'function') {
    try { window.SleepyCookies.stop(true); } catch (e) { /* old copy already gone */ }
  }

  const VERSION = '2.2.4';
  const TESTED_GAME_VERSION = 2.058;
  const STORE_KEY = 'SleepyCookies.v2';
  const noop = function () {};
  const l = (id) => document.getElementById(id);
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const upgradesList = () => Object.values(Game.UpgradesById);

  // ================================================================== option schema
  // type: 'check' (0/1), 'choice' (index into labels), 'number', 'button'
  const AURAS = ['No aura', 'Breath of Milk', 'Dragon Cursor', 'Elder Battalion', 'Reaper of Fields', 'Earth Shatterer',
    'Master of the Armory', 'Fierce Hoarder', 'Dragon God', 'Arcane Aura', 'Dragonflight', 'Ancestral Metamorphosis',
    'Unholy Dominion', 'Epoch Manipulator', 'Mind Over Matter', 'Radiant Appetite', "Dragon's Fortune", "Dragon's Curve",
    'Reality Bending', 'Dragon Orbs', 'Supreme Intellect', 'Dragon Guts'];
  const FPS_VALUES = [15, 24, 30, 48, 60, 72, 88, 100, 120, 144, 200, 240, 300, 5, 10];
  const SEASON_KEYS = ['', 'fools', 'christmas', 'easter', 'halloween', 'valentines'];

  const OPTIONS = [
    // ---- Auto clicking
    { sec: 'Auto clicking', key: 'autoClick', type: 'check', def: 1, label: 'Auto-click big cookie' },
    { sec: 'Auto clicking', key: 'cookieClickSpeed', type: 'number', def: 40, min: 1, max: 50, label: 'Clicks per second (game caps scripted clicks at 50)' },
    { sec: 'Auto clicking', key: 'autoFrenzy', type: 'check', def: 0, label: 'Faster auto-click during click frenzies' },
    { sec: 'Auto clicking', key: 'frenzyClickSpeed', type: 'number', def: 50, min: 1, max: 50, label: 'Frenzy clicks per second' },
    { sec: 'Auto clicking', key: 'autoGC', type: 'check', def: 1, label: 'Auto-click golden/wrath cookies (skips known backfires)' },
    { sec: 'Auto clicking', key: 'autoReindeer', type: 'check', def: 1, label: 'Auto-click reindeer' },
    { sec: 'Auto clicking', key: 'autoFortune', type: 'check', def: 0, label: 'Auto-click fortunes in the news ticker' },
    // ---- Auto buying
    { sec: 'Auto buying', key: 'autoBuy', type: 'check', def: 1, label: 'Auto-buy most efficient building/upgrade' },
    { sec: 'Auto buying', key: 'otherUpgrades', type: 'check', def: 1, label: "Buy upgrades that don't boost CpS directly" },
    { sec: 'Auto buying', key: 'blacklist', type: 'choice', def: 0, label: 'Blacklist', labels: ['Off', 'Speedrun', 'Hardcore', 'Grandmapocalypse', 'No buildings'] },
    { sec: 'Auto buying', key: 'autoBlacklistOff', type: 'check', def: 0, label: 'Turn blacklist off when its goal is met' },
    { sec: 'Auto buying', key: 'mineLimit', type: 'check', def: 0, label: 'Limit mines (for Godzamok)' },
    { sec: 'Auto buying', key: 'mineMax', type: 'number', def: 500, min: 0, max: 100000, label: 'Max mines' },
    { sec: 'Auto buying', key: 'factoryLimit', type: 'check', def: 0, label: 'Limit factories (for Godzamok)' },
    { sec: 'Auto buying', key: 'factoryMax', type: 'number', def: 500, min: 0, max: 100000, label: 'Max factories' },
    { sec: 'Auto buying', key: 'pastemode', type: 'check', def: 0, label: 'Pastemode: buy least efficient (not recommended)' },
    // ---- Other automation
    { sec: 'Other automation', key: 'autoBulk', type: 'choice', def: 0, label: 'Bulk-buy mode after ascending', labels: ['Off', 'x10', 'x100'] },
    { sec: 'Other automation', key: 'autoBuyAll', type: 'check', def: 0, label: 'Buy all upgrades until a heavenly chip is earned' },
    { sec: 'Other automation', key: 'autoAscendToggle', type: 'check', def: 0, label: 'Auto-ascend (skips the upgrade screen!)' },
    { sec: 'Other automation', key: 'autoAscend', type: 'choice', def: 0, label: 'Auto-ascend when', labels: ['Off', 'Set chip amount reached', 'Prestige doubles'] },
    { sec: 'Other automation', key: 'HCAscendAmount', type: 'number', def: 0, min: 0, max: 1e300, label: 'New heavenly chips to ascend at' },
    { sec: 'Other automation', key: 'comboAscend', type: 'check', def: 0, label: 'Allow ascending during combos (frenzy >= minimum)' },
    { sec: 'Other automation', key: 'minCpSMult', type: 'number', def: 7, min: 0, max: 1e300, label: 'Minimum frenzy multiplier (combos, spells, ascend)' },
    { sec: 'Other automation', key: 'autoWrinkler', type: 'choice', def: 0, label: 'Auto-pop wrinklers', labels: ['Off', 'Efficiently', 'Instantly'] },
    { sec: 'Other automation', key: 'shinyPop', type: 'check', def: 0, label: 'Protect shiny wrinklers (blocks Elder Pledge)' },
    { sec: 'Other automation', key: 'autoSL', type: 'choice', def: 1, label: 'Harvest ripe sugar lumps', labels: ['Off', 'On', 'On + auto Rigidel'] },
    { sec: 'Other automation', key: 'dragonsCurve', type: 'choice', def: 0, label: "Swap in Dragon's Curve for lump harvest", labels: ['Off', 'On', 'On + Reality Bending'] },
    { sec: 'Other automation', key: 'sugarBakingGuard', type: 'check', def: 0, label: "Don't spend lumps below 101 (Sugar baking)" },
    { sec: 'Other automation', key: 'autoGS', type: 'check', def: 0, label: 'Auto Golden Switch during click buffs' },
    { sec: 'Other automation', key: 'autoGodzamok', type: 'check', def: 0, label: 'Auto-sell mines/factories for Godzamok' },
    { sec: 'Other automation', key: 'autoBank', type: 'check', def: 0, label: 'Auto-upgrade bank office' },
    { sec: 'Other automation', key: 'autoBroker', type: 'check', def: 0, label: 'Auto-hire stockbrokers' },
    { sec: 'Other automation', key: 'autoLoan', type: 'choice', def: 0, label: 'Auto-take loans in click frenzies', labels: ['Off', 'Loans 1 and 2', 'All 3 loans'] },
    { sec: 'Other automation', key: 'minLoanMult', type: 'number', def: 777, min: 0, max: 1e300, label: 'Minimum frenzy for loans' },
    // ---- Pantheon
    { sec: 'Pantheon', key: 'autoWorshipToggle', type: 'check', def: 0, label: 'Auto Pantheon (picks the best gods)' },
    // ---- Grimoire
    { sec: 'Grimoire', key: 'towerLimit', type: 'check', def: 0, label: 'Stop buying wizard towers at max mana' },
    { sec: 'Grimoire', key: 'manaMax', type: 'number', def: 37, min: 0, max: 1000, label: 'Max mana' },
    { sec: 'Grimoire', key: 'autoCasting', type: 'check', def: 0, label: 'Smart Grimoire (decides each Hand of Fate cast)' },
    { sec: 'Grimoire', key: 'autoSugarFrenzy', type: 'check', def: 0, label: 'Auto Sugar Frenzy during double-cast combos' },
    { sec: 'Grimoire', key: 'minASFMult', type: 'number', def: 7777, min: 0, max: 1e300, label: 'Minimum frenzy for Sugar Frenzy' },
    // ---- Dragon
    { sec: 'Dragon', key: 'autoDragon', type: 'check', def: 0, label: 'Auto-upgrade dragon' },
    { sec: 'Dragon', key: 'petDragon', type: 'check', def: 0, label: 'Pet dragon until all drops unlocked' },
    { sec: 'Dragon', key: 'autoDragonToggle', type: 'check', def: 0, label: 'Auto-set dragon auras' },
    { sec: 'Dragon', key: 'autoDragonAura0', type: 'choice', def: 0, label: 'First aura', labels: AURAS },
    { sec: 'Dragon', key: 'autoDragonAura1', type: 'choice', def: 0, label: 'Second aura', labels: AURAS },
    { sec: 'Dragon', key: 'autoDragonOrbs', type: 'check', def: 0, label: 'Sell Yous for golden cookies (Dragon Orbs)' },
    { sec: 'Dragon', key: 'orbLimit', type: 'check', def: 0, label: 'Limit Yous' },
    { sec: 'Dragon', key: 'orbMax', type: 'number', def: 200, min: 0, max: 100000, label: 'Max Yous' },
    // ---- Seasons
    { sec: 'Seasons', key: 'defaultSeasonToggle', type: 'check', def: 0, label: 'Auto-buy default season when nothing else is needed' },
    { sec: 'Seasons', key: 'defaultSeason', type: 'choice', def: 0, label: 'Default season', labels: ['None', 'Business Day', 'Christmas', 'Easter', 'Halloween', "Valentine's Day"] },
    { sec: 'Seasons', key: 'freeSeason', type: 'choice', def: 1, label: 'Stay in free base season', labels: ['Off', 'Christmas & Business Day', 'All seasons'] },
    { sec: 'Seasons', key: 'autoEaster', type: 'check', def: 0, label: 'Switch to Easter during cookie storms if eggs missing' },
    { sec: 'Seasons', key: 'autoHalloween', type: 'check', def: 0, label: 'Switch to Halloween if wrinklers and cookies missing' },
    // ---- Bank
    { sec: 'Bank', key: 'holdManBank', type: 'check', def: 0, label: 'Manual minimum bank' },
    { sec: 'Bank', key: 'manBankMins', type: 'number', def: 0, min: 0, max: 1e9, label: 'Minutes of base CpS to keep' },
    { sec: 'Bank', key: 'holdSEBank', type: 'check', def: 0, label: 'Keep bank for Spontaneous Edifice' },
    { sec: 'Bank', key: 'setHarvestBankPlant', type: 'choice', def: 0, label: 'Keep bank for harvesting', labels: ['Off', 'Bakeberry', 'Chocoroot', 'White chocoroot', 'Queenbeet', 'Duketater', 'Crumbspore', 'Doughshroom'] },
    { sec: 'Bank', key: 'setHarvestBankType', type: 'choice', def: 0, label: 'Harvest during', labels: ['No multiplier', 'Frenzy', 'Building special', 'Frenzy + building special'] },
    { sec: 'Bank', key: 'maxSpecials', type: 'number', def: 1, min: 1, max: 20, label: 'Building specials to plan for' },
    // ---- Other
    { sec: 'Other', key: 'FCshortcuts', type: 'check', def: 1, label: 'Keyboard shortcuts (a b c e r s w)' },
    { sec: 'Other', key: 'simulatedGCPercent', type: 'choice', def: 1, label: 'Golden cookies clicked (for efficiency math)', labels: ['0%', '100%'] },
    // ---- Display
    { sec: 'Display', key: 'showMissedCookies', type: 'check', def: 0, label: 'Show missed golden cookies in info' },
    { sec: 'Display', key: 'numberDisplay', type: 'choice', def: 1, label: 'Number format', labels: ['Raw', 'Full names', 'Initials', 'SI units', 'Scientific'] },
    { sec: 'Display', key: 'fancyui', type: 'choice', def: 0, label: 'Infobox (timers)', labels: ['Off', 'Text only', 'Wheel only', 'Wheel & text'] },
    { sec: 'Display', key: 'logging', type: 'check', def: 1, label: 'Log actions to console' },
    { sec: 'Display', key: 'purchaseLog', type: 'check', def: 0, label: 'Log every auto-purchase' },
    { sec: 'Display', key: 'fpsModifier', type: 'choice', def: 2, label: 'Frame rate (fps)', labels: FPS_VALUES.map(String) },
    { sec: 'Display', key: 'trackStats', type: 'choice', def: 0, label: 'Track stats for graphs', labels: ['Off', 'Every 60s', 'Every 30m', 'Every 1h', 'Every 24h', 'On upgrades', 'Smart timing'] },
    { sec: 'Display', key: 'recommendedSettings', type: 'button', label: 'Apply recommended settings' },
    // ---- Sleepy extras (not in Frozen Cookies)
    { sec: 'Stock market trader (extra)', key: 'autoTrade', type: 'check', def: 0, label: 'Auto-trade stocks' },
    { sec: 'Stock market trader (extra)', key: 'tradeBuyPct', type: 'number', def: 60, min: 1, max: 200, label: 'Buy at <= % of resting price' },
    { sec: 'Stock market trader (extra)', key: 'tradeSellPct', type: 'number', def: 150, min: 50, max: 1000, label: 'Sell at >= % of resting price' },
    { sec: 'Stock market trader (extra)', key: 'tradeMinProfit', type: 'number', def: 20, min: 0, max: 1000, label: 'Min profit over buy cost %' },
    { sec: 'Stock market trader (extra)', key: 'tradeSpendPct', type: 'number', def: 50, min: 1, max: 100, label: 'Max % of spare cookies per tick' },
    { sec: 'Stock market trader (extra)', key: 'tradeUseTrend', type: 'check', def: 1, label: 'Use hidden trend (peeks at game data)' },
    { sec: 'Garden planter (extra)', key: 'autoGarden', type: 'check', def: 0, label: 'Auto-plant garden' },
    { sec: 'Garden planter (extra)', key: 'gardenMode', type: 'choice', def: 0, label: 'Mode', labels: ['Unlock new seeds', 'Farm one seed'] },
    { sec: 'Garden planter (extra)', key: 'gardenSeed', type: 'seed', def: 'auto', label: 'Farm seed' },
    { sec: 'Garden planter (extra)', key: 'gardenHarvestMature', type: 'check', def: 1, label: 'Harvest payout plants when mature' },
    { sec: 'Garden planter (extra)', key: 'gardenAutoSoil', type: 'check', def: 1, label: 'Switch soil automatically' }
  ];
  const OPT = {};
  for (const o of OPTIONS) OPT[o.key] = o;

  // Frozen Cookies' "Recommended" preset (fc_main.js recommendedSettingsAction), with the click
  // speeds capped at the game's real 50 clicks/s limit.
  const RECOMMENDED = {
    autoClick: 1, cookieClickSpeed: 50, autoFrenzy: 1, frenzyClickSpeed: 50, autoGC: 1, autoReindeer: 1, autoFortune: 1,
    autoBuy: 1, otherUpgrades: 1, autoBlacklistOff: 0, blacklist: 0, mineLimit: 1, mineMax: 500, factoryLimit: 1, factoryMax: 500, pastemode: 0,
    autoAscendToggle: 0, autoAscend: 2, comboAscend: 0, HCAscendAmount: 0, autoBulk: 2, autoBuyAll: 1, autoWrinkler: 1, shinyPop: 0,
    autoSL: 2, dragonsCurve: 2, sugarBakingGuard: 1, autoGS: 1, autoGodzamok: 1, autoBank: 1, autoBroker: 1, autoLoan: 1, minLoanMult: 777,
    autoWorshipToggle: 1,
    towerLimit: 1, manaMax: 37, autoCasting: 1, minCpSMult: 7, autoSugarFrenzy: 0, minASFMult: 7777,
    autoDragon: 1, petDragon: 1, autoDragonToggle: 1, autoDragonAura0: 3, autoDragonAura1: 15, autoDragonOrbs: 0, orbLimit: 0, orbMax: 200,
    defaultSeasonToggle: 1, defaultSeason: 1, freeSeason: 1, autoEaster: 1, autoHalloween: 1,
    holdManBank: 0, manBankMins: 0, holdSEBank: 0, setHarvestBankPlant: 0, setHarvestBankType: 3, maxSpecials: 1,
    FCshortcuts: 1, simulatedGCPercent: 1, showMissedCookies: 0, numberDisplay: 1, fancyui: 1, logging: 1, purchaseLog: 0, fpsModifier: 2, trackStats: 0
  };

  // ================================================================== settings & persistent data
  function defaults() {
    const d = {};
    for (const o of OPTIONS) if (o.type !== 'button') d[o.key] = o.def;
    return d;
  }
  function loadSettings() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { saved = {}; }
    const s = Object.assign(defaults(), saved.settings || {});
    if (s.autoCasting > 1) s.autoCasting = 1;                     // v2.0 had six cast modes; now one smart mode
    if (s.autoSugarFrenzy > 1) s.autoSugarFrenzy = 1;
    for (const k in s) if (!(k in OPT)) delete s[k];              // drop options that no longer exist
    const data = Object.assign({
      frenzyTimes: {}, lastHCAmount: 0, lastHCTime: Date.now(), prevLastHCTime: Date.now(), maxHCPercent: 0,
      trades: {}, tradeProfit: 0, trackedStats: []
    }, saved.data || {});
    return { s, data };
  }
  const loaded = loadSettings();
  const S = loaded.s;      // user settings
  const D = loaded.data;   // persistent bot data (stats, trades, panel)
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }
  function saveNow() {
    if (D.trackedStats.length > 2000) D.trackedStats = D.trackedStats.slice(-2000);
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ settings: S, data: D })); } catch (e) { /* storage blocked */ }
  }

  // ================================================================== logging & formatting
  function logEvent(event, text, popup) {
    const secs = Math.floor((Date.now() - Game.startDate) / 1000);
    const line = '[' + (secs > 0 ? timeDisplay(secs) : '0s') + '] ' + event + ': ' + text;
    if (S.logging) console.log('[Sleepy Cookies] ' + line);
    if (popup) Game.Popup(text);
  }
  const reported = {};
  function safe(name, fn) {
    return function () {
      try { return fn.apply(this, arguments); } catch (e) {
        if (!reported[name]) { reported[name] = 1; console.error('[Sleepy Cookies] ' + name + ' error (reported once):', e); }
      }
    };
  }

  // The game's own Beautify, kept so we can restore it and use it for "Full names".
  const origBeautify = window.Beautify;
  function rawFormatter(v) { return String(Math.round(v)); }
  function scientific(v) {
    if (v === 0 || !isFinite(v) || (Math.abs(v) >= 1 && Math.abs(v) <= 1000)) return rawFormatter(v);
    return v.toExponential(2).replace('+', '');
  }
  function everyThirdPower(suffixes) {
    return function (v) {
      const base = Math.floor(Math.log10(Math.max(1, Math.abs(v))) / 3);
      if (base <= 0 || base >= suffixes.length) return base >= suffixes.length ? scientific(v) : rawFormatter(v);
      return (Math.round((v / Math.pow(1000, base)) * 1000) / 1000) + suffixes[base];
    };
  }
  const SHORT = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UnD', 'DoD', 'TrD', 'QaD', 'QiD', 'SxD', 'SpD', 'OcD', 'NoD', 'Vg'];
  const SI = ['', ' k', ' M', ' G', ' T', ' P', ' E', ' Z', ' Y', ' R', ' Q'];
  function fcBeautify(value, floats) {
    const mode = S.numberDisplay;
    if (mode === 1 || !isFinite(value)) return origBeautify(value, floats);
    const neg = value < 0;
    let v = Math.abs(value);
    if (v < 1000 && mode !== 0) return origBeautify(value, floats);
    let out;
    if (mode === 0) out = rawFormatter(v);
    else if (mode === 2) out = everyThirdPower(SHORT)(v);
    else if (mode === 3) out = v >= 1e33 ? scientific(v) : everyThirdPower(SI)(v);
    else out = scientific(v);
    if (mode === 0) out = String(out).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + out;
  }
  function timeDisplay(seconds) {
    if (seconds === '---' || seconds === 0) return 'Done!';
    if (seconds === Number.POSITIVE_INFINITY || !isFinite(seconds)) return 'Never!';
    seconds = Math.floor(seconds);
    const y = Math.floor(seconds / 31557600); seconds %= 31557600;
    const d = Math.floor(seconds / 86400); seconds %= 86400;
    const h = Math.floor(seconds / 3600); seconds %= 3600;
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return ((y ? fcBeautify(y) + 'y ' : '') + (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + (s ? s + 's' : '')).trim() || 'Done!';
  }
  function divCps(value, cps) { return value ? (cps ? value / cps : Number.POSITIVE_INFINITY) : 0; }
  const B = (n) => fcBeautify(n);

  // ================================================================== data from Frozen Cookies (cc_upgrade_prerequisites.js)
  const PREREQS = {"0":[[1],[],0,0],"1":[[1],[],0,0],"2":[[10],[],0,0],"3":[[25],[],0,0],"4":[[50],[],0,0],"5":[[100],[],0,0],"6":[[150],[],0,0],"7":[[0,1],[],0,0],"8":[[0,5],[],0,0],"9":[[0,25],[],0,0],"10":[[0,0,1],[],0,0],"11":[[0,0,5],[],0,0],"12":[[0,0,25],[],0,0],"13":[[0,0,0,0,1],[],0,0],"14":[[0,0,0,0,5],[],0,0],"15":[[0,0,0,0,25],[],0,0],"16":[[0,0,0,1],[],0,0],"17":[[0,0,0,5],[],0,0],"18":[[0,0,0,25],[],0,0],"19":[[0,0,0,0,0,0,0,0,1],[],0,0],"20":[[0,0,0,0,0,0,0,0,5],[],0,0],"21":[[0,0,0,0,0,0,0,0,25],[],0,0],"22":[[0,0,0,0,0,0,0,0,0,1],[],0,0],"23":[[0,0,0,0,0,0,0,0,0,5],[],0,0],"24":[[0,0,0,0,0,0,0,0,0,25],[],0,0],"25":[[0,0,0,0,0,0,0,0,0,0,1],[],0,0],"26":[[0,0,0,0,0,0,0,0,0,0,5],[],0,0],"27":[[0,0,0,0,0,0,0,0,0,0,25],[],0,0],"28":[[0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"29":[[0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"30":[[0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"43":[[200],[],0,0],"44":[[0,50],[],0,0],"45":[[0,0,50],[],0,0],"46":[[0,0,0,0,50],[],0,0],"47":[[0,0,0,50],[],0,0],"48":[[0,0,0,0,0,0,0,0,50],[],0,0],"49":[[0,0,0,0,0,0,0,0,0,50],[],0,0],"50":[[0,0,0,0,0,0,0,0,0,0,50],[],0,0],"51":[[0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"57":[[0,1,15],[],0,0],"58":[[0,1,0,15],[],0,0],"59":[[0,1,0,0,15],[],0,0],"60":[[0,1,0,0,0,0,0,0,15],[],0,0],"61":[[0,1,0,0,0,0,0,0,0,15],[],0,0],"62":[[0,1,0,0,0,0,0,0,0,0,15],[],0,0],"63":[[0,1,0,0,0,0,0,0,0,0,0,15],[],0,0],"64":[[0,6],[57,58,59,250,251,252,60],0,0],"65":[[],[64],0,0],"66":[[],[65],0,0],"67":[[],[66],0,0],"68":[[],[67],0,0],"69":[[],[68],0,0],"70":[[],[69],0,0],"71":[[],[70],0,0],"72":[[],[71],0,0],"73":[[],[72],0,0],"74":[[],[73],0,0],"82":[[250],[],0,0],"84":[[],[73],0,0],"85":[[],[73],0,0],"99":[[0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"100":[[0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"101":[[0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"102":[[0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"103":[[0,1,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"109":[[300],[],0,0],"110":[[0,100],[],0,0],"111":[[0,0,100],[],0,0],"112":[[0,0,0,0,100],[],0,0],"113":[[0,0,0,100],[],0,0],"114":[[0,0,0,0,0,0,0,0,100],[],0,0],"115":[[0,0,0,0,0,0,0,0,0,100],[],0,0],"116":[[0,0,0,0,0,0,0,0,0,0,100],[],0,0],"117":[[0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"118":[[0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"130":[[],[129],0,0],"131":[[],[130],0,0],"132":[[],[131],0,0],"133":[[],[132],0,0],"134":[[],[69,183],0,1],"135":[[],[69,183],0,1],"136":[[],[69,183],0,1],"137":[[],[69,183],0,1],"138":[[],[69,183],0,1],"139":[[],[69,183],0,1],"140":[[],[69,183],0,1],"143":[[],[182],0,0],"144":[[],[182],0,0],"145":[[],[182],0,0],"146":[[],[182],0,0],"147":[[],[182],0,0],"148":[[],[182],0,0],"149":[[],[182],0,0],"152":[[],[182],0,0],"153":[[],[152],1,0],"154":[[],[152],1,0],"155":[[],[152],1,0],"156":[[],[152],1,0],"157":[[],[152],1,0],"158":[[],[152],1,0],"159":[[],[152],1,0],"160":[[],[152],1,0],"161":[[],[152],1,0],"162":[[],[152],1,0],"163":[[],[152],1,0],"164":[[],[152],1,0],"165":[[],[152],1,0],"166":[[],[152],1,0],"168":[[],[152],14,0],"169":[[],[184],0,0],"170":[[],[169,184],0,0],"171":[[],[170,184],0,0],"172":[[],[171,184],0,0],"173":[[],[172,184],0,0],"174":[[],[173,184],0,0],"175":[[0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"176":[[0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"177":[[0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"178":[[0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"179":[[0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"180":[[0,1,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"182":[[],[181],0,0],"183":[[],[181],0,0],"184":[[],[181],0,0],"185":[[],[181],0,0],"188":[[350],[],0,0],"189":[[400],[],0,0],"192":[[0,150],[],0,0],"193":[[0,0,150],[],0,0],"194":[[0,0,0,0,150],[],0,0],"195":[[0,0,0,150],[],0,0],"196":[[0,0,0,0,0,0,0,0,150],[],0,0],"197":[[0,0,0,0,0,0,0,0,0,150],[],0,0],"198":[[0,0,0,0,0,0,0,0,0,0,150],[],0,0],"199":[[0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"200":[[0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"201":[[0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"209":[[],[181],0,0],"210":[[],[209],0,0],"211":[[],[209],0,0],"212":[[],[209],0,0],"213":[[],[209],0,0],"214":[[],[209],0,0],"215":[[],[209],0,0],"216":[[],[209],0,0],"217":[[],[209],0,0],"218":[[],[209],0,0],"219":[[],[209],0,0],"220":[[],[209],0,0],"221":[[],[209],0,0],"222":[[],[209],0,0],"223":[[],[209],0,0],"224":[[],[209],0,0],"225":[[],[209],0,0],"226":[[],[209],0,0],"227":[[],[209],0,0],"228":[[],[209],0,0],"229":[[],[209],0,0],"232":[[0,0,0,0,0,1],[],0,0],"233":[[0,0,0,0,0,5],[],0,0],"234":[[0,0,0,0,0,25],[],0,0],"235":[[0,0,0,0,0,50],[],0,0],"236":[[0,0,0,0,0,100],[],0,0],"237":[[0,0,0,0,0,150],[],0,0],"238":[[0,0,0,0,0,0,1],[],0,0],"239":[[0,0,0,0,0,0,5],[],0,0],"240":[[0,0,0,0,0,0,25],[],0,0],"241":[[0,0,0,0,0,0,50],[],0,0],"242":[[0,0,0,0,0,0,100],[],0,0],"243":[[0,0,0,0,0,0,150],[],0,0],"244":[[0,0,0,0,0,0,0,1],[],0,0],"245":[[0,0,0,0,0,0,0,5],[],0,0],"246":[[0,0,0,0,0,0,0,25],[],0,0],"247":[[0,0,0,0,0,0,0,50],[],0,0],"248":[[0,0,0,0,0,0,0,100],[],0,0],"249":[[0,0,0,0,0,0,0,150],[],0,0],"250":[[0,1,0,0,0,15],[],0,0],"251":[[0,1,0,0,0,0,15],[],0,0],"252":[[0,1,0,0,0,0,0,15],[],0,0],"294":[[0,200],[],0,0],"295":[[0,0,200],[],0,0],"296":[[0,0,0,200],[],0,0],"297":[[0,0,0,0,200],[],0,0],"298":[[0,0,0,0,0,200],[],0,0],"299":[[0,0,0,0,0,0,200],[],0,0],"300":[[0,0,0,0,0,0,0,200],[],0,0],"301":[[0,0,0,0,0,0,0,0,200],[],0,0],"302":[[0,0,0,0,0,0,0,0,0,200],[],0,0],"303":[[0,0,0,0,0,0,0,0,0,0,200],[],0,0],"304":[[0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"305":[[0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"306":[[0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"307":[[0,250],[],0,0],"308":[[0,0,250],[],0,0],"309":[[0,0,0,250],[],0,0],"310":[[0,0,0,0,250],[],0,0],"311":[[0,0,0,0,0,250],[],0,0],"312":[[0,0,0,0,0,0,250],[],0,0],"313":[[0,0,0,0,0,0,0,250],[],0,0],"314":[[0,0,0,0,0,0,0,0,250],[],0,0],"315":[[0,0,0,0,0,0,0,0,0,250],[],0,0],"316":[[0,0,0,0,0,0,0,0,0,0,250],[],0,0],"317":[[0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"318":[[0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"319":[[0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"324":[[],[323],0,0],"334":[[100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],[],0,0],"335":[[150,150,150,150,150,150,150,150,150,150,150,150,150,150,150,150,150,150,150,150],[],0,0],"336":[[200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200],[],0,0],"337":[[250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250],[],0,0],"369":[[0,0,15,0,0,0,0,0,0,0,0,15],[393],0,0],"370":[[0,0,75,0,0,0,75],[394],0,0],"371":[[0,0,0,15,0,0,0,15],[393],0,0],"372":[[0,0,0,75,0,0,0,0,75],[394],0,0],"373":[[0,0,0,0,15,0,0,0,0,0,0,0,15],[393],0,0],"374":[[0,0,0,0,75,0,0,0,0,0,0,75],[394],0,0],"375":[[0,0,0,0,0,15,0,0,0,0,15],[393],0,0],"376":[[0,0,0,0,75,75],[394],0,0],"377":[[0,0,0,0,0,0,15,0,0,0,15],[393],0,0],"378":[[0,0,0,0,0,0,75,0,0,0,0,0,75],[394],0,0],"379":[[0,0,0,0,0,0,0,15,0,15],[393],0,0],"380":[[0,0,75,0,0,0,0,75],[394],0,0],"381":[[0,0,0,15,0,0,0,0,15],[393],0,0],"382":[[0,0,0,0,75,0,0,0,75],[394],0,0],"383":[[0,0,0,15,0,0,0,0,0,15],[393],0,0],"384":[[0,0,0,0,0,75,0,0,0,75],[394],0,0],"385":[[0,0,15,0,0,0,0,0,0,0,15],[393],0,0],"386":[[0,0,0,0,0,0,0,0,0,0,75,0,0,75],[394],0,0],"387":[[0,0,0,0,0,0,0,0,15,0,0,15],[393],0,0],"388":[[0,0,0,0,0,0,0,0,0,0,0,75,0,75],[394],0,0],"389":[[0,0,0,0,0,15,0,0,0,0,0,0,15],[393],0,0],"390":[[0,0,0,0,0,0,0,0,0,75,0,0,75],[394],0,0],"391":[[0,0,0,0,0,0,0,15,0,0,0,0,0,15],[393],0,0],"392":[[0,0,0,0,0,0,75,0,0,0,0,0,0,75],[394],0,0],"400":[[300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300],[],0,0],"415":[[0,1,0,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"416":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"417":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"418":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"419":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"420":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"421":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"422":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"423":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"424":[[0,0,0,15,0,0,0,0,0,0,0,0,0,0,15],[393],0,0],"428":[[0,300],[],0,0],"429":[[0,0,300],[],0,0],"430":[[0,0,0,300],[],0,0],"431":[[0,0,0,0,300],[],0,0],"432":[[0,0,0,0,0,300],[],0,0],"433":[[0,0,0,0,0,0,300],[],0,0],"434":[[0,0,0,0,0,0,0,300],[],0,0],"435":[[0,0,0,0,0,0,0,0,300],[],0,0],"436":[[0,0,0,0,0,0,0,0,0,300],[],0,0],"437":[[0,0,0,0,0,0,0,0,0,0,300],[],0,0],"438":[[0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"439":[[0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"440":[[0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"441":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"443":[[0,0,0,0,0,0,0,0,0,0,0,0,75,0,75],[394],0,0],"477":[[350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350],[],0,0],"478":[[400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400],[],0,0],"479":[[450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450],[],0,0],"480":[[0,350],[],0,0],"481":[[0,0,350],[],0,0],"482":[[0,0,0,350],[],0,0],"483":[[0,0,0,0,350],[],0,0],"484":[[0,0,0,0,0,350],[],0,0],"485":[[0,0,0,0,0,0,350],[],0,0],"486":[[0,0,0,0,0,0,0,350],[],0,0],"487":[[0,0,0,0,0,0,0,0,350],[],0,0],"488":[[0,0,0,0,0,0,0,0,0,350],[],0,0],"489":[[0,0,0,0,0,0,0,0,0,0,350],[],0,0],"490":[[0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"491":[[0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"492":[[0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"493":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"497":[[500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500],[],0,0],"506":[[0,400],[],0,0],"507":[[0,0,400],[],0,0],"508":[[0,0,0,400],[],0,0],"509":[[0,0,0,0,400],[],0,0],"510":[[0,0,0,0,0,400],[],0,0],"511":[[0,0,0,0,0,0,400],[],0,0],"512":[[0,0,0,0,0,0,0,400],[],0,0],"513":[[0,0,0,0,0,0,0,0,400],[],0,0],"514":[[0,0,0,0,0,0,0,0,0,400],[],0,0],"515":[[0,0,0,0,0,0,0,0,0,0,400],[],0,0],"516":[[0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"517":[[0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"518":[[0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"519":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"521":[[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"522":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"523":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"524":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"525":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"526":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"527":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"528":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"529":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"530":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"531":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"532":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"533":[[0,0,0,0,0,0,0,0,0,0,0,0,0,15,0,15],[393],0,0],"534":[[75,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75],[394],0,0],"593":[[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"594":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"595":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"596":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"597":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"598":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"599":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"600":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"601":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"602":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"603":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"604":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"605":[[0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[393],0,0],"606":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,0,75],[394],0,0],"621":[[15],[643],0,0],"622":[[0,15],[643],0,0],"623":[[0,0,15],[643],0,0],"624":[[0,0,0,15],[643],0,0],"625":[[0,0,0,0,15],[643],0,0],"626":[[0,0,0,0,0,15],[643],0,0],"627":[[0,0,0,0,0,0,15],[643],0,0],"628":[[0,0,0,0,0,0,0,15],[643],0,0],"629":[[0,0,0,0,0,0,0,0,15],[643],0,0],"630":[[0,0,0,0,0,0,0,0,0,15],[643],0,0],"631":[[0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"632":[[0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"633":[[0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"634":[[0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"635":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"636":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"637":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"645":[[],[174,184],0,0],"648":[[],[323,324,647],0,0],"649":[[],[323,324,647],0,0],"650":[[],[323,324,647],0,0],"651":[[],[323,324,647],0,0],"659":[[550,550,550,550,550,550,550,550,550,550,550,550,550,550,550,550,550,550,550,550],[],0,0],"660":[[450],[],0,0],"662":[[0,450],[],0,0],"663":[[0,0,450],[],0,0],"664":[[0,0,0,450],[],0,0],"665":[[0,0,0,0,450],[],0,0],"666":[[0,0,0,0,0,450],[],0,0],"667":[[0,0,0,0,0,0,450],[],0,0],"668":[[0,0,0,0,0,0,0,450],[],0,0],"669":[[0,0,0,0,0,0,0,0,450],[],0,0],"670":[[0,0,0,0,0,0,0,0,0,450],[],0,0],"671":[[0,0,0,0,0,0,0,0,0,0,450],[],0,0],"672":[[0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"673":[[0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"674":[[0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"675":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"676":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"677":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"683":[[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"684":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"685":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"686":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"687":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"688":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"689":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"690":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"691":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"692":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"693":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"694":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"695":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"696":[[0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,0,0,15],[393],0,0],"697":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,0,75],[394],0,0],"698":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"699":[[600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600],[],0,0],"700":[[0,500],[],0,0],"701":[[0,0,500],[],0,0],"702":[[0,0,0,500],[],0,0],"703":[[0,0,0,0,500],[],0,0],"704":[[0,0,0,0,0,500],[],0,0],"705":[[0,0,0,0,0,0,500],[],0,0],"706":[[0,0,0,0,0,0,0,500],[],0,0],"707":[[0,0,0,0,0,0,0,0,500],[],0,0],"708":[[0,0,0,0,0,0,0,0,0,500],[],0,0],"709":[[0,0,0,0,0,0,0,0,0,0,500],[],0,0],"710":[[0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"711":[[0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"712":[[0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"713":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"714":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"715":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"716":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"729":[[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"730":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"731":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"732":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"733":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"734":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"735":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"736":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"737":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"738":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"739":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"740":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"741":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"742":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"743":[[0,550],[],0,0],"744":[[0,0,550],[],0,0],"745":[[0,0,0,550],[],0,0],"746":[[0,0,0,0,550],[],0,0],"747":[[0,0,0,0,0,550],[],0,0],"748":[[0,0,0,0,0,0,550],[],0,0],"749":[[0,0,0,0,0,0,0,550],[],0,0],"750":[[0,0,0,0,0,0,0,0,550],[],0,0],"751":[[0,0,0,0,0,0,0,0,0,550],[],0,0],"752":[[0,0,0,0,0,0,0,0,0,0,550],[],0,0],"753":[[0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"754":[[0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"755":[[0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"756":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"757":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"758":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"759":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"760":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"761":[[0,0,0,0,0,0,15,0,0,0,0,0,0,0,0,0,0,15],[393],0,0],"762":[[0,0,75,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75],[394],0,0],"763":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"764":[[500],[],0,0],"767":[[650,650,650,650,650,650,650,650,650,650,650,650,650,650,650,650,650,650,650,650],[],0,0],"825":[[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[],0,0],"826":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[],0,0],"827":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],[],0,0],"828":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],[],0,0],"829":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50],[],0,0],"830":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100],[],0,0],"831":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,150],[],0,0],"832":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200],[],0,0],"833":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250],[],0,0],"834":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300],[],0,0],"835":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,350],[],0,0],"836":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,400],[],0,0],"837":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,450],[],0,0],"838":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,500],[],0,0],"839":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,550],[],0,0],"840":[[0,600],[],0,0],"841":[[0,0,600],[],0,0],"842":[[0,0,0,600],[],0,0],"843":[[0,0,0,0,600],[],0,0],"844":[[0,0,0,0,0,600],[],0,0],"845":[[0,0,0,0,0,0,600],[],0,0],"846":[[0,0,0,0,0,0,0,600],[],0,0],"847":[[0,0,0,0,0,0,0,0,600],[],0,0],"848":[[0,0,0,0,0,0,0,0,0,600],[],0,0],"849":[[0,0,0,0,0,0,0,0,0,0,600],[],0,0],"850":[[0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"851":[[0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"852":[[0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"853":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"854":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"855":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"856":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"857":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"858":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,600],[],0,0],"859":[[0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,15],[393],0,0],"860":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,0,75],[394],0,0],"861":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15],[643],0,0],"862":[[700,700,700,700,700,700,700,700,700,700,700,700,700,700,700,700,700,700,700,700],[],0,0],"873":[[550],[],0,0]};
  const GC_ODDS = {"clot":[0,0.10386789477947,0.19565417350258,0.279830557040944],"frenzy":[0.475438636303817,0.330397784579005,0.17665214624519,0],"blood":[0,0.021118483342717,0.042826537084539,0.065166067095688],"chain":[0.004445863757111,0.025152456647178,0.046465712706818,0.068600124409242],"ruin":[0,0.059020277260868,0.111661484235184,0.171880882712373],"frenzyRuin":[0,0.031491314174174,0.033674609798233,0],"clotRuin":[0,0.013356303344429,0.050318079469162,0.107949674328571],"lucky":[0.070071731013916,0.113288563286977,0.146693408687535,0.171634249195106],"frenzyLucky":[0.405366905290347,0.219293086015375,0.083880131161928,0],"clotLucky":[0,0.046715208884435,0.081736878830784,0.107949674328571],"click":[0.022561043069409,0.020309670016808,0.019242724580528,0.019177860550822],"frenzyClick":[0.022115820565423,0.012720131151967,0.005384749977878,0],"clotClick":[0,0.001307530606642,0.005809363719639,0.007810910338684],"blab":[0,0,0,0]};

  // ================================================================== Frozen Cookies efficiency engine (port)
  // Faithful port of FC's purchase model: effective CpS = base CpS x wrinkler multiplier
  // + golden cookie value per second + clicking + reindeer. Purchases are scored by
  // (cost / current effective CpS) + (cost / delta effective CpS), lower is better.
  const BLACKLISTS = [
    { upgrades: [], buildings: [] },                                // off
    { upgrades: [129, 130, 131, 132, 133], buildings: [] },         // speedrun
    { upgrades: true, buildings: [] },                              // hardcore
    { upgrades: [71, 72, 73, 74, 84, 85], buildings: [] },          // grandmapocalypse
    { upgrades: [], buildings: true }                               // no buildings
  ];
  const RECOMMENDATION_BLACKLIST = [227, 331, 332, 333, 361, 414, 452, 563, 564, 806];
  const HOLIDAY = {
    halloween: [134, 135, 136, 137, 138, 139, 140],
    christmas: [143, 144, 145, 146, 147, 148, 149],
    valentines: [169, 170, 171, 172, 173, 174, 645],
    easter: [210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229]
  };
  // toggle-pool upgrades that FC's engine is allowed to recommend
  const TOGGLES_ALLOWED = new Set([74, 84, 85, 182, 183, 184, 185, 209]);

  const W = {
    lastBaseCPS: Game.cookiesPs, recalc: true, lastRecalc: 0,
    caches: { recommendationList: [], nextPurchase: null, nextChained: null },
    lastCPS: Game.cookiesPs, currentBank: { cost: 0, efficiency: 0 }, targetBank: { cost: 0, efficiency: 0 },
    lastCookieCPS: 0, lastUpgradeCount: -1, sim: null, probCache: {}
  };

  function grimoire() { return Game.Objects['Wizard tower'].minigameLoaded ? Game.Objects['Wizard tower'].minigame : null; }
  function pantheon() { return Game.Objects.Temple.minigameLoaded ? Game.Objects.Temple.minigame : null; }
  function market() { return Game.Objects.Bank.minigameLoaded ? Game.Objects.Bank.minigame : null; }
  function garden() { return Game.Objects.Farm.minigameLoaded ? Game.Objects.Farm.minigame : null; }

  function clickBuffBonus() {
    let r = 1;
    for (const k in Game.buffs) {
      const b = Game.buffs[k];
      if (typeof b.multClick !== 'undefined' && b.name !== 'Devastation') r *= b.multClick;
    }
    return r;
  }
  function cpsBonus() {
    let r = 1;
    for (const k in Game.buffs) if (typeof Game.buffs[k].multCpS !== 'undefined') r *= Game.buffs[k].multCpS;
    return r;
  }
  function hasClickBuff() { return !!Game.hasBuff('Cursed finger') || clickBuffBonus() > 1; }
  function baseCps() {
    const m = cpsBonus();
    if (m === 0) return W.lastBaseCPS;
    W.lastBaseCPS = Game.cookiesPs / m;
    return W.lastBaseCPS;
  }
  function clickSpeed() { return S.autoClick ? Math.min(50, S.cookieClickSpeed) : 0; }
  function baseClickingCps(speed) {
    const div = (clickBuffBonus() * cpsBonus()) || 1;
    return speed * (Game.mouseCps() / div);
  }
  function wrinklerMod(num) {
    return 1.1 * num * num * 0.05 * (Game.Has('Wrinklerspawn') ? 1.05 : 1) + (1 - 0.05 * num);
  }
  function popValue(w) {
    let toSuck = 1.1;
    if (Game.Has('Sacrilegious corruption')) toSuck *= 1.05;
    if (w.type === 1) toSuck *= 3;
    let sucked = w.sucked * toSuck;
    if (Game.Has('Wrinklerspawn')) sucked *= 1.05;
    return sucked;
  }
  function wrinklerValue() { return Game.wrinklers.reduce((s, w) => s + popValue(w), 0); }
  function liveWrinklers() {
    return Game.wrinklers.filter((w) => w.sucked > 0.5 && w.phase > 0).sort((a, b) => b.sucked - a.sucked);
  }
  function defaultWrinklers(wrath) { return wrath ? Game.getWrinklersMax() : 0; }

  // ---- golden cookie / reindeer spawn timing (cumulative probability per frame)
  function generateProbabilities(mult, minBase, maxMult) {
    const minTime = minBase * mult, maxTime = maxMult * minTime, span = maxTime - minTime;
    const out = new Float64Array(Math.ceil(maxTime));
    let remaining = 1;
    for (let i = 0; i < out.length; i++) {
      remaining -= remaining * Math.pow(Math.max(0, (i - minTime) / span), 5);
      out[i] = 1 - remaining;
    }
    return out;
  }
  // Spawn window straight from the game's own timer code, so every modifier counts (Heavenly luck,
  // Arcane Aura, Mokalsium/Jeremy, seasons...). FC used a fixed 3-upgrade approximation built once at load.
  function probList(type) {
    const st = Game.shimmerTypes[type];
    const minT = st.getMinTime({ wrath: 0 }), maxT = st.getMaxTime({ wrath: 0 });
    const key = type + minT + '-' + maxT;
    if (!W.probCache[key]) {
      if (Object.keys(W.probCache).length > 40) W.probCache = {};
      W.probCache[key] = generateProbabilities(1, minT, maxT / minT);
    }
    return W.probCache[key];
  }
  function sortedIndex(arr, v) {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (arr[mid] < v) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function probabilitySpan(type, start, endP) {
    const list = probList(type);
    const sp = list[Math.min(Math.max(0, Math.floor(start)), list.length - 1)];
    return sortedIndex(list, sp + endP - sp * endP);
  }
  function gcPs(value) { return (value / (probabilitySpan('golden', 0, 0.5) / Game.fps)) * S.simulatedGCPercent; }

  // ---- expected golden cookie value (FC's model; odds by elder wrath level 0-3)
  function calculateChainValue(bank, cps, digit) {
    const x = Math.min(bank, cps * 60 * 60 * 6 * 4);
    const n = Math.floor(Math.log((9 * x) / (4 * digit)) / Math.LN10);
    return 125 * Math.pow(9, n - 3) * digit;
  }
  function cookieValue(bank, wrath, wrinklerCount) {
    const cps = baseCps();
    const clickCps = baseClickingCps(clickSpeed());
    const frenzyCps = S.autoFrenzy ? baseClickingCps(Math.min(50, S.frenzyClickSpeed)) : clickCps;
    // Buff length multiplier: FC only counted Get lucky; the game also applies Lasting fortune, lucky
    // digits, Green yeast, Epoch Manipulator and Vomitrax, so use the full factor.
    const luckyMod = buffTimeFactor();
    wrath = wrath != null ? wrath : Game.elderWrath;
    wrinklerCount = wrinklerCount != null ? wrinklerCount : defaultWrinklers(wrath);
    const wr = wrinklerMod(wrinklerCount);
    const o = (k) => GC_ODDS[k][wrath];
    let v = 0;
    v -= o('clot') * (wr * cps + clickCps) * luckyMod * 66 * 0.5;
    v += o('frenzy') * (wr * cps + clickCps) * luckyMod * 77 * 6;
    v += o('blood') * (wr * cps + clickCps) * luckyMod * 6 * 665;
    v += o('chain') * calculateChainValue(bank, cps, 7 - wrath / 3);
    v -= o('ruin') * (Math.min(bank * 0.05, cps * 60 * 10) + 13);
    v -= o('frenzyRuin') * (Math.min(bank * 0.05, cps * 60 * 10 * 7) + 13);
    v -= o('clotRuin') * (Math.min(bank * 0.05, cps * 60 * 10 * 0.5) + 13);
    v += o('lucky') * (Math.min(bank * 0.15, cps * 60 * 15) + 13);
    v += o('frenzyLucky') * (Math.min(bank * 0.15, cps * 60 * 15 * 7) + 13);
    v += o('clotLucky') * (Math.min(bank * 0.15, cps * 60 * 15 * 0.5) + 13);
    v += o('click') * frenzyCps * luckyMod * 13 * 777;
    v += o('frenzyClick') * frenzyCps * luckyMod * 13 * 777 * 7;
    v += o('clotClick') * frenzyCps * luckyMod * 13 * 777 * 0.5;
    return v;
  }
  function reindeerValue(wrath) {
    if (Game.season !== 'christmas') return 0;
    wrath = wrath != null ? wrath : Game.elderWrath;
    const f = GC_ODDS.frenzy[wrath], c = GC_ODDS.clot[wrath], b = GC_ODDS.blood[wrath];
    const mod = Game.Has('Ho ho ho-flavored frosting') ? 2 : 1;
    const base = baseCps() * mod * 60;
    return Math.max(25, base * 7) * f + Math.max(25, base * 0.5) * c + Math.max(25, base * 666) * b + Math.max(25, base) * (1 - (f + c + b));
  }
  function reindeerCps(wrath) {
    return (reindeerValue(wrath) / (probabilitySpan('reindeer', 0, 0.5) / Game.fps)) * S.simulatedGCPercent;
  }
  function effectiveCps(delay, wrath, wrinklerCount) {
    wrath = wrath != null ? wrath : Game.elderWrath;
    wrinklerCount = wrinklerCount != null ? wrinklerCount : defaultWrinklers(wrath);
    if (delay == null) delay = delayAmount();
    return baseCps() * wrinklerMod(wrinklerCount) + gcPs(cookieValue(delay, wrath, wrinklerCount)) +
      baseClickingCps(clickSpeed()) + reindeerCps(wrath);
  }

  // ---- building costs, discounts, chocolate egg
  function totalDiscount(building) {
    let p = 1;
    if (building) {
      if (Game.Has('Season savings')) p *= 0.99;
      if (Game.Has("Santa's dominion")) p *= 0.99;
      if (Game.Has('Faberge egg')) p *= 0.99;
      if (Game.Has('Divine discount')) p *= 0.99;
      if (Game.hasAura('Fierce Hoarder')) p *= 0.98;
      if (Game.hasBuff('Everything must go')) p *= 0.95;
    } else {
      if (Game.Has('Toy workshop')) p *= 0.95;
      if (Game.Has('Five-finger discount')) p *= Math.pow(0.99, Game.Objects.Cursor.amount / 100);
      if (Game.Has("Santa's dominion")) p *= 0.98;
      if (Game.Has('Faberge egg')) p *= 0.99;
      if (Game.Has('Divine sales')) p *= 0.99;
      if (Game.hasAura('Master of the Armory')) p *= 0.98;
    }
    return p;
  }
  function cumulativeBuildingCost(basePrice, start, end) {
    return (basePrice * totalDiscount(true) * (Math.pow(Game.priceIncrease, end) - Math.pow(Game.priceIncrease, start))) / (Game.priceIncrease - 1);
  }
  function cumulativeSantaCost(amount) {
    let total = 0;
    if (!amount) return 0;
    if (Game.santaLevel + amount < Game.santaLevels.length) { for (let i = Game.santaLevel + 1; i <= Game.santaLevel + amount; i++) total += Math.pow(i, i); }
    else if (amount < Game.santaLevels.length) { for (let i = Game.santaLevel + 1; i <= amount; i++) total += Math.pow(i, i); }
    else total = Infinity;
    return total;
  }
  function chocolateValue(bank, earthShatter) {
    if (!(Game.HasUnlocked('Chocolate egg') && !Game.Has('Chocolate egg'))) return 0;
    bank = bank != null && bank !== 0 ? bank : Game.cookies;
    let sellRatio = 0.25, highest = 0;
    if (earthShatter == null) { if (Game.hasAura('Earth Shatterer')) sellRatio = 0.5; }
    else if (earthShatter) {
      sellRatio = 0.5;
      if (!Game.hasAura('Earth Shatterer')) for (const k in Game.Objects) if (Game.Objects[k].amount > 0) highest = Game.Objects[k];
    }
    return 0.05 * (wrinklerValue() + bank + Game.ObjectsById.reduce((s, b) =>
      s + cumulativeBuildingCost(b.basePrice, 1, (b === highest ? b.amount : b.amount + 1) - b.free) * sellRatio, 0));
  }

  // ---- banks
  function canCastSE() { const M = grimoire(); return !!(M && M.magicM >= 80 && Game.Objects.You.amount > 0); }
  function manualBank() { return baseCps() * 60 * S.manBankMins; }
  function edificeBank() {
    if (!canCastSE()) return 0;                       // FC tested the function object here, so this never returned 0
    const p = Game.Objects.You.price;
    return Game.hasBuff('Everything must go') ? (p * (100 / 95)) / 2 : p / 2;
  }
  function luckyBank() { return baseCps() * 60 * 100; }
  function luckyFrenzyBank() {
    let bank = baseCps() * 60 * 100 * 7;
    bank += Game.Has('Get lucky') ? 0 : Game.UpgradesById[86].getPrice();
    return bank;
  }
  function chainBank() {
    const digit = 7 - Math.floor(Game.elderWrath / 3);
    return 4 * Math.floor((digit / 9) * Math.pow(10, Math.floor(Math.log((194400 * baseCps()) / digit) / Math.LN10)));
  }
  const HARVEST_PLANTS = [null, ['Bakeberry', 30, 0.03], ['Chocoroot', 3, 0.03], ['White chocoroot', 3, 0.03], ['Queenbeet', 60, 0.04],
    ['Duketater', 120, 0.08], ['Crumbspore', 1, 0.01], ['Doughshroom', 5, 0.03]];
  const harvestInfo = { plant: '', minutes: 0, maxPercent: 0, frenzy: 1, building: 1 };
  function harvestBank() {
    const p = HARVEST_PLANTS[S.setHarvestBankPlant];
    if (!p) return 0;
    const specials = Math.max(1, S.maxSpecials | 0);
    harvestInfo.plant = p[0]; harvestInfo.minutes = p[1]; harvestInfo.maxPercent = p[2];
    harvestInfo.frenzy = S.setHarvestBankType === 1 || S.setHarvestBankType === 3 ? 7 : 1;
    harvestInfo.building = 1;
    if (S.setHarvestBankType === 2 || S.setHarvestBankType === 3) {
      const amounts = Game.ObjectsById.map((b) => b.amount).sort((a, b) => b - a);
      for (let i = 0; i < specials; i++) harvestInfo.building *= amounts[i] || 0;
    }
    return (baseCps() * 60 * harvestInfo.minutes * harvestInfo.frenzy * harvestInfo.building) / Math.pow(10, specials) / harvestInfo.maxPercent;
  }
  function cookieEfficiency(start, bank) {
    let r = Number.MAX_VALUE;
    const cur = cookieValue(start), bankVal = cookieValue(bank);
    if (gcPs(bankVal) > 0) {
      if (bank <= start) r = 0;
      else r = divCps(Math.max(0, bank - start), gcPs(bankVal - cur));
    } else if (bank <= start) r = 0;
    return r;
  }
  function bestBank(minEfficiency) {
    const edifice = S.holdSEBank ? edificeBank() : 0;
    const harvest = S.setHarvestBankPlant ? harvestBank() : 0;
    const manual = S.holdManBank ? manualBank() : 0;
    const override = Math.max(edifice, harvest, manual);
    const levels = [0, luckyBank(), luckyFrenzyBank()].sort((a, b) => b - a)
      .map((c) => ({ cost: c, efficiency: cookieEfficiency(Game.cookies, c) }))
      .filter((b) => b.efficiency >= 0 && b.efficiency <= minEfficiency);
    if (levels.length && levels[0].cost > override) return levels[0];
    return { cost: override, efficiency: 1 };
  }
  function maxLuckyValue() { return baseCps() * (Game.Has('Get lucky') ? 6300 : 900); }
  function delayAmount() { return bestBank(nextChainedPurchase().efficiency).cost; }

  // ---- upgrade prerequisites (purchase chains)
  function prereqOf(u) {
    const p = PREREQS[u.id];
    return p ? { buildings: p[0], upgrades: p[1], santa: p[2], wrinklers: p[3] } : null;
  }
  function haveAll(season) {
    const list = HOLIDAY[season];
    return !list || list.every((id) => Game.UpgradesById[id] && Game.UpgradesById[id].unlocked);
  }
  function upgradePrereqCost(u, full) {
    let cost = u.getPrice();
    if (u.unlocked) return cost;
    const p = prereqOf(u);
    if (p) {
      p.buildings.forEach((amt, i) => {
        const b = Game.ObjectsById[i];
        if (!amt || !b) return;
        if (full) cost += cumulativeBuildingCost(b.basePrice, 0, amt);
        else if (b.amount < amt) cost += cumulativeBuildingCost(b.basePrice, b.amount, amt);
      });
      p.upgrades.forEach((id) => {
        const r = Game.UpgradesById[id];
        if (r && (!r.bought || full)) cost += upgradePrereqCost(r, full);   // FC checked the outer upgrade here
      });
      cost += cumulativeSantaCost(p.santa);
    }
    return cost;
  }
  function unfinishedUpgradePrereqs(u) {
    if (u.unlocked) return null;
    const needed = [];
    const p = prereqOf(u);
    if (p) {
      p.buildings.forEach((amt, i) => { if (amt && Game.ObjectsById[i] && Game.ObjectsById[i].amount < amt) needed.push({ type: 'building', id: i }); });
      p.upgrades.forEach((id) => {
        const r = Game.UpgradesById[id];
        if (!r || r.bought) return;
        const rec = unfinishedUpgradePrereqs(r);
        if (r.unlocked) needed.push({ type: 'upgrade', id });
        else if (rec) rec.forEach((a) => { if (!needed.some((b) => b.id === a.id && b.type === a.type)) needed.push(a); });
      });
      if (p.santa) needed.push({ type: 'santa', id: 0 });
      if (p.wrinklers && !Game.elderWrath) needed.push({ type: 'wrinklers', id: 0 });
    }
    return needed.length ? needed : null;
  }
  function isUnavailable(u, upgradeBlacklist) {
    if (upgradeBlacklist === true) return true;
    if (upgradeBlacklist.includes(u.id) || RECOMMENDATION_BLACKLIST.includes(u.id)) return true;
    if (u.pool === 'prestige' || u.pool === 'prestigeDecor' || u.pool === 'debug' || u.pool === 'unused') return true;
    if (u.pool === 'toggle' && !TOGGLES_ALLOWED.has(u.id)) return true;
    if (u.priceLumps > 0 || u.choicesFunction) return true;
    if (Game.ascensionMode === 1 && (u.lasting || u.tier === 'fortune')) return true;
    if (Game.Has('Inspired checklist') && Game.vault.includes(u.id)) return true;
    if (u.id === 74 && (Game.season === 'halloween' || Game.season === 'easter') && !haveAll(Game.season)) return true;
    if (u.id === 74 && S.shinyPop) return true;
    if (window.App && u.id === 816) return true;
    if (!window.App && u.id === 817) return true;
    // Stay in a free base season. (FC's version of this test could never be true.)
    if (u.season && Game.baseSeason && Game.season === Game.baseSeason && u.season !== Game.baseSeason &&
      (S.freeSeason === 2 || (S.freeSeason === 1 && (Game.baseSeason === 'christmas' || Game.baseSeason === 'fools')))) return true;
    const needed = unfinishedUpgradePrereqs(u);
    if (!u.unlocked && !needed) return true;
    if (needed && needed.some((a) => a.type === 'wrinklers')) return true;
    if (needed && needed.some((a) => a.type === 'santa') && Game.season !== 'christmas' && !Game.UpgradesById[181].unlocked && !Game.prestige) return true;
    if (u.season && (!haveAll(Game.season) || (u.season !== SEASON_KEYS[S.defaultSeason] && haveAll(u.season)))) return true;
    return false;
  }

  // ---- simulation (temporarily change the game, measure, put it back)
  function simWin(what) {
    if (typeof what === 'string') {
      const a = Game.Achievements[what];
      if (a && !a.won) { a.won = 1; if (a.pool !== 'shadow') Game.AchievementsOwned++; W.sim.won.push(a); }
    } else if (what && typeof what === 'object') { for (const k in what) simWin(what[k]); }
  }
  function simBegin() {
    W.sim = { win: Game.Win, highest: Game.cookiesPsRawHighest, won: [] };
    Game.Win = simWin;
  }
  function simUndoAchievements() {
    for (const a of W.sim.won) { a.won = 0; if (a.pool !== 'shadow') Game.AchievementsOwned--; }
    W.sim.won = [];
  }
  function simEnd() {
    if (!W.sim) return;
    simUndoAchievements();
    Game.Win = W.sim.win;
    Game.cookiesPsRawHighest = W.sim.highest;
    W.sim = null;
    Game.recalculateGains = 1;
    Game.CalculateGains();
  }
  function recalcGains() { Game.recalculateGains = 1; Game.CalculateGains(); }
  const WRATH_EFFECT = { 'One mind': 1, 'Communal brainsweep': 2, 'Elder Pact': 3, 'Elder Pledge': 0, 'Elder Covenant': 0, 'Revoke Elder Covenant': -1 };
  // The wrath level the grandmapocalypse climbs back to without a pledge or covenant (game: UpdateGrandmapocalypse).
  function naturalWrath() { return (Game.Has('One mind') ? 1 : 0) + (Game.Has('Communal brainsweep') ? 1 : 0) + (Game.Has('Elder Pact') ? 1 : 0); }
  function applyUpgrade(u, undo) {
    if (!u.unlocked) {
      const p = prereqOf(u);
      if (p) {
        p.buildings.forEach((amt, i) => {
          const b = Game.ObjectsById[i];
          if (amt && b && b.amount < amt) {
            const diff = amt - b.amount;
            b.amount += diff; b.bought += diff; Game.BuildingsOwned += diff;
            undo.push(() => { b.amount -= diff; b.bought -= diff; Game.BuildingsOwned -= diff; });
          }
        });
        p.upgrades.forEach((id) => { const r = Game.UpgradesById[id]; if (r && !r.bought) applyUpgrade(r, undo); });
      }
    }
    if (u.bought) return;
    u.bought = 1;
    const counts = Game.CountsAsUpgradeOwned(u.pool);
    if (counts) Game.UpgradesOwned++;
    undo.push(() => { u.bought = 0; if (counts) Game.UpgradesOwned--; });
    if (u.name === 'Revoke Elder Covenant') {      // revoking removes the covenant's -5% (FC simulated it as a no-op)
      const cov = Game.Upgrades['Elder Covenant'];
      if (cov.bought) { cov.bought = 0; undo.push(() => { cov.bought = 1; }); }
    }
    if (hasOwn(WRATH_EFFECT, u.name)) {
      const old = Game.elderWrath; Game.elderWrath = WRATH_EFFECT[u.name] < 0 ? naturalWrath() : WRATH_EFFECT[u.name];
      undo.push(() => { Game.elderWrath = old; });
    }
    if (u.season) { const old = Game.season; Game.season = u.season; undo.push(() => { Game.season = old; }); }
  }
  function runUndo(undo) { for (let i = undo.length - 1; i >= 0; i--) undo[i](); }

  function purchaseEfficiency(price, deltaCps, currentCps) {
    return deltaCps > 0 ? divCps(price, currentCps) + divCps(price, deltaCps) : Number.POSITIVE_INFINITY;
  }
  function checkPrices(current) {
    const list = W.caches.recommendationList;
    if (!list.length) return 0;
    let next = list.filter((i) => !(i.id === current.id && i.type === 'upgrade'))[0];
    if (!next) return 0;
    const pre = next.type === 'upgrade' ? unfinishedUpgradePrereqs(next.purchase) : null;
    if (pre) next = list.filter((a) => pre.some((b) => b.id === a.id && b.type === a.type))[0] || next;
    return next.cost == null || !isFinite(next.cost) ? 0 : next.cost / totalDiscount(next.type === 'building') - next.cost;
  }

  function buildingStats() {
    const bl = BLACKLISTS[S.blacklist] || BLACKLISTS[0];
    if (bl.buildings === true) return [];
    const blocked = new Set(bl.buildings);
    const M = grimoire();
    if (M && S.towerLimit && M.magicM >= S.manaMax) blocked.add(7);
    if (S.mineLimit && Game.Objects.Mine.amount >= S.mineMax) blocked.add(3);
    if (S.factoryLimit && Game.Objects.Factory.amount >= S.factoryMax) blocked.add(4);
    if (S.autoDragonOrbs && S.orbLimit && Game.Objects.You.amount >= S.orbMax) blocked.add(19);
    const currentBank = bestBank(0).cost;
    const baseOrig = baseCps();
    const cpsOrig = effectiveCps(Math.min(Game.cookies, currentBank));
    const cpsSame = effectiveCps(currentBank);       // same bank as the simulation, so the delta is only the purchase
    const out = [];
    for (const b of Game.ObjectsById) {
      if (blocked.has(b.id)) continue;
      b.amount += 1; b.bought += 1; Game.BuildingsOwned += 1;
      let baseNew, cpsNew;
      try { recalcGains(); baseNew = baseCps(); cpsNew = effectiveCps(currentBank); }
      finally { b.amount -= 1; b.bought -= 1; Game.BuildingsOwned -= 1; simUndoAchievements(); recalcGains(); simUndoAchievements(); }
      const delta = cpsNew - cpsSame;
      out.push({ id: b.id, type: 'building', purchase: b, name: b.name, cost: b.getPrice(),
        delta_cps: delta, base_delta_cps: baseNew - baseOrig, efficiency: purchaseEfficiency(b.getPrice(), delta, cpsOrig) });
    }
    return out;
  }
  // Discount upgrades can get efficiency 1 through FC's price-reduction rule, so they are never pruned.
  const NO_PRUNE = new Set(['Toy workshop', 'Five-finger discount', "Santa's dominion", 'Faberge egg', 'Divine sales', 'Season savings', 'Divine discount']);
  function upgradeStats(bestSoFar) {
    const bl = BLACKLISTS[S.blacklist] || BLACKLISTS[0];
    if (bl.upgrades === true) return [];
    const currentBank = bestBank(0).cost;
    const baseOrig = baseCps();
    const cpsOrig = effectiveCps(Math.min(Game.cookies, currentBank));
    const cpsSame = effectiveCps(currentBank);
    const discounts = totalDiscount() + totalDiscount(true);
    const cands = [];
    for (const u of upgradesList()) {
      if (u.bought || isUnavailable(u, bl.upgrades)) continue;
      const cost = upgradePrereqCost(u);
      cands.push({ u, cost, lb: u.unlocked || u.season || NO_PRUNE.has(u.name) ? -1 : divCps(cost, cpsOrig) });
    }
    cands.sort((a, b) => a.lb - b.lb);
    let best = bestSoFar;
    const out = [];
    for (const { u, cost, lb } of cands) {
      // Exact pruning: efficiency = cost/cps + cost/delta >= cost/cps, so a chain whose lower bound
      // already loses to the best option can never be picked. (Pastemode wants the worst, so no pruning.)
      if (!S.pastemode && lb > best) {
        out.push({ id: u.id, type: 'upgrade', purchase: u, name: u.dname || u.name, cost, delta_cps: 0, base_delta_cps: 0, efficiency: lb, pruned: true });
        continue;
      }
      const undo = [];
      let baseNew, cpsNew, priceReduction = 0;
      try {
        applyUpgrade(u, undo);
        recalcGains();
        baseNew = baseCps();
        cpsNew = effectiveCps(currentBank);
        if (discounts !== totalDiscount() + totalDiscount(true)) priceReduction = checkPrices(u);
      } finally { runUndo(undo); simUndoAchievements(); recalcGains(); simUndoAchievements(); }
      // FC subtracted CpS measured with the bank it actually had, so while saving up, every candidate
      // (even a no-op like Revoke Elder Covenant) looked like a gain. Measure both sides with the same bank.
      const delta = cpsNew - cpsSame;
      let eff;
      if (u.season && S.defaultSeasonToggle && u.season === SEASON_KEYS[S.defaultSeason]) eff = cost / baseOrig;
      else if (priceReduction > cost) eff = 1;
      else eff = purchaseEfficiency(cost, delta, cpsOrig);
      if (eff < best) best = eff;
      out.push({ id: u.id, type: 'upgrade', purchase: u, name: u.dname || u.name, cost, delta_cps: delta, base_delta_cps: baseNew - baseOrig, efficiency: eff });
    }
    return out;
  }
  function santaStats() {
    if (!(Game.Has('A festive hat') && Game.santaLevel + 1 < Game.santaLevels.length)) return [];
    const name = 'Santa upgrade (' + Game.santaLevels[(Game.santaLevel + 1) % Game.santaLevels.length] + ')';
    return [{ id: 0, type: 'santa', name, cost: cumulativeSantaCost(1), delta_cps: 0, base_delta_cps: 0, efficiency: Infinity,
      purchase: { id: 0, name, unlocked: 1, buy: buySanta, getPrice: () => cumulativeSantaCost(1) } }];
  }
  function buySanta() { withSpecialTab('santa', () => Game.UpgradeSanta()); }
  function defaultPurchase() {
    return { id: 0, type: 'other', name: 'No valid purchases!', cost: Infinity, delta_cps: 0, base_delta_cps: 0, efficiency: Infinity,
      purchase: { id: 0, name: 'No valid purchases!', buy: noop, getPrice: () => Infinity } };
  }
  function addScores(recs) {
    const finite = recs.filter((a) => isFinite(a.efficiency));
    if (finite.length > 0) {
      const minV = Math.log(recs[0].efficiency), maxV = Math.log(recs[finite.length - 1].efficiency), spread = maxV - minV;
      recs.forEach((r) => { r.efficiencyScore = isFinite(r.efficiency) ? (spread ? 1 - (Math.log(r.efficiency) - minV) / spread : 1) : 0; });
    } else recs.forEach((r) => { r.efficiencyScore = 0; });
    return recs;
  }
  function recomputeRecommendations() {
    simBegin();
    let list;
    try {
      const blds = buildingStats();
      const best = blds.reduce((m, b) => Math.min(m, b.efficiency), Infinity);
      list = upgradeStats(best).concat(blds).concat(santaStats());
    } finally { simEnd(); }
    list.sort((a, b) => (a.efficiency !== b.efficiency ? a.efficiency - b.efficiency : a.delta_cps !== b.delta_cps ? b.delta_cps - a.delta_cps : a.cost - b.cost));
    W.caches.recommendationList = addScores(list);
    if (S.pastemode) W.caches.recommendationList.reverse();
    // next purchase + chain target
    let purchase = null, target = null;
    for (const t of W.caches.recommendationList) {
      target = t;
      const pre = t.type === 'upgrade' ? unfinishedUpgradePrereqs(t.purchase) : null;
      purchase = pre ? W.caches.recommendationList.filter((a) => pre.some((b) => b.id === a.id && b.type === a.type))[0] : t;
      if (purchase) break;
    }
    W.caches.nextPurchase = purchase || defaultPurchase();
    W.caches.nextChained = purchase ? target : defaultPurchase();
    W.lastRecalc = Date.now();
  }
  function recommendationList() { if (!W.caches.nextPurchase) recomputeRecommendations(); return W.caches.recommendationList; }
  function nextPurchase() { if (!W.caches.nextPurchase) recomputeRecommendations(); return W.caches.nextPurchase; }
  function nextChainedPurchase() { if (!W.caches.nextChained) recomputeRecommendations(); return W.caches.nextChained; }
  function invalidate() { W.recalc = true; }

  // FC re-ran the whole engine whenever CpS moved 0.01%, which lagged badly with Cyclius or
  // long buffs. Here the same triggers apply, but at most once a second unless something was bought.
  function updateCaches(force) {
    const now = Date.now();
    if (!force && !W.recalc && now - W.lastRecalc < 1000) return;
    const eps = 0.0001;
    let n = 0;
    do {
      if (W.recalc || !W.caches.nextPurchase || n === 0) recomputeRecommendations();
      W.recalc = false;
      const rec = nextPurchase();
      const cur = bestBank(0), tgt = bestBank(rec.efficiency);
      const cookieCps = gcPs(cookieValue(cur.cost));
      const upgCount = Game.UpgradesInStore.length, cps = Game.cookiesPs;
      if (Math.abs(W.lastCPS - cps) > W.lastCPS * eps) { W.recalc = true; W.lastCPS = cps; }
      if (Math.abs(W.currentBank.cost - cur.cost) > W.currentBank.cost * eps) { W.recalc = true; W.currentBank = cur; }
      if (Math.abs(W.targetBank.cost - tgt.cost) > W.targetBank.cost * eps) { W.recalc = true; W.targetBank = tgt; }
      if (Math.abs(W.lastCookieCPS - cookieCps) > W.lastCookieCPS * eps) { W.recalc = true; W.lastCookieCPS = cookieCps; }
      if (W.lastUpgradeCount !== upgCount) { W.recalc = true; W.lastUpgradeCount = upgCount; }
      n++;
    } while (W.recalc && n < 3);
    W.recalc = false;
  }

  // ================================================================== automation runtime state
  const R = {
    clickTimer: 0, clickRateNow: 0, lastGcState: cpsBonus() * clickBuffBonus(), lastGcTime: Date.now(),
    hcGain: 0, hcGainTime: Date.now(), delayPurchaseCount: 0, smartDelay: 80000, nextSmart: Date.now() + 10000,
    lastStat: Date.now(), ascendPending: false, origFps: Game.fps
  };

  function safeBuy(b, count) {
    if (count <= 0) return 0;
    const mode = Game.buyMode, before = b.amount;
    Game.buyMode = 1;                                   // never sell by accident if the store is in Sell mode
    try { b.buy(count); } finally { Game.buyMode = mode; }
    return b.amount - before;
  }

  // ---- clicking
  function clickOnce() {
    if (Game.OnAscend || Game.AscendTimer || Game.specialTabHovered) return;
    const orig = Game.playCookieClickSound;            // 50 click sounds a second is unbearable
    Game.playCookieClickSound = noop;
    try { Game.ClickCookie(); } finally { Game.playCookieClickSound = orig; }
  }
  const clickTick = safe('autoClick', clickOnce);
  function updateClickRate() {
    let rate = 0;
    if (S.autoFrenzy && hasClickBuff()) rate = Math.min(50, S.frenzyClickSpeed);
    else if (S.autoClick) rate = Math.min(50, S.cookieClickSpeed);
    if (rate === R.clickRateNow) return;
    if (R.clickTimer) clearInterval(R.clickTimer);
    R.clickTimer = rate > 0 ? setInterval(clickTick, Math.max(20, 1000 / rate)) : 0;
    R.clickRateNow = rate;
  }

  // ---- wrinklers (FC "efficient" mode pops only when it gets the next purchase sooner)
  function shouldPopWrinklers() {
    const living = liveWrinklers();
    if (!living.length) return [];
    if ((Game.season === 'halloween' || Game.season === 'easter') && !haveAll(Game.season)) return living.map((w) => w.id);
    const delay = delayAmount();
    const rec = nextPurchase();
    const needed = rec.cost + delay - Game.cookies;
    const recCps = rec.delta_cps;
    const max = Game.getWrinklersMax();
    const baseEff = effectiveCps();
    const acc = { total: 0, ids: [] };
    for (const w of Game.wrinklers.slice().sort((a, b) => b.sucked - a.sucked)) {
      if (!(w.sucked > 0.5 && w.phase > 0)) continue;
      const future = living.length - (acc.ids.length + 1);
      if ((acc.total < needed && effectiveCps(delay, Game.elderWrath, future) + recCps > baseEff) || (acc.ids.length === 0 && living.length === max)) {
        acc.ids.push(w.id); acc.total += popValue(w);
      }
    }
    return acc.total > needed ? acc.ids : [];
  }
  function wrinklerAction() {
    if (!S.autoWrinkler) return;
    let ids;
    if (S.autoWrinkler === 1) ids = new Set(shouldPopWrinklers());
    let n = 0;
    for (const w of Game.wrinklers) {
      const pick = S.autoWrinkler === 1 ? ids.has(w.id) : (w.close == 1 && w.phase > 0);
      if (!pick || w.hp <= 0) continue;
      if (S.shinyPop && w.type === 1) continue;
      w.hp = 0; n++;
    }
    if (n) logEvent('Wrinkler', 'Popped ' + n + ' wrinklers.');
  }

  // ---- dragon aura helper (same effect as the game's confirm button, without the prompt)
  function setDragonAura(aura, slot) {
    if (Game.dragonLevel < aura + 4) return false;
    if (slot === 1 && Game.dragonLevel < Game.dragonLevels.length - 1) return false;
    const current = slot === 0 ? Game.dragonAura : Game.dragonAura2;
    const other = slot === 0 ? Game.dragonAura2 : Game.dragonAura;
    if (current === aura) return true;
    if (aura !== 0 && aura === other) return false;
    let highest = 0;
    for (const k in Game.Objects) if (Game.Objects[k].amount > 0) highest = Game.Objects[k];
    if (slot === 0) Game.dragonAura = aura; else Game.dragonAura2 = aura;
    if (highest) highest.sacrifice(1);                // switching costs one of your highest building
    Game.recalculateGains = 1;
    invalidate();
    return true;
  }

  // ---- sugar lumps
  function lumpRipe() { return Date.now() - Game.lumpT >= Math.ceil(Game.lumpRipeAge); }
  function harvestLump() {
    if (Game.dragonLevel >= 21 && S.dragonsCurve) autoDragonsCurve();
    else Game.clickLump();
  }
  function autoDragonsCurve() {
    if (Game.dragonLevel < 21 || S.dragonsCurve < 1) { Game.clickLump(); return; }
    if (!Game.hasAura("Dragon's Curve")) {
      const slot = Game.dragonLevel > 26 && Game.dragonAura === 18 ? 1 : 0;
      if (setDragonAura(17, slot)) logEvent('autoDragonsCurve', 'Dragon auras swapped to manipulate new Sugar Lump');
    }
    if (S.dragonsCurve === 2 && Game.dragonLevel > 26 && !Game.hasAura('Reality Bending')) {
      setDragonAura(18, Game.dragonAura === 17 ? 1 : 0);
    }
    Game.clickLump();
  }
  function rigiSell() {
    if (Game.BuildingsOwned % 10) {
      let cheapest = null;
      for (const b of Game.ObjectsById) if (b.amount > 0 && (!cheapest || b.price < cheapest.price)) cheapest = b;
      if (cheapest) cheapest.sell(Game.BuildingsOwned % 10);
    }
  }
  function autoRigidel() {
    const T = pantheon();
    if (!T) { if (lumpRipe()) harvestLump(); return; }
    const timeToRipe = (Math.ceil(Game.lumpRipeAge) - (Date.now() - Game.lumpT)) / 60000;
    const lvl = Game.hasGod('order') || 0;
    let prevGod = -1, tryHarvest = false;
    if (lvl === 0) {
      if (T.swaps >= (T.slot[0] === -1 ? 1 : 2) && timeToRipe < 60) { prevGod = T.slot[0]; swapIn(T.gods.order.id, 0); tryHarvest = true; }
    } else if (lvl === 1) tryHarvest = timeToRipe < 55;
    else if (lvl === 2) tryHarvest = timeToRipe < 35;
    else if (lvl === 3) tryHarvest = timeToRipe < 15;
    if (tryHarvest) {
      rigiSell();
      Game.computeLumpTimes();
      if (lumpRipe()) { harvestLump(); logEvent('autoRigidel', 'Sugar lump harvested early'); }
    } else if (lumpRipe()) harvestLump();               // FC skipped ripe lumps when Rigidel couldn't be slotted
    if (prevGod !== -1) swapIn(prevGod, 0);
  }
  function lumpAction() {
    if (!Game.canLumps()) return;
    if (S.autoSL === 1 && lumpRipe()) harvestLump();
    if (S.autoSL === 2) autoRigidel();
  }
  function canSpendLump() { return S.sugarBakingGuard ? Game.lumps > 100 : Game.lumps > 0; }

  // ---- golden switch, Godzamok, bank office, brokers, loans
  // The switch costs an hour of CpS each time it's turned on, so only flip it when the boost over the rest of
  // the click buff is worth more than that (FC flipped it on every click buff, even with nothing clicking).
  function autoGSAction() {
    if (!S.autoGS) return;
    const off = Game.Upgrades['Golden switch [off]'], on = Game.Upgrades['Golden switch [on]'];
    if (hasClickBuff() && !Game.hasBuff('Cursed finger')) {
      if (!off.unlocked || off.bought) return;
      let mult = 1.5;
      if (Game.Has('Residual luck')) for (const n of Game.goldenCookieUpgrades) if (Game.Has(n)) mult += 0.1;
      const gain = (mult - 1) * (Game.cookiesPs + Game.computedMouseCps * (R.clickRateNow || 0)) * clickBuffSecs();
      if (gain > off.getPrice() && Game.cookies >= off.getPrice()) { off.buy(1); R.gsByBot = 1; }
    } else if (!hasClickBuff()) {
      if (on.unlocked && !on.bought && R.gsByBot) { Game.recalculateGains = 1; on.buy(1); R.gsByBot = 0; }
    }
  }
  // Seconds left on the shortest click buff (Devastation itself doesn't count).
  function clickBuffSecs() {
    let t = Infinity;
    for (const k in Game.buffs) {
      const b = Game.buffs[k];
      if (b.name !== 'Devastation' && typeof b.multClick !== 'undefined' && b.multClick > 1) t = Math.min(t, b.time / Game.fps);
    }
    return isFinite(t) ? t : 0;
  }
  // Selling and rebuying costs 75% of what the buildings are worth, so Godzamok only fires when the extra clicking
  // during Devastation pays for it. FC fired on every click buff (twice in one Click Frenzy, the second time for its
  // last 3 seconds) and refilled mines/factories up to the limit instead of to what you had.
  function autoGodzamokAction() {
    if (!S.autoGodzamok || !pantheon() || !Game.hasGod('ruin')) return;
    if (Game.hasBuff('Devastation') || Game.hasBuff('Cursed finger') || !hasClickBuff()) return;
    const mine = Game.Objects.Mine, fac = Game.Objects.Factory;
    const nMine = mine.amount, nFac = fac.amount;
    if (nMine + nFac === 0) return;
    const rate = R.clickRateNow || 0, secs = Math.min(10, clickBuffSecs());
    if (!rate || secs < 5) return;
    const per = [0, 0.01, 0.005, 0.0025][Game.hasGod('ruin')] || 0;
    const refund = mine.getReverseSumPrice(nMine) + fac.getReverseSumPrice(nFac);
    const sellMult = mine.getSellMultiplier();
    const loss = sellMult > 0 ? refund * (1 / sellMult - 1) : Infinity;
    const gain = (nMine + nFac) * per * Game.computedMouseCps * rate * secs;
    if (gain < loss * 1.25) {
      if (!R.godzamokSkipNote || Date.now() - R.godzamokSkipNote > 600000) {
        R.godzamokSkipNote = Date.now();
        logEvent('AutoGodzamok', 'Skipped: selling would cost ' + B(loss) + ' but only gain about ' + B(gain));
      }
      return;
    }
    mine.sell(nMine); fac.sell(nFac);
    const bm = safeBuy(mine, Math.min(nMine, S.mineLimit ? S.mineMax : nMine));
    const bf = safeBuy(fac, Math.min(nFac, S.factoryLimit ? S.factoryMax : nFac));
    logEvent('AutoGodzamok', 'Sold and rebought ' + bm + ' mines and ' + bf + ' factories (worth about ' + B(gain) + ' extra clicking)');
    invalidate();
  }
  function autoBankAction() {
    const Bk = market();
    if (!S.autoBank || !Bk || hasClickBuff()) return;
    const office = Bk.offices[Bk.officeLevel];
    if (office && office.cost && Game.Objects.Cursor.amount >= office.cost[0] && Game.Objects.Cursor.level >= office.cost[1]) {
      const n = office.cost[0];
      const btn = l('bankOfficeUpgrade');
      if (!btn) return;
      btn.click();
      safeBuy(Game.Objects.Cursor, n);
      logEvent('AutoBank', 'Upgraded bank office for ' + n + ' cursors');
      invalidate();
    }
  }
  function autoBrokerAction() {
    const Bk = market();
    if (!S.autoBroker || !Bk) return;
    const rec = nextPurchase();
    if (rec.type === 'building' && Bk.brokers < Bk.getMaxBrokers() && Game.cookies >= delayAmount() + Bk.getBrokerPrice()) {
      const price = Bk.getBrokerPrice();
      const btn = l('bankBrokersBuy');
      if (btn) btn.click(); else { Game.Spend(price); Bk.brokers++; }
      logEvent('AutoBroker', 'Hired a broker for ' + B(price) + ' cookies');
      invalidate();
    }
  }
  function autoLoanAction() {
    const Bk = market();
    if (!S.autoLoan || !Bk || Bk.officeLevel < 2) return;
    if (hasClickBuff() && !Game.hasBuff('Cursed finger') && cpsBonus() >= S.minLoanMult) {
      if (Bk.officeLevel >= 2 && Bk.takeLoan(1)) logEvent('AutoLoan', 'Took loan 1');
      if (Bk.officeLevel >= 4 && Bk.takeLoan(2)) logEvent('AutoLoan', 'Took loan 2');
      if (Bk.officeLevel >= 5 && S.autoLoan === 2 && Bk.takeLoan(3)) logEvent('AutoLoan', 'Took loan 3');
    }
  }

  // ---- upgrades the efficiency math can't value
  const OTHER_UPGRADES = ['Faberge egg', 'Wrinklerspawn', 'Omelette', '"egg"', 'Weighted sleighs', "Santa's bottomless bag", 'Dragon fang',
    'Dragon teddy bear', 'Sacrificial rolling pins', 'Green yeast digestives', 'Fern tea', 'Ichor syrup', 'Fortune #102'];
  function buyOtherUpgrades() {
    if (!S.otherUpgrades || (BLACKLISTS[S.blacklist] || {}).upgrades === true) return;
    for (const name of OTHER_UPGRADES) {
      const u = Game.Upgrades[name];
      if (!u) continue;
      if ((name === 'Weighted sleighs' || name === "Santa's bottomless bag") && Game.season !== 'christmas') continue;
      if ((name === 'Dragon fang' || name === 'Dragon teddy bear') && Game.dragonLevel <= 26) continue;
      if (name === 'Sacrificial rolling pins' && !Game.Upgrades['Elder Pact'].bought) continue;
      if (u.unlocked && !u.bought && Game.cookies > u.getPrice()) { u.buy(1); logEvent('OtherUpgrades', 'Bought ' + name); invalidate(); }
    }
  }

  // ---- seasons
  function autoEasterAction() {
    if (!S.autoEaster || Game.season === 'easter' || haveAll('easter')) return;
    if (Game.hasBuff('Cookie storm') && Game.UpgradesById[181].unlocked) {
      if (Game.UpgradesById[209].buy(1)) logEvent('autoEaster', 'Swapped to Easter for the cookie storm');
    }
  }
  function autoHalloweenAction() {
    if (!S.autoHalloween || ['valentines', 'easter', 'halloween'].includes(Game.season) || haveAll('halloween')) return;
    if (liveWrinklers().length > 0 && Game.UpgradesById[181].unlocked) {
      if (Game.UpgradesById[183].buy(1)) logEvent('autoHalloween', 'Swapping to Halloween season to use wrinklers');
    }
  }
  function autoBlacklistOffAction() {
    if (!S.autoBlacklistOff) return;
    const before = S.blacklist;
    if (S.blacklist === 1 && Game.cookiesEarned >= 1e6) S.blacklist = 0;
    else if (S.blacklist === 2 && Game.cookiesEarned >= 1e9) S.blacklist = 0;
    else if (S.blacklist === 3 && haveAll('halloween') && haveAll('easter')) S.blacklist = 0;
    if (before !== S.blacklist) { logEvent('Blacklist', 'Goal reached, blacklist turned off'); save(); invalidate(); refreshPanel(); }
  }

  // ---- reward cookies: buy every building up to the reward threshold, then go back to the limits
  function isRewardCookie(u) {
    const p = u ? PREREQS[u.id] : null;
    if (!p) return false;
    const b = p[0];
    return b.length >= 10 && b.every((v) => v > 0 && v === b[0]);
  }
  function restoreBuildingLimits() {
    const lim = [];
    if (S.towerLimit) lim.push([Game.Objects['Wizard tower'], S.manaMax]);
    if (S.mineLimit) lim.push([Game.Objects.Mine, S.mineMax]);
    if (S.factoryLimit) lim.push([Game.Objects.Factory, S.factoryMax]);
    if (S.autoDragonOrbs && S.orbLimit) lim.push([Game.Objects.You, S.orbMax]);
    for (const [b, max] of lim) if (b.amount > max) b.sell(b.amount - max);
  }
  function rewardCookieAction() {
    const chain = nextChainedPurchase();
    if (!chain || chain.type !== 'upgrade' || !isRewardCookie(chain.purchase)) return;
    PREREQS[chain.purchase.id][0].forEach((amt, i) => {
      const b = Game.ObjectsById[i];
      if (b && b.amount < amt) safeBuy(b, amt - b.amount);
    });
    const u = chain.purchase;
    if (u.unlocked && !u.bought && Game.cookies >= u.getPrice()) {
      u.buy(1);
      logEvent('Autobuy', 'Bought reward cookie ' + u.name);
      restoreBuildingLimits();
    }
    invalidate();
  }

  // ---- the main auto-buy step (FC autoCookie)
  const NO_BUYALL = new Set(['Bingo center/Research facility', 'Specialized chocolate chips', 'Designer cocoa beans', 'Ritual rolling pins',
    'Underworld ovens', 'One mind', 'Exotic nuts', 'Communal brainsweep', 'Arcane sugar', 'Elder Pact']);
  function clampBulk(b, n) {
    if (n <= 1) return 1;
    const M = grimoire();
    let cap = Infinity;
    if (S.mineLimit && b.name === 'Mine') cap = S.mineMax - b.amount;
    if (S.factoryLimit && b.name === 'Factory') cap = S.factoryMax - b.amount;
    if (S.autoDragonOrbs && S.orbLimit && b.name === 'You') cap = S.orbMax - b.amount;
    if (M && S.towerLimit && b.name === 'Wizard tower' && M.magicM >= S.manaMax - 10) cap = 1;
    return Math.max(1, Math.min(n, cap));
  }
  function autoBuyStep() {
    if (!S.autoBuy) return false;
    const rec = nextPurchase(), chain = nextChainedPurchase();
    if (!rec || rec.type === 'other') return false;
    const delay = bestBank(chain.efficiency).cost;
    const isPledge = rec.purchase.name === 'Elder Pledge';
    // Never flip the covenant back within 10 minutes of the bot changing it (guards against any toggle loop).
    const COV_PAIR = { 'Elder Covenant': 'Revoke Elder Covenant', 'Revoke Elder Covenant': 'Elder Covenant' };
    if (COV_PAIR[rec.purchase.name] && R.covenantFlip && R.covenantFlip.name === COV_PAIR[rec.purchase.name] && Date.now() - R.covenantFlip.t < 600000) return false;
    // Elder Pledge ignores the bank (FC rule) but still has to be affordable; FC "bought" it even when it
    // wasn't, which here spun the buy loop for its full 30 ms every tick.
    if (!(Game.cookies >= (isPledge ? 0 : delay) + rec.cost)) return false;
    if (!(S.pastemode || isFinite(chain.efficiency))) return false;
    const cookiesBefore = Game.cookies;
    const prestigeGain = Math.floor(Game.HowMuchPrestige(Game.cookiesReset + Game.cookiesEarned)) - Math.floor(Game.HowMuchPrestige(Game.cookiesReset));
    if (prestigeGain < 1 && Game.Has('Inspired checklist') && S.autoBuyAll && rec.type === 'upgrade' && Game.cookies >= rec.cost && !NO_BUYALL.has(rec.purchase.name)) {
      Game.storeBuyAll();
      logEvent('Autobuy', 'Bought all upgrades!');
    } else if (rec.type === 'building') {
      safeBuy(rec.purchase, clampBulk(rec.purchase, Game.buyBulk > 0 ? Game.buyBulk : 1));
    } else if (rec.type === 'santa') {
      buySanta();
    } else {
      rec.purchase.buy(1);                            // bypasses the confirmation prompts (e.g. One mind)
    }
    if (Game.cookies === cookiesBefore) { invalidate(); return false; }
    if (COV_PAIR[rec.purchase.name]) { R.covenantFlip = { name: rec.purchase.name, t: Date.now() }; logEvent('Autobuy', 'Bought ' + rec.purchase.name); }
    if (S.trackStats === 5 && rec.type === 'upgrade') saveStats();
    else if (S.trackStats === 6) R.delayPurchaseCount++;
    if (S.purchaseLog) logEvent('Store', 'Autobought ' + rec.purchase.name + ' for ' + B(rec.cost) + ', resulting in ' + B(rec.delta_cps) + ' CPS.');
    invalidate();
    return true;
  }

  // ---- auto-ascend
  function autoAscendAction() {
    if (!S.autoAscendToggle || !S.autoAscend || R.ascendPending || Game.OnAscend || Game.AscendTimer || Game.prestige <= 0) return;
    if (!(S.comboAscend || cpsBonus() < S.minCpSMult)) return;
    const reset = Game.HowMuchPrestige(Game.cookiesReset + Game.cookiesEarned + wrinklerValue() + chocolateValue());
    const go = S.autoAscend === 1 ? S.HCAscendAmount > 0 && reset - Game.prestige >= S.HCAscendAmount : reset >= Game.prestige * 2;
    if (!go) return;
    R.ascendPending = true;
    logEvent('AutoAscend', 'Ascending at ' + B(reset) + ' prestige');
    Game.ClosePrompt();
    Game.Ascend(1);
    setTimeout(() => { Game.ClosePrompt(); Game.Reincarnate(1); R.ascendPending = false; }, 10000);
  }

  // ---- frenzy / heavenly chip bookkeeping
  function trackFrenzy() {
    const cur = cpsBonus() * clickBuffBonus();
    if (cur === R.lastGcState) return;
    if (R.lastGcState !== 1 && cur === 1) {
      logEvent('GC', 'Frenzy ended, cookie production x1');
      if (R.hcGain) { logEvent('HC', 'Won ' + fcBeautify(R.hcGain, 2) + ' heavenly chips during Frenzy. Rate: ' + fcBeautify((R.hcGain * 1000) / (Date.now() - R.hcGainTime), 3) + ' HC/s.'); R.hcGainTime = Date.now(); R.hcGain = 0; }
    } else {
      if (R.lastGcState !== 1) logEvent('GC', 'Previous Frenzy x' + B(R.lastGcState) + ' interrupted.');
      else if (R.hcGain) { logEvent('HC', 'Won ' + fcBeautify(R.hcGain, 2) + ' heavenly chips outside of Frenzy.'); R.hcGainTime = Date.now(); R.hcGain = 0; }
      logEvent('GC', 'Starting ' + (hasClickBuff() ? 'Clicking ' : '') + 'Frenzy x' + B(cur));
    }
    const key = String(R.lastGcState);
    D.frenzyTimes[key] = (D.frenzyTimes[key] || 0) + (Date.now() - R.lastGcTime);
    R.lastGcState = cur; R.lastGcTime = Date.now();
  }
  function trackHC() {
    const hc = Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset + wrinklerValue());
    if (Math.floor(D.lastHCAmount) < Math.floor(hc)) {
      const change = hc - D.lastHCAmount;
      D.lastHCAmount = hc; D.prevLastHCTime = D.lastHCTime; D.lastHCTime = Date.now();
      const pct = (3600 * (D.lastHCAmount - Game.heavenlyChips)) / ((D.lastHCTime - Game.startDate) / 1000);
      if (Game.heavenlyChips < hc - change && pct > D.maxHCPercent) D.maxHCPercent = pct;
      R.hcGain += change;
    }
  }
  function nextHC(raw) {
    const future = Math.ceil(Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset));
    const toGo = Game.HowManyCookiesReset(future) - (Game.cookiesEarned + Game.cookiesReset);
    return raw ? toGo : timeDisplay(divCps(toGo, Game.cookiesPs));
  }

  // ---- golden cookies & reindeer
  // Golden cookies made by Hand of Fate carry their effect in sh.force, so a backfire (Clot, Ruin)
  // is left to fade away instead of clicked. Natural golden cookies roll their effect at click time
  // (unseeded), so they can't be known in advance and are always clicked, like FC.
  const skippedGC = new WeakSet();
  function goodForced(force) {
    if (force === 'clot' || force === 'ruin cookies') return false;
    if (force === 'cursed finger') return clickSpeed() > 0;   // CpS stops; only worth it while auto-clicking
    return true;
  }
  function shimmerAction() {
    for (const sh of Game.shimmers.slice()) {
      if (sh.popped || !(sh.life > 0)) continue;
      if (sh.type === 'golden' && S.autoGC) {
        if (sh.force && !goodForced(sh.force)) {
          if (!skippedGC.has(sh)) { skippedGC.add(sh); logEvent('GC', 'Left a ' + sh.force + ' cookie alone (known backfire)'); }
          continue;
        }
        sh.pop();
      } else if (sh.type === 'reindeer' && S.autoReindeer) sh.pop();
    }
  }
  function autoFortuneAction() {
    if (S.autoFortune && Game.TickerEffect && Game.TickerEffect.type === 'fortune') Game.tickerL.click();
  }

  // ---- stats tracking
  function saveStats() {
    D.trackedStats.push({ time: Date.now() - Game.startDate, baseCps: baseCps(), effectiveCps: effectiveCps(),
      hc: Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset + wrinklerValue()), actualClicks: Game.cookieClicks });
    save();
    if (typeof drawGraphs === 'function') drawGraphs();
  }
  function statsAction() {
    const speeds = [0, 60e3, 30 * 60e3, 3600e3, 86400e3];
    const now = Date.now();
    if (S.trackStats >= 1 && S.trackStats <= 4) {
      if (now - R.lastStat >= speeds[S.trackStats]) { R.lastStat = now; saveStats(); }
    } else if (S.trackStats === 6 && now >= R.nextSmart) {
      saveStats();
      R.smartDelay /= R.delayPurchaseCount === 0 ? 1 / 1.5 : R.smartDelay > 10000 ? 2 : 1;
      R.delayPurchaseCount = 0;
      R.nextSmart = now + R.smartDelay;
    }
  }

  // ---- FC's reset hook: cash out wrinklers, stocks, garden and the chocolate egg before ascending.
  // Heavenly chips are awarded when the ascend animation ends, before Game.Reset runs, so FC (which
  // only hooked Game.Reset) opened the egg too late for it to count. Here it runs when you confirm.
  function cashOut() {
    try {
      Game.CollectWrinklers();
      const Bk = market();
      if (Bk) for (let i = 0; i < Bk.goodsById.length; i++) Bk.sellGood(i, 10000);
      const G = garden();
      if (G) G.harvestAll();
      if (Game.HasUnlocked('Chocolate egg') && !Game.Has('Chocolate egg')) {
        if (Game.dragonLevel > 5 && !Game.hasAura('Earth Shatterer')) setDragonAura(5, 0);
        Game.ObjectsById.forEach((b) => b.sell(-1));
        Game.Upgrades['Chocolate egg'].buy(1);
        logEvent('Ascend', 'Sold buildings and opened the Chocolate egg before ascending');
      }
    } catch (e) { console.error('[Sleepy Cookies] cash-out before ascending', e); }
  }
  const origAscend = Game.Ascend;
  function fcAscend(bypass) {
    if (bypass && !Game.OnAscend && !Game.AscendTimer) cashOut();
    return origAscend.apply(this, arguments);
  }
  const origReset = Game.Reset;
  function fcReset(hard) {
    if (!hard) cashOut();                             // FC dropped the 'hard' flag, which broke hard resets
    const out = origReset.apply(this, arguments);
    D.frenzyTimes = {};
    R.lastGcState = cpsBonus() * clickBuffBonus(); R.lastGcTime = Date.now();
    D.lastHCAmount = Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset + wrinklerValue());
    D.lastHCTime = Date.now(); D.prevLastHCTime = Date.now(); D.maxHCPercent = 0;
    if (!hard) D.trackedStats = [];
    W.caches = { recommendationList: [], nextPurchase: null, nextChained: null };
    invalidate();
    save();
    return out;
  }
  function onReincarnate() {
    if (S.autoBulk === 1 && l('storeBulk10')) l('storeBulk10').click();
    if (S.autoBulk === 2 && l('storeBulk100')) l('storeBulk100').click();
    invalidate();
  }

  // ================================================================== Pantheon
  function swapIn(godId, slot) {
    const T = pantheon();
    if (!T || T.swaps < 1) return false;
    const god = T.godsById[godId];
    if (!god || T.slot[slot] === godId) return !!god;
    T.useSwap(1);
    T.lastSwapT = 0;
    const div = l('templeGod' + godId);
    const prev = T.slot[slot];
    if (prev !== -1) {
      const prevDiv = l('templeGod' + prev);
      if (god.slot !== -1) l('templeSlot' + god.slot).appendChild(prevDiv);
      else { const ph = l('templeGodPlaceholder' + prev); ph.parentNode.insertBefore(prevDiv, ph); }
    }
    l('templeSlot' + slot).appendChild(div);
    const ph = l('templeGodPlaceholder' + godId);
    if (ph) ph.style.display = 'none';
    T.slotGod(god, slot);
    PlaySound('snd/tick.mp3'); PlaySound('snd/spirit.mp3', 0.5);
    invalidate();
    return true;
  }
  // Auto Pantheon: simulates every god lineup with the efficiency engine (base CpS, clicking, milk,
  // golden cookie frequency, Cyclius' current phase) and slots the best one. Godzamok stays in the
  // diamond slot when Auto-Godzamok is on; Rigidel is handled by the sugar lump option.
  const SLOT_NAMES = ['diamond', 'ruby', 'jade'];
  const pantheonInfo = { text: 'off', gain: 0 };
  let pantheonNext = 0;
  function lineupScore(T, lineup, delay) {
    const oldSlot = T.slot.slice(), oldGod = T.godsById.map((g) => g.slot);
    try {
      for (const g of T.godsById) g.slot = -1;
      for (let i = 0; i < 3; i++) { T.slot[i] = lineup[i]; if (lineup[i] >= 0) T.godsById[lineup[i]].slot = i; }
      recalcGains();
      return effectiveCps(delay);
    } finally {
      for (let i = 0; i < 3; i++) T.slot[i] = oldSlot[i];
      T.godsById.forEach((g, i) => { g.slot = oldGod[i]; });
      simUndoAchievements(); recalcGains(); simUndoAchievements();
    }
  }
  function bestLineup(T) {
    const pool = ['mother', 'industry', 'labor', 'ages', 'decadence'];
    if (!S.autoGC) pool.push('asceticism');           // Holobore is unslotted the moment a golden cookie is clicked
    const fixed = [-1, -1, -1];
    if (S.autoGodzamok && !S.autoDragonOrbs) fixed[0] = T.gods.ruin.id;
    const ids = pool.map((k) => T.gods[k].id).concat([-1]);   // -1 = leave the slot empty
    const free = [0, 1, 2].filter((s) => fixed[s] < 0);
    const delay = delayAmount();                     // computed before the simulation starts
    let best = null, current;
    const pick = (slotIdx, used, lineup) => {
      if (slotIdx === free.length) {
        const v = lineupScore(T, lineup, delay);
        if (!best || v > best.v * (1 + 1e-9)) best = { v, lineup: lineup.slice() };
        return;
      }
      for (const id of ids) {
        if (id >= 0 && used.has(id)) continue;
        if (id >= 0) used.add(id);
        lineup[free[slotIdx]] = id;
        pick(slotIdx + 1, used, lineup);
        if (id >= 0) used.delete(id);
        lineup[free[slotIdx]] = -1;
      }
    };
    simBegin();
    try {
      pick(0, new Set(), fixed.slice());
      const cur = T.slot.map((id) => (id >= 0 && !(T.gods.order && id === T.gods.order.id) ? id : -1));
      current = lineupScore(T, cur, delay);
    } finally { simEnd(); }
    return { best, current, fixed };
  }
  function autoPantheonAction(force) {
    const T = pantheon();
    if (!S.autoWorshipToggle) { pantheonInfo.text = 'off'; return; }
    if (!T) { pantheonInfo.text = 'no temple minigame yet'; return; }
    if (!force && Date.now() < pantheonNext) return;
    pantheonNext = Date.now() + 60000;
    if (T.gods.order && T.slot.includes(T.gods.order.id) && S.autoSL === 2) return;   // Rigidel is borrowing a slot
    const { best, current, fixed } = bestLineup(T);
    if (!best) return;
    const names = best.lineup.map((id) => (id >= 0 ? T.godsById[id].name.split(',')[0] : 'empty'));
    pantheonInfo.gain = current > 0 ? best.v / current - 1 : 0;
    const wantFixed = fixed.some((id, s) => id >= 0 && T.slot[s] !== id);
    const isRigidel = (id) => T.gods.order && id === T.gods.order.id;
    const differs = best.lineup.some((id, s) => T.slot[s] !== id && !(id < 0 && isRigidel(T.slot[s])));
    pantheonInfo.text = names.join(' / ') + (differs ? ' (+' + (pantheonInfo.gain * 100).toFixed(1) + '% effective CpS once slotted)' : ' (slotted)');
    // Spend swaps only for a real gain (>1%), or to put Godzamok in place for Auto-Godzamok.
    if (differs && !wantFixed && pantheonInfo.gain < 0.01) pantheonInfo.text = 'keeping current gods (best: ' + names.join(' / ') + ' is only +' + (pantheonInfo.gain * 100).toFixed(1) + '%)';
    if (!differs || (!wantFixed && pantheonInfo.gain < 0.01)) return;
    const unslotExtras = () => {                     // unslotting is free
      for (let s = 0; s < 3; s++) {
        const cur = T.slot[s];
        if (best.lineup[s] < 0 && cur >= 0 && !isRigidel(cur) && !best.lineup.includes(cur)) {
          Game.forceUnslotGod(Object.keys(T.gods).find((k) => T.gods[k].id === cur));
          logEvent('autoPantheon', 'Unslotted ' + T.godsById[cur].name.split(',')[0] + ' (costs more than it gives)');
          invalidate();
        }
      }
    };
    unslotExtras();
    for (let s = 0; s < 3 && T.swaps >= 1; s++) {
      const id = best.lineup[s];
      if (id < 0 || T.slot[s] === id) continue;
      if (swapIn(id, s)) logEvent('autoPantheon', 'Slotted ' + T.godsById[id].name.split(',')[0] + ' in ' + SLOT_NAMES[s]);
    }
    unslotExtras();                                   // a swap can push the old god into another slot
    const done = best.lineup.every((id, s) => T.slot[s] === id || (id < 0 && isRigidel(T.slot[s])));
    pantheonInfo.text = names.join(' / ') + (done ? ' (slotted)' : ' (+' + (pantheonInfo.gain * 100).toFixed(1) + '% once slotted; waiting for worship swaps)');
  }
  // ================================================================== Grimoire
  // Predicts Force the Hand of Fate outcomes by replaying the game's seeded RNG (2.058 order).
  const FTHOF_NAMES = { 'frenzy': 'Frenzy', 'multiply cookies': 'Lucky', 'click frenzy': 'Click Frenzy', 'cookie storm': 'Cookie Storm', 'blab': 'Blab',
    'building special': 'Building Special', 'cookie storm drop': 'Cookie Storm (Drop)', 'free sugar lump': 'Sugar Lump', 'clot': 'Clot',
    'ruin cookies': 'Ruin Cookies', 'cursed finger': 'Cursed Finger', 'blood frenzy': 'Elder Frenzy', 'chain cookie': 'Cookie Chain' };
  function nextSpellName(offset) {
    const M = grimoire();
    if (!M) return '';
    const spell = M.spells['hand of fate'];
    const failChance = M.getFailChance(spell);
    const seasonal = ['valentines', 'easter', 'halloween', 'fools'].includes(Game.season);
    let c;
    Math.seedrandom(Game.seed + '/' + (M.spellsCastTotal + offset));
    try {
      if (!spell.fail || Math.random() < 1 - failChance) {
        if (seasonal) Math.random();
        Math.random(); Math.random();                  // golden cookie position
        c = ['frenzy', 'multiply cookies'];
        if (!Game.hasBuff('Dragonflight')) c.push('click frenzy');
        if (Math.random() < 0.1) c.push('cookie storm', 'cookie storm', 'blab');
        if (Game.BuildingsOwned >= 10 && Math.random() < 0.25) c.push('building special');
        if (Math.random() < 0.15) c = ['cookie storm drop'];
        if (Math.random() < 0.0001) c.push('free sugar lump');
      } else {
        if (seasonal) Math.random();
        Math.random(); Math.random();
        c = ['clot', 'ruin cookies'];
        if (Math.random() < 0.1) c.push('cursed finger', 'blood frenzy');
        if (Math.random() < 0.003) c.push('free sugar lump');
        if (Math.random() < 0.1) c = ['blab'];
      }
      c = choose(c);
    } finally { Math.seedrandom(); }
    return FTHOF_NAMES[c] || c;
  }
  const SPELL_COLORS = { 'Frenzy': '#FFDE5F', 'Lucky': '#FFDE5F', 'Click Frenzy': '#00C4FF', 'Cookie Storm': '#00C4FF', 'Building Special': '#DAA520',
    'Sugar Lump': '#5FFFFC', 'Clot': '#FF3605', 'Ruin Cookies': '#FF3605', 'Cursed Finger': '#174F01', 'Elder Frenzy': '#4F0007' };
  function spellPredictionHTML() {
    return '<div class="line"></div><div class="description">' + ['First', 'Second', 'Third', 'Fourth'].map((w, i) => {
      const n = nextSpellName(i);
      return '<b>' + w + ' spell:</b> <span style="color:' + (SPELL_COLORS[n] || '#fff') + '">' + n + '</span>';
    }).join('<br>') + '</div>';
  }
  let fthofTooltipEl = null, fthofTooltipOld = null;
  function hookSpellTooltip() {
    const M = grimoire();
    const el = l('grimoireSpell' + (M ? M.spells['hand of fate'].id : 1));
    if (!M || !el || el === fthofTooltipEl) return;
    fthofTooltipEl = el; fthofTooltipOld = el.onmouseover;
    el.onmouseover = function () {
      Game.tooltip.dynamic = 1;
      Game.tooltip.draw(this, () => M.spellTooltip(M.spells['hand of fate'].id)() + spellPredictionHTML(), 'this');
      Game.tooltip.wobble();
    };
  }
  function spellById(key) { const M = grimoire(); return M.spells[key]; }
  function castable(key) { const M = grimoire(); return M.getSpellCost(spellById(key)) <= M.magicM; }   // max mana is enough
  function affordable(key) { const M = grimoire(); return M.getSpellCost(spellById(key)) <= M.magic; }  // current mana is enough
  function cast(key, why) { const M = grimoire(); if (M.castSpell(spellById(key))) { logEvent('autoCasting', why || ('Cast ' + spellById(key).name)); invalidate(); return true; } return false; }
  function manaFull() { const M = grimoire(); return (S.towerLimit && M.magic >= M.magicM) || (!S.towerLimit && M.magic >= M.magicM - 1); }
  function buffSecs(name) { const b = Game.hasBuff(name); return b ? b.time / Game.fps : 0; }
  function buffTimeFactor() {
    let d = 1;
    if (Game.Has('Get lucky')) d *= 2;
    if (Game.Has('Lasting fortune')) d *= 1.1;
    if (Game.Has('Lucky digit')) d *= 1.01;
    if (Game.Has('Lucky number')) d *= 1.01;
    if (Game.Has('Green yeast digestives')) d *= 1.01;
    if (Game.Has('Lucky payout')) d *= 1.01;
    d *= 1 + Game.auraMult('Epoch Manipulator') * 0.05;
    if (Game.hasGod) { const g = Game.hasGod('decadence'); if (g === 1) d *= 1.07; else if (g === 2) d *= 1.05; else if (g === 3) d *= 1.02; }
    return d;
  }
  function buildingBuff() {
    for (const k in Game.buffs) { const b = Game.buffs[k]; if (b.type && b.type.name === 'building buff') return b; }
    return null;
  }
  function buildingBuffSecs() { const b = buildingBuff(); return b ? b.time / Game.fps : 0; }
  function frenzyWindow() {
    const need = Math.ceil(13 * buffTimeFactor()) - 1;
    const dh = buffSecs('Dragon Harvest'), fr = buffSecs('Frenzy');
    const reaper = Game.hasAura('Reaper of Fields') || Game.hasAura('Reality Bending');
    if (reaper && dh && fr && dh >= need && fr >= need) return true;
    return !Game.hasAura('Reaper of Fields') && (dh || fr) && (dh >= need || fr >= need);
  }
  function buildingWindow() { return !!buildingBuff() && buildingBuffSecs() >= Math.ceil(13 * buffTimeFactor()); }
  function clickWindow(cfSecs) {
    const cf = buffSecs('Click frenzy'), df = buffSecs('Dragonflight');
    return (cf || df) && (cf >= Math.ceil(cfSecs * buffTimeFactor()) - 1 || df >= Math.ceil(6 * buffTimeFactor()) - 1);
  }
  function loanInterest() { return Game.hasBuff('Loan 1 (interest)') || Game.hasBuff('Loan 2 (interest)') || Game.hasBuff('Loan 3 (interest)'); }

  // ---- Smart Grimoire: the next Hand of Fate results are known, so decide per cast.
  //  * Sugar lump next: cast now.
  //  * Good result next (Click Frenzy, Elder Frenzy, Building Special, Cursed Finger, Lucky): cast the moment the
  //    current multiplier reaches the "minimum Frenzy" setting, as long as there is enough mana for the spell
  //    (full mana is not required). Two good results in a row with full mana: double-cast instead.
  //  * Frenzy next: cast when no Frenzy is running. Cookie Storm: cast.
  //  * Blab / storm drop / backfire next: burn it with a cheap spell so the next cast is better.
  const GREAT = new Set(['Click Frenzy', 'Elder Frenzy', 'Building Special', 'Cursed Finger']);
  const BURN = new Set(['Blab', 'Cookie Storm (Drop)', 'Clot', 'Ruin Cookies']);
  const combo2 = { state: 0, count: 0, autobuy: 0 };
  const DOUBLE_CAST = { 1: [81, 21], 2: [81, 14], 3: [81, 8], 4: [81, 3], 5: [83, 1], 6: [88, 1], 7: [91, 1], 8: [93, 1], 9: [96, 1], 10: [98, 1] };
  const grimoireInfo = { text: 'off', fullSince: 0 };
  const MIN_BUFF_SECS = 2;                          // ignore boosts that run out before the new buff would matter
  // The multiplier a result would combine with. Elder Frenzy and Building Special also multiply clicks, so click
  // buffs count for them; Click Frenzy, Cursed Finger and Lucky are worth CpS-multiplier times their base.
  function castMult(next) {
    const withClick = next === 'Elder Frenzy' || next === 'Building Special';
    let r = 1;
    for (const k in Game.buffs) {
      const b = Game.buffs[k], secs = b.time / Game.fps;
      if (typeof b.multCpS !== 'undefined' && (b.multCpS < 1 || secs >= MIN_BUFF_SECS)) r *= b.multCpS;
      if (withClick && typeof b.multClick !== 'undefined' && b.multClick > 1 && secs >= MIN_BUFF_SECS) r *= b.multClick;
    }
    return r;
  }
  // Cursed Finger stops CpS and pays out per click, so its cookie is skipped (and the cast wasted) unless
  // something clicks: the auto-clicker, or you when golden cookie auto-clicking is off.
  function isGood(n) { return GREAT.has(n) && (n !== 'Cursed Finger' || !S.autoGC || clickSpeed() > 0); }
  const fmtX = (v) => fcBeautify(v, 2);
  function greatWindow(next) {
    if (next === 'Click Frenzy' && (Game.hasBuff('Click frenzy') || Game.hasBuff('Dragonflight'))) return false;  // would only refresh it
    return castMult(next) >= S.minCpSMult;
  }
  function finishDoubleCast() {
    const M = grimoire(), wt = Game.Objects['Wizard tower'];
    // Every golden cookie on screen adds to Hand of Fate's fail chance, so collect the first cast's
    // cookie before the second cast, then re-check the prediction. (FC cast blind here.)
    for (const sh of Game.shimmers.slice()) if (sh.type === 'golden' && sh.force && goodForced(sh.force)) sh.pop();
    combo2.autobuy = S.autoBuy ? 1 : 0; S.autoBuy = 0;
    wt.sell(combo2.count);
    M.computeMagicM();
    const next = nextSpellName(0);
    if (isGood(next) || next === 'Sugar Lump') cast('hand of fate', 'Double cast Force the Hand of Fate (' + next + ')');
    else logEvent('autoCasting', 'Second cast would now give ' + next + ', so it was not cast');
    safeBuy(wt, combo2.count);
    if (combo2.autobuy) S.autoBuy = 1;
    combo2.count = 0; combo2.state = 0; combo2.autobuy = 0;
    invalidate();
  }
  function burn(next) {
    if (castable('stretch time') && cpsBonus() < 1 && (next === 'Clot' || next === 'Ruin Cookies')) cast('stretch time', 'Cast Stretch Time to skip a ' + next + ' backfire');
    else if (castable("haggler's charm")) cast("haggler's charm", "Cast Haggler's Charm to skip " + next);
  }
  function smartGrimoireAction() {
    const M = grimoire();
    if (!S.autoCasting) { grimoireInfo.text = 'off'; return; }
    if (!M) { grimoireInfo.text = 'no grimoire yet'; return; }
    if (combo2.state === 3) { finishDoubleCast(); return; }
    const full = manaFull();
    if (!full) grimoireInfo.fullSince = 0;
    else if (!grimoireInfo.fullSince) grimoireInfo.fullSince = Date.now();
    const charging = 'charging mana (' + Math.floor(M.magic) + '/' + M.magicM + ')';
    if (!castable('hand of fate')) {
      if (!full) { grimoireInfo.text = charging; return; }
      grimoireInfo.text = 'max mana too low for Hand of Fate';
      if (castable('conjure baked goods')) cast('conjure baked goods');
      return;
    }
    const n0 = nextSpellName(0), n1 = nextSpellName(1);
    const waited = full ? Date.now() - grimoireInfo.fullSince : 0;
    const fate = (why) => { grimoireInfo.fullSince = 0; grimoireInfo.text = 'cast ' + n0; return cast('hand of fate', why || 'Cast Force the Hand of Fate (' + n0 + ') at x' + fmtX(castMult(n0)) + ' multiplier'); };
    if (n0 === 'Sugar Lump') { fate('Cast Force the Hand of Fate for a free sugar lump'); return; }
    const waitText = (what) => (n0 === 'Click Frenzy' && (Game.hasBuff('Click frenzy') || Game.hasBuff('Dragonflight')))
      ? 'holding ' + what + ' until the running click buff ends'
      : 'holding ' + what + ' until x' + fmtX(S.minCpSMult) + ' (now x' + fmtX(castMult(n0)) + ')';
    const lvl = Game.Objects['Wizard tower'].level, t = DOUBLE_CAST[lvl];
    if (full && t && M.magicM >= t[0] && isGood(n0) && isGood(n1) && !(n0 === 'Cursed Finger' && n1 === 'Cursed Finger')) {
      grimoireInfo.text = waitText(n0 + ' + ' + n1 + ' (double cast)');
      if (greatWindow(n0)) {
        combo2.count = Math.max(0, Game.Objects['Wizard tower'].amount - t[1]);
        if (fate('Cast first Force the Hand of Fate (' + n0 + ') at x' + fmtX(castMult(n0)) + ' multiplier')) combo2.state = 3;
      }
      return;
    }
    if (isGood(n0) || n0 === 'Lucky') {
      grimoireInfo.text = waitText(n0);
      if (!greatWindow(n0) && !(waited > (n0 === 'Lucky' ? 15 : 20) * 60000)) return;
      if (affordable('hand of fate')) fate();
      else grimoireInfo.text = 'x' + fmtX(castMult(n0)) + ' reached, waiting for mana for ' + n0 + ' (' + Math.floor(M.magic) + '/' + Math.ceil(M.getSpellCost(spellById('hand of fate'))) + ')';
      return;
    }
    if (!full) { grimoireInfo.text = charging + ', next: ' + n0; return; }
    if (n0 === 'Frenzy') { grimoireInfo.text = 'next: Frenzy'; if (buffSecs('Frenzy') < 10) fate(); return; }
    if (n0 === 'Cookie Storm') { fate(); return; }
    if (BURN.has(n0) || GREAT.has(n0)) { grimoireInfo.text = 'skipping ' + n0; burn(n0); return; }
    fate();
  }

  function autoSugarFrenzyAction() {
    if (!S.autoSugarFrenzy) return;
    const sf = Game.UpgradesById[452], craving = Game.UpgradesById[450];
    if (!canSpendLump() || cpsBonus() < S.minASFMult || !craving.unlocked || sf.bought) return;
    if (loanInterest() && S.minLoanMult) return;
    if (combo2.state !== 3) return;
    if (Game.lumps < 1 || !sf.canBuy()) return;
    Game.lumps -= 1;                                  // buy(1) skips the lump payment, so pay it here like the game does
    sf.buy(1);
    Game.recalculateGains = 1;
    logEvent('autoSugarFrenzy', 'Started a Sugar Frenzy this ascension');
  }

  // ================================================================== Dragon
  // Run fn with the dragon/Santa popup on the given tab, then put the popup back the way the player had it
  // (the game's own upgrade buttons leave it open, which popped it up mid-game every time the bot used it).
  function withSpecialTab(tab, fn) {
    const prevTab = Game.specialTab;
    const wasOpen = !!prevTab && !!l('specialPopup') && l('specialPopup').className.includes('onScreen');
    Game.specialTab = tab;
    try { return fn(); } finally {
      if (wasOpen) { Game.specialTab = prevTab; Game.ToggleSpecialMenu(1); }
      else Game.ToggleSpecialMenu(0);
    }
  }
  function autoDragonAction() {
    if (!S.autoDragon || !Game.HasUnlocked('A crumbly egg') || Game.dragonLevel > 26 || hasClickBuff()) return;
    if (!Game.Has('A crumbly egg')) { Game.Upgrades['A crumbly egg'].buy(1); logEvent('autoDragon', 'Bought an egg'); }
    if (Game.dragonLevel < Game.dragonLevels.length - 1 && Game.dragonLevels[Game.dragonLevel].cost()) {
      withSpecialTab('dragon', () => Game.UpgradeDragon());
      logEvent('autoDragon', 'Upgraded the dragon to level ' + Game.dragonLevel);
      invalidate();
    }
  }
  function petDragonAction() {
    // Drops only roll from dragon level 8 ("Dragon of ...") up; below that petting did nothing but growl.
    if (!S.petDragon || !Game.Has('A crumbly egg') || Game.dragonLevel < 8 || !Game.Has('Pet the dragon') || hasClickBuff()) return;
    Math.seedrandom(Game.seed + '/dragonTime');
    let drops = shuffle(['Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear']);
    Math.seedrandom();
    const drop = drops[Math.floor((new Date().getMinutes() / 60) * drops.length)];
    if (!Game.Has(drop) && !Game.HasUnlocked(drop)) {
      const snd = window.PlaySound;
      window.PlaySound = noop;                        // one pet a second: no click/growl spam
      try { withSpecialTab('dragon', () => { Game.ToggleSpecialMenu(1); Game.ClickSpecialPic(); }); }
      finally { window.PlaySound = snd; }
    }
  }
  function autoDragonAuraAction() {
    if (!S.autoDragonToggle || !Game.Has('A crumbly egg')) return;
    const a0 = S.autoDragonAura0, a1 = S.autoDragonAura1;
    if (a0 && a0 === a1) { S.autoDragonAura1 = 0; logEvent('autoDragon', "Can't set both auras to the same one!"); refreshPanel(); return; }
    if (a0 && Game.dragonLevel >= 5 && Game.dragonAura !== a0 && Game.dragonAura2 !== a0) {
      if (Game.dragonLevel > 26 && Game.dragonAura === a1) { if (setDragonAura(a0, 1)) logEvent('autoDragon', 'Set first dragon aura'); }
      else if (setDragonAura(a0, 0)) logEvent('autoDragon', 'Set first dragon aura');
      return;
    }
    if (a0 && a1 && Game.dragonLevel >= 27 && Game.dragonAura !== a1 && Game.dragonAura2 !== a1) {
      if (Game.dragonAura2 === a0) { if (setDragonAura(a1, 0)) logEvent('autoDragon', 'Set second dragon aura'); }
      else if (setDragonAura(a1, 1)) logEvent('autoDragon', 'Set second dragon aura');
    }
  }
  function autoDragonOrbsAction() {
    if (!S.autoDragonOrbs || !pantheon()) return;
    if (!Game.hasAura('Dragon Orbs') || Game.hasGod('ruin') || Game.Objects.You.amount < 1) {
      S.autoDragonOrbs = 0; logEvent('autoDragonOrbs', 'Not currently possible to use Dragon Orbs'); refreshPanel(); return;
    }
    if (!Game.shimmers.some((s) => s.type === 'golden') && !Object.keys(Game.buffs).length) {
      const you = Game.Objects.You;
      logEvent('autoDragonOrbs', 'Sold 1 You for ' + B(you.price * you.getSellMultiplier()) + ' cookies and a wish');
      you.sell(1);
      invalidate();
    }
  }

  // ================================================================== Stock market auto-trader (Sleepy extra)
  let lastMarketTick = -1;
  function spareCookies() { return Math.max(0, Game.cookies - delayAmount()); }
  // Stocks tie cookies up for hours, so the trader only gets what is left after the bank AND the next
  // purchase; before, it spent the money auto-buy was saving up and stalled CpS growth.
  function surplusCookies() {
    const rec = S.autoBuy ? nextPurchase() : null;
    const next = rec && isFinite(rec.cost) ? rec.cost : 0;
    return Math.max(0, Game.cookies - delayAmount() - next);
  }
  function tradeRec(id) { return (D.trades[id] = D.trades[id] || { qty: 0, avg: 0 }); }
  function syncTrade(g, overhead) {
    const t = tradeRec(g.id);
    if (g.stock < t.qty) t.qty = g.stock;
    if (g.stock > t.qty) {
      const extra = g.stock - t.qty;
      t.avg = (t.avg * t.qty + (g.prev > 0 ? g.prev : g.val) * overhead * extra) / g.stock;
      t.qty = g.stock;
    }
    if (t.qty <= 0) { t.qty = 0; t.avg = 0; }
    return t;
  }
  function traderAction() {
    const M = market();
    if (!S.autoTrade || !M || !M.goodsById) return;
    if (M.ticks === lastMarketTick) return;
    lastMarketTick = M.ticks;
    const unit = Game.cookiesPsRawHighest;
    if (!(unit > 0)) return;
    const overhead = 1 + 0.01 * (20 * Math.pow(0.95, M.brokers));
    const softCap = 100 + (Game.Objects.Bank.level - 1) * 3;
    const goods = M.goodsById.filter((g) => g.active);
    let changed = false;
    for (const g of goods) {
      const t = syncTrade(g, overhead);
      if (g.stock <= 0 || g.last === 1) continue;
      const rest = M.getRestingVal(g.id);
      const sellAt = Math.max(t.avg * (1 + S.tradeMinProfit / 100), Math.max(rest, Math.min(rest * S.tradeSellPct / 100, softCap * 0.97)));
      const rising = S.tradeUseTrend && (g.mode === 1 || g.mode === 3);
      if (g.val >= sellAt && !(rising && g.val < rest * 3)) {
        const n = g.stock, gain = (g.val - t.avg) * n;
        if (M.sellGood(g.id, n)) {
          D.tradeProfit += gain;
          logEvent('Trader', 'Sold ' + n + ' ' + g.symbol + ' @ $' + g.val.toFixed(2) + ' (' + (gain >= 0 ? '+' : '') + '$' + B(gain) + ')');
          t.qty = 0; t.avg = 0; changed = true;
        }
      }
    }
    let budget = surplusCookies() * S.tradeSpendPct / 100;
    const buyList = goods.filter((g) => g.last !== 2 && g.val <= M.getRestingVal(g.id) * S.tradeBuyPct / 100 && !(S.tradeUseTrend && (g.mode === 2 || g.mode === 4)))
      .sort((a, b) => a.val / M.getRestingVal(a.id) - b.val / M.getRestingVal(b.id));
    for (const g of buyList) {
      const unitCost = g.val * overhead * unit;
      const n = Math.min(M.getGoodMaxStock(g) - g.stock, Math.floor(budget / unitCost));
      if (n <= 0) continue;
      const t = syncTrade(g, overhead);
      if (M.buyGood(g.id, n)) {
        budget -= n * unitCost;
        t.avg = (t.avg * t.qty + g.val * overhead * n) / (t.qty + n);
        t.qty += n;
        logEvent('Trader', 'Bought ' + n + ' ' + g.symbol + ' @ $' + g.val.toFixed(2));
        changed = true;
      }
    }
    if (changed) { save(); invalidate(); }
  }

  // ================================================================== Garden auto-planter (Sleepy extra)
  let gardenPlan = null, gardenPlanSig = '', gardenStatus = 'off';
  function gardenBounds(M) {
    const L = M.plotLimits[Math.max(1, Math.min(M.plotLimits.length, M.parent.level)) - 1];
    return { x0: L[0], y0: L[1], x1: L[2], y1: L[3], w: L[2] - L[0], h: L[3] - L[1] };
  }
  const emptyGrid = () => [0, 1, 2, 3, 4, 5].map(() => [null, null, null, null, null, null]);
  let mutsMemo = new Map();
  function mutsFor(M, counts) {
    const key = Object.keys(counts).sort().map((k) => k + counts[k]).join(',');
    let r = mutsMemo.get(key);
    if (!r) {
      const n = {}, nm = {};
      for (const k in M.plants) { n[k] = 0; nm[k] = 0; }
      for (const k in counts) { n[k] += counts[k]; nm[k] += counts[k]; }
      r = M.getMuts(n, nm);
      mutsMemo.set(key, r);
    }
    return r;
  }
  function layouts(b, A, Bk) {
    const out = [];
    const offs = (h) => (h <= 2 ? [0] : h === 3 ? [1] : h === 4 ? [0, 3] : [1, 4]);
    const put = (g, x, y, k) => { if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1) g[y][x] = k; };
    let g = emptyGrid();
    for (const r of offs(b.h)) for (let c = 0; c < b.w; c++) put(g, b.x0 + c, b.y0 + r, c % 2 ? Bk : A);
    out.push(g); g = emptyGrid();
    for (const c of offs(b.w)) for (let r = 0; r < b.h; r++) put(g, b.x0 + c, b.y0 + r, r % 2 ? Bk : A);
    out.push(g); g = emptyGrid();
    for (let r = 0; r < b.h; r++) { const m = r % 3; if (m !== 1) for (let c = 0; c < b.w; c++) put(g, b.x0 + c, b.y0 + r, m === 0 ? A : Bk); }
    out.push(g); g = emptyGrid();
    for (let c = 0; c < b.w; c++) { const m = c % 3; if (m !== 1) for (let r = 0; r < b.h; r++) put(g, b.x0 + c, b.y0 + r, m === 0 ? A : Bk); }
    out.push(g); g = emptyGrid();
    for (let by = 0; by + 3 <= b.h; by += 3) for (let bx = 0; bx + 3 <= b.w; bx += 3) {
      let k = 0;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) { if (dx === 1 && dy === 1) continue; put(g, b.x0 + bx + dx, b.y0 + by + dy, k++ % 2 ? Bk : A); }
    }
    out.push(g);
    return out;
  }
  function scoreLayout(M, b, grid, target) {
    let score = 0, slots = 0;
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) {
      if (grid[y][x] !== null) continue;
      const counts = {};
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < b.x0 || nx >= b.x1 || ny < b.y0 || ny >= b.y1) continue;
        const k = grid[ny][nx];
        if (k) counts[k] = (counts[k] || 0) + 1;
      }
      if (!Object.keys(counts).length) continue;
      let p = 0;
      for (const m of mutsFor(M, counts)) if (m[0] === target) p += m[1];
      if (p > 0) { score += p; slots++; }
    }
    return { score, slots };
  }
  function planUnlock(M, b) {
    mutsMemo = new Map();
    const sowable = M.plantsById.filter((p) => p.unlocked && p.plantable);
    const locked = new Set(M.plantsById.filter((p) => !p.unlocked).map((p) => p.key));
    if (!locked.size) return null;
    const combos = {};
    const add = (A, Bk, counts) => {
      for (const m of mutsFor(M, counts)) {
        if (!locked.has(m[0])) continue;
        const list = (combos[m[0]] = combos[m[0]] || []);
        if (!list.some((c) => c[0] === A && c[1] === Bk)) list.push([A, Bk]);
      }
    };
    for (let i = 0; i < sowable.length; i++) {
      const A = sowable[i].key;
      for (const n of [2, 4, 5, 8]) add(A, A, { [A]: n });
      for (let j = i + 1; j < sowable.length; j++) { const Bk = sowable[j].key; add(A, Bk, { [A]: 1, [Bk]: 1 }); add(A, Bk, { [A]: 3, [Bk]: 3 }); }
    }
    let best = null;
    for (const target in combos) for (const [A, Bk] of combos[target]) for (const grid of layouts(b, A, Bk)) {
      const r = scoreLayout(M, b, grid, target);
      if (!r.slots) continue;
      const cost = M.getCost(M.plants[A]) + M.getCost(M.plants[Bk]);
      if (!best || r.score > best.score * 1.0001 || (Math.abs(r.score - best.score) <= best.score * 1e-4 && cost < best.cost)) best = { target, A, B: Bk, grid, score: r.score, slots: r.slots, cost };
    }
    const weed = M.plants.meddleweed;
    if (weed && weed.unlocked && weed.plantable && (locked.has('brownMold') || locked.has('crumbspore'))) {
      const grid = emptyGrid(); let n = 0;
      for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) { grid[y][x] = 'meddleweed'; n++; }
      if (!best || n * 0.015 > best.score) best = { target: locked.has('brownMold') ? 'brownMold' : 'crumbspore', A: 'meddleweed', B: 'meddleweed', grid, score: n * 0.015, slots: n, spores: true };
    }
    return best;
  }
  function farmSeed(M) {
    if (S.gardenSeed !== 'auto') { const p = M.plants[S.gardenSeed]; if (p && p.unlocked && p.plantable) return p; }
    for (const k of ['bakeberry', 'bakerWheat']) if (M.plants[k] && M.plants[k].unlocked) return M.plants[k];
    return null;
  }
  function setSoil(M, key) {
    const soil = M.soils[key];
    if (!soil || M.soil === soil.id || M.nextSoil > Date.now() || M.parent.amount < soil.req || M.freeze) return;
    const el = l('gardenSoil-' + soil.id);
    if (el) { el.click(); logEvent('Garden', 'Soil -> ' + soil.name); }
  }
  function gardenAction() {
    if (!S.autoGarden) { gardenStatus = 'off'; return; }
    const M = garden();
    if (!M || !M.plot) { gardenStatus = 'no garden (needs a level 1 Farm)'; return; }
    if (M.freeze) { gardenStatus = 'garden is frozen'; return; }
    const b = gardenBounds(M);
    let mode = S.gardenMode === 0 ? 'unlock' : 'farm', grid = null, plan = null, seed = null;
    if (mode === 'unlock') {
      const sig = M.plantsById.map((p) => (p.unlocked ? 1 : 0)).join('') + '|' + M.parent.level;
      if (sig !== gardenPlanSig) {
        gardenPlanSig = sig;
        const old = gardenPlan && gardenPlan.target;
        gardenPlan = planUnlock(M, b);
        if (gardenPlan && gardenPlan.target !== old) logEvent('Garden', 'Hunting ' + M.plants[gardenPlan.target].name + ' (' + M.plants[gardenPlan.A].name + (gardenPlan.B !== gardenPlan.A ? ' + ' + M.plants[gardenPlan.B].name : '') + ')');
      }
      plan = gardenPlan;
      if (plan) grid = plan.grid; else mode = 'farm';
    }
    if (mode === 'farm') {
      seed = farmSeed(M);
      grid = emptyGrid();
      if (seed) for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) grid[y][x] = seed.key;
    }
    if (S.gardenAutoSoil) {
      // Mutations only come from mature parents, so grow them on fast Fertilizer and switch to Wood chips
      // (3x mutations) once they're all grown. Harvest crops grow on Fertilizer; passive ones sit in Clay.
      const n = M.parent.amount;
      const fast = n >= 50 ? 'fertilizer' : 'dirt';
      if (mode === 'unlock') {
        let ready = true;
        for (let y = b.y0; y < b.y1 && ready; y++) for (let x = b.x0; x < b.x1; x++) {
          const want = grid[y][x]; if (!want || !M.isTileUnlocked(x, y)) continue;
          const t = M.plot[y][x];
          if (!(t[0] > 0 && M.plantsById[t[0] - 1].key === want && t[1] >= M.plants[want].mature)) { ready = false; break; }
        }
        setSoil(M, ready && n >= 300 ? 'woodchips' : fast);
      } else setSoil(M, seed && seed.onHarvest ? fast : n >= 100 ? 'clay' : 'dirt');
    }
    const spare = spareCookies();
    let spent = 0;
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) {
      if (!M.isTileUnlocked(x, y)) continue;
      const tile = M.plot[y][x], want = grid[y][x];
      if (tile[0] > 0) {
        const p = M.plantsById[tile[0] - 1], age = tile[1];
        if (!p.unlocked) { if (age >= p.mature) { M.harvest(x, y); logEvent('Garden', 'Unlocked ' + p.name + ' seed!'); } continue; }
        if (p.key === want) {
          if (plan && plan.spores && age >= 80) M.harvest(x, y);
          else if (mode === 'farm' && S.gardenHarvestMature && p.onHarvest && age >= p.mature) M.harvest(x, y);
          continue;
        }
        M.harvest(x, y);
        continue;
      }
      if (!want) continue;
      const p = M.plants[want];
      if (!p || !p.unlocked || !p.plantable) continue;
      const cost = M.getCost(p);
      if (spare - spent >= cost && M.useTool(p.id, x, y)) spent += cost;
    }
    if (mode === 'unlock' && plan) gardenStatus = 'hunting ' + M.plants[plan.target].name + ' (' + plan.slots + ' slots)';
    else if (seed) gardenStatus = 'farming ' + seed.name + (S.gardenMode === 0 ? ' (nothing left to unlock)' : '');
    else gardenStatus = 'no seed to plant';
  }

  // ================================================================== in-game menu (FC style: replaces the Info button)
  const CSS = `
#scButton{top:0px;right:0px;padding-top:12px;padding-left:2px;font-size:90%;line-height:1.05;background-position:-100px 0px;}
#scButton:hover,#scButton.selected{background-position:-100px -96px;}
#scMenuRoot .sc-btnrow{padding:3px 16px;}
#scMenuRoot .sc-top-btn{display:inline-block;margin:2px 4px 2px 0;}
#scMenuRoot .option,#scMenuRoot .sc-choice{background:#111;color:#fff;border:1px solid #444;border-radius:4px;padding:4px 10px;margin:0;cursor:pointer;
  font-size:1em;text-align:left;transition:background .2s,color .2s,box-shadow .2s;opacity:.7;filter:grayscale(30%);display:inline-block;text-decoration:none;font-family:inherit;line-height:1.3;}
#scMenuRoot .option.selected,#scMenuRoot .sc-choice.selected{background:#222;color:#fff;font-weight:bold;opacity:1;filter:none;box-shadow:0 0 8px 2px #fff,0 0 2px 1px #fff inset;}
#scMenuRoot .option:hover,#scMenuRoot .sc-choice:hover{background:#222;color:#fff;opacity:1;filter:none;box-shadow:0 0 8px 2px #fff,0 0 2px 1px #cfc inset;}
#scMenuRoot .sc-group-vertical{display:flex;flex-direction:column;gap:4px;margin:4px 0;}
#scMenuRoot .sc-group-2col{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:4px 0;}
#scMenuRoot .sc-group-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin:4px 0;}
#scMenuRoot .sc-extra{margin:2px 0 4px;}
#scMenuRoot .sc-section-heading{font-variant:small-caps;font-weight:bold;letter-spacing:1px;font-size:1.1em;display:block;margin:12px 0 2px;padding:0 16px;}
#scMenuRoot .sc-section-heading.extra{color:#9fd;}
#scMenuRoot .sc-hint-label{font-size:smaller;color:#aaa;margin-bottom:2px;display:block;}
#scMenuRoot .sc-choose-one-label{font-size:smaller;color:#aaa;margin-bottom:2px;margin-top:6px;}
#scMenuRoot .sc-warning{font-size:smaller;color:#a00;margin:0 16px 6px;}
#scMenuRoot .sc-note{font-size:smaller;color:#aaa;padding:0 16px;}
#scEfficiencyTable{width:100%;border-collapse:collapse;font-size:12px;}
#scEfficiencyTable th,#scEfficiencyTable td{padding:1px 6px;text-align:right;}
#scEfficiencyTable th:first-child,#scEfficiencyTable td:first-child{text-align:left;}
#scEfficiencyTable tr.sc-divider td{border-top:2px dashed #999;}
#scInfobox{position:absolute;left:0;bottom:0;pointer-events:none;z-index:6}
#scInfoText{position:absolute;left:8px;bottom:40px;z-index:6;pointer-events:none;font:11px Tahoma,Arial,sans-serif;color:#fff;text-shadow:0 1px 2px #000,0 0 4px #000;background:rgba(0,0,0,.35);padding:4px 6px;border-radius:4px;max-width:260px}`;

  let styleEl = null, scButton = null, showGraphs = false, menuRoot = null;
  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) { if (k === 'style') e.style.cssText = attrs[k]; else if (k.startsWith('on')) e[k] = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (text != null) e.textContent = text;
    return e;
  }
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---- control list, worded like Frozen Cookies' options page (fc_preferences.js)
  const ON_OFF = (name) => [name + ' OFF', name + ' ON'];
  const num = (key, unit, title, desc, min, max, prefix) => ({ key, unit, title, desc, min, max, prefix: prefix || '' });
  const FRENZY_PROMPT = 'What CpS multiplier should trigger this? (e.g. "7" will trigger during a Frenzy, "1" prevents triggering during a clot)';
  const CONTROLS = [
    { head: 'Auto clicking:' },
    { key: 'autoClick', hint: 'Auto-click big cookie and set speed.', display: ON_OFF('Autoclick'),
      extra: num('cookieClickSpeed', ' clicks/sec', 'Autoclicking!', 'How many times per second do you want to click? (The game ignores scripted clicks faster than 50 per second.)', 1, 50) },
    { key: 'autoFrenzy', hint: 'Auto-click for click frenzies.', display: ON_OFF('Autofrenzy'),
      extra: num('frenzyClickSpeed', ' clicks/sec', 'Autoclicking!', 'How many times per second do you want to click during click frenzies? (50 max)', 1, 50) },
    { key: 'autoGC', hint: 'Auto-click golden/wrath cookies (leaves Hand of Fate backfires like Clot and Ruin alone).', display: ON_OFF('Autoclick GC') },
    { key: 'autoReindeer', hint: 'Auto-click reindeer.', display: ON_OFF('Autoclick Reindeer') },
    { key: 'autoFortune', hint: 'Auto-click fortunes in news ticker.', display: ON_OFF('Auto Fortune') },
    { head: 'Auto-buying:' },
    { key: 'autoBuy', hint: 'Auto-buy most efficient building/upgrade.', display: ON_OFF('AutoBuy') },
    { key: 'otherUpgrades', hint: "Buy upgrades that don't boost CpS directly.", display: ON_OFF('Other Upgrades') },
    { key: 'autoBlacklistOff', hint: 'Turn off blacklist when goal is met.', display: ON_OFF('Auto Blacklist') },
    { key: 'blacklist', hint: 'Blacklist: Restrict purchases for achievements or challenges.', display: ['Blacklist OFF', 'Blacklist Mode SPEEDRUN', 'Blacklist Mode HARDCORE', 'Blacklist Mode GRANDMAPOCALYPSE', 'Blacklist Mode NO BUILDINGS'] },
    { key: 'mineLimit', hint: 'Limit mines for Godzamok combos.', display: ON_OFF('Mine Limit'), extra: num('mineMax', ' Mines', 'Mine Cap!', 'How many Mines should autobuy stop at?', 0, 100000) },
    { key: 'factoryLimit', hint: 'Limit factories for Godzamok combos.', display: ON_OFF('Factory Limit'), extra: num('factoryMax', ' Factories', 'Factory Cap!', 'How many Factories should autobuy stop at?', 0, 100000) },
    { key: 'pastemode', hint: 'Buy least efficient option (⚠️ not recommended).', display: ON_OFF('Pastemode') },
    { head: 'Other automation:' },
    { key: 'autoBulk', hint: 'Set bulk buy after ascension.', display: ['Auto Bulkbuy OFF', 'Auto Bulkbuy x10', 'Auto Bulkbuy x100'] },
    { key: 'autoBuyAll', hint: 'Auto-buy all upgrades until a chip is earned.', display: ON_OFF('Auto Buy All Upgrades') },
    { key: 'autoAscendToggle', hint: 'Auto-ascend at target chips (⚠️ skips upgrade screen).', display: ON_OFF('Auto Ascend') },
    { key: 'autoAscend', hint: 'Choose auto-ascend method.', display: ['Auto-ascend OFF', 'Auto-ascend at SET amount', 'Auto-ascend when prestige is DOUBLED'],
      extra: num('HCAscendAmount', ' heavenly chips', 'Autoascending!', 'How many heavenly chips do you want to auto-ascend at?', 0, 1e300) },
    { key: 'comboAscend', hint: 'Allow auto-ascend while a Frenzy of at least X is running.', display: ON_OFF('Ascend during combo'),
      extra: num('minCpSMult', ' minimum Frenzy', 'Autoascending!', FRENZY_PROMPT, 0, 1e300, 'x') },
    { key: 'autoWrinkler', hint: 'Auto-pop wrinklers.', display: ['Autopop Wrinklers OFF', 'Autopop Wrinklers EFFICIENTLY', 'Autopop Wrinklers INSTANTLY'] },
    { key: 'shinyPop', hint: 'Protect shiny wrinklers (⚠️ disables Elder Pledge).', display: ON_OFF('Save Shiny Wrinklers') },
    { key: 'autoSL', hint: 'Auto-harvest sugar lumps (optionally with Rigidel).', display: ['Autoharvest SL OFF', 'Autoharvest SL ON', 'Autoharvest SL ON + AUTO RIGIDEL'] },
    { key: 'dragonsCurve', hint: "Swap in Dragon's Curve (and Reality Bending) for lump harvest.", display: ["Auto-Dragon's Curve OFF", "Auto-Dragon's Curve ON", "Auto-Dragon's Curve ON + REALITY BENDING"] },
    { key: 'sugarBakingGuard', hint: "Don't spend lumps below 101 (keep Sugar Baking bonus).", display: ON_OFF('Sugar Baking Guard') },
    { key: 'autoGS', hint: 'Turn on the Golden Switch during click buffs when the boost is worth its 1-hour cost; turns it back off afterwards (only if it turned it on).', display: ON_OFF('Auto-Golden Switch') },
    { key: 'autoGodzamok', hint: 'Sell and rebuy mines/factories for Godzamok during click buffs, only when the extra clicking is worth more than the rebuy cost.', display: ON_OFF('Auto-Godzamok') },
    { key: 'autoBank', hint: 'Auto-upgrade bank office.', display: ON_OFF('Auto-Banking') },
    { key: 'autoBroker', hint: 'Auto-hire stock brokers.', display: ON_OFF('Auto-Broker') },
    { key: 'autoLoan', hint: 'Auto-take loans during click frenzies.', display: ['Auto-Loans OFF', 'Take loans 1 and 2', 'Take all 3 loans'],
      extra: num('minLoanMult', ' minimum Frenzy', 'Loans!', 'What CpS multiplier should trigger taking loans? (e.g. "777" for a Frenzy + Click Frenzy combo)', 0, 1e300, 'x') },
    { head: 'Pantheon:' },
    { key: 'autoWorshipToggle', hint: 'Auto-pick the best gods: simulates every lineup and slots the one with the most CpS (Godzamok stays in diamond with Auto-Godzamok).', display: ON_OFF('Auto Pantheon') },
    { head: 'Grimoire:' },
    { key: 'towerLimit', hint: 'Stop buying Wizard Towers at set max mana.', display: ON_OFF('Wizard Tower Cap'), extra: num('manaMax', ' max Mana', 'Mana Cap!', 'Set the maximum mana wizard towers should reach (37 recommended).', 0, 1000) },
    { key: 'autoCasting', hint: 'Smart Grimoire: reads the upcoming Hand of Fate results. Good results are cast as soon as the CpS multiplier reaches the minimum Frenzy setting; bad ones are skipped; two good ones in a row are double-cast.', display: ON_OFF('Smart Grimoire'),
      extra: num('minCpSMult', ' minimum Frenzy', 'Smart Grimoire!', FRENZY_PROMPT, 0, 1e300, 'x') },
    { key: 'autoSugarFrenzy', hint: 'Auto-buy Sugar Frenzy during a double-cast combo of X Frenzy.', display: ON_OFF('Auto Sugar Frenzy'),
      extra: num('minASFMult', ' minimum Frenzy', 'Sugar Frenzy!', 'What CpS multiplier should trigger buying Sugar Frenzy?', 0, 1e300, 'x') },
    { head: 'Dragon:' },
    { key: 'autoDragon', hint: 'Auto-upgrade dragon.', display: ON_OFF('Dragon Upgrading') },
    { key: 'petDragon', hint: 'Auto-pet dragon for drops.', display: ON_OFF('Dragon Petting') },
    { key: 'autoDragonToggle', hint: 'Auto-set dragon auras.', display: ON_OFF('Dragon Auras') },
    { note: "Set desired auras. Can't set same aura twice." },
    { key: 'autoDragonAura0', hint: 'Auto-set FIRST dragon aura.', display: AURAS },
    { key: 'autoDragonAura1', hint: 'Auto-set SECOND dragon aura.', display: AURAS },
    { key: 'autoDragonOrbs', hint: 'Auto-sell Yous for GC if Dragon Orbs aura is set and Godzamok is not.', display: ON_OFF('Auto-Dragon Orbs') },
    { key: 'orbLimit', hint: 'Limit Yous for Dragon Orbs combos.', display: ON_OFF('You Limit'), extra: num('orbMax', ' Yous', 'You Cap!', 'How many Yous should autobuy stop at?', 0, 100000) },
    { head: 'Season:' },
    { key: 'defaultSeasonToggle', hint: 'Auto-switch to selected season if no upgrades needed.', display: ON_OFF('Autobuy Seasons') },
    { key: 'defaultSeason', hint: 'Select default season.', display: ['Default Season OFF', 'Default Season BUSINESS DAY', 'Default Season CHRISTMAS', 'Default Season EASTER', 'Default Season HALLOWEEN', "Default Season VALENTINE'S DAY"] },
    { key: 'freeSeason', hint: 'Stay in free base season if no upgrades needed.', display: ['Free Season OFF', 'Free Season for CHRISTMAS and BUSINESS DAY', 'Free Season for ALL'] },
    { key: 'autoEaster', hint: 'Switch to Easter during Cookie Storm if eggs missing.', display: ON_OFF('Auto-Easter Switch') },
    { key: 'autoHalloween', hint: 'Switch to Halloween if wrinklers present and cookies missing.', display: ON_OFF('Auto-Halloween Switch') },
    { head: 'Bank: (delays autobuy until bank is full)' },
    { key: 'holdManBank', hint: 'Manual minimum bank (minutes of base CpS)', display: ON_OFF('Manual Bank'), extra: num('manBankMins', ' Minutes', 'Manual Bank!', 'How many minutes of base CpS should be kept in the bank?', 0, 1e9) },
    { key: 'holdSEBank', hint: 'Keep bank for Spontaneous Edifice.', display: ON_OFF('SE Bank') },
    { key: 'setHarvestBankPlant', hint: 'Keep bank for harvesting selected plant.', display: ['Harvesting Bank OFF', 'Harvesting Bank BAKEBERRY', 'Harvesting Bank CHOCOROOT', 'Harvesting Bank WHITE CHOCOROOT', 'Harvesting Bank QUEENBEET', 'Harvesting Bank DUKETATER', 'Harvesting Bank CRUMBSPORE', 'Harvesting Bank DOUGHSHROOM'] },
    { key: 'setHarvestBankType', hint: 'Increase bank for plant harvest during CpS buffs.', display: ['Harvesting during NO CpS MULTIPLIER', 'Harvesting during FRENZY', 'Harvesting during BUILDING SPECIAL', 'Harvesting during FRENZY + BUILDING SPECIAL'],
      extra: num('maxSpecials', ' Building specials', 'Harvest Bank!', 'How many building specials should the bank plan for? (1-20)', 1, 20) },
    { head: 'Stock market trader (Sleepy extra):', extraHead: true },
    { key: 'autoTrade', hint: 'Buy stocks well below their resting price, sell well above it.', display: ON_OFF('Auto-Trader') },
    { key: 'tradeUseTrend', hint: "Use the market's hidden price trend (peeks at game data).", display: ON_OFF('Hidden Trend') },
    { extras: [num('tradeBuyPct', '% of resting price (buy)', 'Auto-Trader!', 'Buy a stock when its price is at or below this % of its resting price.', 1, 200, '≤ '),
      num('tradeSellPct', '% of resting price (sell)', 'Auto-Trader!', 'Sell when the price reaches this % of its resting price (capped near the market ceiling).', 50, 1000, '≥ '),
      num('tradeMinProfit', '% min profit', 'Auto-Trader!', 'Never sell for less than this % over what the shares cost.', 0, 1000),
      num('tradeSpendPct', '% of spare cookies per tick', 'Auto-Trader!', 'Spend at most this % of your spare cookies (what is left after the autobuy bank and the next purchase) each market tick.', 1, 100)] },
    { head: 'Garden planter (Sleepy extra):', extraHead: true },
    { key: 'autoGarden', hint: 'Plant, weed and harvest the garden automatically.', display: ON_OFF('Auto-Planter') },
    { key: 'gardenMode', hint: 'What the planter works on.', display: ['Planter UNLOCK NEW SEEDS', 'Planter FARM ONE SEED'] },
    { key: 'gardenSeed', hint: 'Seed to farm (farm mode, or once every seed is unlocked).', seeds: true },
    { key: 'gardenHarvestMature', hint: 'Harvest payout plants (e.g. Bakeberry) as soon as they mature.', display: ON_OFF('Harvest Mature') },
    { key: 'gardenAutoSoil', hint: 'Switch soil automatically (woodchips to unlock, clay to farm).', display: ON_OFF('Auto Soil') },
    { head: 'Other:' },
    { key: 'FCshortcuts', hint: 'Enable keyboard shortcuts (a: autobuy, b: building spread, c: autoclick GC, e: export save, r: ascend, s: save, w: wrinklers).', display: ON_OFF('Shortcuts') },
    { key: 'simulatedGCPercent', hint: 'Assume % of GCs clicked for efficiency (100% recommended).', display: ['GC clicked 0%', 'GC clicked 100%'] },
    { head: 'Display:' },
    { key: 'showMissedCookies', hint: 'Show missed golden cookies in info panel.', display: ON_OFF('Show Missed GCs') },
    { key: 'numberDisplay', hint: 'Change number formatting style.', display: ['Number Display RAW', 'Number Display FULL (million, billion)', 'Number Display INITIALS (M, B)', 'Number Display SI PREFIXES (M, G, T)', 'Number Display SCIENTIFIC (6.3e12)'] },
    { key: 'fancyui', hint: 'Infobox style (text, wheel, or both).', display: ['Infobox OFF', 'Infobox TEXT ONLY', 'Infobox WHEEL ONLY', 'Infobox WHEEL & TEXT'] },
    { key: 'logging', hint: 'Log actions to console.', display: ON_OFF('Logging') },
    { key: 'purchaseLog', hint: 'Log all auto-purchases.', display: ON_OFF('Purchase Log') },
    { head: 'Warning: These options may slow the game.' },
    { key: 'fpsModifier', hint: 'Set game frame rate (default 30).', display: FPS_VALUES.map((v) => 'Frame Rate ' + v + ' fps') },
    { key: 'trackStats', hint: 'Track CpS/HC for graphs (may slow game).', display: ['Tracking OFF', 'Tracking EVERY 60s', 'Tracking EVERY 30m', 'Tracking EVERY 1h', 'Tracking EVERY 24h', 'Tracking ON UPGRADES', 'Tracking SMART TIMING'],
      action: { label: () => (showGraphs ? 'Hide Stat Graphs' : 'View Stat Graphs'), run: () => { showGraphs = !showGraphs; buildMenu(); } } },
    { key: 'recommendedSettings', hint: "Set all options to Frozen Cookies' recommended values (trader and planter settings are kept).", recommended: true }
  ];

  // ---- the game-style number prompt (same as FC's userInputPrompt)
  let pendingNumber = null;
  function numberPrompt(x) {
    pendingNumber = x;
    Game.Prompt('<id SleepyNumber><h3>' + esc(x.title) + '</h3><div class="block" style="text-align:center;">' + esc(x.desc) +
      '</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="scGenericInput" value="' + esc(S[x.key]) + '"/></div>',
      [['Confirm', 'SleepyCookies._confirmNumber();Game.ClosePrompt();'], 'Cancel']);
    const input = l('scGenericInput');
    if (input) { input.focus(); input.select(); }
  }
  function confirmNumber() {
    const x = pendingNumber, input = l('scGenericInput');
    pendingNumber = null;
    if (!x || !input) return;
    const v = Number(input.value);
    if (input.value.trim() === '' || isNaN(v) || v < x.min || v > x.max) { Game.Notify('Sleepy Cookies', 'Please enter a number from ' + B(x.min) + ' to ' + B(x.max) + '.', [1, 7], 4); return; }
    setOption(x.key, v);
  }
  function recommendedPrompt() {
    Game.Prompt('<id SleepyRecommended><h3>Recommended settings</h3><div class="block" style="text-align:center;">Set every option to Frozen Cookies\' recommended values?<br><small>Stock trader and garden planter settings are kept.</small></div>',
      [['Apply', 'SleepyCookies._applyRecommended();Game.ClosePrompt();'], 'Cancel']);
  }
  function applyRecommended() {
    Object.assign(S, RECOMMENDED);
    logEvent('recommendedSettings', 'Set all options to recommended values', true);
    beautifyDescriptions(); invalidate(); save(); buildMenu();
  }

  function setOption(key, v) {
    S[key] = v;
    if (key === 'autoCyclius' && v) S.autoWorshipToggle = 0;
    if (key === 'numberDisplay') beautifyDescriptions();
    if (key === 'gardenMode' || key === 'gardenSeed') gardenPlanSig = '';
    invalidate();
    save();
    Game.RefreshStore();
    buildMenu();
  }

  function choiceGroup(key, labels, values) {
    const n = labels.length;
    const group = el('div', { class: n === 2 ? 'sc-group-2col' : n > 8 ? 'sc-group-3col' : n > 4 ? 'sc-group-2col' : 'sc-group-vertical' });
    labels.forEach((label, i) => {
      const v = values ? values[i] : i;
      const b = el('a', { class: 'sc-choice' + (S[key] === v ? ' selected' : '') }, label);
      b.onclick = () => { PlaySound('snd/tick.mp3'); setOption(key, v); };
      group.append(b);
    });
    return group;
  }
  function extraButton(x) {
    const b = el('a', { class: 'option sc-extra' }, x.prefix + B(S[x.key]) + x.unit);
    b.onclick = () => { PlaySound('snd/tick.mp3'); numberPrompt(x); };
    return b;
  }
  function buildControls() {
    const sub = el('div', { class: 'subsection' });
    sub.append(el('div', { class: 'title' }, 'Sleepy Cookie Controls'), el('div', { class: 'sc-warning' }, ' ⚠️ All options take effect immediately.'));
    for (const c of CONTROLS) {
      if (c.head) { sub.append(el('div', { class: 'sc-section-heading' + (c.extraHead ? ' extra' : '') }, c.head)); continue; }
      if (c.note) { sub.append(el('div', { class: 'sc-note' }, c.note)); continue; }
      const listing = el('div', { class: 'listing' });
      if (c.extras) { c.extras.forEach((x) => { listing.append(extraButton(x), el('br')); }); sub.append(listing); continue; }
      listing.append(el('label', { class: 'sc-hint-label' }, c.hint));
      if (c.recommended) {
        const b = el('a', { class: 'option' }, 'Apply Recommended Settings');
        b.onclick = () => { PlaySound('snd/tick.mp3'); recommendedPrompt(); };
        listing.append(b);
      } else if (c.seeds) {
        const opts = seedOptions();
        listing.append(el('div', { class: 'sc-choose-one-label' }, 'Choose one:'), choiceGroup(c.key, opts.map((o) => o[1]), opts.map((o) => o[0])));
      } else {
        if (c.display.length > 2) listing.append(el('div', { class: 'sc-choose-one-label' }, 'Choose one:'));
        listing.append(choiceGroup(c.key, c.display));
      }
      if (c.extra) listing.append(extraButton(c.extra));
      if (c.action) { const b = el('a', { class: 'option sc-extra' }, c.action.label()); b.onclick = () => { PlaySound('snd/tick.mp3'); c.action.run(); }; listing.append(b); }
      sub.append(listing);
    }
    return sub;
  }
  function seedOptions() {
    const out = [['auto', 'Auto (Bakeberry > Wheat)']];
    const M = garden();
    if (M) for (const p of M.plantsById) if (p.unlocked && p.plantable) out.push([p.key, p.name]);
    return out;
  }

  // ---- info sections (FC's menu: Autobuy, Golden Cookie, Frenzy Times, HC, Harvesting, Other, Internal)
  const listing = (k, v) => '<div class="listing"><b>' + k + ':</b> ' + v + '</div>';
  const subsection = (title, body) => '<div class="subsection"><div class="title">' + title + '</div>' + body + '</div>';
  function autobuyInfoHTML() {
    const rec = nextPurchase(), chain = nextChainedPurchase();
    const chained = !(rec.id === chain.id && rec.type === chain.type);
    const bank = bestBank(chain.efficiency);
    const actualCps = Game.cookiesPs + Game.mouseCps() * clickSpeed();
    let h = listing('Next Purchase', esc(rec.purchase.name));
    if (chained) h += listing('Building Chain to', esc(chain.purchase.name));
    h += listing('Time til completion', timeDisplay(divCps(Math.max(0, rec.cost + bank.cost - Game.cookies), actualCps)));
    if (chained) h += listing('Time til Chain completion', timeDisplay(divCps(Math.max(0, chain.cost + bank.cost - Game.cookies), actualCps)));
    if (Game.HasUnlocked('Chocolate egg') && !Game.Has('Chocolate egg')) {
      const recoup = (rec.type === 'upgrade' ? rec.cost : rec.cost * 0.425) / (rec.delta_cps * 21);
      h += listing('Time to Recoup Chocolate', timeDisplay(divCps(Math.max(0, rec.cost + bank.cost - Game.cookies), effectiveCps()) + recoup));
    }
    h += listing('Cost', B(rec.cost)) + listing('Golden Cookie Bank', B(bank.cost)) + listing('Base Δ CpS', B(rec.base_delta_cps)) +
      listing('Full Δ CpS', B(rec.delta_cps)) + listing('Purchase Efficiency', B(rec.efficiency));
    if (chained) h += listing('Chain Efficiency', B(chain.efficiency));
    if (bank.efficiency > 0) h += listing('Golden Cookie Efficiency', B(bank.efficiency));
    if (!S.autoBuy) h += '<div class="listing"><small>AutoBuy is off: this is what it would buy.</small></div>';
    return subsection('Autobuy Information', h);
  }
  function restInfoHTML() {
    let out = '';
    const target = W.targetBank, current = W.currentBank;
    const curCookies = Math.min(Game.cookies, target.cost);
    const maxCookies = bestBank(Number.POSITIVE_INFINITY).cost;
    let h = listing('Current Frenzy', B(cpsBonus() * clickBuffBonus()));
    h += listing('Current Average Cookie Value' + (target.cost === current.cost ? '' : ' (Building Bank)') + (curCookies === maxCookies ? ' (Max)' : ''), B(cookieValue(curCookies)));
    if (target.cost !== current.cost) h += listing('Target Average Cookie Value', B(cookieValue(target.cost)));
    if (curCookies !== maxCookies) h += listing('Max Average Cookie Value', B(cookieValue(maxCookies)));
    h += listing('Max Lucky Cookie Value', B(maxLuckyValue())) + listing('Cookie Bank Required for Max Lucky', B(maxLuckyValue() * 10));
    h += listing('Max Chain Cookie Value', B(calculateChainValue(chainBank(), Game.cookiesPs, 7 - Game.elderWrath / 3))) + listing('Cookie Bank Required for Max Chain', B(chainBank()));
    h += listing('Estimated Cookie CpS', B(gcPs(cookieValue(curCookies)))) + listing('Golden Cookie Clicks', B(Game.goldenClicks));
    if (S.showMissedCookies) h += listing('Missed Golden Cookie Clicks', B(Game.missedGoldenClicks));
    h += listing('Last Golden Cookie Effect', esc(Game.shimmerTypes.golden.last || '-'));
    const gt = Game.shimmerTypes.golden;
    h += listing('Next Golden Cookie (50% / 99%)', timeDisplay(Math.max(0, probabilitySpan('golden', gt.time, 0.5) - gt.time) / Game.fps) + ' / ' + timeDisplay(Math.max(0, probabilitySpan('golden', gt.time, 0.99) - gt.time) / Game.fps));
    out += subsection('Golden Cookie Information', h);

    const ft = {};
    for (const k in D.frenzyTimes) ft[Math.round(parseFloat(k))] = (ft[Math.round(parseFloat(k))] || 0) + D.frenzyTimes[k];
    const keys = Object.keys(ft).map(Number).sort((a, b) => a - b);
    out += subsection('Frenzy Times', keys.length ? keys.map((k) => listing('Total Recorded Time at x' + B(k), timeDisplay(ft[k] / 1000))).join('') : '<div class="listing">None recorded yet.</div>');

    const resetHC = Game.HowMuchPrestige(Game.cookiesReset + Game.cookiesEarned + wrinklerValue() + chocolateValue());
    const showTiming = Date.now() - D.lastHCTime > 60000;
    h = listing('HC Now', B(Game.heavenlyChips)) + listing('HC After Reset', B(resetHC));
    if (showTiming) h += listing('Estimated time to next HC', nextHC());
    if (Game.heavenlyChips < resetHC) {
      if (showTiming) {
        h += listing('Time since last HC', timeDisplay((Date.now() - D.lastHCTime) / 1000));
        if (D.lastHCAmount - 1 >= Game.heavenlyChips) h += listing('Time to get last HC', timeDisplay((D.lastHCTime - D.prevLastHCTime) / 1000));
      }
      if (D.maxHCPercent > 0) h += listing('Max HC Gain/hr', B(D.maxHCPercent));
      h += listing('Average HC Gain/hr', B((3600 * (D.lastHCAmount - Game.heavenlyChips)) / ((D.lastHCTime - Game.startDate) / 1000)));
    }
    out += subsection('Heavenly Chips Information', h);

    if (S.setHarvestBankPlant) {
      harvestBank();
      const single = (baseCps() * 60 * harvestInfo.minutes * harvestInfo.frenzy * harvestInfo.building) / Math.pow(10, Math.max(1, S.maxSpecials));
      out += subsection('Harvesting Information', listing('Base CpS', B(baseCps())) + listing('Plant to harvest', harvestInfo.plant) +
        listing('Minutes of CpS', harvestInfo.minutes + ' min') + listing('Max percent of Bank', harvestInfo.maxPercent * 100 + ' %') +
        listing('Single ' + harvestInfo.plant + (S.setHarvestBankPlant < 6 ? ' harvesting' : ' exploding'), B(single)) +
        listing('Full garden ' + (S.setHarvestBankPlant < 6 ? 'harvesting' : 'exploding') + ' (36 plots)', B(36 * single)));
    }

    const cps = baseCps() + baseClickingCps(clickSpeed());
    h = listing('Base CpS' + (S.autoClick ? ' + Autoclick' : '') + (Game.hasBuff('Frenzy') ? '' : ' (*)'), B(cps)) +
      listing('Frenzy CpS' + (S.autoClick ? ' + Autoclick' : '') + (Game.hasBuff('Frenzy') ? ' (*)' : ''), B(cps * 7)) + listing('Estimated Effective CpS', B(effectiveCps()));
    if (Game.HasUnlocked('Chocolate egg') && !Game.Has('Chocolate egg')) {
      h += listing('Chocolate Egg Value', B(chocolateValue()));
      if (!Game.hasAura('Earth Shatterer')) h += listing('+ Earth Shatterer', B(chocolateValue(null, true)));
    }
    if (liveWrinklers().length) h += listing('Wrinkler Value', B(wrinklerValue()));
    if (grimoire()) h += listing('Next Hand of Fate spells', [0, 1, 2, 3].map(nextSpellName).join(', '));
    if (S.autoCasting) h += listing('Smart Grimoire', esc(grimoireInfo.text));
    if (S.autoWorshipToggle) h += listing('Auto Pantheon', esc(pantheonInfo.text));
    const Mk = market();
    if (S.autoTrade && Mk) {
      let held = 0, val = 0;
      for (const g of Mk.goodsById) { held += g.stock; val += g.stock * g.val; }
      h += listing('Auto-Trader', held + ' shares worth $' + B(val) + ', realized profit $' + B(D.tradeProfit) + ', ' + Mk.brokers + ' brokers');
    }
    if (S.autoGarden) h += listing('Garden Planter', esc(gardenStatus));
    h += listing('Game Seed', esc(Game.seed)) + listing('Building Spread', Game.ObjectsById.map((b) => b.amount).join('/'));
    out += subsection('Other Information', h);

    if (showGraphs) out += subsection('Stat Graphs', '<div class="listing"><canvas id="scGraph" width="560" height="260"></canvas></div>' +
      '<div class="listing"><a class="option" onclick="SleepyCookies._recordStats()">Record Stats Now</a> <a class="option" onclick="SleepyCookies._clearStats()">Clear Stats</a></div>');

    let t = '<table id="scEfficiencyTable"><tr><th>Building</th><th>Eff%</th><th>Efficiency</th><th>Cost</th><th>Δ CpS</th></tr>';
    for (const r of recommendationList().slice(0, 80)) {
      t += '<tr><td><b>' + esc(r.purchase.name) + (r.purchase.unlocked === 0 ? ' (C)' : '') + '</b></td><td>' + Math.floor(r.efficiencyScore * 10000) / 100 + '%</td><td>' +
        (r.pruned ? '&gt;' : '') + B(r.efficiency) + '</td><td>' + B(r.cost) + '</td><td>' + (r.pruned ? '-' : B(r.delta_cps)) + '</td></tr>';
    }
    t += '<tr><td colspan="5">&nbsp;</td></tr><tr class="sc-divider"><td colspan="5">&nbsp;</td></tr>';
    for (const bk of [['Lucky Bank', luckyBank()], ['Lucky Frenzy Bank', luckyFrenzyBank()], ['Chain Bank', chainBank()]]) {
      t += '<tr><td colspan="2"><b>' + bk[0] + (bk[1] <= Game.cookies ? ' (*)' : '') + '</b></td><td>' + B(cookieEfficiency(Game.cookies, bk[1])) + '</td><td>' +
        B(Math.max(0, bk[1] - Game.cookies)) + '</td><td>' + B(effectiveCps(bk[1]) - effectiveCps()) + '</td></tr>';
    }
    t += '<tr><td colspan="5">&nbsp;</td></tr><tr class="sc-divider"><td colspan="5">&nbsp;</td></tr>';
    const eff0 = effectiveCps();
    [['Pledging/Appeased', 0], ['One Mind/Awoken', 1], ['Displeased', 2], ['Full Wrath/Angered', 3]].forEach(([n, lv]) => {
      const e = effectiveCps(Game.cookies, lv);
      t += '<tr><td colspan="2"><b>' + n + (Game.elderWrath === lv ? ' (*)' : '') + '</b></td><td colspan="2" title="Ratio of Effective CpS vs Base CpS">' + B(e / baseCps()) + '</td><td>' + B(e - eff0) + '</td></tr>';
    });
    t += '</table>';
    out += subsection('Internal Information', t);
    return out;
  }

  // ---- menu plumbing
  function buildMenu() {
    if (Game.onMenu !== 'sc_menu') return;
    const menu = l('menu');
    menu.innerHTML = '<div class="close menuClose" ' + Game.clickStr + '="Game.ShowMenu();">x</div>';
    menuRoot = el('div', { id: 'scMenuRoot' });
    menuRoot.append(el('div', { class: 'section' }, 'Sleepy Cookies v' + VERSION));
    if (Game.version > TESTED_GAME_VERSION) menuRoot.append(el('div', { class: 'sc-warning', style: 'text-align:center' }, 'Built for Cookie Clicker v' + TESTED_GAME_VERSION + '; this game is v' + Game.version + '.'));
    const row = el('div', { class: 'sc-btnrow' });
    const info = el('a', { class: 'option sc-top-btn', title: 'Open the Cookie Clicker about/version info panel' }, 'Cookie Clicker Info');
    info.onclick = () => Game.ShowMenu('log');
    row.append(info);
    menuRoot.append(row);
    const autobuy = el('div', { id: 'scAutobuyInfo' });
    const rest = el('div', { id: 'scRestInfo' });
    menuRoot.append(autobuy, buildControls(), rest);
    menu.append(menuRoot);
    refreshMenuInfo();
  }
  function refreshMenuInfo() {
    if (Game.onMenu !== 'sc_menu' || !l('scMenuRoot')) return;
    l('scAutobuyInfo').innerHTML = autobuyInfoHTML();
    l('scRestInfo').innerHTML = restInfoHTML();
    if (showGraphs) drawGraphs();
  }
  function refreshPanel() { if (Game.onMenu === 'sc_menu') buildMenu(); }
  function statusUiTick() { refreshMenuInfo(); }

  function drawGraphs() {
    const canvas = l('scGraph');
    if (!canvas) return;
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#ccc'; c.font = '11px Tahoma';
    const pts = D.trackedStats;
    if (pts.length < 2) { c.fillText('Need at least 2 data points. Turn on tracking above or press "Record Stats Now".', 8, 24, w - 16); return; }
    const pad = { l: 60, r: 56, t: 22, b: 24 };
    const t0 = pts[0].time, t1 = pts[pts.length - 1].time || t0 + 1;
    const X = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (w - pad.l - pad.r);
    const logs = pts.flatMap((p) => [p.baseCps, p.effectiveCps]).filter((v) => v > 0).map(Math.log10);
    const lmin = Math.floor(Math.min(...logs)), lmax = Math.max(lmin + 1, Math.ceil(Math.max(...logs)));
    const Y = (v) => h - pad.b - ((Math.log10(Math.max(v, 1e-9)) - lmin) / (lmax - lmin)) * (h - pad.t - pad.b);
    const hcMax = Math.max(...pts.map((p) => p.hc)), hcMin = Math.min(...pts.map((p) => p.hc));
    const Y2 = (v) => h - pad.b - ((v - hcMin) / Math.max(1e-9, hcMax - hcMin)) * (h - pad.t - pad.b);
    c.strokeStyle = '#666'; c.beginPath(); c.moveTo(pad.l, pad.t); c.lineTo(pad.l, h - pad.b); c.lineTo(w - pad.r, h - pad.b); c.stroke();
    for (let e = lmin; e <= lmax; e += Math.max(1, Math.ceil((lmax - lmin) / 5))) c.fillText(B(Math.pow(10, e)), 4, Y(Math.pow(10, e)) + 4, pad.l - 6);
    c.fillText(B(hcMax), w - pad.r + 4, pad.t + 4, pad.r - 6); c.fillText(B(hcMin), w - pad.r + 4, h - pad.b, pad.r - 6);
    c.fillText(timeDisplay(t0 / 1000), pad.l, h - 6); c.fillText(timeDisplay(t1 / 1000), w - pad.r - 70, h - 6);
    const line = (color, f, y) => { c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); pts.forEach((p, i) => { const yy = y(f(p)); if (i) c.lineTo(X(p.time), yy); else c.moveTo(X(p.time), yy); }); c.stroke(); };
    line('#ffde5f', (p) => p.baseCps, Y); line('#00c4ff', (p) => p.effectiveCps, Y); line('#b6f08b', (p) => p.hc, Y2);
    c.fillStyle = '#ffde5f'; c.fillText('Base CpS', pad.l + 4, 14); c.fillStyle = '#00c4ff'; c.fillText('Effective CpS', pad.l + 74, 14); c.fillStyle = '#b6f08b'; c.fillText('Earned HC (right axis)', pad.l + 170, 14);
  }

  function installMenu() {
    styleEl = el('style', { id: 'sleepyCookiesStyle' });
    styleEl.textContent = CSS;
    document.head.append(styleEl);
    const logBtn = l('logButton');
    scButton = el('div', { id: 'scButton', class: 'panelButton' });
    scButton.innerHTML = '<div>Sleepy<br>Cookies</div>';
    scButton.addEventListener('click', () => Game.ShowMenu('sc_menu'));
    logBtn.parentNode.insertBefore(scButton, logBtn);
    const logDisplay = logBtn.style.display;
    logBtn.style.display = 'none';
    const origShowMenu = Game.ShowMenu, origUpdateMenu = Game.UpdateMenu;
    override(Game, 'ShowMenu', function () {
      const r = origShowMenu.apply(this, arguments);
      if (scButton) scButton.className = Game.onMenu === 'sc_menu' ? 'panelButton selected' : 'panelButton';
      return r;
    });
    override(Game, 'UpdateMenu', function () {
      if (Game.onMenu !== 'sc_menu') return origUpdateMenu.apply(this, arguments);
      buildMenu();
    });
    restore.push(() => {
      if (Game.onMenu === 'sc_menu') { Game.onMenu = ''; Game.removeClass('onMenu'); l('menu').innerHTML = ''; }
      if (scButton) scButton.remove();
      scButton = null;
      logBtn.style.display = logDisplay;
      if (styleEl) styleEl.remove();
    });
  }

  // ================================================================== infobox (FC's timer wheel / text in the milk area)
  let infoCanvas = null, infoText = null;
  function timerList() {
    const out = [];
    const bankTotal = delayAmount(), rec = nextPurchase(), chain = nextChainedPurchase();
    const purchaseTotal = isFinite(rec.cost) ? rec.cost : 0;
    const actualCps = Game.cookiesPs + Game.mouseCps() * clickSpeed();
    const maxT = Game.shimmerTypes.golden.maxTime || 1;
    if (chain.cost > rec.cost && chain.type === 'upgrade') {
      const total = upgradePrereqCost(chain.purchase, true) - chain.purchase.getPrice();
      const done = total - (upgradePrereqCost(chain.purchase) - chain.purchase.getPrice());
      out.push({ p: (done + Math.max(Game.cookies - bankTotal, 0)) / (bankTotal + total), c: '#333', name: 'Chain to: ' + chain.purchase.name, t: timeDisplay(divCps(Math.max(total + bankTotal - Game.cookies - done, 0), actualCps)) });
    }
    const name = rec.type === 'building' && Game.season === 'fools' && Game.foolObjects[rec.purchase.name] ? Game.foolObjects[rec.purchase.name].name : rec.purchase.name;
    out.push({ p: Game.cookies / (bankTotal + purchaseTotal || 1), c: '#111', name: 'Next: ' + name, t: timeDisplay(divCps(Math.max(purchaseTotal + bankTotal - Game.cookies, 0), actualCps)) });
    if (bankTotal > 0 && Game.cookies < bankTotal) out.push({ p: Math.min(Game.cookies, bankTotal) / (bankTotal + purchaseTotal), c: '#fcd400', name: 'Bank completion', t: timeDisplay(divCps(Math.max(bankTotal - Game.cookies, 0), actualCps)) });
    const gt = Game.shimmerTypes.golden;
    const d50 = probabilitySpan('golden', gt.time, 0.5) - gt.time;
    if (d50 > 0) {
      const d99 = probabilitySpan('golden', gt.time, 0.99) - gt.time, d1 = probabilitySpan('golden', gt.time, 0.01) - gt.time;
      out.push({ p: d99 / maxT, c: '#ff9b00', name: 'GC maximum (99%)', t: timeDisplay(d99 / Game.fps) });
      out.push({ p: d50 / maxT, c: '#ffde5f', name: 'GC estimate (50%)', t: timeDisplay(d50 / Game.fps) });
      out.push({ p: d1 / maxT, c: '#ffeb00', name: 'GC minimum (1%)', t: timeDisplay(d1 / Game.fps) });
    }
    const buffRows = [['Clot', '#ff3605', 'multCpS'], ['Elder frenzy', '#4f0007', 'multCpS'], ['Frenzy', '#ffde5f', 'multCpS'], ['Dragon Harvest', '#ceb431', 'multCpS'],
      ['Click frenzy', '#00c4ff', 'multClick'], ['Dragonflight', '#b7ce31', 'multClick'], ['Cursed finger', '#174f01', null], ['Cookie storm', '#00c4ff', null]];
    for (const [n, c, m] of buffRows) {
      const b = Game.hasBuff(n);
      if (b) out.push({ p: b.time / maxT, c, name: n + (m ? ' (x' + B(b[m]) + ')' : '') + ' time', t: timeDisplay(b.time / Game.fps) });
    }
    const bb = buildingBuff();
    if (bb) out.push({ p: bb.time / maxT, c: '#daa520', name: 'Building special (x' + B(bb.multCpS) + ') time', t: timeDisplay(bb.time / Game.fps) });
    return out;
  }
  function infoboxTick() {
    const left = l('sectionLeft');
    if (!S.fancyui || !left || Game.OnAscend) { if (infoCanvas) infoCanvas.style.display = 'none'; if (infoText) infoText.style.display = 'none'; return; }
    const rows = timerList();
    const wantWheel = S.fancyui === 2 || S.fancyui === 3, wantText = S.fancyui === 1 || S.fancyui === 3;
    if (!infoCanvas) { infoCanvas = el('canvas', { id: 'scInfobox', width: 150, height: 150 }); left.append(infoCanvas); }
    if (!infoText) { infoText = el('div', { id: 'scInfoText' }); left.append(infoText); }
    infoCanvas.style.display = wantWheel ? 'block' : 'none';
    infoText.style.display = wantText ? 'block' : 'none';
    if (wantText) {
      infoText.style.bottom = wantWheel ? '158px' : '8px';
      infoText.innerHTML = rows.map((r) => '<div><span style="color:' + (r.c === '#111' || r.c === '#333' ? '#fff' : r.c) + '">' + r.name + ':</span> ' + r.t + '</div>').join('') +
        '<div>Frenzy: x' + B(cpsBonus() * clickBuffBonus()) + '</div>';
    }
    if (wantWheel) {
      const c = infoCanvas.getContext('2d');
      c.clearRect(0, 0, 150, 150);
      let r = 68;
      for (const row of rows.slice(0, 9)) {
        c.lineWidth = 6;
        c.strokeStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(75, 75, r, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = row.c === '#111' ? '#e8e6f2' : row.c === '#333' ? '#9b8fd8' : row.c;
        c.beginPath(); c.arc(75, 75, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, row.p || 0))); c.stroke();
        r -= 8;
      }
      c.fillStyle = '#fff'; c.font = 'bold 12px Tahoma'; c.textAlign = 'center';
      c.fillText('x' + B(cpsBonus() * clickBuffBonus()), 75, 80);
    }
  }

  // ================================================================== keyboard shortcuts (FC: a b c e r s w)
  function promptCopy(text) { Game.promptOn = 1; window.prompt('Copy to clipboard: Ctrl+C, Enter', text); Game.promptOn = 0; }
  function onKey(e) {
    if (!S.FCshortcuts || Game.promptOn || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (k === 'a') { S.autoBuy = S.autoBuy ? 0 : 1; logEvent('Shortcut', 'Autobuy ' + (S.autoBuy ? 'ON' : 'OFF'), true); save(); refreshPanel(); }
    else if (k === 'b') promptCopy(Game.ObjectsById.map((b) => b.amount).join('/'));
    else if (k === 'c') { S.autoGC = S.autoGC ? 0 : 1; logEvent('Shortcut', 'Autoclick GC ' + (S.autoGC ? 'ON' : 'OFF'), true); save(); refreshPanel(); }
    else if (k === 'e') promptCopy(Game.WriteSave(1));
    else if (k === 'r') Game.Ascend();                 // FC called Game.Reset() here, which reset the run with no prompt
    else if (k === 's') Game.WriteSave();
    else if (k === 'w') Game.Notify('Wrinkler info', 'Popping all wrinklers will give you ' + B(wrinklerValue()) + ' cookies. <input type="button" value="Click here to pop all wrinklers" onclick="Game.CollectWrinklers()"></input>', [19, 8], 7);
  }

  // ================================================================== game overrides (all restored by stop())
  const restore = [];
  function override(obj, key, value) { const old = obj[key]; restore.push(() => { obj[key] = old; }); obj[key] = value; }
  const descOriginals = new Map();
  function beautifyDescriptions() {
    const re = /\d\d?\d?(?:,\d\d\d)+/;
    const fix = (o) => {
      if (!descOriginals.has(o)) descOriginals.set(o, o.desc);
      const orig = descOriginals.get(o);
      o.desc = S.numberDisplay === 1 ? orig : orig.replace(re, (str) => fcBeautify(parseInt(str.replace(/,/g, ''), 10)));
    };
    Object.values(Game.AchievementsById).forEach(fix);
    Object.values(Game.UpgradesById).forEach(fix);
  }
  function tickerLines() {
    if (Game.cookiesEarned >= 1000 && Math.random() < 0.3 && Game.season !== 'fools') return [
      'News : debate about whether using Sleepy Cookies constitutes cheating continues to rage. Violence escalating.',
      'News : bakers report suspiciously efficient purchases at local cookie plant; owner "just resting their eyes".',
      'News : scientists baffled as cookies are now measured in "efficiency" instead of calories.'];
    const bank = W.targetBank.cost;
    if (bank > 0 && Math.random() < 0.3) return ['You wonder if those ' + B(bank) + ' banked cookies are still fresh.'];
    const rec = W.caches.nextPurchase;
    if (rec && isFinite(rec.cost) && Math.random() < 0.3) return ['You should buy ' + rec.purchase.name + ' next.'];
    return [];
  }
  function installOverrides() {
    override(window, 'Beautify', fcBeautify);
    override(Game, 'sayTime', function (time) { return timeDisplay(time / Game.fps); });
    override(Game, 'Reset', fcReset);
    override(Game, 'Ascend', fcAscend);
    const oldDraw = Game.tooltip.draw;
    override(Game.tooltip, 'draw', function (from, text, origin) {
      if (typeof text === 'string' && text.includes('Devastation') && Game.hasBuff('Devastation')) text = text.replace(/\+\d+%/, '+' + Math.round((Game.hasBuff('Devastation').multClick - 1) * 100) + '%');
      return oldDraw.call(this, from, text, origin);
    });
    const gold = Game.shimmerTypes.golden, oldPop = gold.popFunc;
    override(gold, 'popFunc', function (me) {
      const p = Game.Popup;
      Game.Popup = function (text, x, y) { logEvent('GC', String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); return p(text, x, y); };
      try { return oldPop.call(this, me); } finally { Game.Popup = p; }
    });
    Game.registerHook('reincarnate', onReincarnate);
    Game.registerHook('ticker', tickerLines);
    restore.push(() => { Game.removeHook('reincarnate', onReincarnate); Game.removeHook('ticker', tickerLines); });
    document.addEventListener('keydown', onKey);
    restore.push(() => document.removeEventListener('keydown', onKey));
    beautifyDescriptions();
    restore.push(() => { for (const [o, d] of descOriginals) o.desc = d; });
    restore.push(() => { if (fthofTooltipEl) fthofTooltipEl.onmouseover = fthofTooltipOld; });
    restore.push(() => { if (infoCanvas) infoCanvas.remove(); if (infoText) infoText.remove(); });
    installMenu();
    if (!Game.HasAchiev('Third-party')) Game.Win('Third-party');
  }

  // ================================================================== scheduler (FC's polling rates: base tick 100 ms)
  let tickN = 0, tickTimer = 0;
  const run = {};
  const job = (name, fn) => (run[name] = safe(name, fn));
  job('main', function () {
    if (Game.OnAscend || Game.AscendTimer) return;
    trackHC();
    updateCaches();
    lumpAction();
    if (S.autoWrinkler === 2 || (S.autoWrinkler === 1 && tickN % 5 === 0)) wrinklerAction();
    if (S.autoBuy) rewardCookieAction();
    const t0 = performance.now();
    for (let i = 0; i < 200 && autoBuyStep(); i++) {
      updateCaches(true);
      if (performance.now() - t0 > 30) break;          // keep the game smooth when the bank is huge
    }
    autoAscendAction();
    const fps = FPS_VALUES[S.fpsModifier] || 30;
    if (Game.fps !== fps) Game.fps = fps;
    shimmerAction();
    autoBlacklistOffAction();
    trackFrenzy();
  });
  job('clickRate', updateClickRate);
  job('autoGS', autoGSAction);
  job('autoGodzamok', autoGodzamokAction);
  job('autoDragon', autoDragonAction);
  job('autoLoan', autoLoanAction);
  job('autoSugarFrenzy', autoSugarFrenzyAction);
  job('autoEaster', autoEasterAction);
  job('autoHalloween', autoHalloweenAction);
  job('autoPantheon', () => autoPantheonAction(false));
  job('autoCast', smartGrimoireAction);
  job('autoFortune', autoFortuneAction);
  job('autoBank', autoBankAction);
  job('autoBroker', autoBrokerAction);
  job('petDragon', petDragonAction);
  job('dragonAuras', autoDragonAuraAction);
  job('dragonOrbs', autoDragonOrbsAction);
  job('otherUpgrades', buyOtherUpgrades);
  job('trader', traderAction);
  job('garden', gardenAction);
  job('stats', statsAction);
  job('ui', statusUiTick);
  job('infobox', infoboxTick);
  job('spellTooltip', hookSpellTooltip);
  job('save', saveNow);

  function tick() {
    tickN++;
    const busy = Game.OnAscend || Game.AscendTimer;
    run.main();
    run.clickRate();
    if (!busy) {
      run.autoGS(); run.autoGodzamok(); run.autoDragon();
      if (tickN % 2 === 0) { run.autoLoan(); run.autoSugarFrenzy(); }
      if (tickN % 5 === 0) { run.autoEaster(); run.autoHalloween(); run.autoPantheon(); }
      if (tickN % 10 === 0) {
        run.autoCast(); run.autoFortune(); run.autoBank(); run.autoBroker(); run.petDragon(); run.dragonAuras(); run.dragonOrbs();
        run.otherUpgrades(); run.trader(); run.garden(); run.spellTooltip();
      }
    }
    if (tickN % 10 === 0) { run.stats(); run.ui(); }
    if (tickN % 3 === 0) run.infobox();
    if (tickN % 300 === 0) run.save();
  }

  function start() {
    installOverrides();
    updateCaches(true);
    tickTimer = setInterval(tick, 100);
    logEvent('Load', 'Sleepy Cookies v' + VERSION + ' loaded on Cookie Clicker v' + Game.version);
    console.log('[Sleepy Cookies] v' + VERSION + ' loaded. Open the "Sleepy Cookies" button (top right of the middle panel). Unload with SleepyCookies.stop().');
    if (Game.version > TESTED_GAME_VERSION) console.warn('[Sleepy Cookies] Tested on v' + TESTED_GAME_VERSION + '; this game is v' + Game.version + '.');
  }
  function stop(quiet) {
    clearInterval(tickTimer);
    if (R.clickTimer) clearInterval(R.clickTimer);
    R.clickTimer = 0; R.clickRateNow = 0;
    while (restore.length) { try { restore.pop()(); } catch (e) { /* keep going */ } }
    if (W.sim) simEnd();
    Game.fps = R.origFps;
    saveNow();
    if (window.SleepyCookies && window.SleepyCookies.version === VERSION) delete window.SleepyCookies;
    if (!quiet) console.log('[Sleepy Cookies] Unloaded.');
  }

  window.SleepyCookies = {
    version: VERSION,
    settings: S,
    data: D,
    stop,
    nextPurchase: () => nextPurchase(),
    recommendations: () => recommendationList(),
    nextSpell: (i) => nextSpellName(i || 0),
    effectiveCps: () => effectiveCps(),
    gardenPlan: () => gardenPlan,
    resetSettings: () => { localStorage.removeItem(STORE_KEY); console.log('[Sleepy Cookies] Settings reset. Paste the script again to reload.'); },
    _confirmNumber: () => confirmNumber(),
    _applyRecommended: () => applyRecommended(),
    _recordStats: () => { saveStats(); refreshMenuInfo(); },
    _clearStats: () => { D.trackedStats = []; save(); refreshMenuInfo(); },
    _internal: { combo2, pantheonInfo, grimoireInfo, autoPantheonAction, W, R, setDragonAura, swapIn, bestBank, delayAmount, cookieValue }
  };
  start();
})();
