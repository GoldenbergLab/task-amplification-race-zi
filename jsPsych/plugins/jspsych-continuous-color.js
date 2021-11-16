/**
 * jspsych-continuous-color
 * plugin for continuous color report using Schurgin et al. color wheel.
  */

var continuous_color_css_added = false;

jsPsych.plugins['continuous-color'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'continuous-color',
    description: '',
    parameters: {
      set_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Set size',
        default: 4,
        description: 'Number of actual colors to show on this trial'
      },
			item_colors: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Actual colors to show (optional)',
        default: [],
				array: true,
				description: 'If not empty, should be a list of colors to show, in degrees of color wheel, of same length as set_size. If empty, random colors with min distance between them of min_difference [option below] will be chosen. '
      },
      which_test: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which item to probe',
        default: 0,
        description: 'Item # from 0 to set_size-1 to probe. (Since the colors are by default randomly position & random colors, this can stay 0 unless you need to change it). OR -1 to put probe at the center, as in an ensemble report task.'
      },			
			click_to_start: {
        type: jsPsych.plugins.parameterType.Boolean,
        pretty_name: 'Click to start trial or start on a timer?',
        default: true,
        description: 'Click to start trial or start on a 500ms timer?'
			},	
			color_wheel_spin: {
        type: jsPsych.plugins.parameterType.Boolean,
        pretty_name: 'Spin the color wheel every trial',
        default: false,
        description: 'Should the color wheel spin every trial?'				
			},
			feedback: {
        type: jsPsych.plugins.parameterType.Boolean,
        pretty_name: 'Give feedback?',
        default: false,
        description: 'Feedback will be in deg. of color wheel of error.'				
			},			
			responses_per_item: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Collect multiple response per item',
        default: 1,
        description: 'To allow ranking task, where people can pick more than 1 color for each item.'
      },			
      color_wheel_num_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of colors on wheel',
        default: 360,
        description: 'Number of color options. Can be overruled by color_wheel_list_options. Should evenly divide into 360 and be <= 360.'
      },
      color_wheel_list_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which choices to show',
        array: true,
        default: [],
        description: 'If not empty, which options to show, relative to the target (0), ranging from -179 to 180.'
      },
      item_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Size of each item',
        default: 90,
        description: 'Diameter of each circle in pixels.'
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
      num_placeholders: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of locations where items can appear',
        default: 8,
        description: 'Number of locations where items can appear'
      },			
      min_difference: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Min difference between different items',
        default: 15,
        description: 'Min difference between items in degrees of color space (to reduce grouping).'
      },
			bg_color: {
        type: jsPsych.plugins.parameterType.String,
        pretty_name: 'BG color of box for experiment',
        default: '#DDDDDD',
        description: 'BG color of box for experiment.'
      }
    }
  }
	
  plugin.trial = function(display_element, trial) {

    /* Add CSS for classes just once when 
      plugin is first used: 
    --------------------------------*/
		if (!continuous_color_css_added) {
			var css = `
			.contMemoryItem {
				position: absolute;
				border-radius: 50%;
				border: 1px solid #222;
			}
			.contMemoryChoice {
				width: 20px;
				height: 20px;
        border-radius: 50%;
				cursor: pointer;
				font-size: 10pt;
				display: flex;
				align-items: center;
        justify-content: center;  
			}
      #contMemoryBox {
        display: flex;
        margin: 0 auto;
        align-items: center;
        justify-content: center;  
        border: 1px solid black;
        background: ${trial.bg_color};
        position: relative;
      }`;
			var styleSheet = document.createElement("style");
			styleSheet.type = "text/css"
			styleSheet.innerText = css;
			document.head.appendChild(styleSheet);
			continuous_color_css_added = true;
		}
		
		/* Build basic trial structure: 
		-------------------------------- */
		var width = trial.radius * 2 + trial.item_size * 2 + 50;
		var height = trial.radius * 2 + trial.item_size * 2 + 50;
		var center = width/2;
		var startText = "Click the + to start this trial.";
		if (!trial.click_to_start) {	startText = "";	}
    var html = `
		<div id="contMemoryBox" style="
			width:${width}px; 
			height: ${height}px;">`;
		var possiblePositions = [];
		for (var i=0; i < trial.num_placeholders; i++) {
			let curTop = (Math.cos((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center;
			let curLeft = (Math.sin((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center;
				
			html += `<div id="item${i}" class="contMemoryItem" 
				style="top:${curTop}px; left:${curLeft}px; 
        width:${trial.item_size}px; 
        height:${trial.item_size}px"></div>`;
				
			possiblePositions.push(i);
		}
		html += `<span id="contMemoryFixation" style="cursor: pointer">+</span>
			<div id="contMemoryStartTrial" style="position: absolute; 
				top:20px">${startText}</div>
			<div id="item-1" class="contMemoryItem" 
				style="display: none; top:${center-trial.item_size/2}px; left:${center-trial.item_size/2}px; 
        width:${trial.item_size}px; 
        height:${trial.item_size}px; background: #DDDDDD"></div>
			<div id="reportDiv"></div>
		</div>`;
		display_element.innerHTML = html;
		
		/* Wait for click to start the trial:  
		-------------------------------- */
		var startTrial = function() {
			document.getElementById("contMemoryStartTrial").style.display = 'none';
			if (trial.click_to_start) {
				display_element.querySelector('#contMemoryFixation').removeEventListener('click', startTrial);
			}
			document.getElementById("contMemoryFixation").style.cursor = 'auto';
			jsPsych.pluginAPI.setTimeout(function() {
        requestAnimationFrame(showStimuli);
      }, 500);
		};
		if (trial.click_to_start) {
			display_element.querySelector('#contMemoryFixation').addEventListener('click', startTrial);
		} else {
			startTrial();
		}

		/* Show the items:  
		-------------------------------- */
		var pos = jsPsych.randomization.sampleWithoutReplacement(possiblePositions, trial.set_size);
		var item_colors = trial.item_colors;
		if (trial.item_colors.length==0) {
			item_colors = GetColorsForTrial(trial.set_size, trial.min_difference);
		}
		var start_request_anim;
    var last_frame_time;
    var showStimuli = function(ts) {
      for (var i=0; i<trial.set_size; i++) {
         SetColor('item'+pos[i], item_colors[i]);  
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
		let wheel_spin = 0;
		if (trial.color_wheel_spin) {
			wheel_spin = getRandomIntInclusive(0,359);
		}
		var wheel_radius = trial.radius + trial.item_size + 5;
		var response_angle;
    var start_time;
		var updateAngle = function(e) {
			var rect = document.getElementById('reportDiv').getBoundingClientRect();
			var relX = e.clientX - rect.left; //+ center; 
			var relY = e.clientY - rect.top; //+ center;  
			var curAngle = Math.atan2(relY,relX);
			response_angle = curAngle / Math.PI * 180.0;
			response_angle = (response_angle < 0) ? response_angle+360:response_angle;
		}
		var wheelOptions = [];
		var curResponseNum = 1;
		var getResponse = function() {
			
			var html = `<div id='backgroundRing' 
        style='border: 2px solid gray;
               border-radius: 50%;
               position: absolute;
               top: 17.5px;
               left: 17.5px;
               width: ${wheel_radius*2}px;
               height: ${wheel_radius*2}px'>&nbsp;
      </div>`;
      /* What colors on the wheel? Use color_wheel_list_options
        if included; otherwise, color_wheel_num_options, which
        defaults to 360 colors. */
      wheelOptions = new Array();
      if (trial.color_wheel_list_options.length>0) {
        for (var i=0; i<trial.color_wheel_list_options.length; i++) {
          wheelOptions.push(wrap(trial.color_wheel_list_options[i]
            + item_colors[trial.which_test]));
        }
      } else {
        var stepSize = 360 / trial.color_wheel_num_options;
				var st = (trial.which_test==-1) ? 0 : item_colors[trial.which_test];
  			for (var i=st; 
                i>=st-360; 
                i-=stepSize) {
          wheelOptions.push(i);
        }
      }
      /* Now make wheel html: */
      for (var i=0; i<wheelOptions.length; i++) {
        var deg = wrap(wheelOptions[i]);
        var col = getColor(deg);
				var positionDeg = wrap(deg + wheel_spin);
				var topPx = center-10 + wheel_radius * Math.sin(positionDeg/180.0*Math.PI);
				var leftPx = center-10 + wheel_radius * Math.cos(positionDeg/180.0*Math.PI);    
				html += `<div class='contMemoryChoice' colorClicked='${deg}' 
					id='colorRing${deg}' style='position:absolute;
				background-color: rgb(${Math.round(col[0])}, ${Math.round(col[1])}, 
				${Math.round(col[2])}); top: ${topPx}px; left: ${leftPx}px;'></div>`;
			}
			document.getElementById('reportDiv').innerHTML = html;
      start_time = performance.now();
			if (trial.which_test==-1) {
				document.getElementById('item-1').style.display = 'block';
				document.getElementById('item-1').style.border = '5px solid black';
			} else {
				document.getElementById('item' + pos[trial.which_test]).style.border = '5px solid black';
			}
			
			document.addEventListener('mousemove', updateAngle);			
			Array.from(document.getElementsByClassName("contMemoryChoice")).forEach(function(e) {
				e.addEventListener('click', judge_response);
			});
		};
		
		/* Calc. error & give feedback */
    var trial_errs = new Array();
		var reported_angle_contin = new Array();
		var reported_color_contin = new Array();
		var cols_clicked = new Array();
		var end_click_times = new Array();
		var judge_response = function(e){ 
			end_click_times.push(performance.now()- start_time);
			var colClicked = this.getAttribute("colorClicked");
			document.getElementById('colorRing'+colClicked).
				removeEventListener('click', judge_response);

			cols_clicked.push(parseInt(colClicked));
			reported_angle_contin.push(response_angle);
			reported_color_contin.push(wrap(response_angle - wheel_spin));
			
			if (trial.which_test==-1) {
				var err = undefined;
			} else {
				var err = Math.round(wrap(response_angle - wheel_spin))
					 - item_colors[trial.which_test];
				if (trial.color_wheel_list_options.length>0 
						|| trial.color_wheel_num_options<360) {
					err = colClicked - item_colors[trial.which_test];
				}
				if (err>180) { err-=360; }
				if (err<=-180) { err+=360; }
			}
			trial_errs.push(err);
			
			if (trial.responses_per_item!=1) {
				var ringClick = document.getElementById('colorRing'+colClicked);
				ringClick.style.border = '2px solid black';
				ringClick.style.cursor = 'default';
				ringClick.style.zIndex = curResponseNum;
				ringClick.innerHTML = curResponseNum;
			}
			
			if (curResponseNum != trial.responses_per_item) {
				curResponseNum++;
				return;
			}
			
			document.removeEventListener('mousemove', updateAngle);
			Array.from(document.getElementsByClassName("contMemoryChoice")).forEach(function(e) {
				e.removeEventListener('click', judge_response);
			});
			if (trial.feedback) {
				SetColor('item'+pos[trial.which_test], item_colors[trial.which_test]); 
				var ringClick = document.getElementById('colorRing' + item_colors[trial.which_test]);
				ringClick.style.border = '4px solid black';
				ringClick.style.zIndex = 100;
				if (trial.responses_per_item==1) {
					document.getElementById('contMemoryFixation').innerHTML = 
						"You were off by<br>" + Math.abs(err) + " degrees.";
				} else {
					document.getElementById('contMemoryFixation').innerHTML = 
						"Correct answer<br>is highlighted.";					
				}
				setTimeout(function() { 
					endTrial();
				}, 1500);
			} else {
				setTimeout(endTrial, 100);
			}
		}

		/* End trial and record information:  
		-------------------------------- */		
		var endTrial = function(){
			var trial_data = {
				"rt": end_click_times,
				"position_of_items": pos,
				"colors_of_items": item_colors,
				"wheel_spin": wheel_spin,
				"physical_response_angle": reported_angle_contin,
        "reported_color_angle": reported_color_contin,
        "reported_color_discrete": cols_clicked,
        "error": trial_errs,
				"which_test": trial.which_test,
				"set_size": trial.set_size,
				"wheel_num_options": wheelOptions.length,
        "actual_stim_duration": actual_stim_duration
			};
			display_element.innerHTML = '';
			jsPsych.finishTrial(trial_data);
		};
	
  };

  /* Helper functions
	 ------------------------------ */
	 
	/* Set an element to a color given in degrees of color wheel */
	function SetColor(id, deg) {
		deg=(deg>=360) ? deg-360:deg;
		deg=(deg<0) ? deg+360:deg;
		var col = getColor(deg);
		document.getElementById(id).style.backgroundColor = 'rgb('
			+ Math.round(col[0])+','
			+ Math.round(col[1])+','
			+ Math.round(col[2])+')';
	}

	/* Get colors subject to constraint that all items are a min.
	  difference from each other: */
	function GetColorsForTrial(setSize, minDiff) {
		var items = [];
		var whichCol = getRandomIntInclusive(0,359);
		items.push(whichCol);
		
		for (var j=1; j<=setSize-1; j++) {
			var validColors = new Array();
			for (var c=0;c<360; c++) { 
				isValid = !tooClose(whichCol,c, minDiff);
				for (var testAgainst=0;testAgainst<j;testAgainst++) {
					if (isValid && tooClose(items[testAgainst],c,minDiff)) {
						isValid = false;
					}
				}
				if (isValid) {
					validColors.push(c); 
				}
			}
			validColors = jsPsych.randomization.shuffle(validColors);
			items.push(validColors[0]);
		}
		return items;
	}

	/* Make sure all numbers in an array are between 0 and 360: */
	function wrap(v) {
    if (Array.isArray(v)) {
      for (var i=0; i<v.length; i++) {
        if (v[i]>=360) { v[i]-=360; }
        if (v[i]<0) { v[i]+=360; }
      }    
    } else {
      if (v>=360) { v-=360; }
      if (v<0) { v+=360; }
    }
		return v;
	} 

	function getRandomIntInclusive(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}


	function tooClose(startcol,endcol,minDiff) {
		if (isNaN(startcol) || isNaN(endcol)) {
			return false;
		}
		if (Math.abs(startcol-endcol)<=minDiff) {
			return true;
		}
		if (Math.abs(startcol+360 - endcol)<=minDiff) {
			return true;
		}	
		if (Math.abs(startcol-360 - endcol)<=minDiff) {
			return true;
		}		
		return false;
	}

	function getColor(deg) {
		let colorsList = [
			[246,37,111],
			[246,37,110],
			[246,37,109],
			[246,37,107.5],
			[246,37,106],
			[246,37,104.5],
			[246,37,103],
			[246,37.5,102],
			[246,38,101],
			[246,38.5,99.5],
			[246,39,98],
			[246,39.5,96.5],
			[246,40,95],
			[246,41,94],
			[246,42,93],
			[245.5,42.5,91.5],
			[245,43,90],
			[245,44,89],
			[245,45,88],
			[245,46,86.5],
			[245,47,85],
			[244.5,47.5,84],
			[244,48,83],
			[243.5,49,81.5],
			[243,50,80],
			[242.5,51,79],
			[242,52,78],
			[242,53,76.5],
			[242,54,75],
			[241.5,55.5,74],
			[241,57,73],
			[240.5,58,71.5],
			[240,59,70],
			[239,60,69],
			[238,61,68],
			[237.5,62,66.5],
			[237,63,65],
			[236.5,64,64],
			[236,65,63],
			[235.5,66,62],
			[235,67,61],
			[234,68.5,60],
			[233,70,59],
			[232.5,71,57.5],
			[232,72,56],
			[231,73,55],
			[230,74,54],
			[229,75,53],
			[228,76,52],
			[227.5,77,51],
			[227,78,50],
			[226,79,49],
			[225,80,48],
			[224,81,46.5],
			[223,82,45],
			[222,83,44],
			[221,84,43],
			[220,85,42],
			[219,86,41],
			[218,87,40],
			[217,88,39],
			[216,89,38],
			[215,90,37],
			[214,91,36.5],
			[213,92,36],
			[212,93,35],
			[211,94,34],
			[210,95,33],
			[209,96,32],
			[208,97,31],
			[207,98,30],
			[205.5,98.5,29.5],
			[204,99,29],
			[203,100,28],
			[202,101,27],
			[201,102,26.5],
			[200,103,26],
			[198.5,103.5,25],
			[197,104,24],
			[196,105,23.5],
			[195,106,23],
			[194,107,22.5],
			[193,108,22],
			[191.5,108.5,21.5],
			[190,109,21],
			[189,110,20.5],
			[188,111,20],
			[186.5,111.5,19.5],
			[185,112,19],
			[183.5,113,19],
			[182,114,19],
			[181,114.5,19],
			[180,115,19],
			[178.5,115.5,19],
			[177,116,19],
			[176,117,19],
			[175,118,19],
			[173.5,118.5,19],
			[172,119,19],
			[170.5,119.5,19.5],
			[169,120,20],
			[168,120.5,20.5],
			[167,121,21],
			[165.5,121.5,21.5],
			[164,122,22],
			[162.5,123,22.5],
			[161,124,23],
			[160,124.5,24],
			[159,125,25],
			[157.5,125.5,25.5],
			[156,126,26],
			[154.5,126.5,27],
			[153,127,28],
			[152,127.5,28.5],
			[151,128,29],
			[149.5,128.5,30],
			[148,129,31],
			[146.5,129,32],
			[145,129,33],
			[144,129.5,34],
			[143,130,35],
			[141.5,130.5,36],
			[140,131,37],
			[138.5,131.5,38],
			[137,132,39],
			[135.5,132.5,40],
			[134,133,41],
			[133,133.5,42.5],
			[132,134,44],
			[130.5,134,45],
			[129,134,46],
			[127.5,134.5,47],
			[126,135,48],
			[125,135.5,49],
			[124,136,50],
			[122.5,136,51.5],
			[121,136,53],
			[119.5,136.5,54],
			[118,137,55],
			[117,137,56.5],
			[116,137,58],
			[114.5,137.5,59],
			[113,138,60],
			[111.5,138,61.5],
			[110,138,63],
			[109,138.5,64],
			[108,139,65],
			[106.5,139,66.5],
			[105,139,68],
			[103.5,139.5,69.5],
			[102,140,71],
			[101,140,72],
			[100,140,73],
			[98.5,140.5,74.5],
			[97,141,76],
			[95.5,141,77.5],
			[94,141,79],
			[93,141,80],
			[92,141,81],
			[90.5,141.5,82.5],
			[89,142,84],
			[88,142,85.5],
			[87,142,87],
			[85.5,142,88.5],
			[84,142,90],
			[82.5,142,91],
			[81,142,92],
			[80,142,93.5],
			[79,142,95],
			[77.5,142.5,96.5],
			[76,143,98],
			[75,143,99.5],
			[74,143,101],
			[72.5,143,102.5],
			[71,143,104],
			[70,143,105],
			[69,143,106],
			[67.5,143,107.5],
			[66,143,109],
			[65,143,110.5],
			[64,143,112],
			[63,143,113.5],
			[62,143,115],
			[61,143,116],
			[60,143,117],
			[58.5,143,118.5],
			[57,143,120],
			[56,143,121.5],
			[55,143,123],
			[54,143,124.5],
			[53,143,126],
			[52.5,143,127],
			[52,143,128],
			[51,143,129.5],
			[50,143,131],
			[49.5,143,132.5],
			[49,143,134],
			[48,143,135],
			[47,143,136],
			[46.5,143,137.5],
			[46,143,139],
			[46,142.5,140],
			[46,142,141],
			[45.5,142,142.5],
			[45,142,144],
			[45,142,145],
			[45,142,146],
			[45,142,147.5],
			[45,142,149],
			[45.5,141.5,150],
			[46,141,151],
			[46.5,141,152.5],
			[47,141,154],
			[47.5,141,155],
			[48,141,156],
			[49,140.5,157],
			[50,140,158],
			[50.5,140,159],
			[51,140,160],
			[52,139.5,161],
			[53,139,162],
			[54.5,139,163.5],
			[56,139,165],
			[57,138.5,165.5],
			[58,138,166],
			[59.5,138,167],
			[61,138,168],
			[62.5,137.5,169],
			[64,137,170],
			[65.5,137,171],
			[67,137,172],
			[68.5,136.5,173],
			[70,136,174],
			[71.5,135.5,174.5],
			[73,135,175],
			[75,135,176],
			[77,135,177],
			[78.5,134.5,177.5],
			[80,134,178],
			[82,133.5,179],
			[84,133,180],
			[85.5,132.5,180.5],
			[87,132,181],
			[89,132,181.5],
			[91,132,182],
			[92.5,131.5,182.5],
			[94,131,183],
			[96,130.5,183.5],
			[98,130,184],
			[100,129.5,184.5],
			[102,129,185],
			[104,128.5,185.5],
			[106,128,186],
			[107.5,127.5,186.5],
			[109,127,187],
			[111,126.5,187.5],
			[113,126,188],
			[115,125.5,188],
			[117,125,188],
			[119,124,188.5],
			[121,123,189],
			[123,122.5,189],
			[125,122,189],
			[127,121.5,189],
			[129,121,189],
			[130.5,120.5,189.5],
			[132,120,190],
			[134,119,190],
			[136,118,190],
			[138,117.5,190],
			[140,117,190],
			[142,116.5,190],
			[144,116,190],
			[145.5,115,189.5],
			[147,114,189],
			[149,113.5,189],
			[151,113,189],
			[153,112,189],
			[155,111,189],
			[156.5,110,188.5],
			[158,109,188],
			[160,108.5,188],
			[162,108,188],
			[163.5,107,187.5],
			[165,106,187],
			[167,105.5,186.5],
			[169,105,186],
			[170.5,104,185.5],
			[172,103,185],
			[174,102,184.5],
			[176,101,184],
			[177.5,100,183.5],
			[179,99,183],
			[180.5,98,182.5],
			[182,97,182],
			[184,96,181.5],
			[186,95,181],
			[187.5,94,180.5],
			[189,93,180],
			[190.5,92,179],
			[192,91,178],
			[193.5,90,177.5],
			[195,89,177],
			[196.5,88,176],
			[198,87,175],
			[199.5,86,174.5],
			[201,85,174],
			[202.5,84,173],
			[204,83,172],
			[205,82,171],
			[206,81,170],
			[207.5,80,169],
			[209,79,168],
			[210,78,167.5],
			[211,77,167],
			[212.5,76,166],
			[214,75,165],
			[215,73.5,164],
			[216,72,163],
			[217.5,71,162],
			[219,70,161],
			[220,69,159.5],
			[221,68,158],
			[222,67,157],
			[223,66,156],
			[224,64.5,155],
			[225,63,154],
			[226,62,153],
			[227,61,152],
			[228,60,150.5],
			[229,59,149],
			[230,58,148],
			[231,57,147],
			[232,56,146],
			[233,55,145],
			[233.5,54,143.5],
			[234,53,142],
			[235,51.5,141],
			[236,50,140],
			[236.5,49,138.5],
			[237,48,137],
			[237.5,47.5,136],
			[238,47,135],
			[239,46,133.5],
			[240,45,132],
			[240.5,44,131],
			[241,43,130],
			[241.5,42.5,128.5],
			[242,42,127],
			[242.5,41,125.5],
			[243,40,124],
			[243,39.5,123],
			[243,39,122],
			[243.5,38.5,120.5],
			[244,38,119],
			[244.5,37.5,118],
			[245,37,117],
			[245,37,115.5],
			[245,37,114],
			[245.5,37,112.5]
		];
		return colorsList[deg];
	}

  return plugin;
})();
