var fbos = [null, null];
var pingPong = 0;
var mQuadVBO = null;
var mQuadTVBO = null;
var mProgram = null;
var screenProgram = null;
var mInputs = [null, null, null, null];
var mInputsStr = "";
var mOSCStr = "";
var mMIDIStr = "";
var vsScreen = null;
var vsDraw = null;
var elapsedBandPeaks = [0.0, 0.0, 0.0, 0.0];
//unifoms
var vertPosU, l2, l3, l4, l5, l6, l7, l8, ch0, ch1, ch2, ch3, ch4, bs, screenResU, screenTexU, screenBlendU, translateUniform, scaleUniform, rotateUniform, gammaU, bandsTimeU, midiU;
var resos = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
var oscM = [null, null, null, null, null, null, null, null, null, null];
var gammaValues = [1.0, 1.0, 1.0, 1.0];

var mHeader = null;
var fsNew = "void main () {\n\tgl_FragColor = vec4(black, 1.0);\n}";

var testingImage = false;
var testTexture;

function createGlContext() {
    var gGLContext = null;
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var i = 0; i < names.length; i++) {
        try {
            gGLContext = mCanvas.getContext(names[i], {
                alpha: false,
                depth: false,
                antialias: false,
                stencil: false,
                premultipliedAlpha: false,
                preserveDrawingBuffer: true
            });
        } catch (e) {
            gGLContext = null;
        }
        if (gGLContext)
            break;
    }

    if (gGLContext === null) {
        mIsPaused = true;
        console.log("no GL");
    }

    gl = gGLContext;
    resizeGLCanvas(window.innerWidth, window.innerHeight);

    //because I want to load shaders as files. :/
    $.when($.ajax({ url: "shaders/draw.vert", dataType: "text" }),
        $.ajax({ url: "shaders/screen.vert", dataType: "text" }),
        $.ajax({ url: "shaders/screen.frag", dataType: "text" }),
        $.ajax({ url: "shaders/header.frag", dataType: "text" })).done(function(d, v, f, h) {

        //build screen shader
        var res = createShader(v[0], f[0]);

        if (res.mSuccess === false) {
            console.log(res.mInfo);
            alert("error");
        }

        if (screenProgram !== null)
            gl.deleteProgram(screenProgram);

        screenProgram = res.mProgram;

        gl.useProgram(screenProgram);
        vertPosU = gl.getAttribLocation(screenProgram, "position");
        texLocationAttribute = gl.getAttribLocation(screenProgram, "a_texCoord");
        screenResU = gl.getUniformLocation(screenProgram, "resolution");
        screenTexU = gl.getUniformLocation(screenProgram, "texture");
        screenBlendU = gl.getUniformLocation(screenProgram, "edgeBlend");
        translateUniform = gl.getUniformLocation(screenProgram, "translation");
        scaleUniform = gl.getUniformLocation(screenProgram, "u_scale");
        rotateUniform = gl.getUniformLocation(screenProgram, "u_degrees");
        gammaU = gl.getUniformLocation(screenProgram, "colorCurves");
        //vertex data
        mQuadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mQuadVBO);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array([-1.0, -1.0,
                1.0, -1.0, -1.0, 1.0,
                1.0, 1.0
            ]),
            gl.STATIC_DRAW);
        gl.enableVertexAttribArray(vertPosU);
        gl.vertexAttribPointer(vertPosU, 2, gl.FLOAT, false, 0, 0);

        mQuadTVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mQuadTVBO);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                1.0, 1.0
            ]),
            gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texLocationAttribute);
        gl.vertexAttribPointer(texLocationAttribute, 2, gl.FLOAT, false, 0, 0);


        vsScreen = v[0];
        mHeader = h[0];
        vsDraw = d[0];
        var res = newShader(vsDraw, fsNew);
        if (res.mSuccess === false) {
            console.log(res.mInfo);
            alert("error");
        }
    }); //end $.when

    testTexture = gl.createTexture();
    testImage = new Image();
    testImage.onload = function() { handleTextureLoaded(testImage, testTexture); }
    testImage.src = "images/test.jpg";
}


function createTarget(width, height) {
    var target = {};


    if (target.framebuffer && gl.isFramebuffer(target.framebuffer))
        gl.deleteFramebuffer(target.framebuffer);

    if (target.texture && gl.isTexture(target.texture))
        gl.deleteTexture(target.texture);

    target.framebuffer = gl.createFramebuffer();
    target.texture = gl.createTexture();

    // set up framebuffer
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);

    // clean up
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return target;
}

function setShaderFromEditor() {
    var result = newShader(vsDraw, editor.getValue());
    sendOSCMessages();
    return setShader(result, false);
}

