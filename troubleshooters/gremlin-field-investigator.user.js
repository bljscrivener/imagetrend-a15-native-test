// ==UserScript==
// @name         Gremlin Field Investigator
// @namespace    local.imagetrend.gremlin.investigator
// @version      0.3.1
// @description  Compatibility entrypoint for the Safari-safe Gremlin Universal Investigator.
// @match        http://*/*
// @match        https://*/*
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-universal-investigator.user.js
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-field-investigator.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-field-investigator.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

/*
 * Compatibility shim.
 *
 * The investigator mechanism now lives in gremlin-universal-investigator.user.js.
 * Keeping this file as the stable update endpoint preserves existing installs while
 * divorcing the generic inspection mechanism from ImageTrend-specific assumptions.
 */