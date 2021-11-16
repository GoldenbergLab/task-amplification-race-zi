/**
 * jspsych-continuous-color
 * plugin for continuous color report
 
 * requires jQuery to be included, as well as the relevant css
 */

var continuous_img_css_added = false;

jsPsych.plugins['continuous-image-percep'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'continuous-image-percep',
    description: '',
    parameters: {
	    image_sprite: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Sprite of images',
        default: undefined,
        description: 'The image content to be displayed, should be CSS sprite'
      },
			item_values: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Actual colors to show (optional)',
        default: [],
				array: true,
        description: 'If not empty, should be a list of colors to show, in degrees of color wheel, of same length as set_size'
      },		
			wheel_spin: {
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
      num_previews: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of previews of images outside wheel',
        default: 24,
        description: 'Number of previews of images outside wheel.'
      },			
      wheel_num_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of colors on wheel',
        default: 360,
        description: 'Number of color options. Can be overruled by wheel_list_options. Should evenly divide into 360 and be <= 360.'
      },
      wheel_list_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which choices to show',
        array: true,
        default: [],
        description: 'If not empty, which options to show, relative to the target (0), ranging from -179 to 180.'
      },
			bg_color: {
        type: jsPsych.plugins.parameterType.String,
        pretty_name: 'BG color of box for experiment',
        default: '#FFFFFF',
        description: 'BG color of box for experiment.'
      },
      item_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Size of each item',
        default: 90,
        description: 'Diameter of each circle in pixels.'
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
      }
    }
  }
	
  plugin.trial = function(display_element, trial) {

    /* Add CSS for classes just once when 
      plugin is first used: 
    --------------------------------*/
		if (!continuous_img_css_added) {
			var css = `
			.contImgMemoryItem {
				position: absolute;
				border: 1px solid #CCC;
				user-select: none;
			}
			.contImgMemoryChoice {
				position: absolute;
				width: 20px;
				height: 20px;
        border-radius: 50%;
				background: gray;
				cursor: pointer;
				z-index: 5;
				font-size: 10pt;
				display: flex;
				align-items: center;
        justify-content: center;  
				user-select: none;
			}
			.contImgPreview {
				position: absolute;
				background-size: 5000% 100%;
				width: 50px;
				height: 50px;			
				z-index: 1;
			}
			#contImgMemoryFixation {
				font-size: 11pt;
				padding: 15px;
				user-select: none;
				position: absolute;
			}
      #contImgMemoryBox {
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
		trial.set_size = 1;
		trial.which_test = 0;
		var width = trial.radius * 2 + trial.item_size * 2 + 150;
		var height = trial.radius * 2 + trial.item_size * 2 + 150;
		var center = width/2;
    var html = `
		<div id="contImgMemoryBox" style="
			width:${width}px; 
			height: ${height}px;">`;
		var possiblePositions = [];
		for (var i=0; i < trial.num_placeholders; i++) {
			let curTop = (Math.cos((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center;
			let curLeft = (Math.sin((Math.PI*2)/(trial.num_placeholders)*i)*trial.radius)
				- trial.item_size/2 + center;
				
			html += `<div id="item${i}" class="contImgMemoryItem" 
				style="top:${curTop}px; left:${curLeft}px; 
        width:${trial.item_size}px; 
        height:${trial.item_size}px; background-size: 5000% 100%;"></div>`;
				
			possiblePositions.push(i);
		}
		html += `<span id="contImgMemoryFixation" style="cursor: pointer">+</span>
			<div id="contMemoryStartTrial" style="position: absolute; 
				top:20px">Click the + to start this trial.</div>
			<div id="reportDiv"></div>
		</div>`;
		display_element.innerHTML = html;
		
		/* Wait for click to start the trial:  
		-------------------------------- */
		var startTrial = function() {
			document.getElementById("contMemoryStartTrial").style.display = 'none';
			display_element.querySelector('#contImgMemoryFixation').removeEventListener('click', startTrial);
			document.getElementById("contImgMemoryFixation").style.cursor = 'auto';
			jsPsych.pluginAPI.setTimeout(function() {
        requestAnimationFrame(showStimuli);
      }, 500);
		};
		display_element.querySelector('#contImgMemoryFixation').addEventListener('click', startTrial);

		/* Show the items:  
		-------------------------------- */
		var pos = jsPsych.randomization.sampleWithoutReplacement(possiblePositions, 2);
		var item_values = trial.item_values;
		if (trial.item_values.length==0) {
			item_values = GetItemsForTrial(trial.set_size, trial.min_difference);
		}
		var showStimuli = function() {
			SetItem('item'+pos[0], item_values[0], trial);  
			document.getElementById('item' + pos[0]).style.border = '5px solid black';
			document.getElementById('item' + pos[1]).style.border = '5px solid green';
			getResponse();    
		}
		
		/* Show response wheel:  
		-------------------------------- */
		let wheel_spin = 0;
		if (trial.wheel_spin) {
			wheel_spin = getRandomIntInclusive(0,359);
		}
		var wheel_radius = trial.radius + trial.item_size + 5;
		var response_angle;
    var start_time;
		var prevClosestItem = item_values[trial.which_test];
		var updateAngle = function(e) {
			var rect = document.getElementById('reportDiv').getBoundingClientRect();
			var relX = e.clientX - rect.left; //+ center; 
			var relY = e.clientY - rect.top; //+ center;  
			var curAngle = Math.atan2(relY,relX);
			response_angle = curAngle / Math.PI * 180.0;
			response_angle = (response_angle < 0) ? response_angle+360:response_angle;
			
			SetItem('item'+pos[1], Math.round(wrap(response_angle - wheel_spin)), trial); 
			var closestItem = wheelOptionPositions.reduce((a, b) => {
					return Math.abs(b - response_angle) < Math.abs(a - response_angle) ? b : a;
			});
			var closestItemDeg = wrap(wheelOptions[wheelOptionPositions.indexOf(closestItem)]);
			if (document.getElementById('itemRing' + prevClosestItem).style.zIndex==10) {
				document.getElementById('itemRing' + prevClosestItem).style.zIndex = 5;
				document.getElementById('itemRing' + prevClosestItem).style.border = 'none';
			}
			if (document.getElementById('itemRing' + closestItemDeg).style.zIndex==5) {
				document.getElementById('itemRing' + closestItemDeg).style.border = '2px solid black';
				document.getElementById('itemRing' + closestItemDeg).style.zIndex = 10;
			}
			prevClosestItem = closestItemDeg;
		}
		var wheelOptions = [];
		var wheelOptionPositions = [];
		var curResponseNum = 1;
		var getResponse = function() {
			var html = `<div id='backgroundRing' 
        style='border: 2px solid gray;
               border-radius: 50%;
               position: absolute;
               top: ${(height - wheel_radius*2)/2}px;
               left: ${(width - wheel_radius*2)/2}px;
               width: ${wheel_radius*2 - 5}px;
               height: ${wheel_radius*2 - 5}px'>&nbsp;
      </div>`;
      /* What colors on the wheel? Use wheel_list_options
        if included; otherwise, wheel_num_options, which
        defaults to 360 colors. */
      wheelOptions = new Array();
      if (trial.wheel_list_options.length>0) {
        for (var i=0; i<trial.wheel_list_options.length; i++) {
          wheelOptions.push(wrap(trial.wheel_list_options[i]
            + item_values[trial.which_test]));
        }
      } else {
        var stepSize = 360 / trial.wheel_num_options;
  			for (var i=item_values[trial.which_test]; 
                i>=item_values[trial.which_test]-360; 
                i-=stepSize) {
          wheelOptions.push(wrap(i));
        }
      }
			
      /* Now make wheel html: */
      for (var i=0; i<wheelOptions.length; i++) {
        var deg = wrap(wheelOptions[i]);
				var positionDeg = wrap(deg + wheel_spin);
				wheelOptionPositions.push(positionDeg);
				var topPx = center-10 + wheel_radius * Math.sin(positionDeg/180.0*Math.PI);
				var leftPx = center-10 + wheel_radius * Math.cos(positionDeg/180.0*Math.PI);    
				html += `<div class='contImgMemoryChoice' itemClicked='${deg}' 
					id='itemRing${deg}' style='top: ${topPx}px; left: ${leftPx}px; z-index: 5'></div>`;
			}
			
			/* Now make previews: */
      var stepSize = 360 / trial.num_previews;  
      for (var i=0; i<360; i+=stepSize) {  
				var positionDeg = wrap(i + wheel_spin);
				var topPx = center-25 + (wheel_radius+40) * Math.sin(positionDeg/180.0*Math.PI);
				var leftPx = center-25 + (wheel_radius+40) * Math.cos(positionDeg/180.0*Math.PI);  			
				html += `<div class='contImgPreview' id='preview${i}' style='top: ${topPx}px; left: ${leftPx}px;'></div>`;
			}			
			document.getElementById('reportDiv').innerHTML = html;
      for (var i=0; i<360; i+=stepSize) {  
				SetItem("preview" + i, i, trial);
			}					
			
      start_time = performance.now();
			//document.getElementById('item' + pos[trial.which_test]).style.border = '5px solid black';
			
			document.addEventListener('mousemove', updateAngle);			
			Array.from(document.getElementsByClassName("contImgMemoryChoice")).forEach(function(e) {
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
			var colClicked = this.getAttribute("itemClicked");
			document.getElementById('itemRing'+colClicked).
				removeEventListener('click', judge_response);

			cols_clicked.push(parseInt(colClicked));
			reported_angle_contin.push(response_angle);
			reported_color_contin.push(wrap(response_angle - wheel_spin));
			
			var err = Math.round(wrap(response_angle - wheel_spin))
         - item_values[trial.which_test];
      if (trial.wheel_list_options.length>0 
          || trial.wheel_num_options<360) {
        err = colClicked - item_values[trial.which_test];
      }
      if (err>180) { err-=360; }
      if (err<=-180) { err+=360; }
			trial_errs.push(err);
			
			if (trial.responses_per_item!=1) {
				var ringClick = document.getElementById('itemRing'+colClicked);
				ringClick.style.border = '2px solid black';
				ringClick.style.cursor = 'default';
				ringClick.style.zIndex = 20+curResponseNum;
				ringClick.innerHTML = curResponseNum;
			}
			
			if (curResponseNum != trial.responses_per_item) {
				curResponseNum++;
				return;
			}
			
			document.removeEventListener('mousemove', updateAngle);
			Array.from(document.getElementsByClassName("contImgMemoryChoice")).forEach(function(e) {
				e.removeEventListener('click', judge_response);
			});
			if (trial.feedback) {
				SetItem('item'+pos[trial.which_test], item_values[trial.which_test], trial); 
				var ringClick = document.getElementById('itemRing' + item_values[trial.which_test]);
				ringClick.style.border = '4px solid black';
				ringClick.style.zIndex = 100;
				if (trial.responses_per_item==1) {
					document.getElementById('contImgMemoryFixation').innerHTML = 
						"You were off by<br>" + Math.abs(err) + " degrees.";
				} else {
					document.getElementById('contImgMemoryFixation').innerHTML = 
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
				"colors_of_items": item_values,
				"wheel_spin": wheel_spin,
				"physical_response_angle": reported_angle_contin,
        "reported_color_angle": reported_color_contin,
        "reported_color_discrete": cols_clicked,
        "error": trial_errs,
				"which_test": trial.which_test,
				"set_size": trial.set_size,
				"wheel_num_options": wheelOptions.length
			};
			display_element.innerHTML = '';
			jsPsych.finishTrial(trial_data);
		};
	
  };

  /* Helper functions
	 ------------------------------ */
	 
	/* Set an element to a color given in degrees of color wheel */
	function SetItem(id, deg, trial) {
		deg=(deg>=360) ? deg-360:deg;
		deg=(deg<0) ? deg+360:deg;
		document.getElementById(id).style.backgroundImage = `url('${trial.image_sprite}')`;
		document.getElementById(id).style.backgroundPosition = `${(deg*100)}% 0%`;
	}

	/* Get colors subject to constraint that all items are a min.
	  difference from each other: */
	function GetItemsForTrial(setSize, minDiff) {
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

  return plugin;
})();
