var CANVAS_SIZE = 2048;
var ANIMATE_TIME_MS = 600;
var ANIMATE_FLASH_MS = 600;
var BGM_FADE_MS = 600;

var QUADRANT_LABEL = [
        "一",
        "二",
        "三",
        "四"
];

var QUADRANT_STRING = [
        "一", // "第一象限に", // dai-ichishō gen ni
        "二", // "第二象限に", // dai-nishō gen ni
        "三", // "第三象限に", // dai-sanshō gen ni
        "四"  // "第四象限に"  // dai-yonshō gen ni
];
var ORIENT_STRING = [
        "Inward", // "中心へ", // chūshin e
        "CCW", // "左巻へ", // samaki e
        "Outward", // "辺へ", // hen e
        "Clockwise" // "右巻へ" // migimaki e
];

var QUADRANT_ANGLE = [
        -45,
        -45-90,
        +45+90,
        +45
];

var ORIENT_ANGLE = [
        180,
        -90,
        0,
        90
];

var QUADRANT_ANGLE_ERROR = 45;
var ORIENT_ANGLE_ERROR = 20;

var COLORS = {
    arenaInner: [0x33, 0x33, 0x33],
    arenaOuter: [0x9d, 0x9d, 0x9d],
    arenaBorder: [0x33, 0x33, 0x33],
    quadLine: [0xee, 0xee, 0xee],
    quadText: [0x9d, 0x9d, 0x9d],
    arrowFillP1: [66, 139, 202],
    arrowFillP2: [217, 83, 79],
    arrowBorder: [0x33, 0x33, 0x33],
    rivetFill: [238, 162, 54],
    rivetHighlight: [253, 214, 174] //[240, 173, 78] // 253, 214, 174 ?
};

var audio = {
    spin : null,
    taikoReel: null,
    rouletteStop1: null,
    rouletteStop2: null
};

var AUDIO_FILES = {
    spin: "./img/274928__theshaggyfreak__cat-toy-spinning-ball.mp3",
    taikoReel: "./img/taiko-reel.mp3",
    rouletteStop1: "./img/roulette-stop1.mp3",
    rouletteStop2: "./img/roulette-stop2.mp3"
};

var arena = {
    $canvas: null,
    canvas: null,
    ctx: null
};

var arenaBare = {
    $canvas: null,
    canvas: null,
    ctx: null
};

var currentRobots = [
    {position: null, orientation: null},
    {position: null, orientation: null}
];

var rouletteAnim = {
    tStart: [null, null], // robot 1, 2
    mainStart: [null, null], // robot 1, 2
    secondaryStart: [null, null],
    mainEnd: [null, null],
    secondaryEnd: [null, null],
    mainTau: 0.5,
    secondaryTau: 1,
    fullSpins: 3,
    showAfterTaus: 5,
    endAfterTaus: 12,
    getShowAfterTime: function() {
        return rouletteAnim.showAfterTaus * Math.max(rouletteAnim.mainTau, rouletteAnim.secondaryTau);
    },
    getEndAfterTime: function() {
        return rouletteAnim.endAfterTaus * Math.max(rouletteAnim.mainTau, rouletteAnim.secondaryTau);
    }
};

