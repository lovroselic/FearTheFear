/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */

"use strict";
console.log("%cMAP for FearTheFear loaded.", "color: #888");

const MAP_TEXT = {
    1: "This is initial sandbox.",
    2: "The dark room to test gates.",
};

/** Map definitions */
const MAP = {
    1: {
        name: "Bedroom in the ButtCrack Hotel",
        data: '{"width":"13","height":"13","depth":3,"map":"BB2ABABB5AA26ŁABAA22BAA5BAA4BABAA5BABABB31ABB4ABB2AA3BB2ABB2AA4BB9ABÁBB11ABB46ABB8Á$BB34ABB105ÁBB3ÁÁ6AÁÁ2BB38ÁÁ67BÁÁ19BB10ɁсࡁB","extendedMap":"AA42㡋$AA38ᡂAA181ᡂAA187ࡂࡂ2AA2㡆AA22ᡆAA21㡋㡋6A"}',
        dungeonAmbience: 0.03,
        sg: 0,
        maxSpawned: 2,
        killCountdown: 3,
        killsRequiredToStopSpawning: 12,
        spawnDelay: 9999,
        wall: "BlackWall45",
        floor: "Wood12",
        ceil: "WebbedFloor4",
        frontPanorama: "",
        leftPanorama: "",
        rightPanorama: "",
        backPanorama: "",
        archPanorama: "",
        skyPanorama: "",
        start: '[201,1]',
        decals: '[[221,5,"FirePlaceDecal_675","crest"],[233,3,"FirePlaceDecal_675","crest"],[222,4,"FirePit_681","crest"],[232,4,"FirePit_677","crest"]]',
        lights: '[[162,1,"Fireplace_716","fireplace",["9.99","50.0","5.0"]]]',
        lairs: '[[329,1,"Lair78"],[333,1,"Lair_606"]]',
        fires: '[[222,4,"Fireplace"],[232,4,"Fireplace"]]',
        monsterList: '["Bat"]',
    }

};