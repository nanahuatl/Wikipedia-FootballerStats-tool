// ==UserScript==
// @name         FootballerStats
// @namespace    https://tr.wikipedia.org/
// @version      0.15.20
// @description  Futbolcu bilgi kutusu ve kariyer istatistiklerini günceller.
// @match        https://tr.wikipedia.org/w/index.php?*
// @match        https://tr.wikipedia.org/wiki/*
// @grant        none
// ==/UserScript==

( function () {
	'use strict';

	const STORAGE_KEY_PREFIX = 'trwiki-football-stats-helper-data';
	const OTHER_NOTE_KEY_PREFIX = 'trwiki-football-stats-helper-other-note';
	const FIELD_KEYS = [
		'team',
		'teamLink',
		'disableTeamLink',
		'isLoan',
		'season',
		'seasonLink',
		'disableSeasonLink',
		'leagueName',
		'leagueApps',
		'leagueGoals',
		'localLeagueName',
		'localLeagueApps',
		'localLeagueGoals',
		'cupApps',
		'cupGoals',
		'leagueCupApps',
		'leagueCupGoals',
		'continentalApps',
		'continentalGoals',
		'otherApps',
		'otherGoals'
	];
	const STAT_PAIRS = [
		[ 'leagueApps', 'leagueGoals' ],
		[ 'localLeagueApps', 'localLeagueGoals' ],
		[ 'cupApps', 'cupGoals' ],
		[ 'leagueCupApps', 'leagueCupGoals' ],
		[ 'continentalApps', 'continentalGoals' ],
		[ 'otherApps', 'otherGoals' ]
	];

	const style = document.createElement( 'style' );
	style.textContent = `
    .tfsh-launch {
      padding: 7px 12px;
      border: 1px solid #a2a9b1;
      background: #f8f9fa;
      color: #202122;
      cursor: pointer;
      border-radius: 2px;
      font: 600 13px/1.4 sans-serif;
    }
    .tfsh-launch-row {
      margin: 0 0 12px;
      display: block;
    }
    .tfsh-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 16px;
    }
    .tfsh-backdrop.is-open {
      display: flex;
    }
    .tfsh-modal {
      width: 94vw;
      max-height: 82vh;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
      background: #f8f9fa;
      border: 1px solid #a2a9b1;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
      padding: 12px;
      font: 11.7px/1.5 sans-serif;
      color: #202122;
    }
    .tfsh-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    .tfsh-title {
      font-size: 16.2px;
      font-weight: 700;
    }
    .tfsh-help {
      margin: 0 0 12px;
      border: 1px solid #a2a9b1;
      background: #f8f9fa;
    }
    .tfsh-help summary {
      cursor: pointer;
      padding: 7px 10px;
      font-weight: 700;
      user-select: none;
    }
    .tfsh-help-body {
      padding: 0 10px 10px;
      color: #54595d;
    }
    .tfsh-help-body p {
      margin: 6px 0 0;
    }
    .tfsh-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 12px;
      background: #f8f9fa;
      color: #202122;
      font-family: sans-serif;
    }
    .tfsh-table-wrap {
      position: relative;
      padding-top: 0;
    }
    .tfsh-table th.tfsh-toggle-heading {
      cursor: pointer;
      user-select: none;
      background: linear-gradient(to bottom, #fff 0%, #eaecf0 48%, #c8ccd1 100%);
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -3px 0 #72777d,
        inset 1px 0 0 #c8ccd1,
        inset -1px 0 0 #72777d,
        0 2px 2px rgba(0, 0, 0, 0.22);
      transition: filter 80ms ease, box-shadow 80ms ease, transform 80ms ease;
    }
    .tfsh-table th.tfsh-toggle-heading:hover {
      filter: brightness(1.06);
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -3px 0 #36c,
        inset 1px 0 0 #36c,
        inset -1px 0 0 #36c,
        0 3px 3px rgba(0, 0, 0, 0.24);
    }
    .tfsh-table th.tfsh-toggle-heading:active {
      transform: translateY(2px);
      box-shadow:
        inset 0 2px 3px rgba(0, 0, 0, 0.28),
        inset 0 -1px 0 #72777d;
    }
    .tfsh-table th.tfsh-toggle-heading[aria-pressed="false"] {
      background: linear-gradient(to bottom, #f8f9fa 0%, #eaecf0 55%, #a2a9b1 100%);
    }
    .tfsh-column-disabled {
      background: #f8f9fa !important;
      color: #72777d !important;
      opacity: 0.62;
    }
    .tfsh-table th.tfsh-toggle-heading.tfsh-column-disabled {
      background: linear-gradient(to bottom, #f8f9fa 0%, #eaecf0 55%, #a2a9b1 100%) !important;
      opacity: 0.72;
    }
    .tfsh-table th,
    .tfsh-table td {
      border: 1px solid #a2a9b1;
      padding: 3px;
      text-align: left;
      vertical-align: top;
    }
    .tfsh-table th {
      background: #eaecf0;
      position: static;
      text-align: center;
      vertical-align: middle;
      font-weight: 700;
      padding-top: 3px;
      padding-bottom: 3px;
    }
    .tfsh-table thead {
      position: sticky;
      top: -12px;
      z-index: 3;
      background: #eaecf0;
    }
    .tfsh-table input {
      width: 100%;
      box-sizing: border-box;
      min-width: 0;
      min-height: 28px;
      padding: 2px 5px;
      border: 1px solid #a2a9b1;
      border-radius: 2px;
      background: #fff;
      color: #202122;
      font-family: inherit;
      font-size: 11.7px;
      line-height: 1.4;
      margin: 0;
    }
    .tfsh-table input::placeholder {
      color: #72777d;
      opacity: 1;
    }
    .tfsh-table input.tfsh-invalid {
      border-color: #b32424;
      background: #fee7e6;
      box-shadow: inset 0 0 0 1px #b32424;
    }
    .tfsh-table .tfsh-text {
      min-width: 0;
    }
    .tfsh-table .tfsh-team {
      min-width: 0;
    }
    .tfsh-table .tfsh-season {
      min-width: 0;
    }
    .tfsh-table .tfsh-stat {
      width: 100%;
      min-width: 0;
      text-align: center;
      padding-left: 2px;
      padding-right: 2px;
    }
    .tfsh-link-cell {
      min-width: 0;
      vertical-align: top !important;
    }
    .tfsh-link-row {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 2px;
    }
    .tfsh-link-row input[type="text"] {
      flex: 1 1 auto;
      min-width: 0;
    }
    .tfsh-link-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      justify-content: flex-start;
      font-size: 9.9px;
      color: #54595d;
      line-height: 1.2;
      margin-top: -1px;
    }
    .tfsh-link-toggle input {
      width: 14px;
      min-width: 0;
      margin: 0;
    }
    .tfsh-team-cell {
      min-width: 0;
      vertical-align: top !important;
    }
    .tfsh-team-stack {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 2px;
      justify-content: flex-start;
    }
    .tfsh-season-stack {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
    }
    .tfsh-inline-link {
      padding: 0;
      border: 0;
      background: transparent;
      color: #36c;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: 10.8px;
      line-height: 1.2;
    }
    .tfsh-inline-link:hover {
      text-decoration: underline;
    }
    .tfsh-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .tfsh-actions button {
      padding: 7px 12px;
      border: 1px solid #a2a9b1;
      background: #f8f9fa;
      color: #202122;
      cursor: pointer;
      border-radius: 2px;
      font-family: inherit;
      font-size: 11.7px;
      font-weight: 600;
      line-height: 1.4;
    }
    .tfsh-actions .tfsh-primary {
      background: #36c;
      color: #fff;
      border-color: #36c;
    }
    .tfsh-other-note-btn {
      margin-left: 6px;
      width: 18px;
      height: 18px;
      padding: 0;
      font-size: 9.9px;
      line-height: 16px;
      border: 1px solid #72777d;
      border-radius: 999px;
      background: linear-gradient(to bottom, #fff 0%, #eaecf0 52%, #a2a9b1 100%);
      color: #202122;
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -2px 0 #72777d,
        0 2px 2px rgba(0, 0, 0, 0.24);
      cursor: pointer;
      text-align: center;
      font-weight: 700;
      transition: filter 80ms ease, box-shadow 80ms ease, transform 80ms ease;
    }
    .tfsh-other-note-btn:hover {
      filter: none;
      border-color: #36c;
      background: linear-gradient(to bottom, #6b8de3 0%, #36c 55%, #2a4b9b 100%);
      color: #fff;
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -2px 0 #36c,
        0 3px 3px rgba(0, 0, 0, 0.25);
    }
    .tfsh-other-note-btn:active {
      transform: translateY(2px);
      box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.3);
    }
    .tfsh-note-dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100001;
      display: none;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 16px;
      background: rgba(0, 0, 0, 0.5);
    }
    .tfsh-note-dialog-backdrop.is-open {
      display: flex;
    }
    .tfsh-note-dialog {
      width: min(500px, 92vw);
      box-sizing: border-box;
      padding: 14px;
      border: 1px solid #a2a9b1;
      border-top: 4px solid #36c;
      background: #f8f9fa;
      color: #202122;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
      font: 11.7px/1.5 sans-serif;
    }
    .tfsh-note-dialog h3 {
      margin: 0 0 8px;
      font-size: 16.2px;
    }
    .tfsh-note-dialog p {
      margin: 0 0 8px;
    }
    .tfsh-note-dialog-example {
      padding: 7px 9px;
      border-left: 3px solid #a2a9b1;
      background: #eaecf0;
      color: #54595d;
    }
    .tfsh-note-dialog input {
      width: 100%;
      box-sizing: border-box;
      margin: 4px 0 12px;
      padding: 6px 8px;
      border: 1px solid #a2a9b1;
      background: #fff;
      color: #202122;
      font: inherit;
    }
    .tfsh-note-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .tfsh-note-dialog-actions button {
      padding: 6px 11px;
      border: 1px solid #a2a9b1;
      border-radius: 2px;
      background: #f8f9fa;
      color: #202122;
      cursor: pointer;
      font: 600 11.7px/1.4 sans-serif;
    }
    .tfsh-note-dialog-actions .tfsh-note-save {
      border-color: #36c;
      background: #36c;
      color: #fff;
    }
    .tfsh-preview {
      width: 100%;
      min-height: 220px;
      font-family: monospace;
      box-sizing: border-box;
      border: 1px solid #a2a9b1;
      background: #fff;
      padding: 8px;
    }
    .tfsh-note {
      margin: 0 0 12px;
      color: #54595d;
    }
    .tfsh-remove {
      padding: 4px 8px;
      border: 1px solid #a2a9b1;
      background: #f8f9fa;
      color: #202122;
      border-radius: 2px;
      cursor: pointer;
      font-family: inherit;
      font-size: 10.8px;
      font-weight: 600;
      line-height: 1.4;
    }
    .tfsh-close {
      box-sizing: border-box;
      flex: 0 0 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      max-width: 26px;
      width: 26px;
      min-height: 26px;
      max-height: 26px;
      height: 26px;
      aspect-ratio: 1 / 1;
      padding: 3px;
      border: 1px solid transparent;
      border-radius: 2px;
      background-color: transparent;
      color: #202122;
      cursor: pointer;
      line-height: 1;
    }
    .tfsh-close:hover {
      border-color: transparent;
      background-color: #eaecf0;
      color: #000;
    }
    .tfsh-close:active {
      border-color: #72777d;
      background-color: #c8ccd1;
      color: #000;
    }
    .tfsh-close:focus-visible {
      border-color: #36c;
      box-shadow: inset 0 0 0 1px #36c;
      outline: 1px solid transparent;
    }
    .tfsh-close .cdx-icon {
      display: inline-flex;
      width: 18px;
      height: 18px;
      color: inherit;
    }
    .tfsh-close .cdx-icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
    .tfsh-remove-cell {
      border: none !important;
      background: transparent !important;
      padding-left: 8px !important;
      width: 1%;
      white-space: nowrap;
    }
    .tfsh-remove-cell .tfsh-remove {
      height: 26px;
      border-color: #72777d;
      background: linear-gradient(to bottom, #fff 0%, #eaecf0 50%, #a2a9b1 100%);
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -3px 0 #72777d,
        0 2px 2px rgba(0, 0, 0, 0.22);
      text-shadow: none;
      transition: filter 80ms ease, box-shadow 80ms ease, transform 80ms ease;
    }
    .tfsh-remove-cell .tfsh-remove:hover {
      filter: brightness(1.06);
      border-color: #36c;
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -3px 0 #36c,
        0 3px 3px rgba(0, 0, 0, 0.24);
    }
    .tfsh-remove-cell .tfsh-remove:active {
      transform: translateY(2px);
      box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.3);
    }
    .tfsh-modal button:not(.tfsh-close),
    .tfsh-modal button.tfsh-primary,
    .tfsh-modal .tfsh-remove-cell .tfsh-remove,
    .tfsh-note-dialog button,
    .tfsh-note-dialog-actions .tfsh-note-save,
    .tfsh-table th.tfsh-toggle-heading {
      appearance: none;
      border: 1px solid #a2a9b1;
      border-radius: 2px;
      background-color: #f8f9fa;
      background-image: linear-gradient(to bottom, #fff, #f8f9fa 55%, #eaecf0);
      color: #202122;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 1px 1px rgba(0, 0, 0, 0.08);
      filter: none;
      text-shadow: none;
      transform: none;
      transition: background-color 80ms ease, border-color 80ms ease, box-shadow 80ms ease;
    }
    .tfsh-modal button:not(.tfsh-close):hover,
    .tfsh-modal button.tfsh-primary:hover,
    .tfsh-modal .tfsh-remove-cell .tfsh-remove:hover,
    .tfsh-note-dialog button:hover,
    .tfsh-note-dialog-actions .tfsh-note-save:hover,
    .tfsh-table th.tfsh-toggle-heading:hover {
      border-color: #72777d;
      background-color: #fff;
      background-image: linear-gradient(to bottom, #fff, #f8f9fa);
      color: #202122;
      box-shadow: inset 0 1px 0 #fff, 0 1px 2px rgba(0, 0, 0, 0.14);
      filter: none;
      transform: none;
    }
    .tfsh-modal button:not(.tfsh-close):active,
    .tfsh-modal button.tfsh-primary:active,
    .tfsh-modal .tfsh-remove-cell .tfsh-remove:active,
    .tfsh-note-dialog button:active,
    .tfsh-note-dialog-actions .tfsh-note-save:active,
    .tfsh-table th.tfsh-toggle-heading:active {
      border-color: #72777d;
      background-color: #c8ccd1;
      background-image: none;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.22);
      transform: none;
    }
    .tfsh-modal button:not(.tfsh-close):focus-visible,
    .tfsh-note-dialog button:focus-visible,
    .tfsh-table th.tfsh-toggle-heading:focus-visible {
      outline: 2px solid #36c;
      outline-offset: 1px;
    }
    .tfsh-table th.tfsh-toggle-heading[aria-pressed="false"],
    .tfsh-table th.tfsh-toggle-heading.tfsh-column-disabled {
      background-color: #eaecf0 !important;
      background-image: linear-gradient(to bottom, #f8f9fa, #eaecf0) !important;
      color: #54595d !important;
      box-shadow: inset 0 1px 0 #fff !important;
    }
    .tfsh-inline-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      align-self: center;
      width: 24px;
      height: 22px;
      padding: 0;
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      line-height: 1;
    }
    .tfsh-modal .tfsh-actions button.tfsh-primary {
      min-height: 32px;
      padding: 5px 12px;
      border-color: #36c;
      background-color: #36c;
      background-image: none;
      color: #fff;
      box-shadow: none;
      font-size: 13px;
      font-weight: 700;
      text-shadow: none;
    }
    .tfsh-modal .tfsh-actions button.tfsh-primary:hover {
      border-color: #4b77d6;
      background-color: #4b77d6;
      background-image: none;
      color: #fff;
      box-shadow: none;
    }
    .tfsh-modal .tfsh-actions button.tfsh-primary:active {
      border-color: #233566;
      background-color: #233566;
      background-image: none;
      color: #fff;
      box-shadow: none;
    }
    .tfsh-modal .tfsh-actions button.tfsh-primary:focus-visible {
      border-color: #36c;
      outline: 1px solid transparent;
      outline-offset: 0;
      box-shadow: inset 0 0 0 1px #36c, inset 0 0 0 2px #fff;
    }
    .tfsh-row-hidden {
      display: none;
    }
  `;
	document.head.appendChild( style );

	let textarea;
	let launchButton;
	let buttonRow;
	let launchTab;
	let quickAccessLink;
	let quickAccessTab;
	let backdrop;
	let tbody;
	let leagueCupEnabled = false;
	let localLeagueEnabled = false;
	let nationalCupEnabled = true;
	let continentalEnabled = true;
	let otherEnabled = true;
	let preview;
	let otherNote = '';
	let pageInfoboxCheckPromise = null;
	let pageInfoboxCheckResult = null;
	let articleSourcePromise = null;
	let articleSourceResult = null;
	const SUPPORTED_SKINS = new Set( [ 'monobook', 'vector', 'vector-2022' ] );

	function hasSupportedFootballerInfobox( source ) {
		return /^\{\{\s*Futbolcu bilgi kutusu\b/im.test( source || '' );
	}

	function getCurrentSkin() {
		if ( window.mw && window.mw.config && window.mw.config.get( 'skin' ) ) {
			return window.mw.config.get( 'skin' );
		}

		const skinClass = Array.from( ( document.body && document.body.classList ) || [] ).find( ( className ) => className.startsWith( 'skin-' ) );
		return skinClass ? skinClass.slice( 5 ) : '';
	}

	function isSupportedSkin() {
		return SUPPORTED_SKINS.has( getCurrentSkin() );
	}

	function isMonobookSkin() {
		return getCurrentSkin() === 'monobook';
	}

	function getActionPortletId() {
		if ( isMonobookSkin() ) {
			return 'p-cactions';
		}
		if ( document.getElementById( 'p-cactions' ) ) {
			return 'p-cactions';
		}
		return 'p-views';
	}

	function getCurrentPageTitle() {
		if ( window.mw && window.mw.config && window.mw.config.get( 'wgPageName' ) ) {
			return window.mw.config.get( 'wgPageName' );
		}

		const search = new URLSearchParams( window.location.search );
		if ( search.get( 'title' ) ) {
			return search.get( 'title' );
		}

		const wikiPrefix = '/wiki/';
		if ( window.location.pathname.startsWith( wikiPrefix ) ) {
			return decodeURIComponent( window.location.pathname.slice( wikiPrefix.length ) );
		}

		return '';
	}

	function buildToolEditUrl() {
		const url = new URL( window.location.origin + '/w/index.php' );
		url.searchParams.set( 'title', getCurrentPageTitle() );
		url.searchParams.set( 'action', 'edit' );
		url.searchParams.set( 'tfsh', '1' );
		return url.toString();
	}

	function getPageStorageSuffix() {
		return cleanValue( getCurrentPageTitle() ) || '__unknown__';
	}

	function getRowsStorageKey() {
		return `${ STORAGE_KEY_PREFIX }:${ getPageStorageSuffix() }`;
	}

	function getOtherNoteStorageKey() {
		return `${ OTHER_NOTE_KEY_PREFIX }:${ getPageStorageSuffix() }`;
	}

	async function getArticleSource() {
		if ( articleSourceResult !== null ) {
			return articleSourceResult;
		}

		if ( articleSourcePromise ) {
			return articleSourcePromise;
		}

		const title = getCurrentPageTitle();
		if ( !title ) {
			articleSourceResult = '';
			return articleSourceResult;
		}

		const apiUrl = new URL( window.location.origin + '/w/api.php' );
		apiUrl.searchParams.set( 'action', 'query' );
		apiUrl.searchParams.set( 'prop', 'revisions' );
		apiUrl.searchParams.set( 'titles', title );
		apiUrl.searchParams.set( 'rvprop', 'content' );
		apiUrl.searchParams.set( 'rvslots', 'main' );
		apiUrl.searchParams.set( 'format', 'json' );
		apiUrl.searchParams.set( 'formatversion', '2' );

		articleSourcePromise = fetch( apiUrl.toString(), {
			credentials: 'same-origin'
		} )
			.then( ( response ) => {
				if ( !response.ok ) {
					throw new Error( `HTTP ${ response.status }` );
				}
				return response.json();
			} )
			.then( ( data ) => {
				const pages = data && data.query && data.query.pages;
				const revisions = pages && pages[ 0 ] && pages[ 0 ].revisions;
				const slots = revisions && revisions[ 0 ] && revisions[ 0 ].slots;
				articleSourceResult = ( slots && slots.main && slots.main.content ) || '';
				return articleSourceResult;
			} )
			.catch( () => {
				articleSourceResult = '';
				return '';
			} )
			.finally( () => {
				articleSourcePromise = null;
			} );

		return articleSourcePromise;
	}

	async function articleUsesSupportedFootballerInfobox() {
		if ( pageInfoboxCheckResult !== null ) {
			return pageInfoboxCheckResult;
		}

		if ( pageInfoboxCheckPromise ) {
			return pageInfoboxCheckPromise;
		}

		const title = getCurrentPageTitle();
		if ( !title ) {
			pageInfoboxCheckResult = false;
			return pageInfoboxCheckResult;
		}

		pageInfoboxCheckPromise = getArticleSource()
			.then( ( content ) => {
				pageInfoboxCheckResult = hasSupportedFootballerInfobox( content );
				return pageInfoboxCheckResult;
			} )
			.catch( () => {
				pageInfoboxCheckResult = false;
				return false;
			} )
			.finally( () => {
				pageInfoboxCheckPromise = null;
			} );

		return pageInfoboxCheckPromise;
	}

	function ensureQuickAccessLink() {
		if ( quickAccessLink ) {
			return quickAccessLink;
		}

		if ( !window.mw || !window.mw.util || !window.mw.util.addPortletLink ) {
			return null;
		}

		quickAccessLink = window.mw.util.addPortletLink(
			getActionPortletId(),
			buildToolEditUrl(),
			'FootballerStats',
			'ca-matchstats-editor-view',
			'FootballerStats aracını aç'
		);
		quickAccessTab = quickAccessLink ? quickAccessLink.closest( 'li' ) : null;
		return quickAccessLink;
	}

	function cleanValue( value ) {
		return String( value === null || value === undefined ? '' : value ).trim();
	}

	function escapeCell( value ) {
		return cleanValue( value ).replace( /\|/g, '{{!}}' );
	}

	function normalizeBoolean( value ) {
		return value === true || value === 'true' || value === '1';
	}

	function isUnknown( value ) {
		return cleanValue( value ) === '?';
	}

	function isBlank( value ) {
		return cleanValue( value ) === '';
	}

	function numericValue( value ) {
		const cleaned = cleanValue( value );
		if ( !cleaned || cleaned === '?' ) {
			return 0;
		}
		const digits = cleaned.replace( /[^\d-]/g, '' );
		return digits ? Number( digits ) : 0;
	}

	function buildWikiLink( target, label ) {
		const cleanTarget = cleanValue( target );
		const cleanLabel = cleanValue( label );
		if ( !cleanTarget && !cleanLabel ) {
			return '';
		}
		if ( !cleanTarget || cleanTarget === cleanLabel ) {
			return `[[${ escapeCell( cleanLabel || cleanTarget ) }]]`;
		}
		return `[[${ escapeCell( cleanTarget ) }|${ escapeCell( cleanLabel ) }]]`;
	}

	function formatTeamCell( row, options = {} ) {
		const team = cleanValue( row.team );
		let renderedTeam;
		if ( normalizeBoolean( row.disableTeamLink ) ) {
			renderedTeam = escapeCell( team );
		} else {
			const teamLink = cleanValue( row.teamLink );
			renderedTeam = buildWikiLink( teamLink || team, team );
		}
		if ( normalizeBoolean( row.isLoan ) ) {
			return options.withArrow ? `→ ${ renderedTeam } (kiralık)` : `${ renderedTeam } (kiralık)`;
		}
		return renderedTeam;
	}

	function defaultSeasonTarget( row ) {
		const team = cleanValue( row.team );
		const teamLink = cleanValue( row.teamLink );
		const targetTeam = teamLink || team;
		return `${ targetTeam } ${ cleanValue( row.season ) } sezonu`.trim();
	}

	function formatSeasonCell( row ) {
		const season = cleanValue( row.season );
		if ( normalizeBoolean( row.disableSeasonLink ) ) {
			return escapeCell( season );
		}
		const seasonLink = cleanValue( row.seasonLink );
		return buildWikiLink( seasonLink || defaultSeasonTarget( row ), season );
	}

	function formatLeagueCell( row ) {
		return formatNamedLeagueCell( row, 'leagueName' );
	}

	function formatLocalLeagueCell( row ) {
		return formatNamedLeagueCell( row, 'localLeagueName' );
	}

	function formatNamedLeagueCell( row, key ) {
		const leagueName = cleanValue( row[ key ] );
		if ( !leagueName ) {
			return '-';
		}
		const displayName = leagueName.replace( /\s*\([^()]+\)\s*$/, '' ).trim() || leagueName;
		return buildWikiLink( `${ cleanValue( row.season ) } ${ leagueName }`.trim(), displayName );
	}

	function activeStatPairs() {
		const pairs = [ [ 'leagueApps', 'leagueGoals' ] ];
		if ( localLeagueEnabled ) {
			pairs.push( [ 'localLeagueApps', 'localLeagueGoals' ] );
		}
		if ( nationalCupEnabled ) {
			pairs.push( [ 'cupApps', 'cupGoals' ] );
		}
		if ( leagueCupEnabled ) {
			pairs.push( [ 'leagueCupApps', 'leagueCupGoals' ] );
		}
		if ( continentalEnabled ) {
			pairs.push( [ 'continentalApps', 'continentalGoals' ] );
		}
		if ( otherEnabled ) {
			pairs.push( [ 'otherApps', 'otherGoals' ] );
		}
		return pairs;
	}

	function rowHasUnknown( row ) {
		return activeStatPairs().some( ( [ appsKey, goalsKey ] ) => {
			const appsUnknown = isUnknown( row[ appsKey ] );
			return appsUnknown || isUnknown( row[ goalsKey ] );
		} );
	}

	function rowsHaveUnknown( rows ) {
		return rows.some( ( row ) => rowHasUnknown( row ) );
	}

	function computeRowTotals( row ) {
		if ( rowHasUnknown( row ) ) {
			return { apps: null, goals: null, unknown: true };
		}

		let apps = 0;
		let goals = 0;
		activeStatPairs().forEach( ( [ appsKey, goalsKey ] ) => {
			apps += numericValue( row[ appsKey ] );
			goals += numericValue( row[ goalsKey ] );
		} );
		return { apps, goals, unknown: false };
	}

	function sumColumnWithUnknown( rows, key ) {
		let total = 0;
		let unknown = false;
		rows.forEach( ( row ) => {
			if ( isUnknown( row[ key ] ) ) {
				unknown = true;
				return;
			}
			total += numericValue( row[ key ] );
		} );
		return { total, unknown };
	}

	function pairDisplay( appsValue, goalsValue ) {
		if ( isBlank( appsValue ) && isBlank( goalsValue ) ) {
			return { merged: true, text: '-' };
		}
		return {
			merged: false,
			apps: escapeCell( cleanValue( appsValue ) ),
			goals: escapeCell( cleanValue( goalsValue ) )
		};
	}

	function joinedRow( marker, cells ) {
		const separator = ` ${ marker }${ marker } `;
		return `${ marker } ${ cells.join( separator ) }`;
	}

	function groupRowsByTeam( rows ) {
		const groups = [];
		rows.forEach( ( row ) => {
			const team = cleanValue( row.team );
			if ( !team ) {
				return;
			}

			const key = JSON.stringify( [
				team,
				cleanValue( row.teamLink ),
				normalizeBoolean( row.isLoan ),
				normalizeBoolean( row.disableTeamLink )
			] );
			const previous = groups[ groups.length - 1 ];

			if ( previous && previous.key === key ) {
				previous.rows.push( row );
				return;
			}

			groups.push( {
				key,
				rows: [ row ]
			} );
		} );
		return groups;
	}

	function buildGroupRowLines( group ) {
		const lines = [];
		const representative = group.rows[ 0 ];
		const rowSpan = group.rows.length > 1 ? group.rows.length + 1 : group.rows.length;
		let groupTotalApps = 0;
		let groupTotalGoals = 0;
		const groupHasUnknown = rowsHaveUnknown( group.rows );
		const groupLeagueApps = sumColumnWithUnknown( group.rows, 'leagueApps' );
		const groupLeagueGoals = sumColumnWithUnknown( group.rows, 'leagueGoals' );
		const groupLocalLeagueApps = sumColumnWithUnknown( group.rows, 'localLeagueApps' );
		const groupLocalLeagueGoals = sumColumnWithUnknown( group.rows, 'localLeagueGoals' );
		const groupCupApps = sumColumnWithUnknown( group.rows, 'cupApps' );
		const groupCupGoals = sumColumnWithUnknown( group.rows, 'cupGoals' );
		const groupLeagueCupApps = sumColumnWithUnknown( group.rows, 'leagueCupApps' );
		const groupLeagueCupGoals = sumColumnWithUnknown( group.rows, 'leagueCupGoals' );
		const groupContinentalApps = sumColumnWithUnknown( group.rows, 'continentalApps' );
		const groupContinentalGoals = sumColumnWithUnknown( group.rows, 'continentalGoals' );
		const groupOtherApps = sumColumnWithUnknown( group.rows, 'otherApps' );
		const groupOtherGoals = sumColumnWithUnknown( group.rows, 'otherGoals' );

		group.rows.forEach( ( row ) => {
			const rowTotal = computeRowTotals( row );
			if ( !rowTotal.unknown ) {
				groupTotalApps += rowTotal.apps;
				groupTotalGoals += rowTotal.goals;
			}
		} );

		group.rows.forEach( ( row, index ) => {
			const rowTotal = computeRowTotals( row );
			const cells = [];
			lines.push( '|-' );
			if ( index === 0 ) {
				cells.push( `rowspan="${ rowSpan }" | ${ formatTeamCell( representative ) }` );
			}
			cells.push( formatSeasonCell( row ) );
			cells.push( formatLeagueCell( row ) );
			const competitionPairs = [
				pairDisplay( row.leagueApps, row.leagueGoals )
			];
			if ( localLeagueEnabled ) {
				cells.push( ...competitionPairs.flatMap( ( pair ) => pair.merged ?
					[ `colspan="2" | ${ pair.text }` ] :
					[ pair.apps, pair.goals ] ) );
				competitionPairs.length = 0;
				cells.push( formatLocalLeagueCell( row ) );
				competitionPairs.push( pairDisplay( row.localLeagueApps, row.localLeagueGoals ) );
			}
			if ( nationalCupEnabled ) {
				competitionPairs.push( pairDisplay( row.cupApps, row.cupGoals ) );
			}
			if ( leagueCupEnabled ) {
				competitionPairs.push( pairDisplay( row.leagueCupApps, row.leagueCupGoals ) );
			}
			if ( continentalEnabled ) {
				competitionPairs.push( pairDisplay( row.continentalApps, row.continentalGoals ) );
			}
			if ( otherEnabled ) {
				competitionPairs.push( pairDisplay( row.otherApps, row.otherGoals ) );
			}
			competitionPairs.forEach( ( pair ) => {
				if ( pair.merged ) {
					cells.push( `colspan="2" | ${ pair.text }` );
				} else {
					cells.push( pair.apps );
					cells.push( pair.goals );
				}
			} );
			if ( rowTotal.unknown ) {
				cells.push( '?' );
				cells.push( '?' );
			} else {
				cells.push( String( rowTotal.apps ) );
				cells.push( String( rowTotal.goals ) );
			}
			lines.push( joinedRow( '|', cells ) );
		} );

		if ( group.rows.length > 1 ) {
			lines.push( '|-' );
			const totalCells = [
				'colspan="2" | Toplam',
				groupLeagueApps.unknown ? '?' : String( groupLeagueApps.total ),
				groupLeagueGoals.unknown ? '?' : String( groupLeagueGoals.total )
			];
			if ( localLeagueEnabled ) {
				totalCells.push(
					'-',
					groupLocalLeagueApps.unknown ? '?' : String( groupLocalLeagueApps.total ),
					groupLocalLeagueGoals.unknown ? '?' : String( groupLocalLeagueGoals.total )
				);
			}
			if ( nationalCupEnabled ) {
				totalCells.push(
					groupCupApps.unknown ? '?' : String( groupCupApps.total ),
					groupCupGoals.unknown ? '?' : String( groupCupGoals.total )
				);
			}
			if ( leagueCupEnabled ) {
				totalCells.push(
					groupLeagueCupApps.unknown ? '?' : String( groupLeagueCupApps.total ),
					groupLeagueCupGoals.unknown ? '?' : String( groupLeagueCupGoals.total )
				);
			}
			if ( continentalEnabled ) {
				totalCells.push( groupContinentalApps.unknown ? '?' : String( groupContinentalApps.total ) );
				totalCells.push( groupContinentalGoals.unknown ? '?' : String( groupContinentalGoals.total ) );
			}
			if ( otherEnabled ) {
				totalCells.push( groupOtherApps.unknown ? '?' : String( groupOtherApps.total ) );
				totalCells.push( groupOtherGoals.unknown ? '?' : String( groupOtherGoals.total ) );
			}
			if ( groupHasUnknown ) {
				totalCells.push( '?' );
				totalCells.push( '?' );
			} else {
				totalCells.push( String( groupTotalApps ) );
				totalCells.push( String( groupTotalGoals ) );
			}
			lines.push( joinedRow( '!', totalCells ) );
		}

		return {
			lines,
			totalApps: groupTotalApps,
			totalGoals: groupTotalGoals,
			unknown: groupHasUnknown
		};
	}

	function buildTableWikitext( rows ) {
		const groups = groupRowsByTeam( rows );
		const topHeaders = [
			'rowspan="2" | Takım',
			'rowspan="2" | Sezon',
			'colspan="3" | Lig'
		];
		const subHeaders = [ 'Lig', 'Maç', 'Gol' ];
		if ( localLeagueEnabled ) {
			topHeaders.push( 'colspan="3" | Yerel lig' );
			subHeaders.push( 'Lig', 'Maç', 'Gol' );
		}
		if ( nationalCupEnabled ) {
			topHeaders.push( 'colspan="2" | Ulusal kupa' );
			subHeaders.push( 'Maç', 'Gol' );
		}
		if ( leagueCupEnabled ) {
			topHeaders.push( 'colspan="2" | Lig kupası' );
			subHeaders.push( 'Maç', 'Gol' );
		}
		if ( continentalEnabled ) {
			topHeaders.push( 'colspan="2" | Kıtasal' );
			subHeaders.push( 'Maç', 'Gol' );
		}
		if ( otherEnabled ) {
			topHeaders.push( `colspan="2" | ${ buildOtherHeaderText() }` );
			subHeaders.push( 'Maç', 'Gol' );
		}
		topHeaders.push( 'colspan="2" | Toplam' );
		subHeaders.push( 'Maç', 'Gol' );
		const lines = [
			'{| class="wikitable" style="text-align: center;"',
			joinedRow( '!', topHeaders ),
			'|-',
			joinedRow( '!', subHeaders )
		];

		let grandApps = 0;
		let grandGoals = 0;
		const grandHasUnknown = rowsHaveUnknown( rows );
		const grandLeagueApps = sumColumnWithUnknown( rows, 'leagueApps' );
		const grandLeagueGoals = sumColumnWithUnknown( rows, 'leagueGoals' );
		const grandLocalLeagueApps = sumColumnWithUnknown( rows, 'localLeagueApps' );
		const grandLocalLeagueGoals = sumColumnWithUnknown( rows, 'localLeagueGoals' );
		const grandCupApps = sumColumnWithUnknown( rows, 'cupApps' );
		const grandCupGoals = sumColumnWithUnknown( rows, 'cupGoals' );
		const grandLeagueCupApps = sumColumnWithUnknown( rows, 'leagueCupApps' );
		const grandLeagueCupGoals = sumColumnWithUnknown( rows, 'leagueCupGoals' );
		const grandContinentalApps = sumColumnWithUnknown( rows, 'continentalApps' );
		const grandContinentalGoals = sumColumnWithUnknown( rows, 'continentalGoals' );
		const grandOtherApps = sumColumnWithUnknown( rows, 'otherApps' );
		const grandOtherGoals = sumColumnWithUnknown( rows, 'otherGoals' );

		groups.forEach( ( group ) => {
			const groupRow = buildGroupRowLines( group );
			lines.push( ...groupRow.lines );
			grandApps += groupRow.totalApps;
			grandGoals += groupRow.totalGoals;
		} );

		if ( groups.length > 1 ) {
			lines.push( '|-' );
			const grandCells = [
				'colspan="3" | Toplam',
				grandLeagueApps.unknown ? '?' : String( grandLeagueApps.total ),
				grandLeagueGoals.unknown ? '?' : String( grandLeagueGoals.total )
			];
			if ( localLeagueEnabled ) {
				grandCells.push(
					'-',
					grandLocalLeagueApps.unknown ? '?' : String( grandLocalLeagueApps.total ),
					grandLocalLeagueGoals.unknown ? '?' : String( grandLocalLeagueGoals.total )
				);
			}
			if ( nationalCupEnabled ) {
				grandCells.push(
					grandCupApps.unknown ? '?' : String( grandCupApps.total ),
					grandCupGoals.unknown ? '?' : String( grandCupGoals.total )
				);
			}
			if ( leagueCupEnabled ) {
				grandCells.push(
					grandLeagueCupApps.unknown ? '?' : String( grandLeagueCupApps.total ),
					grandLeagueCupGoals.unknown ? '?' : String( grandLeagueCupGoals.total )
				);
			}
			if ( continentalEnabled ) {
				grandCells.push( grandContinentalApps.unknown ? '?' : String( grandContinentalApps.total ) );
				grandCells.push( grandContinentalGoals.unknown ? '?' : String( grandContinentalGoals.total ) );
			}
			if ( otherEnabled ) {
				grandCells.push( grandOtherApps.unknown ? '?' : String( grandOtherApps.total ) );
				grandCells.push( grandOtherGoals.unknown ? '?' : String( grandOtherGoals.total ) );
			}
			if ( grandHasUnknown ) {
				grandCells.push( '?' );
				grandCells.push( '?' );
			} else {
				grandCells.push( String( grandApps ) );
				grandCells.push( String( grandGoals ) );
			}
			lines.push( joinedRow( '!', grandCells ) );
		}

		lines.push( '|}' );
		return lines.join( '\n' );
	}

	function buildOtherHeaderText() {
		const note = cleanValue( otherNote );
		if ( !note ) {
			return 'Diğer';
		}
		return `Diğer{{adn|${ note } maçlarını içerir.}}`;
	}

	function buildOtherNoteText() {
		return '';
	}

	function buildCareerSection( rows ) {
		return `== Kariyer istatistikleri ==\n${ buildTableWikitext( rows ) }${ buildOtherNoteText() }\n`;
	}

	function extractCellContent( cellText ) {
		const cell = cleanValue( cellText ).replace( /\{\{!\}\}/g, '|' );
		const attrIndex = cell.indexOf( ' | ' );
		if ( attrIndex !== -1 && !cell.startsWith( '[[' ) ) {
			return cleanValue( cell.slice( attrIndex + 3 ) );
		}
		return cell;
	}

	function parseWikiLinkValue( value ) {
		const cleaned = cleanValue( value );
		const match = cleaned.match( /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/ );
		if ( !match ) {
			return {
				label: cleaned,
				target: '',
				disableLink: cleaned !== ''
			};
		}

		return {
			target: cleanValue( match[ 1 ] ),
			label: cleanValue( match[ 2 ] || match[ 1 ] ),
			disableLink: false
		};
	}

	function parseTeamValue( value ) {
		const loanPrefixMatch = value.match( /^(?:→|â†’)\s*(.*)$/ );
		const withoutArrow = cleanValue( loanPrefixMatch ? loanPrefixMatch[ 1 ] : value );
		const loanSuffixMatch = withoutArrow.match( /^(.*?)\s*\((?:kiralık|kiralÄ±k)\)\s*$/i );
		const baseValue = cleanValue( loanSuffixMatch ? loanSuffixMatch[ 1 ] : withoutArrow );
		const link = parseWikiLinkValue( baseValue );
		return {
			team: link.label,
			teamLink: link.target,
			disableTeamLink: link.disableLink,
			isLoan: !!loanPrefixMatch || !!loanSuffixMatch
		};
	}

	function parseSeasonValue( value ) {
		const link = parseWikiLinkValue( value );
		return {
			season: link.label,
			seasonLink: link.target,
			disableSeasonLink: link.disableLink
		};
	}

	function parseStatPairs( cells, startIndex, hasLeagueName = false, hasLocalLeague = false, hasNationalCup = true, hasLeagueCup = false, hasContinental = true, hasOther = true, season = '' ) {
		const values = {
			leagueName: '',
			leagueApps: '',
			leagueGoals: '',
			localLeagueName: '',
			localLeagueApps: '',
			localLeagueGoals: '',
			cupApps: '',
			cupGoals: '',
			leagueCupApps: '',
			leagueCupGoals: '',
			continentalApps: '',
			continentalGoals: '',
			otherApps: '',
			otherGoals: ''
		};
		let cursor = startIndex;
		const readLeagueName = ( key ) => {
			const leagueCell = extractCellContent( cells[ cursor ] || '' );
			if ( leagueCell && leagueCell !== '-' ) {
				const parsedLeague = parseWikiLinkValue( leagueCell );
				const seasonPrefix = `${ cleanValue( season ) } `;
				values[ key ] = parsedLeague.target.startsWith( seasonPrefix ) ?
					cleanValue( parsedLeague.target.slice( seasonPrefix.length ) ) :
					parsedLeague.label;
			}
			cursor += 1;
		};
		const readPair = ( appsKey, goalsKey ) => {
			const current = cleanValue( cells[ cursor ] || '' );
			if ( !current || /^colspan\s*=\s*"2"/i.test( current ) || current === '-' ) {
				cursor += 1;
				return;
			}
			values[ appsKey ] = current;
			values[ goalsKey ] = cleanValue( cells[ cursor + 1 ] || '' );
			cursor += 2;
		};

		if ( hasLeagueName ) {
			readLeagueName( 'leagueName' );
		}
		readPair( 'leagueApps', 'leagueGoals' );
		if ( hasLocalLeague ) {
			readLeagueName( 'localLeagueName' );
			readPair( 'localLeagueApps', 'localLeagueGoals' );
		}
		if ( hasNationalCup ) {
			readPair( 'cupApps', 'cupGoals' );
		}
		if ( hasLeagueCup ) {
			readPair( 'leagueCupApps', 'leagueCupGoals' );
		}
		if ( hasContinental ) {
			readPair( 'continentalApps', 'continentalGoals' );
		}
		if ( hasOther ) {
			readPair( 'otherApps', 'otherGoals' );
		}

		return values;
	}

	function extractCareerSectionSource( source ) {
		const headingRegex = /^==+\s*Kariyer istatistikleri\s*==+\s*$/im;
		const match = headingRegex.exec( source || '' );
		if ( !match ) {
			return '';
		}

		const start = match.index;
		const sectionStart = source.indexOf( '\n', start );
		const bodyStart = sectionStart === -1 ? source.length : sectionStart + 1;
		const remainder = source.slice( bodyStart );
		const nextHeadingMatch = /^\s*==+[^=\n].*==+\s*$/m.exec( remainder );
		const end = nextHeadingMatch ? bodyStart + nextHeadingMatch.index : source.length;
		return source.slice( start, end );
	}

	function parseRowsFromCareerSection( source ) {
		const section = extractCareerSectionSource( source );
		if ( !section ) {
			return { rows: [], otherNote: '' };
		}

		const otherNoteMatch = section.match( /Diğer\s*\{\{adn\|(.+?) maçlarını içerir\.\}\}/i );
		const parsedOtherNote = cleanValue( otherNoteMatch ? otherNoteMatch[ 1 ] : '' );
		const lines = section.split( /\r?\n/ );
		const hasLeagueName = /colspan\s*=\s*"3"\s*\|\s*Lig/i.test( section );
		const hasLocalLeague = /colspan\s*=\s*"3"\s*\|\s*Yerel lig/i.test( section );
		if ( hasLocalLeague ) {
			localLeagueEnabled = true;
		}
		const hasLeagueCup = /colspan\s*=\s*"2"\s*\|\s*Lig kupası/i.test( section );
		if ( hasLeagueCup ) {
			leagueCupEnabled = true;
		}
		const hasNationalCup = /colspan\s*=\s*"2"\s*\|\s*Ulusal kupa/i.test( section );
		const hasContinental = /colspan\s*=\s*"2"\s*\|\s*Kıtasal/i.test( section );
		const hasOther = /colspan\s*=\s*"2"\s*\|\s*Diğer/i.test( section );
		nationalCupEnabled = hasNationalCup;
		continentalEnabled = hasContinental;
		otherEnabled = hasOther;
		const rows = [];
		let activeTeam = null;

		lines.forEach( ( line ) => {
			const trimmed = line.trim();
			if ( !trimmed.startsWith( '| ' ) || /^!\s/.test( trimmed ) ) {
				return;
			}

			const rawCells = trimmed.replace( /^\|\s*/, '' ).split( /\s\|\|\s/ );
			if ( !rawCells.length ) {
				return;
			}

			if ( /^colspan\s*=\s*"2"\s*\|\s*Toplam$/i.test( rawCells[ 0 ] ) || /^Toplam$/i.test( extractCellContent( rawCells[ 0 ] ) ) ) {
				return;
			}

			let seasonCellIndex = 0;
			let statStartIndex = 1;
			const firstCell = cleanValue( rawCells[ 0 ] );
			if ( /^rowspan\s*=/i.test( firstCell ) ) {
				activeTeam = parseTeamValue( extractCellContent( firstCell ) );
				seasonCellIndex = 1;
				statStartIndex = 2;
			} else if ( !activeTeam ) {
				return;
			}

			const seasonCell = extractCellContent( rawCells[ seasonCellIndex ] || '' );
			if ( !seasonCell || /^Toplam$/i.test( seasonCell ) ) {
				return;
			}

			const season = parseSeasonValue( seasonCell );
			rows.push( {
				...activeTeam,
				...season,
				...parseStatPairs(
					rawCells,
					statStartIndex,
					hasLeagueName,
					hasLocalLeague,
					hasNationalCup,
					hasLeagueCup,
					hasContinental,
					hasOther,
					season.season
				)
			} );
		} );

		return { rows, otherNote: parsedOtherNote };
	}

	function parseInfoboxFieldValue( line ) {
		const match = line.match( /^\|\s*[^=]+\s*=\s*(.*)$/ );
		return cleanValue( match ? match[ 1 ] : '' );
	}

	function shortenInfoboxYearRange( value ) {
		const shortened = cleanValue( value ).replace(
			/(\b\d{4}\b)(\s*[-–—]\s*)(\d{4}\b)/g,
			( fullMatch, start, separator, end ) => `${ start }${ separator }${ end.slice( -2 ) }`
		);
		const ongoingMatch = shortened.match( /^(\d{4})(\s*[-–—]\s*)$/ );
		if ( !ongoingMatch ) {
			return shortened;
		}

		const currentYear = String( new Date().getFullYear() ).slice( -2 );
		return `${ ongoingMatch[ 1 ] }${ ongoingMatch[ 2 ] }${ currentYear }`;
	}

	function expandInfoboxSeasonRows( row ) {
		const bounds = seasonBounds( row.season );
		const start = Number( bounds.start );
		const end = Number( bounds.end );
		if ( !Number.isInteger( start ) || !Number.isInteger( end ) || end <= start ) {
			return [ row ];
		}

		const expanded = [];
		for ( let year = start; year < end; year += 1 ) {
			const seasonRow = {
				...row,
				season: `${ year }-${ String( year + 1 ).slice( -2 ) }`,
				seasonLink: ''
			};

			// Bilgi kutusundaki toplamları yalnızca ilk sezona aktar.
			if ( year > start ) {
				STAT_PAIRS.forEach( ( [ appsKey, goalsKey ] ) => {
					seasonRow[ appsKey ] = '';
					seasonRow[ goalsKey ] = '';
				} );
			}
			expanded.push( seasonRow );
		}
		return expanded;
	}

	function parseRowsFromInfobox( source ) {
		const bounds = detectInfoboxBounds( source || '' );
		if ( !bounds ) {
			return [];
		}

		const rowsByIndex = new Map();
		const infoboxLines = bounds.lines.slice( bounds.startIndex, bounds.endIndex + 1 );

		infoboxLines.forEach( ( line ) => {
			const trimmed = line.trim();
			const match = trimmed.match( /^\|\s*(kulüpyıl|kulüp|maç|gol)(\d+)\s*=/i );
			if ( !match ) {
				return;
			}

			const field = match[ 1 ].toLowerCase();
			const index = Number( match[ 2 ] );
			const value = parseInfoboxFieldValue( trimmed );
			const row = rowsByIndex.get( index ) || {
				team: '',
				teamLink: '',
				disableTeamLink: false,
				isLoan: false,
				season: '',
				seasonLink: '',
				disableSeasonLink: false,
				leagueName: '',
				leagueApps: '',
				leagueGoals: '',
				localLeagueName: '',
				localLeagueApps: '',
				localLeagueGoals: '',
				cupApps: '',
				cupGoals: '',
				leagueCupApps: '',
				leagueCupGoals: '',
				continentalApps: '',
				continentalGoals: '',
				otherApps: '',
				otherGoals: ''
			};

			if ( field === 'kulüpyıl' ) {
				row.season = shortenInfoboxYearRange( value );
				row.seasonLink = '';
				row.disableSeasonLink = false;
			} else if ( field === 'kulüp' ) {
				const parsedTeam = parseTeamValue( value );
				row.team = parsedTeam.team;
				row.teamLink = parsedTeam.teamLink;
				row.disableTeamLink = parsedTeam.disableTeamLink;
				row.isLoan = parsedTeam.isLoan;
			} else if ( field === 'maç' ) {
				row.leagueApps = value;
			} else if ( field === 'gol' ) {
				row.leagueGoals = value;
			}

			rowsByIndex.set( index, row );
		} );

		return Array.from( rowsByIndex.entries() )
			.sort( ( a, b ) => a[ 0 ] - b[ 0 ] )
			.map( ( [ , row ] ) => {
				// Boş değer bilinmeyen toplamı, 0 ise gerçek sıfırı belirtir.
				if ( row.team || row.season ) {
					if ( !cleanValue( row.leagueApps ) ) {
						row.leagueApps = '?';
					}
					if ( !cleanValue( row.leagueGoals ) ) {
						row.leagueGoals = '?';
					}
				}
				return row;
			} )
			.flatMap( ( row ) => expandInfoboxSeasonRows( row ) )
			.filter( ( row ) => row.team || row.season || row.leagueApps || row.leagueGoals );
	}

	async function getInitialSourceForForm() {
		const search = new URLSearchParams( window.location.search );
		const isSectionEdit = search.has( 'section' ) && search.get( 'section' ) !== '0';
		if ( textarea && !isSectionEdit ) {
			return textarea.value;
		}
		return getArticleSource();
	}

	function createLinkToggle( labelText, checkedValue ) {
		const label = document.createElement( 'label' );
		label.className = 'tfsh-link-toggle';

		const checkbox = document.createElement( 'input' );
		checkbox.type = 'checkbox';
		checkbox.checked = normalizeBoolean( checkedValue );
		checkbox.addEventListener( 'input', refreshPreview );
		checkbox.addEventListener( 'change', refreshPreview );

		label.appendChild( document.createTextNode( labelText ) );
		label.appendChild( checkbox );

		return { label, checkbox };
	}

	function createRow( initialData = {} ) {
		const tr = document.createElement( 'tr' );
		const data = {};
		const cells = {};
		let addSeasonLink = null;
		let addTeamLink = null;

		FIELD_KEYS.forEach( ( key ) => {
			data[ key ] = initialData[ key ] === null || initialData[ key ] === undefined ? '' : initialData[ key ];
		} );

		const fieldDefs = [
			[ 'team', 'text', 'tfsh-team' ],
			[ 'teamLink', 'text', 'tfsh-text' ],
			[ 'season', 'text', 'tfsh-season' ],
			[ 'seasonLink', 'text', 'tfsh-text' ],
			[ 'leagueName', 'text', 'tfsh-text' ],
			[ 'leagueApps', 'text', 'tfsh-stat' ],
			[ 'leagueGoals', 'text', 'tfsh-stat' ],
			[ 'localLeagueName', 'text', 'tfsh-text' ],
			[ 'localLeagueApps', 'text', 'tfsh-stat' ],
			[ 'localLeagueGoals', 'text', 'tfsh-stat' ],
			[ 'cupApps', 'text', 'tfsh-stat' ],
			[ 'cupGoals', 'text', 'tfsh-stat' ],
			[ 'leagueCupApps', 'text', 'tfsh-stat' ],
			[ 'leagueCupGoals', 'text', 'tfsh-stat' ],
			[ 'continentalApps', 'text', 'tfsh-stat' ],
			[ 'continentalGoals', 'text', 'tfsh-stat' ],
			[ 'otherApps', 'text', 'tfsh-stat' ],
			[ 'otherGoals', 'text', 'tfsh-stat' ]
		];

		fieldDefs.forEach( ( [ key, type, className ] ) => {
			const td = document.createElement( 'td' );
			if ( key === 'leagueCupApps' || key === 'leagueCupGoals' ) {
				td.classList.add( 'tfsh-league-cup-column' );
			}
			if ( key === 'localLeagueName' || key === 'localLeagueApps' || key === 'localLeagueGoals' ) {
				td.classList.add( 'tfsh-local-league-column' );
			}
			if ( key === 'cupApps' || key === 'cupGoals' ) {
				td.classList.add( 'tfsh-national-cup-column' );
			}
			if ( key === 'continentalApps' || key === 'continentalGoals' ) {
				td.classList.add( 'tfsh-continental-column' );
			}
			if ( key === 'otherApps' || key === 'otherGoals' ) {
				td.classList.add( 'tfsh-other-column' );
			}
			const input = document.createElement( 'input' );
			input.type = type;
			input.className = className;
			if ( type === 'checkbox' ) {
				input.checked = normalizeBoolean( data[ key ] );
			} else {
				input.value = cleanValue( data[ key ] );
			}
			if ( key === 'seasonLink' && !cleanValue( input.value ) ) {
				input.dataset.tfshAutoLink = '1';
			}
			if ( key === 'seasonLink' ) {
				input.addEventListener( 'input', () => {
					delete input.dataset.tfshAutoLink;
				} );
			}
			input.addEventListener( 'input', refreshPreview );
			input.addEventListener( 'change', refreshPreview );
			if ( key === 'leagueName' || key === 'localLeagueName' ) {
				input.addEventListener( 'focus', () => prepareLeagueNamePropagation( tr, key ) );
				input.addEventListener( 'input', () => propagateLeagueName( tr, key ) );
				input.addEventListener( 'blur', clearLeagueNamePropagation );
			}

			if ( key === 'team' ) {
				td.className = 'tfsh-team-cell';
				const stack = document.createElement( 'div' );
				stack.className = 'tfsh-team-stack';
				stack.appendChild( input );

				const loanToggle = createLinkToggle( 'Kiralık', data.isLoan );
				stack.appendChild( loanToggle.label );
				data.isLoan = loanToggle.checkbox;

				addTeamLink = document.createElement( 'button' );
				addTeamLink.type = 'button';
				addTeamLink.className = 'tfsh-inline-link tfsh-add-team';
				addTeamLink.textContent = '+';
				addTeamLink.setAttribute( 'aria-label', 'Takım ekle' );
				addTeamLink.title = 'Takım ekle';
				addTeamLink.addEventListener( 'click', addTeamRow );
				stack.appendChild( addTeamLink );

				td.appendChild( stack );
			} else if ( key === 'teamLink' || key === 'seasonLink' ) {
				td.className = 'tfsh-link-cell';
				const row = document.createElement( 'div' );
				row.className = 'tfsh-link-row';
				row.appendChild( input );

				if ( key === 'teamLink' ) {
					const toggle = createLinkToggle( 'Bağlantı olmasın', data.disableTeamLink );
					row.appendChild( toggle.label );
					data.disableTeamLink = toggle.checkbox;
					if ( toggle.checkbox.checked ) {
						input.value = '';
					}
					toggle.checkbox.addEventListener( 'change', () => {
						if ( toggle.checkbox.checked ) {
							input.value = '';
						}
						refreshPreview();
					} );
				} else {
					const toggle = createLinkToggle( 'Bağlantı olmasın', data.disableSeasonLink );
					row.appendChild( toggle.label );
					data.disableSeasonLink = toggle.checkbox;
					toggle.checkbox.addEventListener( 'change', () => {
						if ( toggle.checkbox.checked ) {
							input.value = '';
							delete input.dataset.tfshAutoLink;
						} else if ( !cleanValue( input.value ) ) {
							input.dataset.tfshAutoLink = '1';
						}
						refreshPreview();
					} );
				}

				td.appendChild( row );
			} else if ( key === 'season' ) {
				const stack = document.createElement( 'div' );
				stack.className = 'tfsh-season-stack';
				stack.appendChild( input );

				addSeasonLink = document.createElement( 'button' );
				addSeasonLink.type = 'button';
				addSeasonLink.className = 'tfsh-inline-link';
				addSeasonLink.textContent = '+';
				addSeasonLink.setAttribute( 'aria-label', 'Sezon ekle' );
				addSeasonLink.title = 'Sezon ekle';
				addSeasonLink.addEventListener( 'click', () => {
					addSeasonRow( tr );
				} );
				stack.appendChild( addSeasonLink );

				td.appendChild( stack );
			} else {
				td.appendChild( input );
			}

			tr.appendChild( td );
			data[ key ] = input;
			cells[ key ] = td;
		} );

		const removeTd = document.createElement( 'td' );
		removeTd.className = 'tfsh-remove-cell';
		const removeButton = document.createElement( 'button' );
		removeButton.type = 'button';
		removeButton.className = 'tfsh-remove';
		removeButton.textContent = 'Sil';
		removeButton.addEventListener( 'click', () => {
			tr.remove();
			refreshPreview();
		} );
		removeTd.appendChild( removeButton );
		tr.appendChild( removeTd );

		tr.tfshData = { inputs: data, cells, removeCell: removeTd, addSeasonLink, addTeamLink };
		tbody.appendChild( tr );
	}

	function updateUiGrouping() {
		const rows = Array.from( tbody.querySelectorAll( 'tr' ) );
		rows.forEach( ( tr ) => {
			const rowData = tr.tfshData;
			const teamCell = rowData && rowData.cells && rowData.cells.team;
			const linkCell = rowData && rowData.cells && rowData.cells.teamLink;
			const seasonLink = rowData && rowData.addSeasonLink;
			const teamLink = rowData && rowData.addTeamLink;
			if ( teamCell ) {
				teamCell.style.display = '';
				teamCell.rowSpan = 1;
			}
			if ( linkCell ) {
				linkCell.style.display = '';
				linkCell.rowSpan = 1;
			}
			if ( seasonLink ) {
				seasonLink.style.display = '';
			}
			if ( teamLink ) {
				teamLink.style.display = 'none';
			}
		} );

		for ( let i = 0; i < rows.length; i += 1 ) {
			const current = rows[ i ];
			const currentInputs = current.tfshData.inputs;
			const key = JSON.stringify( [
				cleanValue( currentInputs.team.value ),
				cleanValue( currentInputs.teamLink.value ),
				currentInputs.isLoan.checked,
				currentInputs.disableTeamLink.checked
			] );

			let span = 1;
			for ( let j = i + 1; j < rows.length; j += 1 ) {
				const next = rows[ j ];
				const nextInputs = next.tfshData.inputs;
				const nextKey = JSON.stringify( [
					cleanValue( nextInputs.team.value ),
					cleanValue( nextInputs.teamLink.value ),
					nextInputs.isLoan.checked,
					nextInputs.disableTeamLink.checked
				] );
				if ( nextKey !== key ) {
					break;
				}
				span += 1;
			}

			if ( span > 1 ) {
				current.tfshData.cells.team.rowSpan = span;
				current.tfshData.cells.teamLink.rowSpan = span;
				for ( let j = i + 1; j < i + span; j += 1 ) {
					rows[ j ].tfshData.cells.team.style.display = 'none';
					rows[ j ].tfshData.cells.teamLink.style.display = 'none';
					if ( rows[ j - 1 ].tfshData.addSeasonLink ) {
						rows[ j - 1 ].tfshData.addSeasonLink.style.display = 'none';
					}
				}
				i += span - 1;
			}
		}

		for ( let i = rows.length - 1; i >= 0; i -= 1 ) {
			const row = rows[ i ];
			if ( row.tfshData && row.tfshData.cells && row.tfshData.cells.team.style.display !== 'none' && row.tfshData.addTeamLink ) {
				row.tfshData.addTeamLink.style.display = '';
				break;
			}
		}
	}

	function updateLeagueCupVisibility() {
		updateOptionalCompetitionVisibility( 'tfsh-league-cup-column', 'tfsh-league-cup-heading', leagueCupEnabled, 'Lig kupası' );
	}

	function toggleLeagueCup() {
		leagueCupEnabled = !leagueCupEnabled;
		updateLeagueCupVisibility();
		refreshPreview();
	}

	function updateLocalLeagueVisibility() {
		updateOptionalCompetitionVisibility( 'tfsh-local-league-column', 'tfsh-local-league-heading', localLeagueEnabled, 'Yerel lig' );
	}

	function toggleLocalLeague() {
		localLeagueEnabled = !localLeagueEnabled;
		updateLocalLeagueVisibility();
		refreshPreview();
	}

	function updateOptionalCompetitionVisibility( columnClass, headingClass, enabled, label ) {
		if ( !backdrop ) {
			return;
		}
		Array.from( backdrop.querySelectorAll( `.${ columnClass }` ) ).forEach( ( element ) => {
			element.classList.toggle( 'tfsh-column-disabled', !enabled );
			Array.from( element.querySelectorAll( 'input' ) ).forEach( ( input ) => {
				input.disabled = !enabled;
			} );
		} );
		const heading = backdrop.querySelector( `.${ headingClass }` );
		if ( heading ) {
			heading.setAttribute( 'aria-pressed', enabled ? 'true' : 'false' );
			heading.title = `${ label } sütununu ${ enabled ? 'kapat' : 'aç' }`;
		}
	}

	function updateOptionalCompetitionColumns() {
		updateOptionalCompetitionVisibility( 'tfsh-national-cup-column', 'tfsh-national-cup-heading', nationalCupEnabled, 'Ulusal kupa' );
		updateOptionalCompetitionVisibility( 'tfsh-continental-column', 'tfsh-continental-heading', continentalEnabled, 'Kıtasal' );
		updateOptionalCompetitionVisibility( 'tfsh-other-column', 'tfsh-other-heading', otherEnabled, 'Diğer' );
	}

	function toggleNationalCup() {
		nationalCupEnabled = !nationalCupEnabled;
		updateOptionalCompetitionColumns();
		refreshPreview();
	}

	function toggleContinental() {
		continentalEnabled = !continentalEnabled;
		updateOptionalCompetitionColumns();
		refreshPreview();
	}

	function toggleOther() {
		otherEnabled = !otherEnabled;
		updateOptionalCompetitionColumns();
		refreshPreview();
	}

	function resetDefaultOptionalCompetitionColumns() {
		nationalCupEnabled = true;
		continentalEnabled = true;
		otherEnabled = true;
	}

	function matchingTeamRows( sourceTr ) {
		const sourceInputs = sourceTr && sourceTr.tfshData && sourceTr.tfshData.inputs;
		const team = cleanValue( sourceInputs && sourceInputs.team && sourceInputs.team.value );
		if ( !team ) {
			return [];
		}

		const sourceKey = JSON.stringify( [
			team,
			cleanValue( sourceInputs.teamLink.value ),
			sourceInputs.isLoan.checked,
			sourceInputs.disableTeamLink.checked
		] );

		return Array.from( tbody.querySelectorAll( 'tr' ) ).filter( ( row ) => {
			if ( row === sourceTr || !row.tfshData ) {
				return false;
			}
			const inputs = row.tfshData.inputs;
			return JSON.stringify( [
				cleanValue( inputs.team.value ),
				cleanValue( inputs.teamLink.value ),
				inputs.isLoan.checked,
				inputs.disableTeamLink.checked
			] ) === sourceKey;
		} );
	}

	function prepareLeagueNamePropagation( sourceTr, fieldKey = 'leagueName' ) {
		clearLeagueNamePropagation();
		matchingTeamRows( sourceTr ).forEach( ( row ) => {
			const input = row.tfshData.inputs[ fieldKey ];
			if ( !cleanValue( input.value ) ) {
				input.dataset.tfshLeagueSync = '1';
			}
		} );
	}

	function clearLeagueNamePropagation() {
		if ( !tbody ) {
			return;
		}
		Array.from( tbody.querySelectorAll( '[data-tfsh-league-sync="1"]' ) ).forEach( ( input ) => {
			delete input.dataset.tfshLeagueSync;
		} );
	}

	function propagateLeagueName( sourceTr, fieldKey = 'leagueName' ) {
		const inputs = sourceTr && sourceTr.tfshData && sourceTr.tfshData.inputs;
		const field = inputs && inputs[ fieldKey ];
		const leagueName = ( field && field.value ) || '';

		let changed = false;
		matchingTeamRows( sourceTr ).forEach( ( row ) => {
			const input = row.tfshData.inputs[ fieldKey ];
			if ( input.dataset.tfshLeagueSync === '1' && input.value !== leagueName ) {
				input.value = leagueName;
				changed = true;
			}
		} );

		if ( changed ) {
			refreshPreview();
		}
	}

	function lastRowData() {
		const rows = getRowsFromUI();
		return rows.length ? rows[ rows.length - 1 ] : null;
	}

	function addTeamRow() {
		createRow();
		refreshPreview();
	}

	function nextSeasonValue( value ) {
		const season = cleanValue( value );
		const match = season.match( /\b(\d{4})(\s*[-–—]\s*)?(?:\d{2,4})?\b/ );
		if ( !match ) {
			return '';
		}

		const nextStart = Number( match[ 1 ] ) + 1;
		const nextEnd = String( nextStart + 1 ).slice( -2 );
		const separator = match[ 2 ] || '-';
		return `${ nextStart }${ separator }${ nextEnd }`;
	}

	function buildSeasonRowSeed( row ) {
		const base = row || lastRowData();
		if ( !base ) {
			return null;
		}

		return {
			team: base.team,
			teamLink: base.teamLink,
			isLoan: base.isLoan,
			disableTeamLink: base.disableTeamLink,
			season: nextSeasonValue( base.season ),
			seasonLink: '',
			disableSeasonLink: false,
			leagueName: base.leagueName,
			leagueApps: '',
			leagueGoals: '',
			localLeagueName: base.localLeagueName,
			localLeagueApps: '',
			localLeagueGoals: '',
			cupApps: '',
			cupGoals: '',
			leagueCupApps: '',
			leagueCupGoals: '',
			continentalApps: '',
			continentalGoals: '',
			otherApps: '',
			otherGoals: ''
		};
	}

	function addSeasonRow( afterTr = null ) {
		const seed = buildSeasonRowSeed(
			afterTr ?
				Object.fromEntries(
					FIELD_KEYS.map( ( key ) => {
						const input = afterTr.tfshData.inputs[ key ];
						return [ key, input.type === 'checkbox' ? input.checked : cleanValue( input.value ) ];
					} )
				) :
				null
		);

		if ( !seed ) {
			addTeamRow();
			return;
		}

		createRow( seed );
		const newRow = tbody.lastElementChild;
		if ( afterTr && newRow && afterTr.nextSibling ) {
			tbody.insertBefore( newRow, afterTr.nextSibling );
		}
		refreshPreview();
	}

	function getRowsFromUI() {
		return Array.from( tbody.querySelectorAll( 'tr' ) )
			.map( ( tr ) => {
				const row = {};
				FIELD_KEYS.forEach( ( key ) => {
					const input = tr.tfshData.inputs[ key ];
					row[ key ] = input.type === 'checkbox' ?
						input.checked :
						key === 'seasonLink' && input.dataset.tfshAutoLink === '1' ?
							'' :
							cleanValue( input.value );
				} );
				return row;
			} )
			.filter( ( row ) => row.team || row.season );
	}

	function updateSeasonLinkHints() {
		Array.from( tbody.querySelectorAll( 'tr' ) ).forEach( ( row ) => {
			const inputs = row.tfshData && row.tfshData.inputs;
			if ( !inputs ) {
				return;
			}
			const generatedTarget = defaultSeasonTarget( {
				team: inputs.team.value,
				teamLink: inputs.teamLink.value,
				season: inputs.season.value
			} );
			if ( inputs.disableSeasonLink.checked ) {
				inputs.seasonLink.value = '';
				inputs.seasonLink.placeholder = '';
				delete inputs.seasonLink.dataset.tfshAutoLink;
				return;
			}
			if ( inputs.seasonLink.dataset.tfshAutoLink === '1' || !cleanValue( inputs.seasonLink.value ) ) {
				inputs.seasonLink.value = generatedTarget;
				inputs.seasonLink.dataset.tfshAutoLink = '1';
			}
			inputs.seasonLink.placeholder = generatedTarget;
		} );
	}

	function updateLeagueNameValidity() {
		Array.from( tbody.querySelectorAll( 'tr' ) ).forEach( ( row ) => {
			const inputs = row.tfshData && row.tfshData.inputs;
			if ( !inputs ) {
				return;
			}
			const activeRow = cleanValue( inputs.team.value ) || cleanValue( inputs.season.value );
			inputs.leagueName.classList.toggle(
				'tfsh-invalid',
				Boolean( activeRow && !cleanValue( inputs.leagueName.value ) )
			);
		} );
	}

	function handleTableKeyboardNavigation( event ) {
		if ( event.key !== 'Enter' || event.isComposing ) {
			return;
		}
		const currentInput = event.target.closest( 'input[type="text"]' );
		if ( !currentInput || !tbody.contains( currentInput ) ) {
			return;
		}

		const visibleInputs = Array.from( tbody.querySelectorAll( 'input[type="text"]' ) )
			.filter( ( input ) => input.getClientRects().length > 0 && !input.disabled );
		const currentIndex = visibleInputs.indexOf( currentInput );
		const nextIndex = currentIndex + ( event.shiftKey ? -1 : 1 );
		const nextInput = visibleInputs[ nextIndex ];
		if ( !nextInput ) {
			return;
		}

		event.preventDefault();
		nextInput.focus();
		nextInput.select();
	}

	function refreshPreview() {
		const rows = getRowsFromUI();
		preview.value = rows.length ? buildCareerSection( rows ) : '';
		mw.storage.set( getRowsStorageKey(), JSON.stringify( rows ) );
		mw.storage.set( getOtherNoteStorageKey(), otherNote );
		updateUiGrouping();
		updateSeasonLinkHints();
		updateLeagueNameValidity();
		updateLeagueCupVisibility();
		updateLocalLeagueVisibility();
		updateOptionalCompetitionColumns();
	}

	function closeOtherNoteDialog() {
		const dialog = backdrop && backdrop.querySelector( '.tfsh-note-dialog-backdrop' );
		if ( dialog ) {
			dialog.classList.remove( 'is-open' );
		}
	}

	function editOtherNote( event ) {
		if ( event ) {
			event.preventDefault();
			event.stopPropagation();
		}
		const dialogBackdrop = backdrop.querySelector( '.tfsh-note-dialog-backdrop' );
		const input = dialogBackdrop.querySelector( '.tfsh-note-dialog-input' );
		input.value = otherNote;
		dialogBackdrop.classList.add( 'is-open' );
		input.focus();
		input.select();
	}

	function saveOtherNote() {
		const input = backdrop.querySelector( '.tfsh-note-dialog-input' );
		otherNote = cleanValue( input.value );
		closeOtherNoteDialog();
		refreshPreview();
	}

	function clearUiRows() {
		tbody.innerHTML = '';
	}

	async function loadSavedRows() {
		// Her madde varsayılan sütun görünümüyle açılır.
		resetDefaultOptionalCompetitionColumns();

		try {
			const source = await getInitialSourceForForm();
			const parsedCareer = parseRowsFromCareerSection( source );
			// Ayrıştırma sırasında değişen görünümü varsayılana döndür.
			resetDefaultOptionalCompetitionColumns();
			if ( parsedCareer.rows.length ) {
				clearUiRows();
				otherNote = parsedCareer.otherNote;
				parsedCareer.rows.forEach( ( row ) => createRow( row ) );
				refreshPreview();
				return;
			}

			const infoboxRows = parseRowsFromInfobox( source );
			if ( infoboxRows.length ) {
				clearUiRows();
				otherNote = '';
				infoboxRows.forEach( ( row ) => createRow( row ) );
				refreshPreview();
				return;
			}
		} catch ( error ) {
			mw.log.warn( 'Madde içeriği çözümlenemedi:', error );
		}

		try {
			const saved = JSON.parse( mw.storage.get( getRowsStorageKey() ) || '[]' );
			otherNote = cleanValue( mw.storage.get( getOtherNoteStorageKey() ) || '' );
			if ( Array.isArray( saved ) && saved.length ) {
				clearUiRows();
				saved.forEach( ( row ) => createRow( row ) );
				refreshPreview();
				return;
			}
		} catch ( error ) {
			mw.log.warn( 'Kayıtlı veriler okunamadı:', error );
		}

		clearUiRows();
		otherNote = '';
		createRow();
		refreshPreview();
	}

	function insertOrReplaceCareerSection( source, sectionText ) {
		// Eski bölümü kaldırıp güncel konumunda yeniden oluştur.
		const headingRegex = /^==\s*Kariyer istatistikleri\s*==\s*$/im;
		const match = headingRegex.exec( source );
		let cleanSource = source;
		let preservedNationalTeamSection = '';

		if ( match ) {
			const headingEnd = source.indexOf( '\n', match.index );
			const bodyStart = headingEnd === -1 ? source.length : headingEnd + 1;
			const nextHeadingMatch = /^==\s*[^=\n].*?\s*==\s*$/m.exec( source.slice( bodyStart ) );
			const end = nextHeadingMatch ? bodyStart + nextHeadingMatch.index : source.length;

			// Kariyer bölümündeki millî takım içeriğini koru.
			const oldSectionBody = source.slice( bodyStart, end );
			const nationalTeamHeading = /^===+\s*(?:mill[iî]\s+takım(?:\s+[^=\n]+)?|mill[iî]\s+istatistikler(?:i)?|uluslararası\s+istatistikler(?:i)?)\s*===+\s*$/im.exec( oldSectionBody );
			if ( nationalTeamHeading ) {
				preservedNationalTeamSection = oldSectionBody
					.slice( nationalTeamHeading.index )
					.trim();
			}

			cleanSource = `${ source.slice( 0, match.index ) }${ source.slice( end ) }`;
		}

		const replacementSection = preservedNationalTeamSection ?
			`${ sectionText.trimEnd() }\n\n${ preservedNationalTeamSection }\n` :
			sectionText;

		const headings = [];
		const topLevelHeadingRegex = /^==\s*([^=\n].*?)\s*==\s*$/gm;
		let headingMatch;
		while ( ( headingMatch = topLevelHeadingRegex.exec( cleanSource ) ) !== null ) {
			headings.push( {
				index: headingMatch.index,
				title: headingMatch[ 1 ]
					.trim()
					.toLocaleLowerCase( 'tr-TR' )
					.replace( /[\s_-]+/g, ' ' )
			} );
		}

		// Kariyer istatistiklerini kapanış bölümlerinin önüne yerleştir.

		const closingHeadingPattern = /^(başarıları?|başarı ve ödülleri|ödülleri|kaynakça|kaynaklar|dış bağlantılar)$/;
		const closingHeading = headings.find( ( heading ) => {
			const title = heading.title;
			return closingHeadingPattern.test( title );
		} );
		let insertAt = closingHeading ? closingHeading.index : -1;

		if ( insertAt === -1 ) {
			// Kapanış bölümü yoksa son kariyer başlığının ardından ekle.
			const careerHeadings = headings.filter( ( heading ) => /(?:^| )(?:kariyer(?:i)?|futbolculuk|teknik direktörlük)(?: |$)/.test( heading.title )
			);
			if ( careerHeadings.length ) {
				const lastCareer = careerHeadings[ careerHeadings.length - 1 ];
				const followingHeading = headings.find( ( heading ) => {
					const headingIndex = heading.index;
					return headingIndex > lastCareer.index;
				} );
				insertAt = followingHeading ? followingHeading.index : cleanSource.length;
			}
		}

		if ( insertAt === -1 ) {
			// Bölümü sıralama, kategori ve dil bağlantılarının üstünde tut.
			const trailingMetadata = /^(?:\{\{\s*(?:DEFAULTSORT|VarsayılanSıralama)\s*:|\[\[(?:Kategori|Category):|\[\[[a-z-]{2,12}:)/im.exec( cleanSource );
			insertAt = trailingMetadata ? trailingMetadata.index : cleanSource.length;
		}

		const before = cleanSource.slice( 0, insertAt ).replace( /\s*$/, '' );
		const after = cleanSource.slice( insertAt ).replace( /^\s*/, '' );
		return `${ before }\n\n${ replacementSection.trimEnd() }${ after ? `\n\n${ after }` : '\n' }`;
	}

	function ensureNotesSection( source ) {
		if ( !otherEnabled || !cleanValue( otherNote ) ) {
			return source;
		}

		const notesTemplateRegex = /\{\{\s*Not[ _]listesi\b/i;
		const notesHeadingRegex = /^==\s*Notlar\s*==\s*$/im;
		const notesHeading = notesHeadingRegex.exec( source );

		if ( notesHeading ) {
			if ( notesTemplateRegex.test( source ) ) {
				return source;
			}
			const headingEnd = source.indexOf( '\n', notesHeading.index );
			if ( headingEnd === -1 ) {
				return `${ source }\n{{Not listesi}}\n`;
			}
			return `${ source.slice( 0, headingEnd + 1 ) }{{Not listesi}}\n${ source.slice( headingEnd + 1 ) }`;
		}

		if ( notesTemplateRegex.test( source ) ) {
			return source;
		}

		const followingHeading = /^(?:==\s*(?:Kaynakça|Kaynaklar|Dış bağlantılar)\s*==\s*)$/im.exec( source );
		let insertAt = followingHeading ? followingHeading.index : -1;
		if ( insertAt === -1 ) {
			const trailingMetadata = /^(?:\{\{\s*(?:DEFAULTSORT|VarsayılanSıralama)\s*:|\[\[(?:Kategori|Category):|\[\[[a-z-]{2,12}:)/im.exec( source );
			insertAt = trailingMetadata ? trailingMetadata.index : source.length;
		}

		const before = source.slice( 0, insertAt ).replace( /\s*$/, '' );
		const after = source.slice( insertAt ).replace( /^\s*/, '' );
		return `${ before }\n\n== Notlar ==\n{{Not listesi}}${ after ? `\n\n${ after }` : '\n' }`;
	}

	function detectInfoboxBounds( source ) {
		const lines = source.split( '\n' );
		const startIndex = lines.findIndex( ( line ) => hasSupportedFootballerInfobox( line.trim() )
		);
		if ( startIndex === -1 ) {
			return null;
		}

		let depth = 0;
		for ( let i = startIndex; i < lines.length; i += 1 ) {
			const line = lines[ i ];
			const opens = ( line.match( /\{\{/g ) || [] ).length;
			const closes = ( line.match( /\}\}/g ) || [] ).length;
			depth += opens - closes;
			if ( depth <= 0 && i > startIndex ) {
				return { startIndex, endIndex: i, lines };
			}
		}

		return null;
	}

	function seasonBounds( seasonText ) {
		const season = cleanValue( seasonText );
		const match = season.match( /(\d{4})\D+(\d{2,4})/ );
		if ( !match ) {
			return { start: season, end: season };
		}

		const start = Number( match[ 1 ] );
		const rawEnd = match[ 2 ];
		let end = Number( rawEnd );

		if ( rawEnd.length === 2 ) {
			const century = Math.floor( start / 100 ) * 100;
			end = century + end;
			if ( end < start ) {
				end += 100;
			}
		}

		return { start: String( start ), end: String( end ) };
	}

	function seasonRangeText( seasons ) {
		const filtered = seasons.filter( Boolean );
		if ( !filtered.length ) {
			return '';
		}

		const first = seasonBounds( filtered[ 0 ] );
		const last = seasonBounds( filtered[ filtered.length - 1 ] );
		if ( first.start === last.end ) {
			return first.start;
		}
		return `${ first.start }-${ last.end }`;
	}

	function aggregateInfoboxRows( rows ) {
		const aggregated = [];

		rows.forEach( ( row ) => {
			const team = cleanValue( row.team );
			if ( !team ) {
				return;
			}

			const key = JSON.stringify( [
				team,
				cleanValue( row.teamLink ),
				normalizeBoolean( row.isLoan ),
				normalizeBoolean( row.disableTeamLink )
			] );
			const previous = aggregated[ aggregated.length - 1 ];
			const leagueUnknown = isUnknown( row.leagueApps ) || isUnknown( row.leagueGoals );
			const isLoan = normalizeBoolean( row.isLoan );

			if ( previous && previous.key === key ) {
				previous.seasons.push( cleanValue( row.season ) );
				if ( previous.includeStats && !leagueUnknown ) {
					previous.apps += numericValue( row.leagueApps );
					previous.goals += numericValue( row.leagueGoals );
				} else {
					previous.includeStats = false;
				}
				return;
			}

			if ( isLoan ) {
				for ( let i = aggregated.length - 1; i >= 0; i -= 1 ) {
					const entry = aggregated[ i ];
					if ( !normalizeBoolean( entry.isLoan ) ) {
						entry.seasons.push( cleanValue( row.season ) );
						break;
					}
				}
			}

			if ( !isLoan ) {
				let returnIndex = -1;
				for ( let i = aggregated.length - 1; i >= 0; i -= 1 ) {
					const entry = aggregated[ i ];
					if (
						entry.team === team &&
            cleanValue( entry.teamLink ) === cleanValue( row.teamLink ) &&
            !normalizeBoolean( entry.isLoan ) &&
            normalizeBoolean( entry.disableTeamLink ) === normalizeBoolean( row.disableTeamLink )
					) {
						returnIndex = i;
						break;
					}
				}

				if ( returnIndex !== -1 ) {
					const onlyLoansBetween = aggregated
						.slice( returnIndex + 1 )
						.every( ( entry ) => normalizeBoolean( entry.isLoan ) );
					if ( onlyLoansBetween ) {
						const original = aggregated[ returnIndex ];
						original.seasons.push( cleanValue( row.season ) );
						if ( original.includeStats && !leagueUnknown ) {
							original.apps += numericValue( row.leagueApps );
							original.goals += numericValue( row.leagueGoals );
						} else {
							original.includeStats = false;
						}
						return;
					}
				}
			}

			aggregated.push( {
				key,
				team,
				teamLink: cleanValue( row.teamLink ),
				isLoan,
				disableTeamLink: normalizeBoolean( row.disableTeamLink ),
				seasons: [ cleanValue( row.season ) ],
				apps: numericValue( row.leagueApps ),
				goals: numericValue( row.leagueGoals ),
				includeStats: !leagueUnknown
			} );
		} );

		return aggregated;
	}

	function findInfoboxCareerInsertIndex( infoboxLines ) {
		const isYouthLine = ( line ) => /^\|\s*(altyapıyıl|altyapıkulüp|altyapıkulübü)\d+\s*=/.test( line.trim() );
		const isNationalLine = ( line ) => /^\|\s*(milliyıl|millitakım|milli?maç|milligol)\d+\s*=/.test( line.trim() );

		for ( let i = 0; i < infoboxLines.length; i += 1 ) {
			if ( isNationalLine( infoboxLines[ i ] ) ) {
				return i;
			}
		}

		for ( let i = infoboxLines.length - 1; i >= 0; i -= 1 ) {
			if ( isYouthLine( infoboxLines[ i ] ) ) {
				return i + 1;
			}
		}

		return Math.max( infoboxLines.length - 1, 1 );
	}

	function rebuildInfobox( source, rows ) {
		const bounds = detectInfoboxBounds( source );
		if ( !bounds ) {
			return source;
		}

		const { startIndex, endIndex, lines } = bounds;
		const infoboxLines = lines.slice( startIndex, endIndex + 1 ).filter( ( line ) => !/^\|\s*(kulüpyıl|kulüp|maç|gol)\d+\s*=/.test( line.trim() ) );

		const insertAt = findInfoboxCareerInsertIndex( infoboxLines );
		const statLines = [];

		aggregateInfoboxRows( rows ).forEach( ( row, index ) => {
			const n = index + 1;
			statLines.push( `| kulüpyıl${ n } = ${ seasonRangeText( row.seasons ) }` );
			statLines.push( `| kulüp${ n } = ${ formatTeamCell( row, { withArrow: true } ) }` );
			statLines.push( `| maç${ n } = ${ row.includeStats ? row.apps : '' }` );
			statLines.push( `| gol${ n } = ${ row.includeStats ? row.goals : '' }` );
		} );

		infoboxLines.splice( insertAt, 0, ...statLines );

		// Bilgi kutusundaki farklı tireleri standartlaştır.
		for ( let i = 0; i < infoboxLines.length; i += 1 ) {
			if ( /^\|\s*[^=]*yıl\d*\s*=/i.test( infoboxLines[ i ].trim() ) ) {
				infoboxLines[ i ] = infoboxLines[ i ].replace( /[–—−]/g, '-' );
			}
		}

		const rebuiltLines = [
			...lines.slice( 0, startIndex ),
			...infoboxLines,
			...lines.slice( endIndex + 1 )
		];
		return rebuiltLines.join( '\n' );
	}

	function applyToTextarea() {
		const rows = getRowsFromUI();
		if ( !rows.length ) {
			return;
		}

		const sectionText = buildCareerSection( rows );
		let nextText = insertOrReplaceCareerSection( textarea.value, sectionText );
		nextText = ensureNotesSection( nextText );
		nextText = rebuildInfobox( nextText, rows );
		textarea.value = nextText;
		refreshPreview();
		backdrop.classList.remove( 'is-open' );

		const summaryInput = document.querySelector( "#wpSummary, input[name='wpSummary']" );
		if ( summaryInput && !cleanValue( summaryInput.value ) ) {
			summaryInput.value = 'kariyer istatistikleri düzenlendi ve güncellendi';
			summaryInput.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			summaryInput.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		}

		const previewButton = document.querySelector( "#wpPreview, button[name='wpPreview'], input[name='wpPreview']" );
		if ( previewButton ) {
			previewButton.click();
		}
	}

	function ensureUi() {
		if ( launchButton && backdrop ) {
			return true;
		}

		if ( isMonobookSkin() && window.mw && window.mw.util && window.mw.util.addPortletLink ) {
			launchButton = window.mw.util.addPortletLink(
				'p-cactions',
				'#',
				'FootballerStats',
				'ca-matchstats-editor',
				'FootballerStats aracını aç'
			);
			launchTab = launchButton ? launchButton.closest( 'li' ) : null;
		}

		if ( !launchButton ) {
			launchButton = document.createElement( 'button' );
			launchButton.type = 'button';
			launchButton.className = 'tfsh-launch';
			launchButton.textContent = 'FootballerStats';

			buttonRow = document.createElement( 'div' );
			buttonRow.className = 'tfsh-launch-row';
			buttonRow.appendChild( launchButton );
		}

		backdrop = document.createElement( 'div' );
		backdrop.className = 'tfsh-backdrop';
		backdrop.innerHTML = `
      <div class="tfsh-modal" role="dialog" aria-modal="true" aria-label="FootballerStats">
        <div class="tfsh-head">
          <div class="tfsh-title">FootballerStats</div>
          <button type="button" class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium cdx-button--icon-only tfsh-close" aria-label="Kapat" title="Kapat">
            <span class="cdx-icon cdx-icon--medium" aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <path d="m4.34 2.93 12.73 12.73-1.41 1.41L2.93 4.35z"></path>
                <path d="M17.07 4.34 4.34 17.07l-1.41-1.41L15.66 2.93z"></path>
              </svg>
            </span>
          </button>
        </div>
        <details class="tfsh-help">
          <summary>Nasıl kullanılır?</summary>
          <div class="tfsh-help-body">
            <p>Takımın yer almadığı müsabakalardaki istatistik kısmını boş bırakın.</p>
            <p>Takım yer almış ancak oyuncu maça çıkmamışsa, 0 koyun.</p>
            <p>Takım yer almış ancak oyuncunun istatistikleri bilinmiyorsa ? ekleyin.</p>
          </div>
        </details>
        <div class="tfsh-table-wrap">
        <table class="tfsh-table">
          <colgroup>
            <col style="width:10%"><col style="width:12%"><col style="width:7%"><col style="width:12%"><col style="width:9%">
            <col style="width:5.5%"><col style="width:5.5%">
            <col class="tfsh-local-league-column" style="width:9%"><col class="tfsh-local-league-column" style="width:5.5%"><col class="tfsh-local-league-column" style="width:5.5%">
            <col class="tfsh-national-cup-column" style="width:5.5%"><col class="tfsh-national-cup-column" style="width:5.5%">
            <col class="tfsh-league-cup-column" style="width:5.5%"><col class="tfsh-league-cup-column" style="width:5.5%">
            <col class="tfsh-continental-column" style="width:5.5%"><col class="tfsh-continental-column" style="width:5.5%"><col class="tfsh-other-column" style="width:5.5%"><col class="tfsh-other-column" style="width:5.5%"><col style="width:6%">
          </colgroup>
          <thead>
            <tr>
              <th rowspan="2">Takım</th>
              <th rowspan="2">Takım bağlantısı</th>
              <th rowspan="2">Sezon</th>
              <th rowspan="2">Sezon bağlantısı</th>
              <th colspan="3" class="tfsh-main-league-heading">Lig</th>
              <th colspan="3" class="tfsh-local-league-heading tfsh-local-league-column tfsh-toggle-heading" role="button" tabindex="0" aria-pressed="false">Yerel lig</th>
              <th colspan="2" class="tfsh-national-cup-heading tfsh-national-cup-column tfsh-toggle-heading" role="button" tabindex="0" aria-pressed="true">Ulusal kupa</th>
              <th colspan="2" class="tfsh-league-cup-heading tfsh-league-cup-column tfsh-toggle-heading" role="button" tabindex="0" aria-pressed="false">Lig kupası</th>
              <th colspan="2" class="tfsh-continental-heading tfsh-continental-column tfsh-toggle-heading" role="button" tabindex="0" aria-pressed="true">Kıtasal</th>
              <th colspan="2" class="tfsh-other-heading tfsh-other-column tfsh-toggle-heading" role="button" tabindex="0" aria-pressed="true">Diğer <button type="button" class="tfsh-other-note-btn" aria-label="Diğer notu">?</button></th>
            </tr>
            <tr>
              <th>Lig</th>
              <th>Maç</th>
              <th>Gol</th>
              <th class="tfsh-local-league-column">Lig</th>
              <th class="tfsh-local-league-column">Maç</th>
              <th class="tfsh-local-league-column">Gol</th>
              <th class="tfsh-national-cup-column">Maç</th>
              <th class="tfsh-national-cup-column">Gol</th>
              <th class="tfsh-league-cup-column">Maç</th>
              <th class="tfsh-league-cup-column">Gol</th>
              <th class="tfsh-continental-column">Maç</th>
              <th class="tfsh-continental-column">Gol</th>
              <th class="tfsh-other-column">Maç</th>
              <th class="tfsh-other-column">Gol</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        </div>
        <div class="tfsh-actions">
          <button type="button" class="tfsh-primary tfsh-apply">Önizle</button>
        </div>
        <textarea class="tfsh-preview" spellcheck="false" placeholder="Oluşan kariyer istatistikleri tablosu burada görünür."></textarea>
      </div>
      <div class="tfsh-note-dialog-backdrop" role="presentation">
        <div class="tfsh-note-dialog" role="dialog" aria-modal="true" aria-labelledby="tfsh-note-dialog-title">
          <h3 id="tfsh-note-dialog-title">Diğer sütunu notu</h3>
          <p>Diğer sütunundaki istatistiklerin hangi turnuva veya maç türlerini içerdiğini yazın. “Maçlarını içerir” ifadesini eklemeyin; araç bunu otomatik tamamlar.</p>
          <p class="tfsh-note-dialog-example"><strong>Örnek:</strong> UEFA Süper Kupası ve FIFA Kulüpler Dünya Kupası</p>
          <input type="text" class="tfsh-note-dialog-input" aria-label="Diğer sütunu açıklaması" placeholder="Turnuva adlarını yazın">
          <div class="tfsh-note-dialog-actions">
            <button type="button" class="tfsh-note-cancel">İptal</button>
            <button type="button" class="tfsh-note-save">Kaydet</button>
          </div>
        </div>
      </div>
    `;
		document.body.appendChild( backdrop );

		if ( buttonRow ) {
			const editForm =
        document.querySelector( '#editform' ) ||
        textarea.closest( 'form' ) ||
        textarea.parentElement;
			editForm.insertBefore( buttonRow, textarea );
		}

		tbody = backdrop.querySelector( 'tbody' );
		preview = backdrop.querySelector( '.tfsh-preview' );
		tbody.addEventListener( 'keydown', handleTableKeyboardNavigation );

		launchButton.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			backdrop.classList.add( 'is-open' );
			window.requestAnimationFrame( updateOptionalCompetitionColumns );
		} );

		backdrop.querySelector( '.tfsh-close' ).addEventListener( 'click', () => {
			backdrop.classList.remove( 'is-open' );
		} );

		backdrop.querySelector( '.tfsh-other-note-btn' ).addEventListener( 'click', editOtherNote );
		backdrop.querySelector( '.tfsh-note-cancel' ).addEventListener( 'click', closeOtherNoteDialog );
		backdrop.querySelector( '.tfsh-note-save' ).addEventListener( 'click', saveOtherNote );
		backdrop.querySelector( '.tfsh-note-dialog-input' ).addEventListener( 'keydown', ( event ) => {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				saveOtherNote();
			}
		} );
		backdrop.querySelector( '.tfsh-note-dialog-backdrop' ).addEventListener( 'click', ( event ) => {
			if ( event.target === event.currentTarget ) {
				closeOtherNoteDialog();
			}
		} );
		backdrop.querySelector( '.tfsh-league-cup-heading' ).addEventListener( 'click', toggleLeagueCup );
		backdrop.querySelector( '.tfsh-local-league-heading' ).addEventListener( 'click', toggleLocalLeague );
		backdrop.querySelector( '.tfsh-national-cup-heading' ).addEventListener( 'click', toggleNationalCup );
		backdrop.querySelector( '.tfsh-continental-heading' ).addEventListener( 'click', toggleContinental );
		backdrop.querySelector( '.tfsh-other-heading' ).addEventListener( 'click', ( event ) => {
			if ( !event.target.closest( '.tfsh-other-note-btn' ) ) {
				toggleOther();
			}
		} );
		[
			[ '.tfsh-local-league-heading', toggleLocalLeague ],
			[ '.tfsh-national-cup-heading', toggleNationalCup ],
			[ '.tfsh-league-cup-heading', toggleLeagueCup ],
			[ '.tfsh-continental-heading', toggleContinental ],
			[ '.tfsh-other-heading', toggleOther ]
		].forEach( ( [ selector, toggle ] ) => {
			backdrop.querySelector( selector ).addEventListener( 'keydown', ( event ) => {
				if ( event.target.closest( '.tfsh-other-note-btn' ) ) {
					return;
				}
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					toggle();
				}
			} );
		} );
		backdrop.querySelector( '.tfsh-apply' ).addEventListener( 'click', applyToTextarea );

		backdrop.addEventListener( 'click', ( event ) => {
			if ( event.target === backdrop ) {
				backdrop.classList.remove( 'is-open' );
			}
		} );

		document.addEventListener( 'keydown', ( event ) => {
			if ( event.key === 'Escape' && backdrop.classList.contains( 'is-open' ) ) {
				if ( backdrop.querySelector( '.tfsh-note-dialog-backdrop' ).classList.contains( 'is-open' ) ) {
					closeOtherNoteDialog();
					return;
				}
				backdrop.classList.remove( 'is-open' );
			}
		} );

		loadSavedRows();
		return true;
	}

	function applyUiAvailability( shouldShow ) {
		if ( !textarea || !ensureUi() ) {
			return false;
		}

		if ( buttonRow ) {
			buttonRow.style.display = shouldShow ? '' : 'none';
		}
		if ( launchTab ) {
			launchTab.style.display = shouldShow ? '' : 'none';
		}
		if ( !shouldShow ) {
			backdrop.classList.remove( 'is-open' );
		}
		return shouldShow;
	}

	function autoOpenIfRequested( shouldShow ) {
		const search = new URLSearchParams( window.location.search );
		const shouldAutoOpen = search.get( 'tfsh' ) === '1';
		if ( !shouldShow || !shouldAutoOpen || !backdrop || document.body.dataset.tfshAutoOpened === '1' ) {
			return;
		}

		document.body.dataset.tfshAutoOpened = '1';
		backdrop.classList.add( 'is-open' );
	}

	async function syncUiAvailability() {
		if ( !textarea || !ensureUi() ) {
			return false;
		}

		if ( hasSupportedFootballerInfobox( textarea.value ) ) {
			const available = applyUiAvailability( true );
			autoOpenIfRequested( available );
			return available;
		}

		const search = new URLSearchParams( window.location.search );
		const isSectionEdit = search.has( 'section' ) && search.get( 'section' ) !== '0';
		if ( isSectionEdit ) {
			const available = applyUiAvailability( await articleUsesSupportedFootballerInfobox() );
			autoOpenIfRequested( available );
			return available;
		}

		const result = applyUiAvailability( false );
		autoOpenIfRequested( result );
		return result;
	}

	async function initViewShortcut() {
		if ( !isSupportedSkin() ) {
			return false;
		}

		const search = new URLSearchParams( window.location.search );
		const action = search.get( 'action' ) || ( window.mw && window.mw.config && window.mw.config.get( 'wgAction' ) ) || 'view';
		const hasTextbox = !!document.querySelector( '#wpTextbox1' );
		const isEditLike =
      hasTextbox ||
      action === 'edit' ||
      action === 'submit' ||
      /[?&]veaction=edit\b/i.test( window.location.search );

		if ( isEditLike || !getCurrentPageTitle() ) {
			return false;
		}

		const supportedArticle = await articleUsesSupportedFootballerInfobox();
		if ( !supportedArticle ) {
			return false;
		}

		const link = ensureQuickAccessLink();
		if ( quickAccessTab ) {
			quickAccessTab.style.display = '';
		}
		return !!link;
	}

	function init() {
		textarea = document.querySelector( '#wpTextbox1' );
		const search = new URLSearchParams( window.location.search );
		const hasTextbox = !!textarea;
		const supportedSkin = isSupportedSkin();
		const isEditView =
			hasTextbox &&
			(
				search.get( 'action' ) === 'edit' ||
				search.get( 'action' ) === 'submit' ||
				document.body.classList.contains( 'action-edit' ) ||
				document.body.classList.contains( 'action-submit' ) ||
				/[?&]veaction=edit\b/i.test( window.location.search )
			);

		if ( !textarea || !isEditView || !supportedSkin ) {
			return false;
		}

		syncUiAvailability();

		if ( !textarea.dataset.tfshBound ) {
			textarea.dataset.tfshBound = '1';
			textarea.addEventListener( 'input', syncUiAvailability );
		}

		return true;
	}

	const initResult = init();
	if ( !initResult ) {
		initViewShortcut();
		const observer = new MutationObserver( () => {
			if ( init() ) {
				observer.disconnect();
				return;
			}
			if ( quickAccessLink ) {
				observer.disconnect();
				return;
			}
			initViewShortcut().then( ( added ) => {
				if ( added || quickAccessLink ) {
					observer.disconnect();
				}
			} );
		} );
		observer.observe( document.documentElement, { childList: true, subtree: true } );
		window.addEventListener( 'load', init, { once: true } );
	}
}() );
