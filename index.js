const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const PORT = process.env.PORT || 8000;
const nodemailer = require('nodemailer');
var admin = require('firebase-admin');
const serviceAccountPath = "./synday-f21da-firebase-adminsdk-3h8rx-470f02303e.json"
var serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://synday-f21da.firebaseio.com"
});

var db = admin.database();

//adding ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//Body parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('views'));

//homepage
app.get('/', (req, res) =>{
    res.render('views',{link : "",bgimg:"/fujibg.jpg",textimg:"/cherrybg2.jfif"});
});

//dynamic redirect
app.get('/:urlCode', (req, res) =>{
    var urlCodePassed = String(req.params.urlCode);
    var result = getLongURL(urlCodePassed,function(result) {
      res.redirect(result);
    });
});

//generating short url
app.post('/generate', (req, res) =>{
    var long_url = req.body.longurl;
    var email = req.body.email;
    if(long_url == ""){
      res.redirect("/");
    }
    if(!long_url.startsWith("http://") && !long_url.startsWith('https://')){
        long_url = "https://" + String(long_url);
    };
    var random_string = generateShortURL();
    setShortURL(random_string,long_url);
    
    res.render("views2",{link : "https://urlgod.herokuapp.com/"+random_string,bgimg:"/fujibg.jpg",textimg:"/cherrybg2.jfif"});
});

//serving
app.listen(PORT, () => {
    console.log('Server Started on port 8000');
});


function checkIfRandomShortURLExists(random_str){
  var ref = db.ref("shortURL");
  ref.once("value", function(snapshot) {
    var keys = new Object;
    var k = Object.keys(snapshot.val());
    for(var i = 0; i < k.length; i++){
      if(k[i] == random_str){
        return 1;
      }
    }
  });
  return 0;
}

function generateShortURL(){
  var random_str = "";
  while(1){
      random_str = generateRandomStr();
      var exists = checkIfRandomShortURLExists(random_str);
      if (exists == 0){
          break;
      }
  }
  return random_str;
}

function generateRandomStr(){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 4; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function setShortURL(random_str, longURL){
  var ref = db.ref("shortURL");
  var random_string = random_str;
  var longURL_string = longURL;
  var data = {};
  data[random_str] = longURL;
  ref.update(data)
}

function getLongURL(random_str, callback){
  if(random_str == "favicon.ico"){
    return "/";
  }
  var ref1 = db.ref('shortURL/' + random_str);
  ref1.once("value", function(snapshot) {
    var scores = snapshot.val();
    console.log(scores, typeof scores);
    callback(String(scores));
  });
}