$(document).ready(function() {
    setupCanvas();
    drawArena();
    rouletteClear();

    // for the size to set itself correctly
    var $posContainers = $(".position-box > h3");
    $posContainers.find('.position').text(QUADRANT_STRING[0]);
    $posContainers.find('.orientation').text(ORIENT_STRING[0]);
    $posContainers.stop(false, true, true).fadeTo(0, 0);

    // buttons
    // TODO: keyboard binds
    $("#btn-robot1-roll").on('click', function() {
        rouletteRoll(1);
    });
    $("#btn-robot2-roll").on('click', function() {
        rouletteRoll(2);
    });
    $("#btn-clear").on('click', function() {
         rouletteClear();
    });
    $("#btn-bgm").on('click', function() {
        if(audio.taikoReel.paused) {
            audio.taikoReel.volume = 0;
            audio.taikoReel.play();
            $(audio.taikoReel).animate({volume: 1.0}, BGM_FADE_MS);
        }
        else {
            $(audio.taikoReel).animate({volume: 0.0}, BGM_FADE_MS, 'swing', function() { audio.taikoReel.pause() });
        }
    });

    // audio
    audio.spin = new Audio(AUDIO_FILES.spin);
    configureAudio(audio.spin);
    audio.spin.playbackRate = 2.0;

    audio.taikoReel = new Audio(AUDIO_FILES.taikoReel);
    configureAudio(audio.taikoReel);
    audio.taikoReel.loop = true;

    audio.rouletteStop1 = new Audio(AUDIO_FILES.rouletteStop1);
    configureAudio(audio.rouletteStop1);

    audio.rouletteStop2 = new Audio(AUDIO_FILES.rouletteStop2);
    configureAudio(audio.rouletteStop2);
});

function configureAudio(audioObj) {
    audioObj.autoplay = false;
    audioObj.volume = 1.0;
    audioObj.playbackRate = 1.0;
    audioObj.preload = 'auto';
    audioObj.loop = false;
    if(audioObj.preservesPitch) audioObj.preservesPitch = true;
    else if(audioObj.mozPreservesPitch) audioObj.mozPreservesPitch = true;
    else if(audioObj.webkitPreservesPitch) audioObj.webkitPreservesPitch = true;
}

function rouletteRoll(robot) {
    var irobot = (robot == 1) ? 0 : 1;
    var other = (irobot == 0) ? 1 : 0;

    currentRobots[irobot].position = getQuadrant(currentRobots[other].position);
    currentRobots[irobot].orientation = getOrientation();

    rouletteAnim.tStart[irobot] = (new Date()).getTime()/1000;
    rouletteAnim.mainStart[irobot] = getRandomAngle();
    rouletteAnim.secondaryStart[irobot] = getRandomAngle();
    rouletteAnim.mainEnd[irobot] = rouletteAnim.fullSpins*360 + QUADRANT_ANGLE[currentRobots[irobot].position]
            + (QUADRANT_ANGLE_ERROR*Math.random()) - QUADRANT_ANGLE_ERROR/2;
    rouletteAnim.secondaryEnd[irobot] = rouletteAnim.fullSpins*360 + ORIENT_ANGLE[currentRobots[irobot].orientation]
            + (ORIENT_ANGLE_ERROR*Math.random()) - ORIENT_ANGLE_ERROR/2;
    window.requestAnimationFrame(drawRouletteFrame);

    audio.spin.currentTime = 0;
    audio.spin.play();

    hideRouletteText(robot);

    function onEndRoulette() {
        // text
        showRouletteText(robot);

        // audio - lower volume on bgm first
        if (audio.taikoReel.paused) playRouletteEndAudio();
        else $(audio.taikoReel).animate({ volume: 0.2 }, BGM_FADE_MS, 'swing', function() {
            playRouletteEndAudio();
        })
    }
    function fadeInBgm() {
        $(audio.taikoReel).animate({ volume: 1.0 }, BGM_FADE_MS, 'swing');
    }
    function playRouletteEndAudio() {
        if(robot == 1) {
            audio.rouletteStop1.currentTime = 0;
            audio.rouletteStop1.play();
            if(!audio.taikoReel.paused) $(audio.rouletteStop1).on('ended', fadeInBgm);
        }
        else {
            audio.rouletteStop2.currentTime = 0;
            audio.rouletteStop2.play();
            if(!audio.taikoReel.paused) $(audio.rouletteStop2).on('ended', fadeInBgm);
        }
    }
    setTimeout(onEndRoulette, rouletteAnim.getShowAfterTime()*1000);
}

