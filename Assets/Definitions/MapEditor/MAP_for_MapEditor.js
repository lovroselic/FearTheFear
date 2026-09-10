/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */

"use strict";

/** textures */
const TEXTURE_LIST = [
    
].sort();

/** Decals */
const DECAL_PAINTINGS = [

].sort();

/** Crests */

const DECAL_CRESTS = [].sort();

//lights
const LIGHT_DECALS = [

].sort();

//panorama
const PANORAMA_DECALS = [

].sort();

//arch
const ARCH_DECALS = [

].sort();;

//sky
const SKY_DECALS = [

].sort();


const TRIGGER_DECALS = [];
const LAIR_DECALS = [].sort();

const CONTAINER_LIST = [];
if (typeof CONTAINER_ITEM_TYPE !== "undefined") {

    for (const container in CONTAINER_ITEM_TYPE) {
        CONTAINER_LIST.push(container);
    }
}
console.log("%cMAP for MapEditor loaded.", "color: #888");