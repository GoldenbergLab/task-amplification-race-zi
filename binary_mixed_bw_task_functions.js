/**
Functions in Sequential Task


**/

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomElement (list){
  return list[Math.floor(Math.random()*list.length)];
}

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

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


function loadFacePool(start,end) { //the start and ending index of the images
  var pool = [];
  for(i = start; i < (end+1); i++){
     pool.push( 'img/A' + i + '.jpg'); pool.push( 'img/B' + i + '.jpg');
     pool.push( 'img/C' + i + '.jpg'); pool.push( 'img/D' + i + '.jpg');
     pool.push( 'img/E' + i + '.jpg'); pool.push( 'img/F' + i + '.jpg');
     pool.push( 'img/G' + i + '.jpg'); pool.push( 'img/H' + i + '.jpg');}
  return pool;
}


function check_consent (){
  if ($('#consent_checkbox').is(':checked')) {
    return true;
  }else {
    alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
    return false;}
}

/**
SAVE FUNCTION
**/

const cognitoIdentityPool = "us-east-1:0f699842-4091-432f-8b93-a2d4b7bb5f20";
const DIRECTORY = "amplification-race-mixed-arrays-zi-jun-21"; 
const BUCKET = "task-data-raw";

function saveDataToS3() {// move to funcs. Global var for ID.  


  id = Face.subject_id;
  csv = jsPsych.data.get().csv()

  AWS.config.update({
    region: "us-east-1", 
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: cognitoIdentityPool 
    }), 
  });

  const filename = `${DIRECTORY}/${id}.csv`;

  const bucket = new AWS.S3({
    params: { Bucket: BUCKET }, 
    apiVersion: "2006-03-01", 
  })

  const objParams = { 
    Key: filename, 
    Body: csv 
  }

  bucket.putObject(objParams, function(err, data) { 
    if (err) { 
      console.log("Error: ", err.message); 
    } else {
      console.log("Data: ", data); 
    } 
  });
}


function getNextSlide () {  //use to shift instruction slides
  var currentSlide = slideList.shift();
  return currentSlide;
}

function loadStimulus(end) { //the start and ending index of the images
  var list = [];
  for(i = 1; i < (end+1); i++){
    list.push( 'stimulus/' + i + '.jpg');}
  return list;
}

function checkAnswer (){
  var inputText = jsPsych.data.getLastTrialData().select('responses').values[0];
  var text = JSON.parse(inputText).Q0;
  var patt = new RegExp("[A-Za-z0-9 _.,!'/$]"); // this allows punctuations
  if (!patt.test(inputText  )){      //test if first/last character in response exist
    alert("Please describe the image just showed in a few words (this will be uses for validation purposes)");
    return true; }
  else{ return false;}
}

function getWord (){ //get a word for attention check from the word list
    Face.word = Face.wordList.shift();
    return Face.word;
}

function checkTyping(){  //test if type correctly
  var inputText = jsPsych.data.getLastTrialData().select('responses').values[0];
  var text = JSON.parse(inputText).Q0;
  var falseAllowance = 5;
  if (Face.word !== text){
    falseAnswer += 1;
    alert("Attention! Please type the word correctly. If the alert shows up for 4 times, the experiment will be terminated.");
    Face.wordList.unshift(Face.word);
    if (falseAnswer == falseAllowance){ //if participant gets alert this number of times
      alert("Hi! You've made too much errors in typing the word suggesting that you are not paying attention to the task. If you attempt to further proceed on the task, you will not be compensated.");
      window.close();
    }else{return true;} }
  else {falseAnswer = 0; return false;} //reset falseAnswer
}

function getTimeAndFace (){  //get randomized time of fixation by randomly choosing from 0.4, 0.5 and 0.6s
  Face.fixationTime = getRandomElement([400, 500, 600]);

    //choose face_itive or negative valence before displaying faces
    Face.emotionX = getRandomElement([50,100]); //1 is smallest 
    //choose the identity of the face
    Face.b_person_ratio = getRandomElement([0.25,0.5,0.75]);

    return Face.fixationTime;
}

function make_stim(stim_array){

  Face.b_faces_no = Face.b_person_ratio * Face.array_length //find number of black faces
  Face.w_faces_no = (1-Face.b_person_ratio) * Face.array_length

  Face.b_identity = getRandomElement(["E","F","G","H"]) //find identity of b and w person
  Face.w_identity = getRandomElement(["A","B","C","D"])

  Face.personArray = []

  if(Face.b_person_ratio == 0 ||Face.b_person_ratio==1){
    for(p of stim_array){
      if (Face.b_person_ratio == 0){
        Face.personArray.push(Face.w_identity)
      }

      else if (Face.b_person_ratio == 1){
        Face.personArray.push(Face.b_identity)
      }

    }
  }

  else if (Face.b_person_ratio == 0.5||Face.b_person_ratio==0.25||Face.b_person_ratio==0.75){
    var part_array = Face.array_length * Face.b_person_ratio
    for (i = 0; i < part_array; i++){
      Face.personArray.push(Face.b_identity)
    }

    for (i = 0; i < Face.array_length-part_array; i++){
      Face.personArray.push(Face.w_identity)
    }

  }

  Face.personArray = shuffle(Face.personArray)

  var html_stim_array = []
  for (i = 0; i < Face.array_length; i++){
    
    var random_margin = String(getRandomInt(20,50)); //jitter the margin
    p = stim_array[i]
    person = Face.personArray[i]
    person_offset = Face.face_offset[person]

    html_stim_array.push("<div class='"+Face.valence+"' style='background-position:" + (p*100) + "% "+person_offset+"%;margin-top:"+random_margin+"px'></div>")
  }
  for (i = 0; i < 26 - html_stim_array.length; i++){
    html_stim_array.push("<div> </div>")
  }
  shuffle(html_stim_array);
  var xx = html_stim_array.join(" ")
  Face.html_stim_array = xx;
  // return(xx)
  return ("<span class='grid'>"+xx+"</span>")
}

