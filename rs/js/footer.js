$(document).ready(function () {
	$(".icon-menu-mobile").on('click', function () {
		$(".mobile-dropdown").slideToggle();
	})
	async function logJSONData() {
		const response = await fetch("data/config.json");
		const jsonData = await response.json();
		renderHtmlConfig(jsonData);
	}
	// logJSONData();
	initInGameModPanel();
})
function renderHtmlConfig(data = []) {
	if (!data.length) return;
	let html = "";
	for (let game of data) {
		html += '<div class="game-flex-item">';
		html += `<a class="flex-item" href="/${repository}/${game.slug}">`;
		html += `<img width="180" height="180" src="rs/imgs/${game.image}" title="${game.image}" alt="${game.image}">`
		html += `<div class="header-flex-item"><a class="text-overflow header-game-title" href="/${repository}/${game.slug}">${game.name}</a></div>`;
		html += '</a>';
		html += '</div>';
	}
	$("#ajax-append").html(html);
}
function theaterMode() {
	let iframe = document.querySelector("#iframehtml5");
	if (iframe.classList.contains("force_half_full_screen")) {
		iframe.classList.remove("force_half_full_screen");
		document.body.style.overflow = "unset";
		document.querySelector(".header-game").classList.remove("header_game_enable_half_full_screen");
		document.querySelector('body').setAttribute('style', '');
	} else {
		let above = 0;
		let left = 0;
		let below = document.querySelector(".header-game").clientHeight;
		let right = 0;
		// let width = window.innerWidth;
		// let height = window.innerHeight;
		if (!document.querySelector("#style-append")) {
			let styleElement = document.createElement("style");
			styleElement.type = "text/css";
			styleElement.setAttribute('id', "style-append");
			let cssCode = `
		.force_half_full_screen{
		position: fixed!important;
		top: 0!important;
		left: 0!important;
		z-index: 887;
		top:${above}px!important;
		left:${left}px!important;
		width:calc(100% - ${left}px)!important;
		height:calc(100% - ${above + below}px)!important;
		background-color:#000;
		}
		.header_game_enable_half_full_screen{
			position:fixed;
			left:${left}px!important;
			bottom:0!important;
			right:0!important;
			z-index:887!important;
			width:calc(100% - ${left}px)!important;
			padding-left:10px;
			padding-right:10px;
		}
		@media (max-width: 1364px){
			.force_half_full_screen{
				left:0!important;
				width:100%!important;
			}
			.header_game_enable_half_full_screen{
				width:100%!important;
				left:0!important;
			}
		}`
			styleElement.innerHTML = cssCode;
			document.querySelector('head').appendChild(styleElement);
		}
		document.querySelector('body').setAttribute('style', 'overflow:hidden');
		iframe.classList.add("force_half_full_screen")
		document.querySelector(".header-game").classList.add("header_game_enable_half_full_screen")
	}
}
$("#expand").on('click', function () {
	$("#iframehtml5").addClass("force_full_screen");
	$("#_exit_full_screen").removeClass('hidden');
	requestFullScreen(document.body);
});
$("#_exit_full_screen").on('click', cancelFullScreen);
function requestFullScreen(element) {
	$("#iframehtml5").removeClass("force_half_full_screen");
	$(".header-game").removeClass("header_game_enable_half_full_screen");
	// Supports most browsers and their versions.
	var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
	if (requestMethod) { // Native full screen.
		requestMethod.call(element);
	} else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript !== null) {
			wscript.SendKeys("{F11}");
		}
	}
}

function cancelFullScreen() {
	$("#_exit_full_screen").addClass('hidden');
	$("#iframehtml5").removeClass("force_full_screen");
	$("#iframehtml5").removeClass("force_half_full_screen");
	$(".header-game").removeClass("header_game_enable_half_full_screen");
	document.querySelector('body').setAttribute('style', '');
	document.body.style.overflow = "unset";
	var requestMethod = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || document.exitFullScreenBtn;
	if (requestMethod) { // cancel full screen.
		requestMethod.call(document);
	} else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript !== null) {
			wscript.SendKeys("{F11}");
		}
	}
}

