/**
 * jspsych-color-rotated-object
 *
 * plugin for displaying a color-rotated object stimulus and getting a keyboard response
 *
 **/


jsPsych.plugins["color-rotated-object"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('color-rotated-object', 'stimulus', 'image');

  plugin.info = {
    name: 'color-rotated-object',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The image to be displayed'
      },
			color_rotation_deg: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Amount to rotate the color',
        default: null,
        description: 'In LAB space, how much to rotate the image.'				
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
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show trial before it ends.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, trial will end when subject makes a response.'
      },
    }
  }

  plugin.trial = function(display_element, trial) {

    /* Create/download image: */
		var img = document.createElement('img');
		img.setAttribute('width', trial.stimulus_width);
    img.setAttribute('height', trial.stimulus_height);
		img.width = trial.stimulus_width;
		img.height = trial.stimulus_height;
		img.src = trial.stimulus;
		
		/* Create canvas & put image in it: */
		var canvas = document.createElement('canvas');
		canvas.setAttribute('id', trial.stimulus_width);
		canvas.setAttribute('width', trial.stimulus_width);
    canvas.setAttribute('height', trial.stimulus_height);
    var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0,0, trial.stimulus_width, trial.stimulus_height);
		
		/* Pixel by pixel rotate the image in LAB space: */
		var imageData = ctx.getImageData(0, 0, trial.stimulus_width, trial.stimulus_height);
		for (var i = 0; i < imageData.data.length; i+= 4) {
			/* Convert to LAB: */
			var rgb = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
			var lab = rgb2lab(rgb);
			
			/* Rotate around 0/0 origin: */
			var newAB = rotate(0, 0, lab[1], lab[2], trial.color_rotation_deg);
			lab[1] = newAB[0];
			lab[2] = newAB[1];

			/* Fill back in: */
			var rgb2 = lab2rgb(lab);
			imageData.data[i] = rgb2[0];
			imageData.data[i+1] = rgb2[1];
			imageData.data[i+2] = rgb2[2];
		}
		ctx.putImageData(imageData, 0, 0);

		/* Add prompt: */
		var prompt = document.createElement('div');
		prompt.innerHTML = trial.prompt;
		
		/* Put into display_element: */
		display_element.appendChild(canvas);
		display_element.appendChild(prompt);
		
    // store response
    var response = {
      rt: null,
      key: null
    };

    // function to end trial when it is time
    var end_trial = function() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
        "stimulus": trial.stimulus,
        "key_press": response.key
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {
      // only record the first response
      if (response.key == null) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // start the response listener
    if (trial.choices != jsPsych.NO_KEYS) {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      });
    }

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        canvas.style.visibility = 'hidden';
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }

  };

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
