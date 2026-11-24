// ==UserScript==
// @name         Sleepy Cookies
// @namespace    https://github.com/sleeeeeeeeeeeeeep-cmyl/sleepy-cookies
// @version      2.7.3
// @description  Loads the Sleepy Cookies automation add-on in the web version of Cookie Clicker.
// @author       sleeeeeeeeeeeeeep-cmyl
// @license      GPL-3.0-or-later
// @homepageURL  https://github.com/sleeeeeeeeeeeeeep-cmyl/sleepy-cookies
// @supportURL   https://github.com/sleeeeeeeeeeeeeep-cmyl/sleepy-cookies/issues
// @match        https://orteil.dashnet.org/cookieclicker/*
// @match        http://orteil.dashnet.org/cookieclicker/*
// @updateURL    https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy-cookies.user.js
// @downloadURL  https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy-cookies.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  const URL = 'https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy_cookies.js';
  const timer = setInterval(function () {
    const Game = window.Game;
    if (!Game || !Game.ready) return;
    clearInterval(timer);
    if (window.SleepyCookies) return;
    // the hourly query string stops the browser serving a stale copy for long after an update
    Game.LoadMod(URL + '?v=' + Math.floor(Date.now() / 3600000));
  }, 1000);
})();
