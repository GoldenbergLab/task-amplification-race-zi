/**
 * color-rotated-object-report
 * plugin for continuous repor ton a color-rotated object

 */
 
var continuous_object_color_css_added = false;

jsPsych.plugins['color-rotated-object-report'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'color-rotated-object-report',
    description: '',
    parameters: {
			 stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The image to be displayed'
      },
      stimulus_height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image height',
        default: null,
        description: 'Set the image height in pixels'
      },
      stimulus_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image width',
        default: null,
        description: 'Set the image width in pixels'
      },			
			wheel_spin: {
        type: jsPsych.plugins.parameterType.Boolean,
        pretty_name: 'Spin the stimulus wheel every trial',
        default: false,
        description: 'Should the stimulus wheel spin every trial?'				
			},		
			responses_per_item: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Collect multiple response per item',
        default: 1,
        description: 'To allow ranking task, where people can pick more than 1 stimulus option for each item.'
      },		
      num_previews: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of previews of images outside wheel',
        default: 16,
        description: 'Number of previews of images outside wheel.'
      },			
      wheel_num_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of stimuli on wheel',
        default: 360,
        description: 'Number of stimuli options. Can be overruled by wheel_list_options. Should evenly divide into 360 and be <= 360.'
      },
      wheel_list_options: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Which choices to show',
        array: true,
        default: [],
        description: 'If not empty, which options to show, 1 to 360.'
      },
			bg_color: {
        type: jsPsych.plugins.parameterType.String,
        pretty_name: 'BG color of box for experiment',
        default: '#FFFFFF',
        description: 'BG color of box for experiment.'
      },
    }
  }
	
  plugin.trial = function(display_element, trial) {

    /* Add CSS for classes just once when 
      plugin is first used: 
    --------------------------------*/
		if (!continuous_object_color_css_added) {
			var css = `
			.contObjMemoryChoice {
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
			.contObjPreview {
				position: absolute;
				width: 75px;
				height: 75px;			
				z-index: 1;
			}
      #contObjMemoryBox {
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
			continuous_object_color_css_added = true;
		}
		
		/* Build basic trial structure: 
		-------------------------------- */
		var width = trial.stimulus_width * 2  + 150;
		var height = trial.stimulus_height * 2 + 150;
		var center = width/2;
    var html = `
		<div id="contObjMemoryBox" style="
			width:${width}px; 
			height: ${height}px;">
		<canvas id="item" class="contObjMemoryItem" 
			style="position: absolute; top:${center-trial.stimulus_height/2}px; left:${center-trial.stimulus_width/2}px; 
      width:${trial.stimulus_width}px; 
      height:${trial.stimulus_height}px;"></canvas>
			<div id="reportDiv"></div>
		</div>
		<canvas id="invis" class="contObjMemoryItem" 
			style="display: none; position: absolute; top:${center-trial.stimulus_height/2}px; left:${center-trial.stimulus_width/2}px; 
      width:${trial.stimulus_width}px; 
      height:${trial.stimulus_height}px;"></canvas>`;
		display_element.innerHTML = html;
				
		/* Create/download image: */
		var img = document.createElement('img');
		img.setAttribute('width', trial.stimulus_width);
    img.setAttribute('height', trial.stimulus_height);
		img.width = trial.stimulus_width;
		img.height = trial.stimulus_height;
		img.src = trial.stimulus;
		
		/* Get canvas: */
		var canvas = document.getElementById('item');
		canvas.setAttribute('width', trial.stimulus_width);
    canvas.setAttribute('height', trial.stimulus_height);
    var ctx = canvas.getContext("2d");
		
		/* Cache the LAB version of the image: */
		var invisCan = document.getElementById('invis');
		invisCan.setAttribute('width', trial.stimulus_width);
    invisCan.setAttribute('height', trial.stimulus_height);
		var invis = invisCan.getContext("2d");
		invis.drawImage(img, 0,0, trial.stimulus_width, trial.stimulus_height);
		var imageDataInvis = invis.getImageData(0, 0, trial.stimulus_width, trial.stimulus_height);
		var labSpaceImage = new Array();
		for (var i = 0; i < imageDataInvis.data.length; i+= 4) {		
			var rgb = [imageDataInvis.data[i], imageDataInvis.data[i+1], imageDataInvis.data[i+2]];
			var lab = rgb2lab(rgb);
			labSpaceImage.push(lab[0]); 
			labSpaceImage.push(lab[1]); 
			labSpaceImage.push(lab[2]); 
			labSpaceImage.push(0);
		}	
		DrawImage(img, ctx, NaN, trial.stimulus_width, trial.stimulus_height);
		
		/* Show response wheel:  
		-------------------------------- */
		let wheel_spin = 0;
		if (trial.wheel_spin) {
			wheel_spin = getRandomIntInclusive(0,359);
		}
		var wheel_radius = trial.stimulus_width/2 + 60;
		var response_angle;
    var start_time;
		var prevClosestItem = 0;
		var updateAngle = function(e) {
			var rect = document.getElementById('reportDiv').getBoundingClientRect();
			var relX = e.clientX - rect.left; 
			var relY = e.clientY - rect.top; 
			var curAngle = Math.atan2(relY,relX);
			response_angle = curAngle / Math.PI * 180.0;
			response_angle = (response_angle < 0) ? response_angle+360:response_angle;
			
			DrawImageCached(labSpaceImage, ctx, Math.round(wrap(response_angle - wheel_spin)), 
				trial.stimulus_width, trial.stimulus_height);			
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
      /* What items on the wheel? Use wheel_list_options
        if included; otherwise, wheel_num_options, which
        defaults to 360 options. */
      wheelOptions = new Array();
      if (trial.wheel_list_options.length>0) {
        for (var i=0; i<trial.wheel_list_options.length; i++) {
          wheelOptions.push(wrap(trial.wheel_list_options[i]));
        }
      } else {
        var stepSize = 360 / trial.wheel_num_options;
				var st = 0;
  			for (var i=st; 
                i>=st-360; 
                i-=stepSize) {
          wheelOptions.push(i);
        }
      }
			
      /* Now make wheel html: */
      for (var i=0; i<wheelOptions.length; i++) {
        var deg = wrap(wheelOptions[i]);
				var positionDeg = wrap(deg + wheel_spin);
				wheelOptionPositions.push(positionDeg);
				var topPx = center-10 + wheel_radius * Math.sin(positionDeg/180.0*Math.PI);
				var leftPx = center-10 + wheel_radius * Math.cos(positionDeg/180.0*Math.PI);    
				html += `<div class='contObjMemoryChoice' itemClicked='${deg}' 
					id='itemRing${deg}' style='top: ${topPx}px; left: ${leftPx}px; z-index: 5'></div>`;
			}
			
			/* Now make previews: */
      var stepSize = 360 / trial.num_previews;  
      for (var i=0; i<360; i+=stepSize) {  
				var positionDeg = wrap(i + wheel_spin);
				var topPx = center-40 + (wheel_radius+60) * Math.sin(positionDeg/180.0*Math.PI);
				var leftPx = center-40 + (wheel_radius+60) * Math.cos(positionDeg/180.0*Math.PI);  			
				html += `<canvas class='contObjPreview' id='preview${i}' style='top: ${topPx}px; left: ${leftPx}px;' width=75 height=75></canvas>`;
			}			
			document.getElementById('reportDiv').innerHTML = html;
			
			for (var i=0; i<360; i+=stepSize) {  
				var canvasN = document.getElementById(`preview${i}`);
				var ctxN = canvasN.getContext("2d");
				DrawImage(img, ctxN, i, 75, 75);
			}					
			
      start_time = performance.now();			
			document.addEventListener('mousemove', updateAngle);	
			Array.from(document.getElementsByClassName("contObjMemoryChoice")).forEach(function(e) {
				e.addEventListener('click', judge_response);
			});
		};
		setTimeout(getResponse, 10);
		
		/* Calc. error & give feedback */
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
			Array.from(document.getElementsByClassName("contObjMemoryChoice")).forEach(function(e) {
				e.removeEventListener('click', judge_response);
			});
			setTimeout(endTrial, 100);
		}

		/* End trial and record information:  
		-------------------------------- */		
		var endTrial = function(){
			var trial_data = {
				"rt": end_click_times,
				"stimulus": trial.stimulus,
				"wheel_spin": wheel_spin,
				"physical_response_angle": reported_angle_contin,
        "reported_color_angle": reported_color_contin,
        "reported_color_discrete": cols_clicked,
				"wheel_num_options": wheelOptions.length
			};
			display_element.innerHTML = '';
			jsPsych.finishTrial(trial_data);
		};
	
  };

  /* Helper functions
	 ------------------------------ */
	function DrawImage(img, ctx, rotation, width, height) {
		ctx.drawImage(img, 0,0, width, height);
		/* Pixel by pixel rotate the image in LAB space: */
		var imageData = ctx.getImageData(0, 0, width, height);
		for (var i = 0; i < imageData.data.length; i+= 4) {			
			/* Skip black & white-ish pixels: */
			if (imageData.data[i]>225 && imageData.data[i+1]>225 && imageData.data[i+2]>225) { continue; }
			if (imageData.data[i]<25 && imageData.data[i+1]<25 && imageData.data[i+2]<25) { continue; }
			
			/* Convert to LAB: */		
			var rgb = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
			var lab = rgb2lab(rgb);
			if (isNaN(rotation)) {
				/* Grayscale: */
				lab[1] = 0; lab[2] = 0;
			} else {
				/* Rotate around 0/0 origin: */
				var newAB = rotate(0, 0, lab[1], lab[2], rotation);
				lab[1] = newAB[0];
				lab[2] = newAB[1];
			}

			/* Fill back in: */
			var rgb2 = lab2rgb(lab);
			imageData.data[i] = rgb2[0];
			imageData.data[i+1] = rgb2[1];
			imageData.data[i+2] = rgb2[2];
		}
		ctx.putImageData(imageData, 0, 0);
	}
	
	function DrawImageCached(labImageData, ctx, rotation, width, height) {
		//ctx.drawImage(img, 0,0, width, height);
		/* Pixel by pixel rotate the image in LAB space: */
		var imageData = ctx.getImageData(0, 0, width, height);
		for (var i = 0; i < imageData.data.length; i+= 4) {			
			/* Skip black & white-ish pixels: */
			if (labImageData[i]<5 || labImageData[i]>95) { continue; } // too high an L to care
			if (Math.abs(labImageData[i+1])<5 && Math.abs(labImageData[i+2])<5) { continue; } // too little a,b to care
			
			/* Convert to LAB: */
			var lab = [labImageData[i], labImageData[i+1], labImageData[i+2]];
			if (isNaN(rotation)) {
				/* Grayscale: */
				lab[1] = 0; lab[2] = 0;
			} else {
				/* Rotate around 0/0 origin: */
				var newAB = rotate(0, 0, lab[1], lab[2], rotation);
				lab[1] = newAB[0];
				lab[2] = newAB[1];
			}

			/* Fill back in: */
			var rgb2 = lab2rgb(lab);
			imageData.data[i] = rgb2[0];
			imageData.data[i+1] = rgb2[1];
			imageData.data[i+2] = rgb2[2];
		}
		ctx.putImageData(imageData, 0, 0);
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
	
	function rotate(cx, cy, x, y, angle) {
		var radians = (Math.PI / 180) * angle,
				cos = Math.cos(radians),
				sin = Math.sin(radians),
				nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
				ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
		return [nx, ny];
	}
	
	function lab2rgb(lab){
		var y = (lab[0] + 16) / 116,
				x = lab[1] / 500 + y,
				z = y - lab[2] / 200,
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

		return [Math.max(0, Math.min(1, r)) * 255, 
						Math.max(0, Math.min(1, g)) * 255, 
						Math.max(0, Math.min(1, b)) * 255]
	}

	function rgb2lab(rgb){
		var r = rgb[0] / 255,
				g = rgb[1] / 255,
				b = rgb[2] / 255,
				x, y, z;

		r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
		g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
		b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

		x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
		y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
		z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

		x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
		y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
		z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

		return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
	}

  return plugin;
})();
