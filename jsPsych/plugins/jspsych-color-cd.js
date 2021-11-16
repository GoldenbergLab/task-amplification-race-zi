/**
 * jspsych-color-cd
 * plugin for change detection with colors
  */

var color_cd_css_added = false;

jsPsych.plugins['color-cd'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'color-cd-cd',
    description: 'plugin for change detection with colors',
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
        description: 'Should we give feedback? just sounds'
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
        description: 'Delay time in ms.'
      },
      radius: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Where items appear',
        default: 160,
        description: 'Radius in pixels of circle items appear along.'
      },
			test_color: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which color to show at test',
        default: 'rgb(255,0,0)',
        description: 'Which color to show as test'
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
		if (!color_cd_css_added) {
			var css = `
			.cdMemoryItem {
				position: absolute;
				border-radius: 50%;
				border: 1px solid #222;
			}
			.cdMemoryChoice {
				width: 40px;
				height: 40px;
        border-radius: 50%;
				cursor: pointer;
				font-size: 10pt;
				display: flex;
				align-items: center;
        justify-content: center;  
			}
      #cdMemoryBox {
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
			cSound.id       = 'cd_correct_sound';
			cSound.src      = 'win.mp3';
			cSound.type     = 'audio/mpeg';
			document.body.appendChild(cSound);
			var eSound = document.createElement('audio');
			eSound.id       = 'cd_error_sound';
			eSound.src      = 'lose.mp3';
			eSound.type     = 'audio/mpeg';
			document.body.appendChild(eSound);			
			
			color_cd_css_added = true;
		}
		
		/* Check for LAB colors: 
		-------------------------------- */
		var original_colors = [...trial.colors];
		var original_test_color = trial.test_color;
		for (var i=0; i<trial.colors.length; i++) {
			trial.colors[i] = trial.colors[i].trim().toLowerCase();
			if (trial.colors[i].includes('lab')) {
				trial.colors[i] = lab2rgb(trial.colors[i]);
			}
		}
		trial.test_color = trial.test_color.trim().toLowerCase();
		if (trial.test_color.includes('lab')) {
			trial.test_color = lab2rgb(trial.test_color);
		}
		
		/* Build basic trial structure: 
		-------------------------------- */
		var width = trial.radius * 2 + trial.item_size * 2 + 50;
		var height = trial.radius * 2 + trial.item_size * 2 + 50;
		var center = width/2;
		var startText = "Click the + to start this trial.";
		if (!trial.click_to_start) {	startText = "";	}
    var html = 	`<div id="cdMemoryBox" style="
			width:${width}px; 
			height: ${height}px;; background-color: ${trial.background_color}">`;
		var possiblePositions = [];
		for (var i=0; i < trial.num_placeholders; i++) {
			var curTop = (Math.cos((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center - 15;
			var curLeft = (Math.sin((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center;
			html += `<div id="item${i}" class="cdMemoryItem" 
				style="top:${curTop}px; left:${curLeft}px; 
        width:${trial.item_size}px; 
        height:${trial.item_size}px"></div>`;
			possiblePositions.push(i);
		}
		html += `<span id="cdMemoryFixation" style="cursor: pointer">+</span>
			<div id="cdMemoryStartTrial" style="position: absolute; 
				top:20px">${startText}</div>
			<div id="fcReportDiv"></div>
		</div>`;
		display_element.innerHTML = html;
		
		/* Wait for click to start the trial:  
		-------------------------------- */
		var startTrial = function() {
			document.getElementById("cdMemoryStartTrial").style.display = 'none';
			if (trial.click_to_start) {
				display_element.querySelector('#cdMemoryFixation').removeEventListener('click', startTrial);
			}
			document.getElementById("cdMemoryFixation").style.cursor = 'auto';
			jsPsych.pluginAPI.setTimeout(function() {
        requestAnimationFrame(showStimuli);
      }, 500);
		};
		if (trial.click_to_start) {
			display_element.querySelector('#cdMemoryFixation').addEventListener('click', startTrial);
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
			document.getElementById('item'+pos[trial.which_test]).style.backgroundColor = trial.test_color;  
			start_time = performance.now();
			document.getElementById('cdMemoryStartTrial').innerHTML = "s=same, d=different";
			document.getElementById('cdMemoryStartTrial').style.display='block';
			document.addEventListener('keydown', judge_response);
		};
		
		/* Calc. error & give feedback */
		var saidSame = NaN;
		var wasSame = NaN;
		var correct = NaN;
		var judge_response = function(e){ 
			if (e.key == 's' || e.key=='d') {
				saidSame = (e.key=='s')?1:0;
				end_click_time = (performance.now()- start_time);
				document.removeEventListener('keydown', judge_response);
				var wasSame = trial.test_color == trial.colors[trial.which_test];
				correct = saidSame==wasSame;
				if (trial.feedback) {
					if (saidSame==wasSame) {
						var audio = document.getElementById("cd_correct_sound");
						audio.volume = 0.6;
						audio.currentTime = 0;
						audio.play();
						/*var obj = {
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
						confetti(obj);*/
					} else {
						var audio = document.getElementById("cd_error_sound");
						audio.currentTime = 0;
						audio.volume = 0.4;
						audio.play();					
					}
					setTimeout(endTrial, 500);
				} else {		
					setTimeout(endTrial, 100);
				}
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
        "said_same": saidSame,
				"which_test": trial.which_test,
				"test_color": trial.test_color,
				"specified_test_color": original_test_color,
				"was_same": wasSame,
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