function rouletteClear() {
    for(var i = 0; i < 2; ++i) {
        currentRobots[i].position = null;
        currentRobots[i].orientation = null;
        rouletteAnim.tStart[i] = null;
        rouletteAnim.mainStart[i] = null;
        rouletteAnim.secondaryStart[i] = null;
        rouletteAnim.mainEnd[i] = null;
        rouletteAnim.secondaryEnd[i] = null;
    }
    restoreBareArena();
    $(".position-box > h3").fadeTo(ANIMATE_TIME_MS, 0);
}

function showRouletteText(robot) {
    var irobot = (robot == 1) ? 0 : 1;
    var $posContainer = $('#robot' + robot + '-position');
    var color = (robot == 1) ? COLORS.arrowFillP1 : COLORS.arrowFillP2;

    function animateFlashOn() {
        $posContainer.find('h3').css('color', rgb(color));
        setTimeout(animateFlashOff, ANIMATE_FLASH_MS/2);
    }

    function animateFlashOff() {
        $posContainer.find('h3').css('color', 'inherit');
    }

    $posContainer.find('.position').text(QUADRANT_STRING[currentRobots[irobot].position]);
    $posContainer.find('.orientation').text(ORIENT_STRING[currentRobots[irobot].orientation]);
    $posContainer.find('h3').stop(false, true, true).fadeTo(ANIMATE_TIME_MS, 1, animateFlashOn);
}

function hideRouletteText(robot) {
    var irobot = (robot == 1) ? 0 : 1;
    $('#robot' + robot + '-position h3').fadeTo(ANIMATE_TIME_MS, 0);
}

function drawRouletteFrame() {
    var t = (new Date()).getTime()/1000;
    var tRel = [
        (rouletteAnim.tStart[0] != null) ? t - rouletteAnim.tStart[0] : null,
        (rouletteAnim.tStart[1] != null) ? t - rouletteAnim.tStart[1] : null
    ];
    var endAfter = rouletteAnim.getEndAfterTime();
    var endAllAfter = Math.max.apply(null, rouletteAnim.tStart) + endAfter;

    restoreBareArena();
    drawRouletteSpinner(1, tRel[0]);
    drawRouletteSpinner(2, tRel[1]);

    if(t < endAllAfter) window.requestAnimationFrame(drawRouletteFrame);
}

function drawRouletteSpinner(robot, trel) {
    var i = (robot == 1) ? 0 : 1;
    if (trel == null) return;

    var mainAngle = _expAngle(trel, rouletteAnim.mainTau, rouletteAnim.mainStart[i], rouletteAnim.mainEnd[i]);
    var secondaryAngle = _expAngle(trel, rouletteAnim.secondaryTau,
            rouletteAnim.secondaryStart[i], rouletteAnim.secondaryEnd[i]);
    drawArrow(robot, mainAngle, secondaryAngle);
}

/**
 * Get an exponential charging curve for rotation animations.
 *
 * @param {Number} t Time elapsed since the beginning of the animation.
 * @param tau Time constant.
 * @param xStart Output value at t=0.
 * @param xEnd Output value at t>= tEnd.
 * @returns {Number}
 * @private
 */
function _expAngle(t, tau, xStart, xEnd) {
    return (xEnd - xStart) * (1 - Math.exp(-t/tau)) + xStart;
}

function setupCanvas() {
    var $container = $('#arena-container');
    var $canvas = $('<canvas>');
    $canvas.prop('id', 'arena-canvas');
    $container.append($canvas);

    var $bareCanvas = $('<canvas>');
    $bareCanvas.prop('id', 'arena-bare-canvas');

    // set up external data structure
    arena.$canvas = $canvas;
    arena.canvas = $canvas[0];
    if (arena.canvas.getContext) {
        arena.ctx = arena.canvas.getContext('2d');
    }

    arenaBare.$canvas = $bareCanvas;
    arenaBare.canvas = $bareCanvas[0];
    if (arenaBare.canvas.getContext) {
        arenaBare.ctx = arenaBare.canvas.getContext('2d');
    }
    setCanvasSize();
    arena.ctx.translate(CANVAS_SIZE/2, CANVAS_SIZE/2);
    arenaBare.ctx.translate(CANVAS_SIZE/2, CANVAS_SIZE/2);
}

