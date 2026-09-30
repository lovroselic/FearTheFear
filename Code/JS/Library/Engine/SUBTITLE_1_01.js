/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

/**
 *      dependencies:
 *          ENGINE
 *          GenericTimers
 */

const SUBTITLE = {
    VERSION: "1.01",
    CSS: "color: #7A0",
    layer: "subtitle",
    fs: 18,
    font: "Times",
    x: null,
    y: null,
    color: "FFF",
    layerFraction: 0.95,
    init(layerString = "subtitle", fs = 18, font = "Times", align = "center") {
        this.setLayer(layerString);
        this.CTX = LAYER[layerString];
        this.fs = fs;
        this.font = font;
        this.CTX.font = `${this.fs}px ${this.font}`;
        this.CTX.shadowColor = "#111";
        this.CTX.shadowOffsetX = 1;
        this.CTX.shadowOffsetY = 1;
        this.CTX.shadowBlur = 0;
        this.CTX.textAlign = align;
        this.w = this.CTX.canvas.width;
        this.h = this.CTX.canvas.height;
        this.x = this.w / 2;
        this.y = this.h / 2;
    },
    setLayer(layerString) {
        this.layer = layerString;
    },
    cache: null,
    clear() {
        ENGINE.clearLayer(this.layer);
    },
    subtitle(text, color = "#FFF") {
        this.cache = null;
        this.clear();
        this.color = color;
        this.subtitleWrite(text);
    },
    subtitleAdd(text) {
        text = this.cache + text;
        this.subtitleWrite(text);
    },
    subtitleWrite(text) {
        text = text.replace(/[<>#-]/g, '');
        this.CTX.fillStyle = this.color;
        this.CTX.fillText(text, this.x, this.y);
        this.cache = text;
    },
    timedSubtitle(text, color, timer) {
        this.clear();
        text = text.replace(/[<>#-]/g, '');
        const textWidth = this.CTX.measureText(text).width;
        const fraction = textWidth / this.w;
        if (fraction > this.layerFraction) return this.multiLineSubtitle(text, color, timer);
        this.subtitle(text, color);
        GenericTimers.subTimer(timer);
    },
    multiLineSubtitle(text, color, timer) {
        this.CTX.fillStyle = color;
        const texts = text.split("\n");                 // use \n to split!, we are not checking if it fits to layer !!!
        const L = texts.length;
        const availableH = Math.round(this.h / L);

        for (const [i, T] of texts.entries()) {
            this.CTX.fillText(T.trim(), this.x, ((i + 0.5) * availableH) + (this.fs / 2));
        }
        GenericTimers.subTimer(timer);
    }
};

//END
console.log(`%cSUBTITLE ${SUBTITLE.VERSION} loaded.`, SUBTITLE.CSS);