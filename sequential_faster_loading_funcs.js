
/* UsefulFunctions
------------------------------------------ */

function getRandomElement (list){
    return list[Math.floor(Math.random()*list.length)];
}
  
function getRandomInt(min, max) {
  return Math.floor(Math.random()*(max - min + 1) + min);
}
  
// function shuffle(a) {
//       for (let i = a.length - 1; i > 0; i--) {
//           const j = Math.floor(Math.random() * (i + 1));
//           [a[i], a[j]] = [a[j], a[i]];
//       }
//       return a;
//   }
  
  function getRandom(arr, n) {
      var result = new Array(n),
          len = arr.length,
          taken = new Array(len);
      if (n > len)
          throw new RangeError("getRandom: more elements taken than available");
      while (n--) {
          var x = Math.floor(Math.random() * len);
          result[n] = arr[x in taken ? taken[x] : x];
          taken[x] = --len in taken ? taken[len] : len;
      }
      return result;
  }
  
  function getFixationTime (){  //get randomized time of fixation by randomly choosing from 0.4, 0.5 and 0.6s
    fixationTime = getRandomElement([400, 500, 600]);
    return fixationTime;
  }


  function make_stim(stim_array,face){
    var html_stim_array = []
    for (p of stim_array){
      html_stim_array.push("<div class='"+face+"' style='background-position:" + (stim_array[p]*100) + "% 0%'></div>")
    }
    html_stim_array.join();
    return html_stim_array
  }

  function array_length(){
    var length = getRandomInt(1,12)
    return length
  }

  /* SAVE FUNC
------------------------------------------ */

const cognitoIdentityPool = "us-east-1:0f699842-4091-432f-8b93-a2d4b7bb5f20";
const DATA_BUCKET = "task-data-raw";
const DIRECTORY = "stim-sim-faces-production";

function saveDataToS3() {

	id = faceData.subject_id

	d = {
			"curTime": jsPsych.startTime(),
			"userAgent": navigator.userAgent,
			"windowWidth": window.innerWidth,
			"windowHeight": window.innerHeight,
			"screenWidth": screen.width,
			"screenHeight": screen.height,
			"totalTime": jsPsych.totalTime(),
			"interactionData": jsPsych.data.getInteractionData().json(),
			"trialStruct": jsPsych.data.get().json(),
		};

	d = JSON.stringify(d);

	AWS.config.update({
	region: "us-east-1",
	credentials: new AWS.CognitoIdentityCredentials({
		IdentityPoolId: cognitoIdentityPool
	}),
	});

	const filename = `${DIRECTORY}/${id}.json`;

	const bucket = new AWS.S3({
	params: { Bucket: DATA_BUCKET },
	apiVersion: "2006-03-01",
	})

	const objParams = {
	Key: filename,
	Body: d
	}

	bucket.putObject(objParams, function(err, data) {
	if (err) {
		console.log("Error: ", err.message);
	} else {
		console.log("Data: ", data);
	}
	});


}

  /* SCALE SHENANIGANS
------------------------------------------ */

function getScale (){ //generate the rating scale depending on the person and valence randomly chosen in faceArray
  var scale = [];
  if (faceData.valence == "Happy"){
    var add_me = 50;
  }
  else{
    var add_me = 100;
  }
  for(i = 1; i < 51; i++){
     scale.push('img/'+faceData.person+(add_me+i) + '.jpg')}
  return scale;
}