if (document.addEventListener) {
	document.addEventListener('webkitfullscreenchange', exitHandler, false);
	document.addEventListener('mozfullscreenchange', exitHandler, false);
	document.addEventListener('fullscreenchange', exitHandler, false);
	document.addEventListener('MSFullscreenChange', exitHandler, false);
}

function exitHandler() {
	if (document.webkitIsFullScreen === false ||
		document.mozFullScreen === false ||
		document.msFullscreenElement === false) {
		cancelFullScreen();
	}
}

function initInGameModPanel() {
	const iframe = document.querySelector('#iframehtml5');
	const frameBox = document.querySelector('.frame-box-game');
	if (!iframe || !frameBox) return;
	if (!window.location.pathname.includes('geometry-dash')) return;

	const panel = document.createElement('div');
	panel.className = 'in-game-mod-panel';
	panel.innerHTML = `
		<div class="in-game-mod-panel__title">In-Game Mods</div>
		<label><input type="checkbox" id="gd-mod-noclip"> No Clip</label>
		<label><input type="checkbox" id="gd-mod-hitboxes"> Show Hitboxes</label>
		<div class="in-game-mod-panel__speed">
			<span>Speed Hack</span>
			<input type="number" id="gd-mod-speed" min="0.1" step="0.1" value="1">
			<button type="button" id="gd-mod-speed-apply">Apply</button>
		</div>
		<button type="button" id="gd-mod-unlock">Unlock All Cosmetics</button>
		<p id="gd-mod-status" class="in-game-mod-panel__status">Ready</p>
	`;
	frameBox.style.position = 'relative';
	frameBox.appendChild(panel);

	const statusEl = document.getElementById('gd-mod-status');
	const setStatus = function (message, isError) {
		statusEl.textContent = message;
		statusEl.classList.toggle('error', !!isError);
	};

	const withGameAccess = function (actionName, callback) {
		try {
			const gameWindow = iframe.contentWindow;
			if (!gameWindow) {
				setStatus(`${actionName}: game window unavailable.`, true);
				return;
			}
			const href = gameWindow.location.href;
			if (!href) {
				setStatus(`${actionName}: game URL unavailable.`, true);
				return;
			}
			callback(gameWindow);
			setStatus(`${actionName}: command sent.`);
		} catch (error) {
			setStatus(`${actionName}: blocked by cross-origin iframe.` +
				` Host game must be same-origin to inject runtime mods.`, true);
		}
	};

	const sendModScript = function (gameWindow, script) {
		if (typeof gameWindow.eval === 'function') {
			gameWindow.eval(script);
		}
		gameWindow.postMessage({ source: 'gd-mod-panel', type: 'run-mod-script', script: script }, '*');
	};

	document.getElementById('gd-mod-noclip').addEventListener('change', function (event) {
		const enabled = event.target.checked;
		withGameAccess('No Clip', function (gameWindow) {
			sendModScript(gameWindow, `window.__gdMods = window.__gdMods || {}; window.__gdMods.noclip = ${enabled};`);
		});
	});

	document.getElementById('gd-mod-hitboxes').addEventListener('change', function (event) {
		const enabled = event.target.checked;
		withGameAccess('Show Hitboxes', function (gameWindow) {
			sendModScript(gameWindow, `window.__gdMods = window.__gdMods || {}; window.__gdMods.showHitboxes = ${enabled};`);
		});
	});

	document.getElementById('gd-mod-speed-apply').addEventListener('click', function () {
		const value = Number(document.getElementById('gd-mod-speed').value || 1);
		const speed = Math.max(0.1, value);
		withGameAccess('Speed Hack', function (gameWindow) {
			sendModScript(gameWindow, `window.__gdMods = window.__gdMods || {}; window.__gdMods.speed = ${speed};\nif (window.createjs && createjs.Ticker) { createjs.Ticker.framerate = 60 * ${speed}; }`);
		});
	});

	document.getElementById('gd-mod-unlock').addEventListener('click', function () {
		withGameAccess('Unlock All Cosmetics', function (gameWindow) {
			sendModScript(gameWindow, `window.__gdMods = window.__gdMods || {}; window.__gdMods.unlockAllCosmetics = true;\ntry { localStorage.setItem('unlock_all_cosmetics', '1'); } catch (e) {}`);
		});
	});
}
