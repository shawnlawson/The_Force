var MAX_PROTOCOL_MESSAGES = 50;
var osc;
var messageIndex = 0;
var sendIndex = 0;
var messageVals = [false, false, false, false, false, false, false, false, false, false];
var oscOnScreen = false;

function initOSC() {

    osc = new OSC({
        discardLateMessages: true
    });

    // socket event listeners
    osc.on('open', function(cEvent) 
    {
        $('#socket_status').html('online');
    });

    osc.on('close', function(cEvent) 
    {
        $('#socket_status').html('offline');
        $("#socket_start").button("enable");
        // $('#socket_address').prop('disabled', false);
		// $('#socket_port').prop('disabled', false);

        //TODO: disable OSC listen and send message buttons and the individual messages
		$("#socket_stop").button("disable");
    });

    osc.on('error', function(cEvent) 
    {
        $('#socket_status').html('error');
        $("#socket_start").button("enable");
		$("#socket_stop").button("disable");
    });

    $('#socket_start')
        .button()
        .click( function(event)
        {
    		var address = $('#socket_address').val();
    		var port = $('#socket_port').val();
    		$('#socket_status').html('waiting');
            // $('#socket_address').prop('disabled', true);
            // $('#socket_port').prop('disabled', true);
    		$(this).button("disable");
            $("#socket_stop").button("enable");

            //TODO: enable OSC listen and send message buttons
    		osc.connect(address, port);
        });
    
    $('#socket_stop')
        .button(
            {disabled: true}
        )
        .click( function(event)
        {
        	osc.disconnect();
            $(this).button("disable");
            $("#socket_start").button("enable");
        });

    $('#appendOSCInput')
        .button()
        .click( function(event)
        {
    		if (messageIndex < 9) {
    	        $("#myInputs").append(
                    '<div class="oscRow">\
                    <input type="text" id="inOSCtext' + messageIndex + '" value="/analogInput"/>\
                    <input type="text" id="inOSCUniform' + messageIndex + '" value="analogInput"/>\
                    <button type="submit" id="inOSCenable' + messageIndex + '" onclick="enableOSCMessage(' + messageIndex + ')">Enable</button>\
                    <button type="submit" id="inOSCdisable' + messageIndex + '" onclick="disableOSCMessage(' + messageIndex + ')">Disable</button>\
                    <span id="x' + messageIndex + '" style="color:rgba(255,0,0,0.5);">-</span>\
                    <span id="y' + messageIndex + '" style="color:rgba(0,255,0,0.5);">-</span>\
                    <span id="z' + messageIndex + '" style="color:rgba(0,255,255,0.5);">-</span>\
                    <span id="w' + messageIndex + '" style="color:rgba(255,255,255,0.5);">-</span>\
                    </div>\
                    <div id="rawMessages' + messageIndex + '"> </div>');

                $("#inOSCenable" + messageIndex).button();
    	        $("#inOSCdisable" + messageIndex).button({disabled: true});
    	        messageIndex += 1;
    	    }
        });

    $('#appendOSCOutput')
        .button()
        .click( function(event)
        {
            if (sendIndex < 9) {
                $("#myOutputs").append(
                    '<div class="oscRow">\
                    <input type="text" id="outOSCAddr' + sendIndex + '" value="/out"/>\
                    <input type="text" id="outOSCPattern' + sendIndex + '" value="out"/>\
                    <input type="text" id="outOSCMath' + sendIndex + '" value="%10/10"/>\
                    <input type="text" id="outOSCLine' + sendIndex + '" value="0"/>\
                    <button id="outOSCenable' + sendIndex + '" onclick="enableOSCMessageOut(' + sendIndex + ')">Enable</button>\
                    <button id="outOSCdisable' + sendIndex + '" onclick="disableOSCMessageOut(' + sendIndex + ')">Disable</button>\
                    <span id="rawOutMessages' + sendIndex + '">-</span>\
                    </div>');

                $("#outOSCenable" + sendIndex).button();
                $("#outOSCdisable" + sendIndex).button({disabled: true});
                sendIndex += 1;
            }
        });
        //immedate messaging

    $("#myConsole").keyup(function(event){
      if(event.which == 13){
        var message = new OSC.Message($("#consoleMessage").val(), 
                                      parseFloat($("#consoleValue").val()),
                                      parseInt($("#consoleLine").val()));
        console.log(message);
            osc.send(message);
    }});
    
}

