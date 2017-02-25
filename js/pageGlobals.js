

var mCanvas = null, aCanvas = null;
var  gl = null;
var mAudioContext = null;

var mMousePosX = mMousePosY = 0;
var mMouseClickX = mMouseClickY = 0;

//interface
var mIsPaused = false;
var mFpsFrame = 0.0;
var quality = 2;
var meter = null;
var mSound = null;
var bandsOn = false;
var mTime;
var whichSlot;
var debugging = false;
var numScreens = 1;

//for ace editor
var mCompileTimer = null;
var editor = null;
mErrors = new Array();


$( document ).ready(function()
{
    //--------------------- FOOTER UI ------------
    $('#footer')
        .mouseover( function(event)
        {
            $('#footerUI').fadeIn('fast');
        })
        .mouseleave( function(event)
        {
            $('#footerUI').fadeOut('slow');  
        });

    meter = new FPSMeter( document.getElementById("myFrameRate"),  
                { 
                    top: '4px',
                    graph: 0,
                    theme: 'codenobi'
                });

    $("#selectQuality")
        .selectmenu({
            // style:"popup" //hope jqueryUI implements this soon.
            position: {collision: "flip"}
        })
        .on("selectmenuchange", function(event) 
        {
            quality = $("#selectQuality").val();
            resizeGLCanvas(window.innerWidth, window.innerHeight);
        });

    $("#selectFontSize")
        .selectmenu({
            position: {collision: "flip"}
        })
        .on("selectmenuchange", function(event) 
        {
            document.getElementById('editor').style.fontSize = $("#selectFontSize").val()+'px';
        });

    $("#selectMIDIIn")
        .selectmenu({})
        .on("selectmenuopen", function(event, ui)
        {
            populateMIDIInSelect();
        })
        .on("selectmenuchange", function(event)
        {
            startLoggingMIDIInput($("#selectMIDIIn").val());
        });

    $("#selectMIDIOut")
        .selectmenu({})
        .on("selectmenuopen", function(event, ui)
        {
            // populateMIDIInSelect();
        })
        .on("selectmenuchange", function(event)
        {
           $("#selectMIDIOut").val(); 
        });

    $("#audioButton")
        .button()
        .click( function() 
        {   // we do this check, because for some reason closing the dialog
            // looses the file and server sound
            if ($("#audioPanel").dialog( "isOpen" ))
                // $("#audioPanel").parent().show("clip", {}, 250);
                $("#audioPanel").parent().css("visibility", "visible");
            else
                $("#audioPanel").dialog("open");
        });

    $("#debug")
        .button()
        .bind("change", function()
        {
            debugging = !debugging;
            setShaderFromEditor();
        });

    $("#texturing")
        .button()
        .click( function()
        {
            $("#texturePanel").dialog("open");
        });

    $("#edges")
        .button()
        .click( function(event)
        {
            $("#edgesPanel").dialog("open");
        });

    $("#network")
        .button()
        .click( function(event)
        {
            $("#oscPanel").dialog("open");
        });

    $("#colorCorrectButton")
        .button()
        .click( function(event)
        {
            $("#colorCorrectPanel").dialog("open");
        });

    $("#openFile")
        .button()
        .click( function(event)
        {   //to hide the other file button interface from users
            $("#myFile").trigger('click');
        });

    $("#myFile")
        .change( function(event)
        {
            openFile(event);
        });

    $("#saveFile")
        .button()
        .click( function(event)
        {
            var blob = new Blob([editor.getValue()], {type: "text/plain;charset=utf-8"});
            var d = new Date();
            d.setMonth( d.getMonth( ) + 1 );
            var fName = d.getFullYear()+"_"+d.getMonth()+"M_"+d.getDate()+"D_"+        
                        d.getHours()+"H_"+d.getMinutes()+"m_"+d.getSeconds()+"s";
        
            saveAs(blob, "the_force_"+fName+".frag");
        });

    $("#saveImage")
        .button()
        .click( function(event)
        {
            var aCanvas = document.getElementById("demogl"),
                    ctx = aCanvas.getContext("2d"); 
            aCanvas.toBlob( function(blob)
            {
                var d = new Date();
                var fName = d.getFullYear()+"_"+d.getMonth()+"_"+d.getDate()+"_"+        
                            d.getHours()+"_"+d.getMinutes()+"_"+d.getSeconds();
        
                saveAs(blob, "the_force_"+fName+".png");
            });
            
        });

    $("#play")
        .button()
        .bind("change", function(event)
        {   //because this is checked every frame, 
            //I think bool is faster than jquery checkbox->state?
            mIsPaused = !mIsPaused;
        });

    $("#funcButton")
        .button()
        .click( function(event)
        {
            $("#helpPanel").dialog("open");
        });

    $("#myFullScreen")
        .button()
        .bind("change", function(event)
        {
            if(!window.screenTop && !window.screenY)
            {
                if (document.exitFullscreen) 
                    document.exitFullscreen();
                else if (document.mozCancelFullScreen) 
                   document.mozCancelFullScreen();
                else if (document.webkitExitFullscreen) 
                   document.webkitExitFullscreen();
            } else {
                if (document.body.requestFullScreen)
                    document.body.requestFullScreen();
                else if (document.body.mozRequestFullScreen)
                    document.body.mozRequestFullScreen();
                else if (document.body.webkitRequestFullScreen)
                    document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        });

    //--------------------- AUDIO PANEL ------------
    $("#audioPanel")
        .dialog({
            autoOpen: false,
            maxHeight: 400,
            minWidth: 500,
            show: {
                effect: "clip",
                duration: 250
            },
            hide: {
                effect: "clip",
                duration: 250
            },
            beforeClose: function( event, ui ) {

                // $(this).parent().hide("clip", {}, 250);
                $(this).parent().css("visibility", "hidden");
                event.preventDefault();
                return false;
            }
        });

    $("#audioTabs")
        .tabs();

    $("#soundOffButton")
        .button()
        .click( function(event)
        {
            event.preventDefault();
            mSound.mSource.disconnect();
            initAudio();
            $("#micTogglePlaythrough").button("disable");
        });

    $("#micToggleButton")
        .button()
        .click( function(event)
        {
            event.preventDefault();
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

            if (window.location.protocol != "https:") 
                alert("Browser may not support microphone on non-secure connection. Please copy your code before changing protocol in the URL from http to https.");

            if (navigator.getUserMedia) 
            {
                initAudio();
                navigator.getUserMedia(
                    {audio: true}, 
                    function(stream)  //success
                    {
                        mSound.mStream = stream;
                        mSound.mSource = mAudioContext.createMediaStreamSource(stream);
                        mSound.mSource.disconnect();
                        mSound.mSource.connect(mSound.mAnalyser);
                    }, 
                    function() //failure
                    {
                        alert("Error getting user media stream.");
                    });

                $("#micTogglePlaythrough").button("enable");
                bandsOn = true;
            }
            else
                alert("Browser doesn't support microphone or audio line in.");

            $(this).blur();
        });

    $("#micTogglePlaythrough")
        .button(
            {disabled: true}
        )
        .bind("change", function()
        {
            event.preventDefault();
            if($(this).is(':checked'))
                mSound.mSource.connect(mAudioContext.destination);
            else{
                mSound.mSource.disconnect();
                mSound.mSource.connect(mSound.mAnalyser);
            }
        });

    $("#myAudioServer")
        .button()
        .click( function(event)
        {
            initAudio();

            if ($("#serverSound").length)
                $("#serverSound").remove();

            var audio = createAudioElement(["audio/1_PBV_OPENING.wav"], ["wav"], "serverSound");
            $(this).after(audio);

            mSound.mSource = mAudioContext.createMediaElementSource(audio);
            
            mSound.mSource.connect(mSound.mAnalyser);
            mSound.mAnalyser.connect(mAudioContext.destination);

            bandsOn = true;
        });

    $("#myAudioServerLoop")
        .button()
        .bind("change", function(){
            if ($(this).attr('checked'))
                $("#serverSound").attr('loop', 'true');
            else
                $("#serverSound").attr('loop', 'false');
        });

    $("#myAudioFile")
        .button()
        .change( function(event)
        {
            initAudio();
            
            if ($("#soundFile").length)
                $("#soundFile").remove();

            var exts = [];
            var urls = [];
            for (var i = 0; i < this.files.length; i++)
            {
                urls[i] = URL.createObjectURL(this.files[i]); 
                exts[i] = this.files[i].name.split(".").pop();
            }

            var audio = createAudioElement(urls, exts, "soundFile");
            $(this).after(audio);
            // audio.addEventListener("timeupdate",function(){
  //       var hr  = Math.floor(secs / 3600);
  // var min = Math.floor((secs - (hr * 3600))/60);
  // var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

  // if (min < 10){ 
  //   min = "0" + min; 
  // }
  // if (sec < 10){ 
  //   sec  = "0" + sec;
  // }
  //min + ':' + sec

                // $("#audioClock").html(audio.currentTime);
            // });

            mSound.mSource = mAudioContext.createMediaElementSource(audio);
           mSound.mSource.disconnect();
            mSound.mSource.connect(mSound.mAnalyser);
            mSound.mSource.connect(mAudioContext.destination);

            bandsOn = true;
        });

    $("#myAudioFileLoop")
        .button()
        .bind("change", function(){
            if ($(this).attr('checked'))
                $("#soundFile").attr('loop', 'true');
            else
                $("#soundFile").attr('loop', 'false');
        });

        // audioElement.addEventListener('ended', function() {
        // this.currentTime = 0;
        // this.play();
        // }, false);

    function createAudioElement(urls, exts, name) 
    {
        var audioElement = document.createElement("audio");

        audioElement.id = name;
        audioElement.autoplay = false;
        audioElement.loop = false;
        audioElement.controls = true;

        for (var i = 0; i < urls.length; ++i) 
        {
            var typeStr = "audio/" + exts[i];//"audio/" + urls[i].split(".").pop();

            if (audioElement.canPlayType === undefined ||
                audioElement.canPlayType(typeStr).replace(/no/, "")) 
            {
                var sourceElement = document.createElement("source");
                sourceElement.type = typeStr;
                sourceElement.src = urls[i];
                audioElement.appendChild(sourceElement);
            }
        }

        return audioElement;
    }

    function initAudio()
    {
        if (mSound === null)
        {   // build a new sound object
            mSound = {};
            mSound.low = mSound.mid = mSound.upper = mSound.high = 0.0;
            mSound.mAnalyser = mAudioContext.createAnalyser();
            mSound.mAnalyser.smoothingTimeConstant = 0.5;
            mSound.mAnalyser.fft = 512; 
            mSound.mFreqData = new Uint8Array(mSound.mAnalyser.frequencyBinCount);
            mSound.mWaveData = new Uint8Array(512);

            mSound.javascriptNode = mAudioContext.createScriptProcessor(1024, 2, 2);
            mSound.mAnalyser.connect(mSound.javascriptNode);
            mSound.javascriptNode.connect(mAudioContext.destination);
            mSound.javascriptNode.onaudioprocess = function() 
            {
                updateFourBands(); 
            };
        }

        if (mSound.mStream)
        {   //clean up any user media stream 
            mSound.mStream.stop();
            mSound.mStream = null;
        } 

        bandsOn = false;
    }

     // var k, f;
    var canv = document.getElementById('fourBands');
    aCanvas = canv.getContext('2d');
    aCanvas.width = 100;
    aCanvas.height = 32;
    
     function updateFourBands()
    {
        //todo: speed this up
        aCanvas.clearRect ( 0 , 0 , 100, 32 );

        if (!bandsOn) return;
        if (!mSound) return;
        if (mAudioContext === null) return;

        mSound.mAnalyser.getByteFrequencyData(mSound.mFreqData);
        
        var k = 0;
        var f = 0.0;
        var a = 5, b = 11, c = 24, d = 512, i = 0;
        for(; i < a; i++)
            f += mSound.mFreqData[i];

        f *= .2; // 1/(a-0)
        f *= .003921569; // 1/255
        drawBandsRect(0, aCanvas, f);
        mSound.low = f;

        f = 0.0;
        for(; i < b; i++)
            f += mSound.mFreqData[i];

        f *= .166666667; // 1/(b-a)
        f *= .003921569; // 1/255
        drawBandsRect(1, aCanvas, f);
        mSound.mid = f;

        f = 0.0;
        for(; i < c; i++)
            f += mSound.mFreqData[i];

        f *= .076923077; // 1/(c-b)
        f *= .003921569; // 1/255
        drawBandsRect(2, aCanvas, f);
        mSound.upper = f;

        f = 0.0;
        for(; i < d; i++)
            f += mSound.mFreqData[i];

        f *= .00204918; // 1/(d-c)
        f *= .003921569; // 1/255
        drawBandsRect(3, aCanvas, f);
        mSound.high = f;
    }

    function drawBandsRect(which, ctx, value) 
    {
        var rr = parseInt(255 * value);

        ctx.fillStyle = "rgba("+rr+","+rr+","+rr+","+"0.5)";
        var a = Math.max(0, value * 32.0);
        ctx.fillRect(which * 15, 28 - a, 15, a);
    }

    //--------------------- TEXTURE PANEL ------------
    $("#texturePanel")
        .dialog({
            autoOpen: false,
            minWidth: 380,
            show: {
                effect: "clip",
                duration: 250
            },
            hide: {
                effect: "clip",
                duration: 250
            },
            open: function(){
                //fixes highlight close button
                $(this).parents('.ui-dialog').attr('tabindex', -1)[0].focus();
            }
        });

    $('.textureSlot')
        .click( function(event) 
        {
            $( ".textureSlot" ).animate(
                {
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                }, .250 );
            $(this).animate(
                {
                    backgroundColor: "rgba(0, 255, 0, 0.4)",
                }, .250 );
            whichSlot = event.target.id;     
        })
        .hover( function(event)
        {
            $(this).animate(
                {
                    backgroundColor: "rgba(255, 255, 255, 1.0)",
                }, .250 );
            
        }, function(event)
        {
            $(this).animate(
                {
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                }, .250 );
            if (whichSlot == event.target.id) 
            {
                $(this).animate(
                {
                    backgroundColor: "rgba(0, 255, 0, 0.4)",
                }, .250 );
            }
        });

    $('.textureOption')
        .click( function(event) 
        {
            var slotID = whichSlot.slice(-1);
            destroyInput(slotID);
            var texture = {};

            switch (event.target.id)
            {
                case "tex_none":
                    texture.type = null;
                    texture.globject = null;
                    $("#"+whichSlot)
                        .attr('src', 'none')
                        .animate(
                            {
                                backgroundColor: "rgba(255, 255, 255, 0.5)",
                            }, .250 );;
                    whichSlot = "";
                    break;

                case "tex_keyboard":
                    texture.type = "tex_keyboard"
                    texture.globject =  gl.createTexture();
                    $("#"+whichSlot)
                        .attr('src', 'presets/previz/keyboard.png')
                        .animate(
                        {
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                        }, .250 );
                    whichSlot = "";
            
                    texture.mData = new Uint8Array(256 * 2);
                    for (var j = 0; j < (256 * 2); j++) 
                    {
                        texture.mData[j] = 0;
                    }

                    createKeyboardTexture( gl, texture.globject);
                    break;

                case "tex_webcam":
                    break;

                case "tex_audio":
                    if (mSound == null)
                        initAudio();
                    texture.type = "tex_audio";
                    texture.globject =  gl.createTexture();
                    $("#"+whichSlot)
                        .attr('src', 'presets/previz/audio.png')
                        .animate(
                        {
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                        }, .250 );
                    whichSlot = "";

                    texture.mData = new Uint8Array(512 * 2);
                    for (var j = 0; j < (512 * 2); j++) 
                    {
                        texture.mData[j] = 0;
                    }
                    createAudioTexture( gl, texture.globject);
                    break;

                case "tex_noisebw":
                    texture.type = "tex_2D";
                    texture.globject =  gl.createTexture();
                    texture.image = new Image();
                    texture.loaded = false;
                    $("#"+whichSlot)
                        .attr('src', 'presets/previz/noisebw.png')
                        .animate(
                        {
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                        }, .250 );
                    whichSlot = "";

                    texture.image.onload = function()
                    {
                        createGLTextureNearestRepeat( gl, texture.image, texture.globject);
                        texture.loaded = true;
                    }
                    texture.image.src = 'presets/noisebw.png';
                    break;

                case "tex_noisecolor":
                    texture.type = "tex_2D";
                    texture.globject =  gl.createTexture();
                    texture.image = new Image();
                    texture.loaded = false;
                    $("#"+whichSlot)
                        .attr('src', 'presets/previz/noisecolor.png')
                        .animate(
                        {
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                        }, .250 );
                    whichSlot = "";

                    texture.image.onload = function()
                    {
                        createGLTextureNearestRepeat( gl, texture.image, texture.globject);
                        texture.loaded = true;
                    }
                    texture.image.src = 'presets/noisecolor.png';
                    break;

                case "tex_nyan":
                    texture.type = "tex_2D";
                    texture.globject = gl.createTexture();
                    texture.image = new Image();
                    texture.loaded = false;
                    $("#"+whichSlot)
                        .attr('src', 'presets/previz/nyanIcon.png')
                        .animate(
                            {
                                backgroundColor: "rgba(255, 255, 255, 0.5)",
                            }, .250 );
                    whichSlot = "";
                    texture.image.onload = function()
                    {
                        createGLTextureNearest(gl, texture.image, texture.globject);
                        texture.loaded = true;
                    }
                    texture.image.src = 'presets/nyan.png';
            }

            mInputs[slotID] = texture;
            createInputStr();
        })
        .hover( function(event)
        {
            $(this).animate(
                {
                    backgroundColor: "rgba(255, 255, 255, 1.0)",
                }, .250 );
            
        }, function(event)
        {
            $(this).animate(
                {
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                }, .250 );
        });
    
    //--------------------- PROJECTION MAPPING PANEL ------------
    $("#edgesPanel")
        .dialog({
            minWidth: 800,
            autoOpen: false,
            show: {
                effect: "clip",
                duration: 250
            },
            hide: {
                effect: "clip",
                duration: 250
            }
        });

    //todo fix input radios for only this panel
    $('input[name="radio"]').click(function() {
        numScreens = $(this).val(); 
        if (numScreens == 1) 
        {
            $("#editor").width('100%');
        } 
        else if (numScreens == 3) 
        {
            $("#editor").width('30%');
        }
    });

    $("#testImage").click(function() {
        if (testingImage) 
            testingImage = false;
        else
            testingImage = true;
    });

    $("#saveMapping").click( function(event)
    {
        var mappingSettings = "{ ";
        $("#edgesValues").children("input").each( function() 
        {
            mappingSettings += '"'
            mappingSettings += $(this).attr('id');
            mappingSettings += '": "';
            mappingSettings += $(this).val();
            mappingSettings += '"'
            if ($(this).is(":last-child") == false)
                mappingSettings += ", "
        });
        mappingSettings += "}";

        var blob = new Blob([mappingSettings], {type: "text/plain;charset=utf-8"});
        var d = new Date();
        d.setMonth( d.getMonth( ) + 1 );
        var fName = d.getFullYear()+"_"+d.getMonth()+"M_"+d.getDate()+"D_"+        
                    d.getHours()+"H_"+d.getMinutes()+"m_"+d.getSeconds()+"s";
    
        saveAs(blob, "the_force_"+fName+".mapping");
    });

    $("#loadMapping").click( function(event) 
    {
        $("#mySettings").trigger('click');
    });

    $("#mySettings").change( function(event)
    {
        var file;
        if (event.target.files)
            file = event.target.files;
        else
            file = event.dataTransfer.files;

        for (var i = 0, f; f = file[i]; i++) 
        {
            if (f.name.slice(-8) == ".mapping") 
            {
                var reader = new FileReader();
                reader.onload = ( function(theFile) 
                {
                    return function(e) {
                        var data = JSON.parse(reader.result, function(k, v) 
                            {
                                $("#"+k).val(v)
                            });
                    };
                })(f); //ugh, ok this is a closure

                reader.readAsText(f, "text/plain;charset=utf-8");
            }
        }
    });

    //--------------------- COLOR CORRECTION PANEL ------------

    $("#colorCorrectPanel")
        .dialog({
            autoOpen: false,
            minHeight: 280,
            minWidth: 250,
            show: {
                effect: "clip",
                duration: 250
            },
            hide: {
                effect: "clip",
                duration: 250
            }
        });

    $( "#gammaSlider, #redSlider, #greenSlider, #blueSlider" )
        .slider({
            orientation: "horizontal",
            min: 0.2,
            max: 2.2,
            value: 1.0,
            step: .01,
        });

    $("#redSlider")
        .on( "slide", function( event, ui ) {
            gammaValues[0] = ui.value;
            $("#redAmount").val( ui.value );
        });
    $("#greenSlider")
        .on( "slide", function( event, ui ) {
            gammaValues[1] = ui.value;
            $("#greenAmount").val( ui.value );
        });
    $("#blueSlider")
        .on( "slide", function( event, ui ) {
            gammaValues[2] = ui.value;
            $("#blueAmount").val( ui.value );
        });
    $("#gammaSlider")
        .on( "slide", function( event, ui ) {
            gammaValues[3] = ui.value;
            $("#gammaAmount").val( ui.value );
        });

    $("#redAmount")
        .on('input', function() {
            var v = fixSliderValue( parseFloat( $(this).val() ));
            gammaValues[0] = v;
            $("#redSlider").slider( "value", v );
        })
        .val( $("#redSlider").slider( "value" ) );

    $("#greenAmount")
        .on('input', function() {
            var v = fixSliderValue( parseFloat( $(this).val() ));
            gammaValues[1] = v;
            $("#greenSlider").slider( "value", v );
        })
        .val( $("#greenSlider").slider( "value" ) );

    $("#blueAmount")
        .on('input', function() {
            var v = fixSliderValue( parseFloat( $(this).val() ));
            gammaValues[2] = v;
            $("#blueSlider").slider( "value", v );
        })
        .val( $("#blueSlider").slider( "value" ) );

    $("#gammaAmount")
        .on('input', function() {
            var v = fixSliderValue( parseFloat( $(this).val() ));
            gammaValues[3] = v;
            $("#gammaSlider").slider( "value", v );
        })
        .val( $("#gammaSlider").slider( "value" ) );
    
    function fixSliderValue(input)
    {
        if (input < .2)
            return .2;
        if (input > 2.2)
            return 2.2;
        
        return input;
    }

    //--------------------- HELP PANEL ------------
    $("#helpPanel")
        .dialog({
            minWidth: 600,
            minHeight: 200,
            maxHeight: 400,
            autoOpen: false,
            show: {
                effect: "clip",
                duration: 250
            },
            hide: {
                effect: "clip",
                duration: 250
            }
        });

    $("#helpTabs")
        .tabs();
    $("#networkTabs")
        .tabs();

    var highlight = ace.require("ace/ext/static_highlight");

    function qsa(sel) {
        return Array.apply(null, document.querySelectorAll(sel));
    }
    qsa(".codeHighlight").forEach(function (codeEl) {
        highlight(codeEl, {
            mode: codeEl.getAttribute("ace-mode"),
            theme: codeEl.getAttribute("ace-theme"),
            startLineNumber: 1,
            showGutter: codeEl.getAttribute("ace-gutter"),
            trim: true
        }, function (highlighted) {
            
        });
        
    });

    //--------------------- NETWORK OSC PANEL ------------
    $("#oscPanel")
        .dialog({
            autoOpen: false,
            maxHeight: 400,
            minWidth: 520,
            show: {
                effect: "clip",
                duration: 250
            },
            hide: {
                effect: "clip",
                duration: 250
            }
        });

    initOSC();

    // --- rendering context ---------------------
    mCanvas = document.getElementById("demogl");

    createGlContext();

    // --- audio context ---------------------
    var contextAvailable = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
    
    if(contextAvailable)
        mAudioContext = new contextAvailable();
    else
        alert("This browser doesn't support Audio Contexts. Audio input will not be available.");

    // --- ace editor ---------------------
    var langTools = ace.require("ace/ext/language_tools");
    langTools.setCompleters([langTools.snippetCompleter, langTools.keyWordCompleter])
    editor = ace.edit("editor");
    editor.session.setMode("ace/mode/glsl");
    editor.getSession().setUseWrapMode(true);
    editor.setDisplayIndentGuides(false);
    editor.setTheme("ace/theme/monokai");
    // enable autocompletion and snippets
    editor.setOptions({
        enableBasicAutocompletion: false,
        enableSnippets: true , 
        enableLiveAutocompletion: true
    });

    editor.setShowPrintMargin(false);
    editor.getSession().on('change', function(e) {
                            clearTimeout(mCompileTimer);
                            mCompileTimer = setTimeout(setShaderFromEditor, 200);
    });
    editor.$blockScrolling = Infinity;
    if (typeof(Storage) !== "undefined" && typeof(localStorage.lastValidCode) !== "undefined"){
        editor.setValue(localStorage.lastValidCode,-1);
    }else{
        editor.setValue("void main () {\n\tgl_FragColor = vec4(black, 1.0);\n}", -1);
    }
   
    // mCodeMirror.on("drop", function( mCodeMirror, event )
    //             {
    //                 event.stopPropagation();
    //                 event.preventDefault();
    //                 openFile(event);
    //             });

    function renderLoop2()
    {   
        requestAnimationFrame(renderLoop2);

        if (gl === null) return;

        if (mIsPaused) return;

        meter.tick();

        if($('#soundFile').length) {
        var secs = $('#soundFile').get(0).currentTime;
      //       var hr  = Math.floor(secs / 3600);
      var min = Math.floor(secs / 60.);
      var sec = Math.floor(secs) % 60;

        if (min < 10)
            min = "0" + min; 
        if (sec < 10)
            sec  = "0" + sec;

        $("#audioClock").html(min + ':' + sec);
    }

        paint();
    }

    mTime = Date.now();
    renderLoop2();
    editor.focus();

    var player =  document.getElementById('player');
    var uiUpdater = new UiUpdater();
    
    player.crossorigin="anonymous";
    var loader = new SoundcloudLoader(player,uiUpdater);

    var audioSource = null;
    var form = document.getElementById('form');
    var loadAndUpdate = function(trackUrl) {
        loader.loadStream(trackUrl,
            function() {
                uiUpdater.clearInfoPanel();
                audioSource.playStream(loader.streamUrl());
                uiUpdater.update(loader);
                setTimeout(uiUpdater.toggleControlPanel, 3000); // auto-hide the control panel
            },
            function() {
                uiUpdater.displayMessage("Error", loader.errorMessage);
            });
    };

form.addEventListener('submit', function(e) {
    initAudio();
    audioSource = new SoundCloudAudioSource(player);
        e.preventDefault();
        var trackUrl = document.getElementById('input').value;
        loadAndUpdate(trackUrl);
    });

});

//document events
$(document)
    // .tooltip()
    .mousemove(function( event )
    {
        mMousePosX = event.pageX;
        mMousePosY = event.pageY;
    })
    .mousedown(function( event )
    {
        mMouseClickX = event.pageX;
        mMouseClickY = event.pageY;
    })
    .mouseup( function( event ) 
    { })
    .keydown( function( event )
    {
        updateKeyboardDown(event.keyCode);
        if (event.ctrlKey === true && event.shiftKey === true)
        {
             $("#footer").fadeToggle('slow', function(){});
             $("#editor").fadeToggle('slow', function(){});
        }
    })
    .keyup( function( event )
    {
        updateKeyboardUp(event.keyCode);
    })
    .on('dragenter', function( event )
    {
        event.stopPropagation();
        event.preventDefault();
    })
    .on('dragover', function( event )
    {
        event.stopPropagation();
        event.preventDefault();
    })
    .on('drop', function( event )
    {
        event.stopPropagation();
        event.preventDefault();
    });

$(window)
    .resize(function() 
    {
        resizeGLCanvas(window.innerWidth, window.innerHeight);
    });

function openFile(event)
{
    var file;
    if (event.target.files)
        file = event.target.files;
    else
        file = event.dataTransfer.files;

    for (var i = 0, f; f = file[i]; i++) 
    {
        if (f.name.slice(-5) == ".frag") 
        {
            var reader = new FileReader();

            reader.onload = (function(theFile) 
            {
                return function(e) {
                    editor.setValue(reader.result, -1);
                };
            })(f); 

            reader.readAsText(f, "text/plain;charset=utf-8");
        }
    }
}

var Range = ace.require("ace/range").Range

function setShader(result, fromScript)
{
    while (mErrors.length > 0) 
    {
        var mark = mErrors.pop();
        editor.session.removeMarker(mark);
    }
        
    editor.session.clearAnnotations();

    if (result.mSuccess === false) 
    {
        var lineOffset = getHeaderSize();
        var lines = result.mInfo.match(/^.*((\r\n|\n|\r)|$)/gm);
        var tAnnotations = [];
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(":");

            if (parts.length === 5 || parts.length === 6) 
            {
                var annotation = {};
                annotation.row = parseInt(parts[2]) - lineOffset;
                annotation.text = parts[3] + " : " + parts[4];
                annotation.type = "error";

                if(debugging)
                    tAnnotations.push(annotation);
                
                var id = editor.session.addMarker(new Range(annotation.row, 0, annotation.row, 1), "errorHighlight", "fullLine", false);
                mErrors.push(id);
            } 
        }

        if(debugging) {
            console.log(result.mInfo); 
            editor.session.setAnnotations(tAnnotations);
        }
    }
}