function renderCanvas() {
    // noop - for use if we use an off-screen canvas later
}

function setCanvasSize() {
    arena.$canvas.prop('width', CANVAS_SIZE);
    arena.$canvas.prop('height', CANVAS_SIZE);
    arenaBare.$canvas.prop('width', CANVAS_SIZE);
    arenaBare.$canvas.prop('height', CANVAS_SIZE);
}

function drawArena() {
    var r_net = Math.floor(CANVAS_SIZE/2 - 32);
    var r_border = Math.floor(CANVAS_SIZE/10);

    // Parameters
    var rOuter = r_net;
    var rInner = r_net - r_border;
    var rBorder = 32;
    var quadLineWidth = 16;
    var gradSteps = 16;

    var quadText = {
        font: '256px serif',
        textAlign: 'center',
        textBaseline: 'middle',
        positionOffset: Math.floor(rInner/1.6/Math.sqrt(2))
    };

    // Outer part (white ring)
    arena.ctx.beginPath();
    arena.ctx.fillStyle = rgb(COLORS.arenaOuter);
    arena.ctx.arc(0, 0, rOuter, 0, 2*Math.PI);
    arena.ctx.fill();
    arena.ctx.closePath();

    // Border (linear RGB gradient)
    for(var i = 0; i < gradSteps; ++i) {
        arena.ctx.beginPath();

        // generate RGB gradient values
        var currentColor = [255, 0, 0];
        for(var j = 0; j < 3; j++) {
            currentColor[j] = Math.floor((COLORS.arenaBorder[j] - COLORS.arenaOuter[j]) * (i+1)/gradSteps)
                    + COLORS.arenaOuter[j];
        }
        arena.ctx.strokeStyle = rgb(currentColor);
        arena.ctx.lineWidth = Math.ceil(rBorder/gradSteps);
        arena.ctx.arc(0, 0, Math.floor(rOuter - (gradSteps - i)*rBorder/gradSteps), 0, 2*Math.PI);
        arena.ctx.stroke();
        arena.ctx.closePath();
    }

    // Inner part (black combat surface)
    arena.ctx.beginPath();
    arena.ctx.fillStyle = rgb(COLORS.arenaInner);
    arena.ctx.arc(0, 0, rInner, 0, 2*Math.PI);
    arena.ctx.fill();
    arena.ctx.closePath();

    // Quadrant lines
    arena.ctx.beginPath();
    var halfCanvas = Math.ceil(CANVAS_SIZE/2);
    arena.ctx.strokeStyle = rgb(COLORS.quadLine);
    arena.ctx.lineWidth = quadLineWidth;

    arena.ctx.moveTo(-halfCanvas, 0);
    arena.ctx.lineTo(+halfCanvas, 0);
    arena.ctx.moveTo(0, -halfCanvas);
    arena.ctx.lineTo(0, +halfCanvas);
    arena.ctx.stroke();
    arena.ctx.closePath();

    // Quadrant numbers
    arena.ctx.fillStyle = rgb(COLORS.quadText);
    arena.ctx.font = quadText.font;
    arena.ctx.textAlign = quadText.textAlign;
    arena.ctx.textBaseline = quadText.textBaseline;
    arena.ctx.direction = 'inherit';

    var textPos = [quadText.positionOffset, -quadText.positionOffset];
    for(var q = 0; q < 4; ++q) {
        arena.ctx.fillText(QUADRANT_LABEL[q], textPos[0], textPos[1]);
        textPos = rotate(textPos, -90);
    }

    // save to arena pre-render
    arenaBare.ctx.drawImage(arena.canvas, -CANVAS_SIZE/2, -CANVAS_SIZE/2);

    renderCanvas();
}

