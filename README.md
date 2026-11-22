# Sleepy Cookies

Automation add-on for the web version of [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/), built and tested on **v2.058**.

Sleepy Cookies is a rebuild of [Frozen Cookies](https://github.com/erbkaiser/FrozenCookies) for the current game, with its bugs fixed. It adds:
- **Smart Grimoire:** predicts upcoming spells and decides when to cast.
- **Auto Pantheon:** picks the best gods for you.
- **Stock market trader**
- **Garden planter**

It has no dependencies: it's a single file.

## Load it

Open Cookie Clicker, press **F12 → Console**, paste this and press Enter:

```js
Game.LoadMod('https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy_cookies.js');
```

Or save this as a bookmark and click it while the game is open:

```
javascript:(function(){Game.LoadMod('https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy_cookies.js');})();
```

To open the settings, click the **Sleepy Cookies** button at the top of the middle panel, where the game's Info button was. Info has moved inside the Sleepy Cookies menu.

Your settings are saved in your browser, so they're still there next time you load the add-on.

To try it out quickly, scroll to the bottom of the menu and click **Apply recommended settings**.

## What it does

### Clicking
- Clicks the big cookie up to 50 times a second, and can click faster during click frenzies. 50 is the game's limit for scripted clicks.
- Clicks golden cookies, wrath cookies and reindeer.
  - Golden cookies created by Force the Hand of Fate carry a known effect. A Clot or Ruin from a backfire is left to fade instead of being clicked.
- Clicks fortunes in the news ticker.

### Buying
- Buys whichever building or upgrade gives the most CpS for its price, using Frozen Cookies' efficiency formula. That formula also counts golden cookies, clicking, wrinklers and reindeer.
- Works out what's needed to unlock an upgrade (buildings, other upgrades, Santa levels) and buys towards it.
- **Cookie bank:** saves a bank of cookies so Lucky golden cookies pay out in full. You can also set:
  - a manual minimum bank
  - a Spontaneous Edifice bank
  - a garden harvest bank
- **Blacklists:** Speedrun, Hardcore, Grandmapocalypse and No buildings.
- **Building limits:** caps on mines, factories, wizard towers and Yous.
- Buys useful upgrades the formula can't value, such as eggs, dragon drops and Green yeast digestives.
- Buys Santa levels and reward cookies, switches seasons to collect seasonal upgrades, and can stay in a free season.

### Other automation
- **Wrinklers:** pops them efficiently (only when it speeds up the next purchase) or instantly. Shiny wrinklers can be protected.
- **Sugar lumps:**
  - harvests ripe lumps
  - can slot Rigidel to harvest early
  - can swap in Dragon's Curve / Reality Bending at harvest time
  - can keep 100 lumps for Sugar baking
- **Auto-ascend:** ascends at a set number of heavenly chips, or when your prestige would double. Before ascending it cashes in:
  - wrinklers
  - stocks
  - the garden
  - the Chocolate egg, opened in time to count towards your chips
- **Golden switch, Godzamok and Sugar Frenzy:** turns on the Golden switch and sells mines and factories for Godzamok during click buffs, and buys Sugar Frenzy during big combos. Sugar Frenzy costs its sugar lump like normal.
- **Stock market:** upgrades your bank office, hires brokers, and takes loans during huge combos.

### Smart Grimoire
The game decides each Force the Hand of Fate result in advance, so Sleepy Cookies reads the next ones and plans each cast:
- **Free sugar lump next:** cast immediately.
- **Good result next** (Click Frenzy, Elder Frenzy, Building Special, Cursed Finger or Lucky):
  - Cast the moment your CpS multiplier reaches your **minimum Frenzy** setting (default ×7, so any Frenzy works).
  - Only needs enough mana for the spell, not a full bar.
  - Won't stack a second Click Frenzy on top of one already running.
- **Two good results in a row with full mana:** double-cast. It sells wizard towers so the second cast is cheap, re-checks the prediction, then buys the towers back.
- **Bad result next** (Clot, Ruin, Blab, Cookie Storm drop): spent on a cheap spell so the next cast is a good one.
- **Spell tooltip:** hover over Force the Hand of Fate to see the next four results.

### Auto Pantheon
Tests every combination of the useful gods with the efficiency formula and slots the best one. That includes leaving slots empty when a god would cost more than it gives.
- It only uses a worship swap when the gain is over 1%.
- Godzamok stays in the diamond slot when Auto-Godzamok is on.
- Rigidel is left to the sugar lump option.

### Dragon
Upgrades and pets the dragon (for its drops), sets your two chosen auras, and can sell Yous for Dragon Orbs. The dragon popup only stays open if you opened it yourself.

### Stock market trader (Sleepy extra)
- Buys stocks well below their resting price and sells well above it, never for less than a minimum profit.
- Can read the market's hidden trend to avoid buying while a stock is falling or selling while it's rising.
- Only spends cookies that aren't needed for the bank or the next purchase, so it never slows down auto-buy.

### Garden planter (Sleepy extra)
- **Unlock new seeds:** picks the parent plants and layout most likely to mutate into a seed you don't have yet, then harvests the new plant once it's mature.
- **Farm one seed:** fills the plot with one seed and harvests payout plants such as Bakeberry when they're ripe.
- Clears weeds and unwanted mutations, and switches soil automatically.

### Info and display
- An info section with everything Frozen Cookies shows: next purchase, bank, golden cookie timers, heavenly chip rate, frenzy times and stat graphs.
- An optional timer wheel.
- Five number formats.
- Adjustable frame rate.

## Keyboard shortcuts
These are off while you're typing in a text box.

| Key | Action |
| --- | --- |
| `a` | Auto-buy on/off |
| `b` | Copy your building counts |
| `c` | Auto-click golden cookies on/off |
| `e` | Export your save |
| `r` | Open the Ascend prompt |
| `s` | Save the game |
| `w` | Show the wrinkler payout, with a button to pop them all |

## Console commands

| Command | What it does |
| --- | --- |
| `SleepyCookies.stop()` | Unload the add-on and restore the game |
| `SleepyCookies.resetSettings()` | Reset all settings to defaults (paste the load line again afterwards) |
| `SleepyCookies.nextPurchase()` | What auto-buy will get next |
| `SleepyCookies.nextSpell(0)` | Next Force the Hand of Fate result (`1` = the one after, and so on) |
| `SleepyCookies.version` | Loaded version |

## Troubleshooting
- **Nothing happens / `undefined`:** `Game.LoadMod` always prints `undefined`. Look for the **Sleepy Cookies** button instead. If it isn't there, check the file name in the link: it's `sleepy_cookies.js`, with an underscore.
- **Still on the old version after an update:**
  - GitHub Pages can take a few minutes to serve the new file.
  - Refresh the game with **Ctrl+F5** and load it again.
  - The version is shown in the menu header.
- **Steam version:** this loader is for the web version only.

## Credits

Based on Frozen Cookies by Icehawk78, erbkaiser and contributors.