var SoundCloudAudioSource = function(player) {

    var self = this;

    mSound.mSource = mAudioContext.createMediaElementSource(player);
    mSound.mSource.connect(mSound.mAnalyser);
    mSound.mAnalyser.connect(mAudioContext.destination);
    bandsOn = true;
    // public properties and methods
    this.volume = 0;
    this.streamData = new Uint8Array(128);
    this.playStream = function(streamUrl) {
        // get the input stream from the audio element
        player.addEventListener('ended', function(){
            self.directStream('coasting');
        });
        player.setAttribute('src', streamUrl);
        player.play();
    };
};

/**
 * Makes a request to the Soundcloud API and returns the JSON data.
 */
var SoundcloudLoader = function(player,uiUpdater) {
    var self = this;
    var client_id = "35ea0b79c8a17560443b72c2df925316"; // to get an ID go to http://developers.soundcloud.com/
    this.sound = {};
    this.streamUrl = "";
    this.errorMessage = "";
    this.player = player;
    this.uiUpdater = uiUpdater;

    /**
     * Loads the JSON stream data object from the URL of the track (as given in the location bar of the browser when browsing Soundcloud),
     * and on success it calls the callback passed to it (for example, used to then send the stream_url to the audiosource object).
     * @param track_url
     * @param callback
     */
    this.loadStream = function(track_url, successCallback, errorCallback) {
        SC.initialize({
            client_id: client_id
        });
        SC.get('/resolve', { url: track_url }, function(sound) {
            if (sound.errors) {
                self.errorMessage = "";
                for (var i = 0; i < sound.errors.length; i++) {
                    self.errorMessage += sound.errors[i].error_message + '<br>';
                }
                self.errorMessage += 'Make sure the URL has the correct format: https://soundcloud.com/user/title-of-the-track';
                errorCallback();
            } else {

                if(sound.kind=="playlist"){
                    self.sound = sound;
                    self.streamPlaylistIndex = 0;
                    self.streamUrl = function(){
                        return sound.tracks[self.streamPlaylistIndex].stream_url + '?client_id=' + client_id;
                    };
                    successCallback();
                }else{
                    self.sound = sound;
                    self.streamUrl = function(){ return sound.stream_url + '?client_id=' + client_id; };
                    successCallback();
                }
            }
        });
    };


    this.directStream = function(direction){
        if(direction=='toggle'){
            if (this.player.paused) {
                this.player.play();
            } else {
                this.player.pause();
            }
        }
        else if(this.sound.kind=="playlist"){
            if(direction=='coasting') {
                this.streamPlaylistIndex++;
            }else if(direction=='forward') {
                if(this.streamPlaylistIndex>=this.sound.track_count-1) this.streamPlaylistIndex = 0;
                else this.streamPlaylistIndex++;
            }else{
                if(this.streamPlaylistIndex<=0) this.streamPlaylistIndex = this.sound.track_count-1;
                else this.streamPlaylistIndex--;
            }
            if(this.streamPlaylistIndex>=0 && this.streamPlaylistIndex<=this.sound.track_count-1) {
               this.player.setAttribute('src',this.streamUrl());
               this.uiUpdater.update(this);
               this.player.play();
            }
        }
    };


};