function restoreBareArena() {
    arena.ctx.drawImage(arenaBare.canvas, -CANVAS_SIZE/2, -CANVAS_SIZE/2);
}

/**
 * Angles are left-hand coordinates (positive = clockwise).
 *
 * @param {Number} robot Robot number (1 or 2).
 * @param mainAngleDeg Primary stem angle, in degrees clockwise from horizontal-right.
 * @param secAngleDeg Secondary stem angle, in degrees clockwise from primary stem angle.
 */
function drawArrow(robot, mainAngleDeg, secAngleDeg) {
    var lineWidth = 16;
    var stemWidth = 64;

    var arrowWidth = 128+64;
    var arrowHeight = 128;
    var innerArena = Math.floor(CANVAS_SIZE/2 - 32);
    var mainLength = Math.floor(innerArena/1.8);
    var secondaryLength = innerArena - mainLength - 16;

    var halfStemWidth = Math.floor(stemWidth/2);
    var halfArrowWidth = Math.floor(arrowWidth/2);
    var rivetRadius = halfStemWidth * 0.6;

    arena.ctx.fillStyle = (robot == 1) ? rgb(COLORS.arrowFillP1) : rgb(COLORS.arrowFillP2);
    arena.ctx.strokeStyle = rgb(COLORS.arrowBorder);
    arena.ctx.lineWidth = lineWidth;

    // main arrow stem
    arena.ctx.save();
    arena.ctx.rotate(Math.PI/180 * mainAngleDeg);
    arena.ctx.beginPath();
    arena.ctx.rect(-halfStemWidth, -halfStemWidth, mainLength + halfStemWidth, stemWidth);
    arena.ctx.stroke();
    arena.ctx.fill();
    arena.ctx.closePath();

    _drawRivet(0, 0, rivetRadius);

    arena.ctx.translate(mainLength, 0);
    arena.ctx.rotate(Math.PI/180 * secAngleDeg);
    arena.ctx.beginPath();
    var secondArrowVertices = [
            [-halfStemWidth, -halfStemWidth],
            [secondaryLength - arrowHeight, -halfStemWidth],
            [secondaryLength - arrowHeight, -halfArrowWidth],
            [secondaryLength, 0],
            [secondaryLength - arrowHeight, +halfArrowWidth],
            [secondaryLength - arrowHeight, +halfStemWidth],
            [-halfStemWidth, +halfStemWidth],
            [-halfStemWidth, -halfStemWidth]
    ];
    arena.ctx.moveTo(secondArrowVertices[0][0], secondArrowVertices[0][1]);
    for(var i = 1; i < secondArrowVertices.length; ++i) {
        arena.ctx.lineTo(secondArrowVertices[i][0], secondArrowVertices[i][1]);
    }
    arena.ctx.stroke();
    arena.ctx.fill();
    arena.ctx.closePath();

    _drawRivet(0, 0, rivetRadius);
    arena.ctx.restore();
}

function _drawRivet(x, y, radius) {
    // rivet
    arena.ctx.save(); // push state onto stack
    arena.ctx.beginPath();
    arena.ctx.fillStyle = rgb(COLORS.rivetFill);
    arena.ctx.arc(x, y, radius, 0, 2*Math.PI);
    arena.ctx.stroke();
    arena.ctx.fill();
    arena.ctx.closePath();

    arena.ctx.beginPath();
    arena.ctx.translate(-radius/Math.sqrt(2)/3, -radius/Math.sqrt(2)/3);
    arena.ctx.fillStyle = rgb(COLORS.rivetHighlight);
    arena.ctx.arc(x, y, radius/2, 0, 2*Math.PI);
    arena.ctx.fill();
    arena.ctx.closePath();
    arena.ctx.restore();
}

