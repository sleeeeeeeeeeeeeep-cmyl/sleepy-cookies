# Sleepy Cookies

Automation add-on for [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) (web), built and tested on v2.058.

A dependency-free port of every [Frozen Cookies](https://github.com/erbkaiser/FrozenCookies) feature (with bug fixes),
plus a stock-market auto-trader and a garden auto-planter.

## Load it

Open Cookie Clicker, press F12 → Console, and run:

```js
Game.LoadMod('https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy_cookies.js');
```

Or save this as a bookmark and click it while the game is open:

```
javascript:(function(){Game.LoadMod('https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy_cookies.js');})();
```

Then click the **Sleepy Cookies** button (where the game's Info button was).

- Settings are saved in your browser.
- Unload: `SleepyCookies.stop()`
- Reset settings: `SleepyCookies.resetSettings()`

## Credits

Based on Frozen Cookies by Icehawk78, erbkaiser and contributors.
