/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */

"use strict";
console.log("%cMAP for FearTheFear loaded.", "color: #888");

const MAP_TEXT = {
    1: `My bedroom in the Hotel ButtCrack. I will not make the bed. I am the Princess.`,
    2: "My main room in the Hotel ButtCrack. Should I listen to the news? Perhaps?",
    3: `What a beautiful view. I'd enjoy it more if my castle weren't under attack. Again. Most inconsiderate.`,
    4: ``,
};

/** Map definitions */
const MAP = {
    1: {
        name: "Bedroom in the ButtCrack Hotel",
        data: '{"width":"13","height":"13","depth":3,"map":"BB2ABABB4AA23ŁABAA10BAA6BAA4BAA6BAA4BABAA5BB2AA2BB33ABB4ABB2AA4BB2ABB2AA3BABB8ABÁBB11ABB4䂂BB29Á$BB34ABB79䁢BB39ÁBB3ÁBÁÁ7BABB2ÁBB41ÁÁ32BÁÁ2BÁÁ31BÁÁ17BB9ɁсࡁBAB","extendedMap":"AA42㡋$AA38ᡂAA181ᡂAA187ࡂࡂ2AA2㡆AA22ᡆAA21㡋㡋6A"}',
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
        decals: '[[221,5,"FirePlaceDecal_675","crest"],[233,3,"FirePlaceDecal_675","crest"],[222,4,"FirePit_681","crest"],[232,4,"FirePit_677","crest"],[188,4,"BearRug02","crest"],[199,4,"BearRug02","crest"],[200,4,"BearRug02","crest"],[201,4,"BearRug02","crest"],[202,4,"BearRug02","crest"],[203,4,"BearRug02","crest"]]',
        lights: '[[162,1,"Fireplace_716","fireplace",["9.99","50.0","5.0"]],[422,1,"DuaLLantern_017","standard",["1","10","5.0"]]]',
        gates: '[[155,3,"1.1","2.1","Closed"]]',
        oracles: '[[175,7,"PrincessHotelBed"]]',
        lairs: '[[329,1,"Lair78"],[333,1,"Lair_606"]]',
        fires: '[[222,4,"Fireplace"],[232,4,"Fireplace"]]',
        monsterList: '["Bat"]',
    }
    ,
    2: {
        name: "Room in the ButtCrack Hotel",
        data: '{"width":"15","height":"15","depth":3,"map":"BB3ABABABAA3BB2AA21䁢AA7BAA19BB2AA9ÁAA7BB2ÁAÁAÁAA17BAA2BAA4BAA8BB2AA8BB13AA2BB7ABB9ABB2AA2BB2ABB5AA3BB2AA2BB5ABB10сɁBB4䁢BB46ÁBB60$ŁBB47䁢BB51ABB25ࡁBB2AA2ÁÁ2AÁÁ8BB26䂂BB12ÁÁ2BB4ÁÁ2BB14ÁÁ39BÁBÁÁ28BB4ÁÁ23BB2ÁÁ12BB2ÁÁ27BB9AA4BB3A","extendedMap":"AA42㡌$AA404ࡌAA46ࡆAA120⡆AA59"}',
        dungeonAmbience: 0.03,
        sg: 0,
        maxSpawned: 2,
        killCountdown: 3,
        killsRequiredToStopSpawning: 12,
        spawnDelay: 9999,
        wall: "KleinWall_472",
        floor: "Wood5",
        ceil: "KreaWall_521",
        frontPanorama: "",
        leftPanorama: "",
        rightPanorama: "",
        backPanorama: "",
        archPanorama: "",
        skyPanorama: "",
        start: '[340,5]',
        lights: '[[284,3,"Fireplace_710","fireplace",["9.99","50.0","5.0"]],[404,3,"Fireplace_719","fireplace",["9.99","50.0","5.0"]],[286,1,"Light_618","standardDimmed",["5","20","5.0"]],[376,7,"DuaLLantern_008","standardDimmed",["5","20","5.0"]]]',
        gates: '[[105,5,"2.1","1.1","Closed"],[232,7,"2.2","3.1","Closed"],[442,1,"2.3","4.1","Blue"]]',
        oracles: '[[344,3,"HotelNews"],[235,7,"TanNylon"]]',
    }
    ,
    3: {
        name: "Hotel Balcony",
        data: '{"width":"9","height":"9","depth":5,"map":"BB8AA42BB4$BB10AA9BB43ÁÁ2BB18ÁBB18ÁBB45䁢BB8ÁÁ8BÁÁ6BÁÁ2BÁB䂂ABB23ÁÁ126BB23","extendedMap":"AA46㡋ࡈAA62㡋㡋3AA253$AA4ࡈࡈ6A㡋㡋24AA4"}',
        dungeonAmbience: 10,
        sg: 0,
        maxSpawned: 2,
        killCountdown: 3,
        killsRequiredToStopSpawning: 12,
        spawnDelay: 9999,
        wall: "KreaWall_538",
        floor: "RedMArbleFloor2",
        ceil: "LightWallSDXL310",
        frontPanorama: "",
        leftPanorama: "HotelBalconyView",
        rightPanorama: "",
        backPanorama: "",
        archPanorama: "",
        skyPanorama: "",
        start: '[67,1]',
        gates: '[[76,1,"3.1","2.2","Closed"]]',
        keys: '[[70,4]]',
        oracles: '[[73,1,"MetalBlueSitter3"]]',
    }
    ,
    4: {
        name: "Reception",
        data: '{"width":"15","height":"15","depth":5,"map":"BB2AA2BABB2AA3BAA20BB2ABAA2BAA4BÁÁ2AA2BAA12ŁAA13BABB2AA6BAA3BB3AA3BŁBB2AA4BB11AÁBB3ABB31ABB27ABB6ÁÁ2BB7ABB9ÁÁ3BABABB32ABŁŁ2ࡁBB6ÁŁBB11ABB4AA2B䁢BB10AÁBB12ÁBB27ABB60䂂BB82ABB15ÁBB6ÁÁ2BB20$BB3ÁBB2ÁBB7ÁÁ2ABB2AÁBÁÁ2BB2ÁBÁBÁÁ2BB5ÁBB6ÁÁ2BB2ÁBB2ÁÁ3BÁBÁÁ5BÁÁ2BB4ÁAÁBB5ÁBB78ÁÁ3BB2ࡁÁBB2ÁÁ2BB37ÁÁ46BB3ÁÁ10BÁÁ36BÁÁ7BÁÁ11BÁÁ20AÁBÁÁ34BB3ÁBB2ÁBÁÁ5BB2ÁÁ26BÁÁ5ࡁAÁÁ84AÁÁ2BÁÁ8ࡁÁÁ14AÁBB10ÁÁ2ɁÁÁ11BB14ɁɁ2AA2ŁŁ2AA4Bсс2ŁŁ3ࡁࡁ2ɁɁ3сс3BB5","extendedMap":"AA64⡂$AA87⡂AA204㡆AA34㡋AA5㡋AA104塃塃2AA205硃AA5ᡋࡅAA43硃AA123⡂⡂2A⡂AA2⡂AA16ᡋAA21⡂AA113ᡅAA61ᡋᡋ2AA8ᡆA㡋㡋2AA5"}',
        dungeonAmbience: 0.03,
        sg: 0,
        maxSpawned: 2,
        killCountdown: 3,
        killsRequiredToStopSpawning: 12,
        spawnDelay: 9999,
        wall: "KreaWall_531",
        floor: "BloodMarbleFloorWall_SDXL_020",
        ceil: "BloodMarbleFloorWall_SDXL_012",
        frontPanorama: "",
        leftPanorama: "",
        rightPanorama: "",
        backPanorama: "",
        archPanorama: "",
        skyPanorama: "",
        start: '[512,1]',
        lights: '[[1098,1,"Lamp51","standardYellowFaint",["5","10","2"]],[1100,1,"Lamp51","standardYellowFaint",["5","10","2"]],[357,7,"FluxLight109","standard2",["10","10","2"]],[168,5,"DuaLLantern_018","standard2",["9.99","50.0","5.0"]],[756,1,"DuaLLantern_017","standard2",["5","10","1"]],[756,3,"AlpineLight_159","standard2",["5","10","1"]],[758,5,"Light_648","standard2",["5","10","1"]]]',
        gates: '[[7,7,"4.1","2.3","Blue"]]',
        entities: '[[447,1,"TheReceptionist"]]',
    }

};