function newShader(vs, shaderCode) {
    var res = createShader(vs, mHeader + mInputsStr + mOSCStr + mMIDIStr + shaderCode); //, true);

    if (res.mSuccess === false) {
        return res;
    }

    if (typeof(Storage) !== "undefined") {
        localStorage.lastValidCode = shaderCode;
    }


    if (mProgram !== null)
        gl.deleteProgram(mProgram);

    mProgram = res.mProgram;

    // vertPosU =  gl.getUniformLocation(mProgram, "position");
    l2 = gl.getUniformLocation(mProgram, "time");
    l3 = gl.getUniformLocation(mProgram, "resolution");
    l4 = gl.getUniformLocation(mProgram, "mouse");
    l5 = gl.getUniformLocation(mProgram, "channelTime");
    l7 = gl.getUniformLocation(mProgram, "date");
    l8 = gl.getUniformLocation(mProgram, "channelResolution");

    ch0 = gl.getUniformLocation(mProgram, "channel0");
    ch1 = gl.getUniformLocation(mProgram, "channel1");
    ch2 = gl.getUniformLocation(mProgram, "channel2");
    ch3 = gl.getUniformLocation(mProgram, "channel3");
    ch4 = gl.getUniformLocation(mProgram, "backbuffer");

    bs = gl.getUniformLocation(mProgram, "bands");
    bandsTimeU = gl.getUniformLocation(mProgram, "bandsTime");

    //OSC uniforms
    for (var i = 0; i < oscM.length; i++) {
        if (oscM[i] !== null) {
            oscM[i].uniLoc = gl.getUniformLocation(mProgram, oscM[i].uniName);
        }
    }

    //MIDI uniform
    if (midi !== null) {
        midiU = gl.getUniformLocation(mProgram, "midi");
    }

    return res; //means success
}

function createShader(vertShader, fragShader) {
    if (gl === null) return;

    var tmpProgram = gl.createProgram();

    var vs = gl.createShader(gl.VERTEX_SHADER);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vs, vertShader);
    gl.shaderSource(fs, fragShader);

    gl.compileShader(vs);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(vs);
        gl.deleteProgram(tmpProgram);
        return {
            mSuccess: false,
            mInfo: infoLog
        };
    }

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(fs);
        gl.deleteProgram(tmpProgram);
        return {
            mSuccess: false,
            mInfo: infoLog
        };
    }

    gl.attachShader(tmpProgram, vs);
    gl.attachShader(tmpProgram, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(tmpProgram);

    if (!gl.getProgramParameter(tmpProgram, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(tmpProgram);
        gl.deleteProgram(tmpProgram);
        return {
            mSuccess: false,
            mInfo: infoLog
        };
    }

    return {
        mSuccess: true,
        mProgram: tmpProgram
    }
}

function destroyInput(id) {
    if (mInputs[id] === null) return;
    if (gl === null) return;

    var inp = mInputs[id];

    if (inp.type == "texture") {
        gl.deleteTexture(inp.globject);
    } else if (inp.type == "slideshow") {
        gl.deleteTexture(inp.globject);
    } else if (inp.type == "webcam") {
        gl.deleteTexture(inp.globject);
    } else if (inp.type == "video") {
        inp.video.pause();
        inp.video = null;
        gl.deleteTexture(inp.globject);
    } else if (inp.type == "music") {
        inp.audio.pause();
        inp.audio = null;
        gl.deleteTexture(inp.globject);
    } else if (inp.type == "cubemap") {
        gl.deleteTexture(inp.globject);
    } else if (inp.type == "tex_keyboard") {
        gl.deleteTexture(inp.globject);
    }

    mInputs[id] = null;
}

function createInputStr() {
    mInputsStr = "";
    for (var i = 0; i < mInputs.length; i++) {
        var inp = mInputs[i];

        if (inp !== null && inp.type == "cubemap")
            mInputsStr += "uniform samplerCube channel" + i + ";\n";
        else
            mInputsStr += "uniform sampler2D channel" + i + ";\n";
    }
}

function createOSCUniforms() {
    mOSCStr = "";
    for (var i = 0; i < oscM.length; i++) {
        var inp = oscM[i];

        if (inp !== null) {
            // mOSCStr += "uniform vec4 " + $('#inOSCUniform'+i).val() + ";\n";
            // mOSCStr += "uniform vec4 " + oscM[i].uniName + ";\n";
            mOSCStr = "uniform vec4 analogInput;";
        }
    }
}

function createMIDIUniforms() {
    mMIDIStr = "";
    if (midiIn !== null) {
        mMIDIStr = "uniform int midi[128];";
    }

}

function getHeaderSize() {
    var n = (mHeader + mInputsStr + mOSCStr + mMIDIStr).split(/\r\n|\r|\n/).length;
    return n;
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function createGLTexture(ctx, image, format, texture) {
    if (ctx === null) return;

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, format, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR_MIPMAP_LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.REPEAT);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.REPEAT);
    ctx.generateMipmap(ctx.TEXTURE_2D);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
}

