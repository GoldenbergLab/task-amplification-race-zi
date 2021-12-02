/**
Instructions for Sequential Task
**/

/**
Instructions for Sequential Task
**/

var random_array = getRandomElement(["<img class = 'instructions_img' src = img/ins/binary_mixed_race_arrays/mixed_array_angry.png>","<img class = 'instructions_img' src = img/ins/binary_mixed_race_arrays/mixed_array_happy.png>"])

var instruction_welcome_page = {
  type: 'html-button-response',
  choices: ['Continue'],
  stimulus:  "<p align='left'> Dear participant,</p>"+
   "<p align='left'> You are about to participate in a study that was designed to examine <strong> how people judge if someone else is emotional or not </strong>.</p>"+
   "<p align='left'> You will first go through a short instructions session, then complete a short practice round, and then participate in the actual experiment.</p>"+
   "<p align='left'> Please follow the instructions carefully. </p>",
   on_load: textbox
};

var instruction_general = [];
instruction_general = instruction_general.concat(instruction_welcome_page);

function getRandomElement (list){
  return list[Math.floor(Math.random()*list.length)];
}
var img_face = getRandomElement(["<img src = img/A75.jpg></img>","<img src = img/E75.jpg></img>"])

var  instruction_seq1 = {
  type: "html-button-response",
  choices: ['Continue'],
  stimulus:  "<p align='left'> The goal of this study is to examine <strong> your subjective judgment </strong> of whether you perceive groups as <strong> emotional or NOT emotional </strong> based on a picture.  </p>"+
   "<p align='left'> In each trial, a group of faces expressing some degree of emotion will appear on the screen. The face may either be expressing positive or negative emotions. </p>"+
   random_array+
   "<p align='left'> The face will appear on the screen for a brief moment. In order to process the information portrayed by the face, try to focus your attention on it as much as possible. </p>",
   on_load: textbox
};

var  instruction_seq2 = {
  type: "html-button-response",
  choices: ['Continue'],
  stimulus:  "<p align='left'> After seeing the group, you will be asked to judge whether it was <strong> emotional </strong> or <strong> not emotional.</strong></p>"+
  '<div id="introPics" style="float: center; height: 50px; width: 500px"><button class="jspsych-btn-intro" style="float: left;">emotional</button><button class="jspsych-btn-intro" style="float: right;">NOT emotional</button></div></div>'+
  "<p align='left'> To answer the question you will be required to press either the <strong>emotional </strong>button if you evaluated the group as emotional or the <strong>not emotional</strong> button if you evaluated the person as non-emotional. </p>",
   on_load: textbox
};


var  instruction_seq3 = {
  type: "html-button-response",
  choices: ['Continue'],
  stimulus:
  "<p align='left'> When you make your subjective judgment, <strong> try to imagine that the expressions shown in the pictures are expressions that someone is displaying in a conversation with you. </strong> </p>"+
  "<p align='left'> People judge others' emotionality in different ways and we ask you to use your gut feeling to get your subjective judgment.  </p>",
   on_load: textbox
};

var  instruction_seq4 = {
  type: "html-button-response",
  choices: ['Continue'],
  stimulus:  "<p> Remember, your task is to provide <strong> your judgment </strong> regarding whether you perceive the person as <strong> emotional </strong> or <strong> NOT emotional</strong>.</p>"
};

var  instruction_seq5 = {
  type: "html-button-response",
  choices: ['Continue'],
  stimulus:  "<p> At the next stage, you will conduct a <strong> short practice </strong> run to make sure that the task is clear. </p>"+
  "<p> Remember, your task is to provide <strong> your judgment </strong> of whether you perceive the group as <strong> emotional </strong> or <strong> NOT emotional</strong>.</p>"
};

var  instruction_seq_MainTaskTransition = {
  type: "html-button-response",
  choices: ['Continue'],
  stimulus:  "<p align='left'> Thank you for completing the practice stage. </p>"+
  "<p align='left'> Remember, your task is to give <strong> your judgment </strong> about whether you perceive the group in the picture as <strong> emotional </strong> or <strong> NOT emotional</strong>.</p>"+
  "<p align='left'> In the following section you will complete the actual session, which consists of 50 trials. This part of the study should take 5 minutes, more or less. </p>" +
  "<p align='left'> Click <strong>Continue</strong> to begin the actual task. </p>",
  on_load: textbox
};

var instruction_sequence = [];
instruction_sequence = instruction_sequence.concat(instruction_seq1, instruction_seq2, instruction_seq3, instruction_seq4);


function line () {
  var vertLine = `<div style="border-left:black;border-style:solid;margin-left:${lineSlice}px; height:${vHeight}px;width:0px;position:absolute;" id="vertLine"></div>`;
  var linePrompt = `<div id="linePrompt"><div style="font-size:50px;position:absolute;margin-left:${lineSlice*1.3}px;margin-top:${vHeight/2}px"></div><div style="position:absolute;margin-left:${lineSlice*1.2}px;margin-top:${vHeight/2}px;z-index:5;">Move mouse left of the line to begin</div></div>`;
  //var instrLine = '<div style="position: absolute; top: 100px; right: 10px; width: 1000px; text-align:right;"> Following the face sequence, you will be asked to move the mouse left of the line to begin the rating phase </div>';
  $(".jspsych-content-wrapper").prepend(vertLine);
  $(".jspsych-content-wrapper").prepend(linePrompt);
  //$(".jspsych-content-wrapper").prepend(instrLine);
};

function remover_textbox () {
  $("#vertLine").remove();
  $("#linePrompt").remove();
  var textbox = '<style> p { display: block; margin-top: 1em; margin-bottom: 1em; margin-left: 400px; margin-right: 400px;} </style>';
  $(".jspsych-content").prepend(textbox);
};

function textbox(){
  var textbox = '<style> p { display: block; margin-top: 1em; margin-bottom: 1em; margin-left: 400px; margin-right: 400px;} </style>'
  var imagebox = '<style> #introPics { margin: auto;} </style>'
  var scale = '<style id="jspsych-survey-likert-css">.jspsych-survey-likert-statement { display:block; font-size: 16px; padding-top: 40px; margin-bottom:10px; }.jspsych-survey-likert-opts { list-style:none; width:100%; margin:0; padding:0 0 35px; display:block; font-size: 14px; line-height:1.1em; }.jspsych-survey-likert-opt-label { line-height: 1.1em; color: #444; }.jspsych-survey-likert-opts:before { content: ""; position:relative; top:11px; /*left:9.5%;*/ display:block; background-color:#efefef; height:4px; width:100%; }.jspsych-survey-likert-opts:last-of-type { border-bottom: 0; }.jspsych-survey-likert-opts li { display:inline-block; /*width:19%;*/ text-align:center; vertical-align: top; }.jspsych-survey-likert-opts li input[type=radio] { display:block; position:relative; top:0; left:50%; margin-left:-6px; }</style>'
  $(".jspsych-content").prepend(textbox);
  $(".jspsych-content").prepend(imagebox);
  $(".jspsych-content").prepend(scale);
}




var vHeight = 960;
var lineSlice = 940 / 10;
