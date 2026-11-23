// Sleepy Cookies - Steam Workshop loader.
// Loads the latest build from GitHub Pages, so updates there reach Steam players without a Workshop update.
// Source and license (GPL-3.0-or-later): https://github.com/sleeeeeeeeeeeeeep-cmyl/sleepy-cookies
Game.registerMod('sleepy cookies', {
	init: function () {
		if (window.SleepyCookies) return;
		Game.LoadMod('https://sleeeeeeeeeeeeeep-cmyl.github.io/sleepy-cookies/sleepy_cookies.js');
	}
});