function getFaceSample (){  
  var emotion_value = [...Array(50).keys()].map(function(item) { 
    return item + 1; 
});
  Face.array_length = getRandomElement([4,8,12])

  

  Face.array_values = getRandom(emotion_value, Face.array_length);
  if (Face.emotionX==50){
    Face.valence = "Happy"
  }
  else{
    Face.valence = "Angry"
  }
  return (make_stim(Face.array_values));
}


  function getScale (){ //generate the rating scale depending on the person and valence randomly chosen in faceArray
    var scale = [];

    if(Face.b_person_ratio == 0.5||Face.b_person_ratio==0.25||Face.b_person_ratio==0.75){
      order = [Face.b_identity, Face.w_identity];
      shuffle(order);
    }
    for(i = 1; i < 51; i++){

      if(Face.b_person_ratio==0){
       scale.push('img/'+Face.w_identity+(Face.emotionX +i) + '.jpg')}
      else if(Face.b_person_ratio==1){
       scale.push('img/'+Face.b_identity+(Face.emotionX +i) + '.jpg')}
      else{
        scale.push(['img/'+order[0]+(Face.emotionX +i) + '.jpg', 'img/'+order[1]+(Face.emotionX +i) + '.jpg'])}
      }
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
    
    // split the number of the image filenames off from the rest of it
    var nScale = [];

    if (Face.b_person_ratio == 0||Face.b_person_ratio==1){
      for (var i = 0; i < imgScale.length-1; i++) {
        var imgBase = imgScale[0].split('img/')[1].split('.jpg')[0].replace(/\d+/g, '');
        var n = imgScale[i].split('img/')[1].split('.jpg')[0].split(imgBase)[1];
        nScale.push(n);
      };
  }
    else {
      for (var i = 0; i < imgScale.length-1; i++) {
        var imgBase = imgScale[0][0].split('img/')[1].split('.jpg')[0].replace(/\d+/g, '');
        var n = imgScale[i][0].split('img/')[1].split('.jpg')[0].split(imgBase)[1];

        var imgBase2 = imgScale[0][1].split('img/')[1].split('.jpg')[0].replace(/\d+/g, '');
        var n2 = imgScale[i][1].split('img/')[1].split('.jpg')[0].split(imgBase2)[1];

        nScale.push([n,n2]);
      };
    }
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
    //imgScale[Math.floor(imgScale.length/2)];

    if (Face.b_person_ratio ==0||Face.b_person_ratio==1){
      var initialImage = imgScale[0] ; 
    $('#jspsych-image-slider-response_noButton-stimulus').append(`<img src="${initialImage}" style="filter:blur(4px);visibility:hidden;" id="changeable-image"/>`);
    }

    else{
      var initialImage = imgScale[0][0] ; 
      var initialImage2 = imgScale[0][1] ; 
      $('#jspsych-image-slider-response_noButton-stimulus').append(`<img src="${initialImage}" style="filter:blur(4px);visibility:hidden;" id="changeable-image"/> <br> <img src="${initialImage2}" style="filter:blur(4px);visibility:hidden;" id="changeable-image-2"/>`);
      }

    // workaround with a global variable

    if (Face.b_person_ratio == 0||Face.b_person_ratio==1){
    window.__imageMouseOver = {
      lineSlice: lineSlice,
      slices: slices,
      nScale: nScale,
      imgBase: imgBase,
      startTime: startTime,
      trialData: trialData,
      sliceSelected: 0,
    };
  }

  else{
    window.__imageMouseOver = {
      lineSlice: lineSlice,
      slices: slices,
      nScale: nScale,
      imgBase: imgBase,
      imgBase2: imgBase2,
      startTime: startTime,
      trialData: trialData,
      sliceSelected: 0,
    };
  }
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
          if (Face.b_person_ratio==0||Face.b_person_ratio==1){
          $('#changeable-image').attr('src', `img/${__imageMouseOver.imgBase}${__imageMouseOver.nScale[i]}.jpg`);
          }
          else {
            $('#changeable-image').attr('src', `img/${__imageMouseOver.imgBase}${__imageMouseOver.nScale[i][0]}.jpg`);
            $('#changeable-image-2').attr('src', `img/${__imageMouseOver.imgBase2}${__imageMouseOver.nScale[i][1]}.jpg`);
            }
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
