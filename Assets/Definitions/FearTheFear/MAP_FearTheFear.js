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
        name: "Generic room name",
        data: '{"width":"17","height":"17","depth":3,"map":"BB3ABB9AA33BAA35BAA6BAA44BAA19BB2AA16BB2ÁÁ4BABB14AA2BB25ABB12ABB5AA4BAA7ÁBB6AÁBB13ABB30$BB10ÁÁ2BB11ABB112ÁÁ2BÁÁ2BÁÁ18BB48ÁÁ3BB24ÁÁ76ABÁÁ6AA2ÁÁ3AÁÁ88BB2ÁBB2ÁÁ3AÁÁ43BB3ÁÁ19BÁÁ33AÁÁ22BB18","extendedMap":"AA36⡂ᡂAA12ᡂAA114ࡃAA183⡂⡂2AA150ᡃAA33$AA164ᡂAA15ࡂࡂ3A㡂㡂2AA146"}',
        sg: 0,
        maxSpawned: -1,
        killCountdown: -1,
        killsRequiredToStopSpawning: 99,
        spawnDelay: -1,
        wall: "BlackWall45",
        floor: "Wood12",
        ceil: "WebbedFloor4",
        start: '[246,1]',
        decals: '[[262,1,"FemDommes_26897","picture"],[264,1,"Domme232","picture"],[8,7,"KnightStatue_498","crest"],[256,4,"Firepit1","crest"],[450,7,"Sconce_11","crest"]]',
        lights: '[[219,3,"Lamp52","standard",["9.99","50.0","5.0"]],[450,1,"SkullLantern50","standard",["9.99","50.0","5.0"]]]',
        gates: '[[280,1,"1.1","2.1","Gold"]]',
        keys: '[[229,0]]',
        monsters: '[[127,"Bat",1]]',
        scrolls: '[[195,13]]',
        gold: '[[37,"GreenGem"],[39,"GoldSphere"]]',
        containers: '[[44,"WoodenCrate439","GOLD_ITEM_TYPE.GreenGem",7],[47,"Barrel_476","INTERACTION_ITEM.ManaSkill",7]]',
        movables: '[[175,"RoastChicken"]]',
        fires: '[[256,4,"Fire"],[467,1,"Torch"]]',
    }
    ,
    2: {
        name: "room2",
        data: '{"width":"17","height":"17","depth":3,"map":"BB4ABB10AA155BABB31ABB14ABAA10BB17ABB12䁢BB19ÁÁ2ABB128$BB9ÁÁ24BB84ÁÁ312BB27","extendedMap":"AA867$"}',
        sg: 0,
        maxSpawned: -1,
        killCountdown: -1,
        killsRequiredToStopSpawning: 99,
        spawnDelay: -1,
        wall: "BlackWall45",
        floor: "Wood12",
        ceil: "WebbedFloor4",

        frontPanorama: "",
        leftPanorama: "",
        rightPanorama: "",
        backPanorama: "",
        archPanorama: "",
        skyPanorama: "",
        start: '[59,7]',
        gates: '[[8,7,"2.1","1.1","Gold"],[68,5,"2.2","3.1","Closed"]]',
    }
    ,
    3: {
        name: "TowerTest",
        data: '{"width":"17","height":"17","depth":5,"map":"ÁBB14AA14BAA13BB2AA223BAA9$AA3B䁢ABB2AA2ÁÁ3BB2ÁÁ20ABÁÁ368BB2ÁÁ22BÁBB17ÁÁ3BB2ÁÁ124BÁÁ419BÁÁ166BB2A","extendedMap":"AA1430ࡄ$AA11ࡄࡄ2A"}',
        dungeonAmbience: 2,
        sg: 0,
        maxSpawned: -1,
        killCountdown: -1,
        killsRequiredToStopSpawning: 99,
        spawnDelay: -1,
        wall: "BlackWall45",
        floor: "Wood12",
        ceil: "WebbedFloor4",
        frontPanorama: "AlpinePanorama_168",
        leftPanorama: "AlpinePanorama_168",
        rightPanorama: "AlpinePanorama_168",
        backPanorama: "AlpinePanorama_168",
        archPanorama: "",
        skyPanorama: "Sky_204",
        start: '[66,3]',
        gates: '[[67,3,"3.1","2.2","Closed"]]',
    }
};