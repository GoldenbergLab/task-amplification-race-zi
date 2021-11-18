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
    //  pool.push( 'img/A' + i + '.jpg'); pool.push( 'img/B' + i + '.jpg');
     pool.push( 'img/C' + i + '.jpg'); pool.push( 'img/D' + i + '.jpg');
     //pool.push( 'img/E' + i + '.jpg'); 
     pool.push( 'img/F' + i + '.jpg');
     pool.push( 'img/G' + i + '.jpg'); // pool.push( 'img/H' + i + '.jpg');
   }
  return pool;
}

function createSlideList(start,end){
  var list = [];
  for (i = start; i < (end+1); i++){
     list.push( 'img/ins/sequential_task/Slide ' + i + '.png');}
  return list;
}

function getNextSlide () {  //use to shift instruction slides
  var currentSlide = slideList.shift();
  return currentSlide
}

function loadStimulus(end) { //the start and ending index of the images
  var list = [];
  for(i = 1; i < (end+1); i++){
    list.push( 'stimulus/' + i + '.jpg');}
  return list;
}

function getStim (){
  Face.stim =  Face.stims.shift();
  return Face.stim; //get last stim of the stim list
}

function check_consent (){
  if ($('#consent_checkbox').is(':checked')) {
    return true;
  }else {
    alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
    return false;}
}

function checkID (){
  var lasttrialdata = jsPsych.data.getLastTrialData().select('responses').values[0];
  var textInput = JSON.parse(lasttrialdata).Q0;
  var patt = new RegExp("^[a-zA-Z_0-9]{1,}$"); //the first and last character (this doesn't allow punctuations)
    if (!patt.test(textInput)){      //test if first/last character in response exist
      alert("Please, enter your participant id");
      return true; }
    else{ return false;}
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

function checkPhone (){
  var choice = jsPsych.data.getLastTrialData().select('button_pressed').values[0];
  if(choice == 0){
    alert('As mentioned in the study description, this study can only be done a computer and would not work on a smartphone. Your experiment will be terminated and the window will be closed.');
    window.close();
    return true;
  } else { return false;}
}

  function getWord (){ //get a word for attention check from the word list
    Face.word = Face.wordList.shift();
    return Face.word;
  }

  function binaryFaces(){ //Select face for memory task
    var current_face_identity = Face.personX;
    var current_face_valence = Face.emotionX;
    var low_face = ('img/' + current_face_identity + (current_face_valence + 1) +'.jpg');
    var high_face = ('img/' + current_face_identity + (current_face_valence + 50) +'.jpg');
    var stimulus_iamages = "<div id='myDiv' style='height: 200px; width: 560px'>" + "<div style='float: left;'><img src=" + "'" + low_face + "'" +  "></img>" + "</div>" + "<div style='float: right;'><img src=" + "'" + high_face + "'" + "></img>" + "</div>";
    return stimulus_iamages;
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

  Face.b_identity = getRandomElement(["F","G"]) //find identity of b and w person
  Face.w_identity = getRandomElement(["C","D"])

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

    for (i = 0; i < (Face.array_length - part_array); i++){
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
  

  
    /*
     * You must use this cognitoIdentityPool string value and
     * the "task-data-raw" value for DATA_BUCKET. The DIRECTORY value
     * will change based on the task.
     */

    const cognitoIdentityPool = "us-east-1:0f699842-4091-432f-8b93-a2d4b7bb5f20";
    const DATA_BUCKET = "task-data-raw";
    const DIRECTORY = "amplification-race-binary-mixed-race-arrays";

    /*
     * Save data at any point to S3 using this function.
     * It takes as arguments the string identifier of a participant
     * and the data in CSV form from the jsPsych data getter.
     */

     function saveDataToS3() {


     id = Face.ID
     csv = jsPsych.data.get().csv()

     AWS.config.update({
       region: "us-east-1",
       credentials: new AWS.CognitoIdentityCredentials({
         IdentityPoolId: cognitoIdentityPool
       }),
     });

     const filename = `${DIRECTORY}/${id}.csv`;

     const bucket = new AWS.S3({
       params: { Bucket: DATA_BUCKET },
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