/**
 * Return the "rgb()" string for a given triple of integers 0-255 (if non-integers, floor)
 * @param {[Number, Number, Number]} triple
 * @returns {string}
 */
function rgb(triple) {
    return 'rgb('
            + _colorLimit(triple[0]) + ','
            + _colorLimit(triple[1]) + ','
            + _colorLimit(triple[2])
            + ')';
}

/**
 * Return the "rgba()" string for a given quad of integers 0-255 (if non-integers, floor)
 * @param {[Number, Number, Number, Number]} quad
 * @returns {string}
 */
function rgba(quad) {
    return 'rgba('
            + _colorLimit(quad[0]) + ','
            + _colorLimit(quad[1]) + ','
            + _colorLimit(quad[2]) + ','
            + _colorLimit(quad[3])
            + ')';
}

function _colorLimit(x) {
    if(x < 0)
        return 0;
    else if(x > 255)
        return 255;
    else
        return Math.floor(x);
}

/**
 *
 * @param {[Number, Number]} point Array of numbers representing a 2D cartesian point.
 * @param {Number} degrees Rotation in degrees; positive is CW.
 * @param {[Number, Number]} [center=[0,0]] (axis) of rotation, as an array representing a 2D cartesian point.
 * @return {[Number, Number]} Result of the rotation, rounded to nearest integer coordinates.
 */
function rotate(point, degrees, center) {
    var relPoint;
    var normDegrees = (degrees % 360);
    var radians = Math.PI/180 * normDegrees;

    if(typeof center == 'undefined')
        relPoint = point;
    else
        relPoint = [point[0] - center[0], point[1] - center[1]];

    // 90-degree increments should not risk roundoff errors
    var relRotPoint;
    if(normDegrees == 90 || normDegrees == -270)
        relRotPoint = [-relPoint[1], relPoint[0]];
    else if(normDegrees == 180 || normDegrees == -180)
        relRotPoint = [-relPoint[0], relPoint[1]];
    else if(normDegrees == -90 || normDegrees == 270)
        relRotPoint = [relPoint[1], -relPoint[0]];
    else
        relRotPoint = [Math.round(Math.cos(radians)*relPoint[0] - Math.sin(radians)*relPoint[1]),
                       Math.round(Math.sin(radians)*relPoint[0] + Math.cos(radians)*relPoint[2])];

    if(typeof center == 'undefined')
        return relRotPoint;
    else
        return [Math.round(relRotPoint[0] + center[0]), Math.round(relRotPoint[1] + center[1])]
}

/**
 * Get the quadrant to place a robot.
 * @param {Number} [occupiedQuadrant] Optional. Quadrant already occupied (0-3).
 * @returns {Number}
 */
function getQuadrant(occupiedQuadrant) {
    if (typeof occupiedQuadrant == 'undefined' || occupiedQuadrant == null) {
        return getRandomInt(0, 4);
    }
    else {
        var rawInt = getRandomInt(0, 3);
        var quadrant;
        if(rawInt < occupiedQuadrant) {
            quadrant = rawInt;
        }
        else {
            quadrant = rawInt + 1;
        }
        return quadrant;
    }
}

/**
 * Get a random orientation for a robot.
 * @returns {Number} Use the Orientation enum (object) to interpret return value.
 */
function getOrientation() {
    return getRandomInt(0, 4);
}

var Orientation = {
    CENTRE: 0,
    TANGENT_CCW: 1,
    OUTWARD: 2,
    TANGENT_CW: 3
};

function getRandomAngle() {
    return Math.random() * 360;
}

/**
 * Return a random int within the given range.
 * @param {Number} min Minimum integer (inclusive)
 * @param {Number} max Maximum integer (exclusive)
 * @returns {Number}
 */
function getRandomInt(min, max) {
    var range = Math.floor(max) - Math.floor(min);
    return Math.floor(Math.random() *  range) + Math.floor(min);
}