function sendOSCMessages() 
{
    for (var i = 0; i < 9; i++) 
    {
        var str = editor.getValue();
        if ( messageVals[i]) 
        {
            var pattern = new RegExp($("#outOSCPattern" + i).val(), "g");
            var count = str.match(pattern);
            var mathValue = eval(count.length + $("#outOSCMath" + i).val() );
            var message = new OSC.Message($("#outOSCAddr" + i).val(), mathValue, parseInt($("#outOSCLine" + i).val()));
            osc.send(message);
            if ($('#oscPanel').length)//onscreen
            {
                $("#rawOutMessages" + i).html(count.length);
            }
        }
    }
}

function enableOSCMessage(whom) 
{
    $("#inOSCtext" + whom).prop('disabled', true);
    // $('#inOSCtext' + whom).css("background-color", "rgba(128,128,128,0.5)");
    $("#inOSCUniform" + whom).prop('disabled', true);
    // $('#inOSCUniform' + whom).css("background-color", "rgba(128,128,128,0.5)");
    $("#inOSCenable" + whom).button('disable');
    $("#inOSCdisable" + whom).button('enable');

    var m = $("#inOSCtext" + whom).val();

    var listener = osc.on(m, function(cMessage) 
	{
        if (cMessage.typesString == "ffff") {
            //check if popup is visible
            if ($('#oscPanel').length)//onscreen
            {
	            $("#x" + whom).html(cMessage.args[0].toFixed(3));
	            $("#y" + whom).html(cMessage.args[1].toFixed(3));
	            $("#z" + whom).html(cMessage.args[2].toFixed(3));
	            $("#w" + whom).html(cMessage.args[3].toFixed(3));
                $("#rawMessages" + whom).html(" ");
            }
            oscM[whom].args = [cMessage.args[0].toFixed(3), cMessage.args[1].toFixed(3),
            			  cMessage.args[2].toFixed(3), cMessage.args[3].toFixed(3)];
        }
        else
        {
            if ($('#oscPanel').length)//onscreen
            {
                $("#rawMessages" + whom).html(cMessage.addressPattern + ' @ ' + JSON.stringify(cMessage.args));
            }
        }
    });

    
	oscM[whom] = {};
	oscM[whom].listener = listener;
	oscM[whom].args = [0.0,0.0,0.0,0.0];
	oscM[whom].uniName = $('#inOSCUniform' + whom).val();
    createOSCUniforms();
    setShaderFromEditor();
}

function disableOSCMessage(whom) 
{
    $("#inOSCtext" + whom).prop('disabled', false);
    // $('#inOSCtext' + whom).css("background-color", "rgba(255,255,255,0.5)");
    $("#inOSCUniform" + whom).prop('disabled', false);
    // $('#inOSCUniform' + whom).css("background-color", "rgba(255,255,255,0.5)");
    $("#inOSCenable" + whom).button('enable');
    $("#inOSCdisable" + whom).button('disable');

    osc.off($("#inOSCtext" + whom).val(), oscM[whom].listener);
    oscM[whom] = null;
}

function enableOSCMessageOut(whom) 
{
    $("#outOSCAddr" + whom).prop('disabled', true);
    // $('#outOSCAddr' + whom).css("background-color", "rgba(128,128,128,0.5)");
    $("#outOSCPattern" + whom).prop('disabled', true);
    // $('#outOSCPattern' + whom).css("background-color", "rgba(128,128,128,0.5)");
    $("#outOSCenable" + whom).button('disable');
    $("#outOSCdisable" + whom).button('enable');

    messageVals[whom] = true;
}

function disableOSCMessageOut(whom) 
{
    $("#outOSCAddr" + whom).prop('disabled', false);
    // $('#outOSCAddr' + whom).css("background-color", "rgba(255,255,255,0.5)");
    $("#outOSCPattern" + whom).prop('disabled', false);
    // $('#outOSCPattern' + whom).css("background-color", "rgba(255,255,255,0.5)");
    $("#outOSCenable" + whom).button('enable');
    $("#outOSCdisable" + whom).button('disable');

    messageVals[whom] = false;
}