function createGLTextureLinear(ctx, image, texture) {
    if (ctx === null) return;

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
}


function createGLTextureNearestRepeat(ctx, image, texture) {
    if (ctx === null) return;

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
}

function createGLTextureNearest(ctx, image, texture) {
    if (ctx === null) return;

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, true);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
}

function createAudioTexture(ctx, texture) {
    if (ctx === null) return;

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.LUMINANCE, 512, 2, 0, ctx.LUMINANCE, ctx.UNSIGNED_BYTE, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
}

function createKeyboardTexture(ctx, texture) {
    if (ctx === null) return;

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.LUMINANCE, 256, 2, 0, ctx.LUMINANCE, ctx.UNSIGNED_BYTE, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
}

function resizeGLCanvas(width, height) {
    mCanvas.width = width / quality;
    mCanvas.height = height / quality;

    mCanvas.style.width = width + 'px';
    mCanvas.style.height = height + 'px';

    gl.viewport(0, 0, mCanvas.width, mCanvas.height);

    fbos[0] = createTarget(mCanvas.width, mCanvas.height);
    fbos[1] = createTarget(mCanvas.width, mCanvas.height);
}

function updateKeyboardDown(event) {
    for (var i = 0; i < mInputs.length; i++) {
        var inp = mInputs[i];
        if (inp !== null && inp.type == "tex_keyboard") {
            inp.mData[event] = 255;
        }
    }
}

function updateKeyboardUp(event) {
    for (var i = 0; i < mInputs.length; i++) {
        var inp = mInputs[i];
        if (inp !== null && inp.type == "tex_keyboard") {
            inp.mData[event] = 0;
        }
    }
}

var d = null, dates = null;

