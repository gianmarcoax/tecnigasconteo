/**
 * Utilidad de sonido – retroalimentación auditiva al escanear.
 * Usa Web Audio API para generar tonos cortos.
 */

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

/**
 * Reproduce un tono corto.
 * @param {number} frecuencia - Hz
 * @param {number} duracion   - milisegundos
 * @param {string} tipo       - 'sine' | 'square' | 'triangle'
 */
function reproducirTono(frecuencia, duracion, tipo = 'sine') {
    try {
        const ctx = getAudioCtx();
        const oscilador = ctx.createOscillator();
        const ganancia = ctx.createGain();

        oscilador.type = tipo;
        oscilador.frequency.setValueAtTime(frecuencia, ctx.currentTime);
        ganancia.gain.setValueAtTime(0.3, ctx.currentTime);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion / 1000);

        oscilador.connect(ganancia);
        ganancia.connect(ctx.destination);

        oscilador.start(ctx.currentTime);
        oscilador.stop(ctx.currentTime + duracion / 1000);
    } catch (e) {
        // Silenciosamente ignorar errores de audio
    }
}

/** Sonido de éxito: tono agudo corto */
export function sonidoExito() {
    reproducirTono(880, 120, 'sine');
}

/** Sonido de error: tono grave doble */
export function sonidoError() {
    reproducirTono(220, 200, 'square');
    setTimeout(() => reproducirTono(180, 200, 'square'), 250);
}

/** Sonido de incremento: tono medio muy corto */
export function sonidoIncremento() {
    reproducirTono(660, 80, 'triangle');
}