/**
 * Class to update the UI when a new sound is loaded
 * @constructor
 */
var UiUpdater = function() {
    var controlPanel = document.getElementById('controlPanel');
    var trackInfoPanel = document.getElementById('trackInfoPanel');
    var infoImage = document.getElementById('infoImage');
    var infoArtist = document.getElementById('infoArtist');
    var infoTrack = document.getElementById('infoTrack');
    var messageBox = document.getElementById('messageBox');

    this.clearInfoPanel = function() {
        // first clear the current contents
        infoArtist.innerHTML = "";
        infoTrack.innerHTML = "";
        trackInfoPanel.className = 'hidden';
    };
    this.update = function(loader) {
        // update the track and artist into in the controlPanel
        var artistLink = document.createElement('a');
        artistLink.setAttribute('href', loader.sound.user.permalink_url);
        artistLink.innerHTML = loader.sound.user.username;
        var trackLink = document.createElement('a');
        trackLink.setAttribute('href', loader.sound.permalink_url);

        if(loader.sound.kind=="playlist"){
            trackLink.innerHTML = "<p>" + loader.sound.tracks[loader.streamPlaylistIndex].title + "</p>" + "<p>"+loader.sound.title+"</p>";
        }else{
            trackLink.innerHTML = loader.sound.title;
        }

        var image = loader.sound.artwork_url ? loader.sound.artwork_url : loader.sound.user.avatar_url; // if no track artwork exists, use the user's avatar.
        infoImage.setAttribute('src', image);

        infoArtist.innerHTML = '';
        infoArtist.appendChild(artistLink);

        infoTrack.innerHTML = '';
        infoTrack.appendChild(trackLink);

        // display the track info panel
        trackInfoPanel.className = '';

        // add a hash to the URL so it can be shared or saved
        var trackToken = loader.sound.permalink_url.substr(22);
        window.location = '#' + trackToken;
    };

    this.displayMessage = function(title, message) {
        messageBox.innerHTML = ''; // reset the contents

        var titleElement = document.createElement('h3');
        titleElement.innerHTML = title;

        var messageElement = document.createElement('p');
        messageElement.innerHTML = message;


        messageBox.className = '';
        // stick them into the container div
        messageBox.appendChild(titleElement);
        messageBox.appendChild(messageElement);
        messageBox.appendChild(closeButton);
    };
};

