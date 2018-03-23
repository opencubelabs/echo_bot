const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const qs = require('querystring')
const fs = require('fs')
const https = require('https')
const http = require('http')

var path = require('path')


const app = express()

const token = "EAAZAsDDvVMi8BAEVEXpXnjLYF2Y4F1q1MiPKqRWZAab2bPo9qIahf5zDhdnG30zIM0Bwp49wKZCByB1edr4awBbAMYbk46TZAID0KeZA8mKIaIbD3rVizAUbi46PVuXuVLwLtaJFEDQGo4GCWlZAfSODxiAVKpR3VAEsp3cgiHkZBZAfvV8h8sjU"

var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID

var url = 'mongodb://heroku_ps6w5wqb:ivufckrq29hjjk1glj50p6aih6@ds031477.mlab.com:31477/heroku_ps6w5wqb'

app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	res.send('OCL Testing Server')
})

app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
	var messaging_events = req.body.entry[0].messaging

	if(messaging_events){
		for (var i = 0; i < messaging_events.length; i++) {
			var event = req.body.entry[0].messaging[i]
			console.log(JSON.stringify(event))
			var sender = event.sender.id
			console.log('Sender : '+sender+' |||||||||||||||||||||||||||||||||||||||||||||||||')
			authUser(sender, event)
		}
	}else{
		for (var i = 0; i < req.body.entry[0].standby.length; i++) {
			var event = req.body.entry[0].standby[i]
			console.log(JSON.stringify(event))
			var sender = event.sender.id
			console.log('Sender : '+sender+' |||||||||||||||||||||||||||||||||||||||||||||||||')
			authUser(sender, event)
		}
	}
	
	
	res.send('OK')
})

function authUser(sender, event){
	
    MongoClient.connect(url, function(err, db) {

	  	var cursor = db.collection('fb_user_profile').find({ "fb_id": parseInt(sender) }).toArray(function(err, res){

	   	if(res.length != 0){
            eventHandle(sender, event)
         }else{
            request("https://graph.facebook.com/v2.6/"+sender+"?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token="+token, function(error, response, body) {

               var data = JSON.parse(body)

               if(data.error){
                  sendTextMessage(sender, 'Error authenticating', 'error')
               }else{
                  var cursor = db.collection('fb_user_profile').insertOne({
                     "first_name": data.first_name,
                     "last_name": data.last_name,
                     "profile_pic": data.profile_pic,
                     "locale": data.locale,
                     "timezone": data.timezone,
                     "gender": data.gender,
                     "email": "",
                     "mobile": "",
                     "last_loc": {"lat": "", "long": ""},
                     "acc_status": "",
                     "fb_id": parseInt(sender),
                     "time_stamp": Date.now(),
                     "score": 0
                  }, function(err){
                     if(err){
                       sendTextMessage(sender, 'Error authenticating', 'error')
                    }else{
                       eventHandle(sender, event)
                    }
                  })
               }
            })
         }
	   })
	})
                    
}

function eventHandle(sender, event){

	MongoClient.connect(url, function(err, db) {
	  	var cursor = db.collection('fb_user_profile').find({ "fb_id": parseInt(sender) }).toArray(function(err, res){
	
			if (event.message && event.message.quick_reply){
						
				var text = event.message.quick_reply.payload
						

			}else if(event.message && event.message.attachments){

				var attachment_type = event.message.attachments[0].type

				if( attachment_type === '' ){

					
				}

			}else if (event.message && event.message.text && event.message.nlp) {
				var text = event.message.text

				var entity = event.message.nlp.entities
					
				
				
					if(entity.greetings && entity.greetings[0].confidence > 0.7)	{			

						var msgData = { text: 'Hey '+res[0].first_name+'!! :-D'}

						sendMessage(sender, msgData, Date.now())
						
					}else if(entity.thanks && entity.thanks[0].confidence > 0.7)	{
						var msgData = { text: 'You are welcome '+res[0].first_name+' :-)'}
						
						sendMessage(sender, msgData, Date.now())
					}else if(entity.bye && entity.bye[0].confidence > 0.7)	{
						var msgData = { text: 'See you soon '+res[0].first_name+':-)'}
						
						sendMessage(sender, msgData, Date.now())
					}else{
						var msgData = { "text": text }

						sendMessage(sender, msgData, Date.now())
						
					}
									

			}else if (event.postback) {
				var payload = event.postback.payload

				console.log('Postback : ' + JSON.stringify(event.postback.payload))

				if(payload){

					if(payload === 'HELP'){
						
					}else if(payload == 'GET_STARTED'){
						var msgData = {}
						if(event.postback.referral){
							if(event.postback.referral.ref == "feedback"){
								
							}else{
								
							}
							

						}else{
							
							//msgData = {}
							//sendMessage(sender, msgData1, 'get_started', 'greeting', 'GREET', Date.now())
						}
						
						
					}

				}

			}
		})
	})

}

function sendMessage(sender, msgData, time_stamp){

	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: msgData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
			sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"})

		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
			sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"})

		}else{
			insertLog(sender, msgData, time_stamp)
		}
	})
}

function insertLog(sender, msgData, time_stamp){
	MongoClient.connect(url, function(err, db) {
		var cursor = db.collection('fb_msg_log').insertOne({
			"fb_id": parseInt(sender),
			"msgData": msgData,
			"timestamp": time_stamp
		}, function(err){
			if(err){
				console.log('Error logging message')
			}
		})
	})
}

app.listen(process.env.PORT || 5000, function () {
  console.log('OCL test messenger app listening on port 5000!')
})