function paint() {
    if (gl === null) return;
    if (mProgram === null) return;

    gl.useProgram(mProgram);

    var d = new Date();
    var dates = [
        d.getFullYear(), // the year (four digits)
        d.getMonth(), // the month (from 0-11)
        d.getDate(), // the day of the month (from 1-31)
        d.getHours() * 60.0 * 60 + d.getMinutes() * 60 + d.getSeconds()
    ];

    //init dimensions
    resos = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    //add uniform stuff
    if (l2 !== null) gl.uniform1f(l2, (Date.now() - mTime) * 0.001);
    if (l3 !== null) gl.uniform2f(l3, mCanvas.width, mCanvas.height);
    if (l4 !== null) gl.uniform4f(l4, mMousePosX, mMousePosY, mMouseClickX, mMouseClickY);
    if (l7 !== null) gl.uniform4f(l7, d.getFullYear(), d.getMonth(), d.getDate(),
        d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds());

    if (ch0 !== null) gl.uniform1i(ch0, 0);
    if (ch1 !== null) gl.uniform1i(ch1, 1);
    if (ch2 !== null) gl.uniform1i(ch2, 2);
    if (ch3 !== null) gl.uniform1i(ch3, 3);
    if (ch4 !== null) gl.uniform1i(ch4, 4); //backbuffer

    // gl.bindBuffer( gl.ARRAY_BUFFER, mQuadVBO);
    // gl.vertexAttribPointer(vertPosU, 2,  gl.FLOAT, false, 0, 0);

    //minputs
    //fourband sound
    if (mSound && bandsOn && mAudioContext !== null) {
        if (bs !== null) {

            gl.uniform4f(bs, mSound.low, mSound.mid, mSound.upper, mSound.high);
        }
        if (bandsTimeU !== null) { //this is for per fft band time elapsed events
            if (mSound.low > .7)
                elapsedBandPeaks[0] = 0.0;
            else
                elapsedBandPeaks[0] += meter.duration * .001;

            if (mSound.mid > .7)
                elapsedBandPeaks[1] = 0.0;
            else
                elapsedBandPeaks[1] += meter.duration * .001;

            if (mSound.upper > .7)
                elapsedBandPeaks[2] = 0.0;
            else
                elapsedBandPeaks[2] += meter.duration * .001;

            if (mSound.high > .7)
                elapsedBandPeaks[3] = 0.0;
            else
                elapsedBandPeaks[3] += meter.duration * .001;

            gl.uniform4f(bandsTimeU, elapsedBandPeaks[0], elapsedBandPeaks[1], elapsedBandPeaks[2], elapsedBandPeaks[4]);
        }
        // }
    }

    for (var i = 0; i < mInputs.length; i++) {
        var inp = mInputs[i];


        gl.activeTexture(gl.TEXTURE0 + i);

        if (inp === null) {
            gl.bindTexture(gl.TEXTURE_2D, null);
        } else if (inp.type == "tex_2D") {
            if (inp.loaded === false)
                gl.bindTexture(gl.TEXTURE_2D, null);
            else {
                gl.bindTexture(gl.TEXTURE_2D, inp.globject);
                resos[3 * i + 0] = inp.image.width;
                resos[3 * i + 1] = inp.image.height;
                resos[3 * i + 2] = 1;
            }
        } else if (inp.type == "tex_audio") {
            mSound.mAnalyser.getByteTimeDomainData(mSound.mWaveData);
            mSound.mAnalyser.getByteFrequencyData(mSound.mFreqData);
            gl.bindTexture(gl.TEXTURE_2D, inp.globject);
            var waveLen = Math.min(mSound.mWaveData.length, 512);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, waveLen, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, mSound.mWaveData);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 1, 512, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, mSound.mFreqData);
        } else if (inp.type == "tex_keyboard") {
            // if (inp.loaded === false)
            //     gl.bindTexture(gl.TEXTURE_2D, null);
            // else {
            gl.bindTexture(gl.TEXTURE_2D, inp.globject);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 2, gl.LUMINANCE, gl.UNSIGNED_BYTE, inp.mData);
            // }
        }
    }

    // OSC values
    for (var i = 0; i < oscM.length; i++) {
        if (oscM[i] !== null) {
            gl.uniform4fv(oscM[i].uniLoc, oscM[i].args);
        }
    }

    //MIDI values
    if (midi !== null) {
        gl.uniform1iv(midiU, midiData);
    }

    // if (l5 !== null)  gl.uniform1fv(l5, times);
    if (l8 !== null) gl.uniform3fv(l8, resos);

    gl.activeTexture(gl.TEXTURE4); //backbuffer as texture
    gl.bindTexture(gl.TEXTURE_2D, fbos[pingPong].texture);

    pingPong = (pingPong + 1) % 2;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[pingPong].framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //draw to screen
    if (numScreens == 1) {
        // gl.blendFunc(gl.ONE, gl.ONE);
        gl.disable(gl.BLEND);
        gl.useProgram(screenProgram);
        gl.uniform2f(screenResU, mCanvas.width, mCanvas.height);
        gl.uniform1i(screenTexU, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos[pingPong].texture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT);
        //center
        gl.uniform2f(translateUniform, $("#point1X").val(), $("#point1Y").val());
        gl.uniform2f(scaleUniform, $("#scale1X").val(), $("#scale1Y").val());
        gl.uniform1f(rotateUniform, $("#rotate1").val());
        gl.uniform4f(screenBlendU, 0.0, .001, 1.0, .001);
        // $("#blend2X").val(), $("#blend2Y").val(),
        // $("#blend2Z").val(), $("#blend2W").val());
        gl.uniform4fv(gammaU, gammaValues);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (numScreens == 3) {
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.enable(gl.BLEND);

        gl.enableVertexAttribArray(texLocationAttribute);

        gl.useProgram(screenProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, mQuadVBO);
        gl.vertexAttribPointer(vertPosU, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, mQuadTVBO);
        gl.vertexAttribPointer(texLocationAttribute, 2, gl.FLOAT, false, 0, 0);


        gl.uniform2f(screenResU, mCanvas.width, mCanvas.height);
        gl.uniform1i(screenTexU, 0);
        gl.activeTexture(gl.TEXTURE0);

        if (testingImage)
            gl.bindTexture(gl.TEXTURE_2D, testTexture);
        else
            gl.bindTexture(gl.TEXTURE_2D, fbos[pingPong].texture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // left
        gl.uniform2f(translateUniform, $("#point1X").val(), $("#point1Y").val());
        gl.uniform2f(scaleUniform, $("#scale1X").val(), $("#scale1Y").val());
        gl.uniform4f(screenBlendU, $("#blend1X").val(), $("#blend1Y").val(),
            $("#blend1Z").val(), $("#blend1W").val());
        gl.uniform1f(rotateUniform, $("#rotate1").val());
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // right
        gl.uniform2f(translateUniform, $("#point3X").val(), $("#point3Y").val());
        gl.uniform2f(scaleUniform, $("#scale3X").val(), $("#scale3Y").val());
        gl.uniform4f(screenBlendU, $("#blend3X").val(), $("#blend3Y").val(),
            $("#blend3Z").val(), $("#blend3W").val());
        gl.uniform1f(rotateUniform, $("#rotate3").val());
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


        //center
        gl.uniform2f(translateUniform, $("#point2X").val(), $("#point2Y").val());
        gl.uniform2f(scaleUniform, $("#scale2X").val(), $("#scale2Y").val());
        gl.uniform4f(screenBlendU, $("#blend2X").val(), $("#blend2Y").val(),
            $("#blend2Z").val(), $("#blend2W").val());
        gl.uniform1f(rotateUniform, $("#rotate2").val());
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