function morphedScale (){ //generate the rating scale depending on the person and valence randomly chosen in faceArray
  // defining a few helper functions
  function nrange(size, startAt = 0) {
      return [...Array(size).keys()].map(i => i + startAt);
  };

  function fillArray(value, len) {
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
  };

  function generateSlices(vWidth, nSlices){
    var step = vWidth*0.6/(nSlices-2);
    var stepArray = fillArray(step,nSlices-2)
    stepArray.unshift(0.2*vWidth)
    stepArray.push(0.2*vWidth)

    var bounds = [];
    
    for (var i = 0; i < nSlices; i++) {
      if (i==0){
      bounds.push([(i*stepArray[i]), (i*stepArray[i])+stepArray[i]])
    } else if (i>0 && i!=nSlices-1) {
      bounds.push([(i*stepArray[i]+0.2*vWidth), (i*stepArray[i])+stepArray[i]+0.2*vWidth])
      } else{
      bounds.push([(vWidth-0.2*vWidth), vWidth])  
      }
    };
    return bounds;
  };
  // start trial timer
  var startTime = (new Date()).getTime();
  // get trial data
  var trialData = jsPsych.currentTrial();

  // remove the picture scales and the slider
  $('.jspsych-image-slider-response_noButton-container').remove();
  $('img').remove();
  var imgScale = getScale();
  // drop the first element of the img scale
  //imgScale = imgScale.slice(1,imgScale.length) // why?????
  // derive the letter of the image filenames
  var imgBase = imgScale[0].split('img/')[1].split('.jpg')[0].replace(/\d+/g, '');
  // split the number of the image filenames off from the rest of it
  var nScale = [];
  for (var i = 0; i < imgScale.length-1; i++) {
    var n = imgScale[i].split('img/')[1].split('.jpg')[0].split(imgBase)[1];
    nScale.push(n);
  };
  // calculate the element width, and slice it up into sections
  var vWidth = $(document).width();
  var nSlices = nScale.length;
  var slices = generateSlices(vWidth, nSlices);

  // setting up iniital vertical line to start the mousemove functionality
  var vHeight = $(document).height()-8;
  var lineSlice = vWidth / 10;
  var vertLine = `<div style="border-left:black;border-style:solid;margin-left:${lineSlice}px; height:${vHeight}px;width:0px;position:absolute;" id="vertLine"></div>`;
  var linePrompt = `<div id="linePrompt"><div style="font-size:50px;position:absolute;margin-left:${lineSlice*1.3}px;margin-top:${vHeight/2}px"></div><div style="position:absolute;margin-left:${lineSlice*1.2}px;margin-top:${vHeight/2}px;z-index:5;">Move mouse left of the line to begin</div></div>`
  $(".jspsych-content-wrapper").prepend(vertLine);
  $(".jspsych-content-wrapper").prepend(linePrompt);
  // hide prompt until the trial is begun
  $('#jspsych-content > p').css("visibility", "hidden");

  // initialize the central image with the most neutral one (i.e. from
  // the middle of the scale) and set the image to be blurred
  var initialImage = imgScale[0] ; //imgScale[Math.floor(imgScale.length/2)];
  $('#jspsych-image-slider-response_noButton-stimulus').append(`<img src="${initialImage}" style="filter:blur(4px);visibility:hidden;" id="changeable-image"/>`);


  // workaround with a global variable
  window.__imageMouseOver = {
    lineSlice: lineSlice,
    slices: slices,
    nScale: nScale,
    imgBase: imgBase,
    startTime: startTime,
    trialData: trialData,
    sliceSelected: 0,
  };
  var __listenerBools = {};

  // define mousemove event listener that changes image
  function changeImg(event){
    var mouseX = Math.floor(event.pageX);
    for (var i = 0; i < __imageMouseOver.slices.length; i++) {
      // if mouse X position is within the bounds of the X axis slice,
      // change the image to one that is indexed to that slice
      if (mouseX >= __imageMouseOver.slices[i][0] && mouseX <= __imageMouseOver.slices[i][1]) {
        // capture which slice is selected
        __imageMouseOver.sliceSelected = i;
        // update img src to the picture that corresponds to that slice
        $('#changeable-image').attr('src', `img/${__imageMouseOver.imgBase}${__imageMouseOver.nScale[i]}.jpg`);
      }
    };
  };
  // define the click listener that ends trial
  function clickHandler(event){
    if (__listenerBools['mousemove']) {
      // derive trial data
      var trialData = __imageMouseOver.trialData;
      var end_time = (new Date()).getTime();
      var rt = end_time - __imageMouseOver.startTime;
      trialData['rt'] = rt;
      trialData['stimulus_duration'] = rt;
      trialData['trial_duration'] = rt;
      trialData['imageSelected'] = `${__imageMouseOver.imgBase}${__imageMouseOver.nScale[__imageMouseOver.sliceSelected]}.jpg`
      trialData['indexSelected'] = __imageMouseOver.sliceSelected;
      // turn off listeners
      $(document).off('mousemove');
      $(document).off('click');
      // clean up variable namespaces
      delete window.__imageMouseOver
      delete __listenerBools;
      // finish the trial with trial data
      jsPsych.finishTrial(trialData);
    };
  };

  function verticalLineInit(event){
    var mouseX = Math.floor(event.pageX);
    if (mouseX <= __imageMouseOver.lineSlice) {
      $("#vertLine").remove();
      $("#linePrompt").remove();
      $("#jspsych-image-slider-response_noButton-stimulus > img").css({
        "filter":"blur(0px)",
        "visibility": "visible",
      });
      $('#jspsych-content > p').css("visibility", "visible");
      __listenerBools['mousemove'] = true;
      // turn off THIS mouse move listener
      $(document).off("mousemove");
      // turn on the mouse move listener that changes the image
      $(document).mousemove(changeImg);
      // add mouse click listener
      $(document).on('click', clickHandler);
    };
  };

  // turn on the vertical line mouse move listener
  $(document).mousemove(verticalLineInit);
}
