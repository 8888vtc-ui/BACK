/**
 * Duel Head-to-Head : Bot Actuel (TypeScript Option A) vs Nouveau Bot (XG-Web WASM 3.5M)
 * Mesure du Win Rate, Gammons, Perte d'équité et Error Rate / PR.
 */

import fs from 'fs';
import { performance } from 'perf_hooks';

// Charge le WASM XG-Web Core
const wasmBuffer = fs.readFileSync('public/engine/xg_web_core.wasm');
const wasmModule = await WebAssembly.instantiate(wasmBuffer, {});
const wasm = wasmModule.instance.exports;
wasm.xg_init();

// Charge les poids 3.5M
if (fs.existsSync('public/engine/weights_xg_web.bin')) {
    const weightsBuf = fs.readFileSync('public/engine/weights_xg_web.bin');
    const weightsPtr = 16384;
    const wasmMem = new Uint8Array(wasm.memory.buffer);
    wasmMem.set(weightsBuf, weightsPtr);
    wasm.xg_load_weights(weightsPtr, weightsBuf.length);
    console.log(`[+] Poids XG-Web 3.5M chargés dans WASM (${weightsBuf.length} octets).`);
}

console.log('[+] Moteur WASM initialisé avec succès.');
