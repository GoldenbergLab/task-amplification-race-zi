/**
Various useful functions
**/

function getRandomInt(min, max) {
    return Math.floor(Math.random()*(max - min + 1) + min);
  }

  function getRandomElement (list){
    return list[Math.floor(Math.random()*list.length)];
  }

  ///////////////////
  //set up functions
  //////////////////

  function getFixationTime (){  //get randomized time of fixation by randomly choosing from 0.5, 1 and 1.5s
    Face.fixationTime = getRandomElement([500, 1000, 1500]);
    return Face.fixationTime;
  }

  function loadFacePool(start,end) { //input the start and ending index of the images to preload faces
    var pool = [];
    for(i = start; i < (end+1); i++){
      pool.push( 'img/A' + i + '.jpg'); pool.push( 'img/B' + i + '.jpg');
      pool.push( 'img/C' + i + '.jpg'); pool.push( 'img/D' + i + '.jpg');
      pool.push( 'img/E' + i + '.jpg'); pool.push( 'img/F' + i + '.jpg');
      pool.push( 'img/G' + i + '.jpg'); pool.push( 'img/H' + i + '.jpg');}
    return pool;
  }

  function createSlideList(start,end){
    var list = [];
    for (i = start; i < (end+1); i++){
       list.push( 'img/ins/Slide ' + i + '.png');}
    return list;
  }

  //////////////////////
  /// checks
  ////////////////////


  function checkID (){
    var inputID = jsPsych.data.getLastTrialData().select('responses').values[0];
    var ID = JSON.parse(inputID).Q0;
    var patt = new RegExp("^[a-zA-Z_0-9]{1,}$"); //the first&last character
    if (!patt.test(ID)){      //test if first/last character in response exist
      alert("Please, enter your participant id");
      return true; }
    else{ return false;}
  }


  function checkPhone (){
    var choice = jsPsych.data.getLastTrialData().select('button_pressed').values[0];
    if(choice == 0){
      alert('As mentioned in the study description, this study can only be done a computer and would not work on a smartphone. Your experiment will be terminated and the window will be closed.');
      window.close();
      return true;
    } else { return false;}
  }

  function check_consent (){
    if ($('#consent_checkbox').is(':checked')) {
      return true;
    } else {
      alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
      return false;
    } return false;
  }


  function getWord (){ //get a word for attention check from the word list
    Face.word = Face.wordList.shift();
    return Face.word;
  }

  function checkTyping(){  //test if type correctly
    var inputText = jsPsych.data.getLastTrialData().select('responses').values[0];
    var text = JSON.parse(inputText).Q0;
    if (Face.word !== text){
      falseAnswer += 1;
      alert("Attention! Please type the word correctly. If the alert shows up for 4 times, the experiment will be automatically terminated.");
      Face.wordList.unshift(Face.word);
      if (falseAnswer == falseAllowance){ //if participant gets alert this number of times
        alert("Hi! You've made too much errors in typing the word suggesting that you are not paying attention to the task. The task will be Terminated");
        window.close();
      }else{return true;} }
    else {falseAnswer = 0; return false} //reset falseAnswer
  }


  function checkResponse(data){ //check repeated response
    var trialNumber = jsPsych.data.get().last(1).select('trial_index')['values'][0];
    if (trialNumber > 29) { //after practice trials and two real task trials, we begin to test whether choice is the same as previous two
    var lastRatings = jsPsych.data.get().last(10).filter({trial_type:'image-slider-response_noButton'}).values();//get ratings of past three trials
    var currentRating = Number(lastRatings[0].response); //get rating of this trial
    var last1Rating = Number(lastRatings[1].response); //get rating of last trial
    var last2Rating = Number(lastRatings[2].response); //get rating of two trials before
      if ((currentRating == last1Rating) && (currentRating == last2Rating)){ //if these three ratings are the same
        alert('It seems that you were making the exact same rating as the one in the previous trial. Please make sure to change the scale to reflect your estimate of the mean group emotion. Getting this warning again would lead to a termination of the session.');
        repeatAlert +=1;
        if (repeatAlert == repeatAllowance){ //if participant gets alert this number of times
          alert('You made too many repeated ratings that were exactly the same. The experiment will be terminated.');
          window.close();
        } else {return true;}
      }else {return true;}}
  }


  ////////////////////////////
  //trial speicifc function
  ///////////////////////////

  function getFaceSample (){  //get the sample of faces in each trial
    //choose positive or negative valence
    Face.emotionX = getRandomElement(["anger_", "happy_"]); //randomly choose from anger or happy

    if (Face.emotionX = "anger_") {
      //  select between 109-139
      Face.numX = getRandomInt(110,140)
    } else {
      //  select between 59-89

      Face.numX = getRandomInt(60,90)
    }
    //choose the identity of the face
    Face.personX = getRandomElement(['A','B','C','D','E','F','G','H']);//randomally choose from [A through H] -- select person

    Face.verX = getRandomElement(["v1", "v2", "v3"])
    return [
    ['img/merged_images/'+ Face.emotionX + Face.numX +"_"+ Face.personX +"_" + Face.verX +'.jpg'],
    ];
  }

  function getScale (){ //generate the rating scale depending on the person and valence randomly chosen in faceArray
    var scale = [];

    if (Face.emotionX = "anger_") {

      for(i = 1; i < (50+1); i++){
        scale.push('img/'+ Face.personX + (100 +i) + '.jpg')}
    } else {


      for(i = 1; i < (50+1); i++){
        scale.push('img/'+ Face.personX+ (50 +i) + '.jpg')}
    }

    return scale;
  }

  function morphedScale (){ //generate the rating scale depending on the person and valence randomly chosen in faceArray
    // defining a few helper functions
    function nrange(size, startAt = 0) {
        return [...Array(size).keys()].map(i => i + startAt);
    };
    function generateSlices(vWidth, nSlices){
      var step = vWidth/nSlices;
      var bounds = [];
      for (var i = 0; i < nSlices; i++) {
        bounds.push([(i*step), (i*step)+step]);
      };
      return bounds
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
    imgScale = imgScale.slice(1,imgScale.length)
    // derive the letter of the image filenames
    var imgBase = imgScale[0].split('img/')[1].split('.jpg')[0].replace(/\d+/g, '');
    // split the number of the image filenames off from the rest of it
    var nScale = [];
    for (var i = 0; i < imgScale.length; i++) {
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
    var linePrompt = `<div id="linePrompt"><div style="font-size:50px;position:absolute;margin-left:${lineSlice*1.3}px;margin-top:${vHeight/2}px">⬅</div><div style="position:absolute;margin-left:${lineSlice*1.72}px;margin-top:${vHeight/2}px;z-index:5;"> move mouse here to begin</div></div>`
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

  function getNextSlide () {  //use to shift instruction slides
    var currentSlide = slideList.shift();
    return currentSlide
  }
