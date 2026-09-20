// -- main --
/**
 * 
 */





$(function () {
    console.clear();
    console.info("*****************************************");
    console.info("*****************************************");

    let EL = ELEMENT.compileElementPlanes(ELEMENT.CUBE);
    console.info(EL);
    EL = ELEMENT.compileElementPlanes(ELEMENT.CUBE_60);
    console.info(EL);
    EL = ELEMENT.compileElementPlanes(ELEMENT.WEDGE);
    console.info(EL);



    console.info("*****************************************");
});