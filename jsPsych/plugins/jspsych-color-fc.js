/**
 * jspsych-color-fc
 * plugin for forced-choice with colors
  */

var color_fc_css_added = false;

jsPsych.plugins['color-fc'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'color-cd-fc',
    description: 'plugin for forced-choice with colors',
    parameters: {
      set_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Set size',
        default: 3,
        description: 'Number of colors to show on this trial'
      },
			num_placeholders: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of locations where items can appear',
        default: 8,
        description: 'Number of locations where items can appear'
      },	
			colors: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Actual colors to show',
        default: ['rgb(255,0,0)', 'rgb(255,0,0)', 'rgb(255,0,0)'],
				array: true,
        description: 'Should be array of colors, specified in CSS format'
      },
      which_test: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which item to probe',
        default: 0,
        description: 'Which item, 0 to (setSize-1).'
      },			
			feedback: {
        type: jsPsych.plugins.parameterType.Boolean,
        pretty_name: 'Give feedback?',
        default: false,
        description: 'Should we give feedback? If yes, requires https://github.com/catdad/canvas-confetti'
			},					
			click_to_start: {
        type: jsPsych.plugins.parameterType.Boolean,
        pretty_name: 'Click to start trial or start on a timer?',
        default: true,
        description: 'Click to start trial or start on a 500ms timer?'
			},				
      item_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Size of each item',
        default: 90,
        description: 'Diameter of circle in pixels.'
      },		
			display_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time to show colors',
        default: 500,
        description: 'Time in ms. to display colors'				
			},
      delay_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time before probe appears',
        default: 800,
        description: 'Delay time in ms..'
      },
      radius: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Where items appear',
        default: 160,
        description: 'Radius in pixels of circle items appear along.'
      },
			test_color_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which choice(s) to show at test',
        array: true,
        default: ['rgb(255,0,0)','rgb(255,0,0)'],
        description: 'Which colors to show as forced-choice options.'
      },
			test_location: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Location of forced-choice tests',
        default: 0,
        description: '0=around fixation, at center; 1=bottom of test area'
      },
			background_color: {
        type: jsPsych.plugins.parameterType.String,
        pretty_name: 'Background color of box',
        default: '#DDDDDD',
        description: 'Test box background'
      },
    }
  }
	
  plugin.trial = function(display_element, trial) {

    /* Add CSS for classes just once when 
      plugin is first used: 
    --------------------------------*/
		if (!color_fc_css_added) {
			var css = `
			.fcMemoryItem {
				position: absolute;
				border-radius: 50%;
				border: 1px solid #222;
			}
			.fcMemoryChoice {
				width: 40px;
				height: 40px;
        border-radius: 50%;
				cursor: pointer;
				font-size: 10pt;
				display: flex;
				align-items: center;
        justify-content: center;  
			}
      #fcMemoryBox {
        display: flex;
        margin: 0 auto;
        align-items: center;
        justify-content: center;  
        border: 1px solid black;
        position: relative;
      }
			`;
			var styleSheet = document.createElement("style");
			styleSheet.type = "text/css"
			styleSheet.innerText = css;
			document.head.appendChild(styleSheet);
			
			var cSound = document.createElement('audio');
			cSound.id       = 'fc_correct_sound';
			cSound.src      = 'win.mp3';
			cSound.type     = 'audio/mpeg';
			document.body.appendChild(cSound);
			var eSound = document.createElement('audio');
			eSound.id       = 'fc_error_sound';
			eSound.src      = 'lose.mp3';
			eSound.type     = 'audio/mpeg';
			document.body.appendChild(eSound);			
			
			color_fc_css_added = true;
		}
		
		/* Check for LAB colors: 
		-------------------------------- */
		var original_colors = [...trial.colors];
		var original_test_colors = [...trial.test_color_options];
		for (var i=0; i<trial.colors.length; i++) {
			trial.colors[i] = trial.colors[i].trim().toLowerCase();
			if (trial.colors[i].includes('lab')) {
				trial.colors[i] = lab2rgb(trial.colors[i]);
			}
		}
		for (var i=0; i<trial.test_color_options.length; i++) {
			trial.test_color_options[i] = trial.test_color_options[i].trim().toLowerCase();
			if (trial.test_color_options[i].includes('lab')) {
				trial.test_color_options[i] = lab2rgb(trial.test_color_options[i]);
			}
		}
		
		/* Build basic trial structure: 
		-------------------------------- */
		var width = trial.radius * 2 + trial.item_size * 2 + 50;
		var height = trial.radius * 2 + trial.item_size * 2 + 50;
		var center = width/2;
		var startText = "Click the + to start this trial.";
		if (!trial.click_to_start) {	startText = "";	}
    var html = 	`<div id="fcMemoryBox" style="
			width:${width}px; 
			height: ${height}px;; background-color: ${trial.background_color}">`;
		var possiblePositions = [];
		for (var i=0; i < trial.num_placeholders; i++) {
			var curTop = (Math.cos((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center - 15;
			var curLeft = (Math.sin((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center;
			html += `<div id="item${i}" class="fcMemoryItem" 
				style="top:${curTop}px; left:${curLeft}px; 
        width:${trial.item_size}px; 
        height:${trial.item_size}px"></div>`;
			possiblePositions.push(i);
		}
		html += `<span id="fcMemoryFixation" style="cursor: pointer">+</span>
			<div id="fcMemoryStartTrial" style="position: absolute; 
				top:20px">${startText}</div>
			<div id="fcReportDiv"></div>
		</div>`;
		display_element.innerHTML = html;
		
		/* Wait for click to start the trial:  
		-------------------------------- */
		var startTrial = function() {
			document.getElementById("fcMemoryStartTrial").style.display = 'none';
			if (trial.click_to_start) {
				display_element.querySelector('#fcMemoryFixation').removeEventListener('click', startTrial);
			}
			document.getElementById("fcMemoryFixation").style.cursor = 'auto';
			jsPsych.pluginAPI.setTimeout(function() {
        requestAnimationFrame(showStimuli);
      }, 500);
		};
		if (trial.click_to_start) {
			display_element.querySelector('#fcMemoryFixation').addEventListener('click', startTrial);
		} else {
			startTrial();
		}
		/* Show the items:  
		-------------------------------- */
		var pos = jsPsych.randomization.sampleWithoutReplacement(possiblePositions, trial.set_size);
		var start_request_anim;
    var last_frame_time;
    var showStimuli = function(ts) {
      for (var i=0; i<trial.set_size; i++) {
         document.getElementById('item'+pos[i]).style.backgroundColor = trial.colors[i];  
      }
      start_request_anim = ts;
      last_frame_time = ts;
      requestAnimationFrame(hideStimuli);
    };
    
    /* Wait until time to hide stimuli:  
    -------------------------------- */ 
    var actual_stim_duration;
    var hideStimuli = function(ts) {
      var last_frame_duration = ts - last_frame_time;
      last_frame_time = ts;
      if (ts - start_request_anim 
        >= trial.display_time - (last_frame_duration/2)) { 
        actual_stim_duration = ts - start_request_anim;
        for (var i=0; i<trial.set_size; i++) {
					document.getElementById('item'+pos[i]).style.backgroundColor = '';
        }        
        requestAnimationFrame(delayUntilProbe);
      } else {
        requestAnimationFrame(hideStimuli);
      }        
    }

    /* Wait until time to show probe:  
    -------------------------------- */ 
    var delayUntilProbe = function(ts) {
      var last_frame_duration = ts - last_frame_time;
      last_frame_time = ts;
      if (ts - start_request_anim 
        >= trial.display_time + trial.delay_time - (last_frame_duration/2)) { 
        getResponse();
      } else { 
        requestAnimationFrame(delayUntilProbe);
      }
    }
		
		/* Show response wheel:  
		-------------------------------- */
    var start_time;
		var getResponse = function() {
			var html = "";
			var topPos = (trial.test_location==0)?center-20 : height-60;
			var startLeft = center - 30 - (60*((trial.test_color_options.length/2)-1));
			for (var i=0; i<trial.test_color_options.length; i++) {
				var leftPos = startLeft + 60*i;
				html += `<div class='fcMemoryChoice' colorClicked='${i}' 
					id='colorRing${i}' style='position:absolute;
				background-color: ${trial.test_color_options[i]}; top: ${topPos}px; left: ${leftPos-20}px;'></div>`;
			}
			document.getElementById('fcReportDiv').innerHTML = html;
			start_time = performance.now();
			document.getElementById('item' + pos[trial.which_test]).style.boxShadow = '0 0 0 5px black';
			Array.from(document.getElementsByClassName("fcMemoryChoice")).forEach(function(e) {
				e.addEventListener('click', judge_response);
			});
		};
		
		/* Calc. error & give feedback */
		var col_clicked = NaN;
		var end_click_time = NaN;
		var correct = NaN;
		var judge_response = function(e){ 
			end_click_time = (performance.now()- start_time);
			var colClicked = this.getAttribute("colorClicked");
			document.getElementById('colorRing'+colClicked).
				removeEventListener('click', judge_response);
			col_clicked = parseInt(colClicked);
			Array.from(document.getElementsByClassName("fcMemoryChoice")).forEach(function(e) {
				e.removeEventListener('click', judge_response);
			});
			
			correct = trial.test_color_options[col_clicked] == trial.colors[trial.which_test];
			if (trial.feedback) {
				if (correct) {
					var audio = document.getElementById("fc_correct_sound");
					audio.volume = 0.6;
					audio.currentTime = 0;
					audio.play();
					var obj = {
						particleCount: 100,
						startVelocity: 30,
						spread: 50,
						startVelocity: 15,
						ticks: 20,
						origin: {
							x: e.clientX / window.innerWidth,
							y: e.clientY / window.innerHeight
						}
					};
					confetti(obj);
				} else {
					var audio = document.getElementById("fc_error_sound");
					audio.currentTime = 0;
					audio.volume = 0.4;
					audio.play();					
				}
				setTimeout(endTrial, 500);
			} else {		
				setTimeout(endTrial, 100);
			}
		}

		/* End trial and record information:  
		-------------------------------- */		
		var endTrial = function(){
			var trial_data = {
				"rt": end_click_time,
				"position_of_items": pos,
				"colors_of_items": trial.colors,
				"specified_colors": original_colors,
        "reported_color": col_clicked,
				"test_colors": 		trial.test_color_options,
				"specified_test_colors": 		original_test_colors,
				"which_test": trial.which_test,
				"correct": correct,
        "actual_stim_duration": actual_stim_duration
			};
			display_element.innerHTML = '';
			jsPsych.finishTrial(trial_data);
		};
	
  };

	function lab2rgb(lab){
		let sep = lab.indexOf(",") > -1 ? "," : " ";
		lab = lab.substr(4).split(")")[0].split(sep);
		
		var y = (parseFloat(lab[0]) + 16) / 116,
				x = parseFloat(lab[1]) / 500 + y,
				z = y - parseFloat(lab[2]) / 200,
				r, g, b;

		x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
		y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
		z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

		r = x *  3.2406 + y * -1.5372 + z * -0.4986;
		g = x * -0.9689 + y *  1.8758 + z *  0.0415;
		b = x *  0.0557 + y * -0.2040 + z *  1.0570;

		r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
		g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
		b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

		return "rgb(" + (Math.max(0, Math.min(1, r)) * 255) + "," +
						(Math.max(0, Math.min(1, g)) * 255)  + "," +
						(Math.max(0, Math.min(1, b)) * 255)  + ")";
	}

  return plugin;
})();
