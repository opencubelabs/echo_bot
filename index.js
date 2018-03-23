const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const qs = require('querystring')
const fs = require('fs')
const https = require('https')
const http = require('http')

var path = require('path')


const app = express()

const token = "EAADA3nCCWAoBABuulZBHpyiUtfOyi7RyCxwh1u5FJsqXswZCIMJhgZCVLtGJNIbhOXWSIZBqDnpX60maesGSuflyP62gn2LM7PTRZBEO1boKuLE7PTtTz3QxQAWVcHybpgReyJEHNlBo8ANnX98A46UkemELQHWKScmG10X88qQZDZD"

var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID

var url = 'mongodb://heroku_ps6w5wqb:ivufckrq29hjjk1glj50p6aih6@ds031477.mlab.com:31477/heroku_ps6w5wqb'

var theme_thread = {
	"attachment":
		{
			"type":"template",
			"payload":
				{
					"template_type":"generic",
					"elements":[{
							"buttons":[{
							"type":"postback",
							"title":"Play Now!",
							"payload":"PLAY_KOLAVERI"
							}],
							"title":"Why this Kolaveri Kolaveri Kolaveri di?",
							"image_url":"http://antakshari-bot.herokuapp.com/kolaveri.jpg"
						},{
							"buttons":[{
							"type":"postback",
							"title":"Play Now!",
							"payload":"PLAY_WOMENsDay"
							}],
							"title":"A Musical Tribute to the Power and Grace of the Women",
							"image_url":"http://antakshari-bot.herokuapp.com/womens_day.png"
						},{
							"buttons":[{
							"type":"postback",
							"title":"Play Now!",
							"payload":"PLAY_HOLI"
							}],
							"title":"Holi Special",
							"image_url":"http://antakshari-bot.herokuapp.com/holi.jpeg"
						}]
				}
		}
}

/*{
	"buttons":[{
	"type":"postback",
	"title":"Play Now!",
	"payload":"PLAY_SUMMER"
	}],
	"title":"Sunshine!! Summer Special",
	"image_url":"http://antakshari-bot.herokuapp.com/summer.jpg"
},{
	"buttons":[{
	"type":"postback",
	"title":"Play Now!",
	"payload":"PLAY_VSEAS"
	}],
	"title":"Valentines Season Special",
	"image_url":"http://antakshari-bot.herokuapp.com/val.jpg"
}*/

app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	res.send('Antakshari Testing Server')
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


app.get('/test', function (req, res) {
    
    request("https://4a2617a2.ngrok.io/list/SUMMER", function(error, response, body) {

    	var data = JSON.parse(body)

    	res.send(data)

    })
	
})

app.get('/sendMessage/:sender', function (req, res) {

	var sent_msg = 'api_sent'
	var received_msg = 'test message'
	var msg_cat = 'API_SENT'
	var time_stamp = Date.now()

	var msgData = {"attachment":{"type":"audio","payload":{"url": "https://s3.amazonaws.com/antakshari-bot/audioclip-1520000637000-2944.mp4"}}}

	sendMessage(req.params.sender, msgData, 'test', 'test', 'test', Date.now())

	res.send({'status': 'Success', 'fb_id': req.params.sender})
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
	  		//console.log(event.message)
			if (event.message && event.message.quick_reply){
				var text = event.message.quick_reply.payload
				

			}else if(event.message && event.message.attachments){

				var attachment_type = event.message.attachments[0].type

				if( attachment_type === 'audio' ){

					MongoClient.connect(url, function(err, db) {
						var cursor = db.collection('fb_msg_log').find({'fb_id': parseInt(sender)}).sort({$natural:-1}).limit(1).toArray(function(err, response){
							console.log(response)
							if(response.length != 0){



								if(response[0].msg_cat == 'VAL'){

									/*var cursor = db.collection('fb_audio_log').insertOne({
								  		"fb_id": parseInt(sender),
								  		"flag": 0,
								  		"link": data.url,
								  		"cat": response[0].sent_msg,
								  		"ending": "",
								  		"time_stamp": Date.now()
									  })
									var msgData = { "text":"Please tell what your song ends with which will be the cue for the next song. Eg. ra, ha, ta, cha... :-)" }
						
									sendMessage(sender, msgData, response[0].sent_msg, 'attachment', 'ATTACH', Date.now())*/

									var audio_url = event.message.attachments[0].payload.url

									audio_url = audio_url.replace(new RegExp('/', 'g'), '|_|')
									audio_url = audio_url.replace('?', '-_')

									request("https://antakshari-bot-py.herokuapp.com/upload_song/"+audio_url, function(error, res1, body) {

								    	var data = JSON.parse(body)

								    	if(!error){
								    		if(data.status == 'OK'){
								    			var cursor = db.collection('fb_audio_log').insertOne({
											  		"fb_id": parseInt(sender),
											  		"flag": 0,
											  		"link": data.url,
											  		"cat": response[0].sent_msg,
											  		"ending": "",
											  		"time_stamp": Date.now()
												  })
												//var msgData = { "text":"Please tell what your song ends with which will be the cue for the next song. Eg. ra, ha, ta, cha... :-)" }
												var msgData = {text: "Awesome!! So, what does your song end with? Eg. ra, ga, sa, cha, ? Please type below."}
												sendMessage(sender, msgData, response[0].sent_msg, 'attachment', 'ATTACH', Date.now())
								    		}
								    	}else{
								    		console.log('Error sending messages: ', error)
											sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"}, 'help', 'help', 'HELP', Date.now())

								    	}

								    })
									
								}else{
									var msgData = { "text":"I think you sang it correct but the wrong place :-P Join a thread to start sining :-) Try these commands : Play, Help or Score" }
						
									sendMessage(sender, msgData, 'attachment', 'attachment', 'ATTACH1', Date.now())

								}
								
							}else{
								var msgData = { "text":"I think you sang it correct but the wrong place :-P Join a thread to start sining :-) Try these commands : Play, Help or Score" }
					
								sendMessage(sender, msgData, 'attachment', 'attachment', 'ATTACH1', Date.now())

							}
						})	

					})				  		
					
				}


			}else if (event.message && event.message.text && event.message.nlp) {
				var text = event.message.text

				var entity = event.message.nlp.entities

				MongoClient.connect(url, function(err, db) {
					var cursor = db.collection('fb_msg_log').find({'fb_id': parseInt(sender)}).sort({$natural:-1}).limit(1).toArray(function(err, response){
						console.log('MSH LOG : ' + response)
						if(response.length != 0 && response[0].msg_cat == 'ATTACH'){
							var cursor = db.collection('fb_audio_log').update({'fb_id': parseInt(sender), 'cat': response[0].sent_msg, 'flag': 0}, {'$set':{'ending': text}}, function(err1, response1){
								//var msgData1 = {text: 'Your score will be updated in a while :-)'}
								var msgData1 = {text: "Thank you! Lets see if the next singer is OK with your song and gives you a point :-). Check out other antakshari threads till then."}
								var msgData2 = theme_thread

								sendMessage(sender, msgData1, msgData1.text, 'ending phrase', 'EPH', Date.now())
								sendMessage(sender, msgData2, 'all threads', 'all threads', 'THREAD', Date.now())

							})
						}else{
							if(entity.greetings && entity.greetings[0].confidence > 0.7)	{			

								/*var msgData = { 
												"text":"Hey " + res[0].first_name + "! Welcome to Antakshari Bot. Antakshari ANYTIME, ANYWHERE with ANYONE. Have fun playing India's favorite musical game Antakshari, now online, on your Messenger. Get into one of the antakshari threads below, join to the string of songs sung by others, your song starting the with the last sound of the last song." 
											  }*/

								var msgData = { text: "Hey " + res[0].first_name + "!! Welcome to Antakshari Bot. Play Antakshari with others ANYTIME, ANYWHERE with ANYONE on your FACEBOOK MESSENGER. Have fun!!"}

								

								//var msgData1 = { text: "Click on one of the Antakshari threads below.\n1. Validate if the previous sung song started correctly\n2. Sing your song pressing on the microphone logi\n3. Leave back the cue of what your song ends with\n4. Let the other user sing the next song" }

								var msgData1 = {text: "Click on one of the antakshari thread below and Play India's favorite game. The way you have always played it. Sing from where the previous song ended and say what your song ended with. Enjoy!! Sing a BIT. Enjoy a LOT. :-)"}
								

								var msgData2 = theme_thread

			
								
								var sent_msg = text
								var received_msg = 'greeting'
								var msg_cat = 'GREET'
								var time_stamp = Date.now()

								sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, Date.now())
								sendMessage(sender, msgData1, sent_msg, received_msg, msg_cat, Date.now())
								sendMessage(sender, msgData2, sent_msg, received_msg, msg_cat, Date.now())
								
							}else if(entity.thanks && entity.thanks[0].confidence > 0.7)	{
								var msgData = { text: 'You are welcome :-)'}
								var sent_msg = text
								var received_msg = msgData.text
								var msg_cat = 'THANKS'
								var time_stamp = Date.now()

								sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
							}else if(entity.bye && entity.bye[0].confidence > 0.7)	{
								var msgData = { text: 'See you soon ' + res[0].first_name + ' :-)'}
								var sent_msg = text
								var received_msg = msgData.text
								var msg_cat = 'BYE'
								var time_stamp = Date.now()

								sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
							}else if(text.toLowerCase() == 'list'){


								/*var msgData = {"attachment": {"type": "template", "payload": {"template_type": "generic", "elements": [{"buttons": [{"type": "postback", "payload": "SONG_ID", "title": "Listen Now!"}], "image_url": "https://scontent.xx.fbcdn.net/v/t31.0-1/28070352_1688778117849343_5584548745458151763_o.jpg?oh=f69ff544c1a750e71f9f3839665709a3&oe=5B4DAAF6", "subtitle": "Ending with Na | SUMMER", "title": "Apurva"}, {"buttons": [{"type": "postback", "payload": "SONG_ID", "title": "Listen Now!"}], "image_url": "https://scontent.xx.fbcdn.net/v/t1.0-1/12801246_10153653829698300_1716466994778309987_n.jpg?oh=e1235aa6e78ea61ff84740022d00ba7b&oe=5B0DAE85", "subtitle": "Ending with na | SUMMER", "title": "Abhinandan"}, {"buttons": [{"type": "postback", "payload": "SONG_ID", "title": "Listen Now!"}], "image_url": "https://scontent.xx.fbcdn.net/v/t1.0-1/260523_223650127662728_5152001_n.jpg?oh=787c6c32642ce3abbfcf691fb72ba83d&oe=5B084BCF", "subtitle": "Ending with Aa | SUMMER", "title": "Suraj"}, {"buttons": [{"type": "postback", "payload": "SONG_ID", "title": "Listen Now!"}], "image_url": "https://scontent.xx.fbcdn.net/v/t1.0-1/12036611_1132595793437216_241045638830209824_n.jpg?oh=992668e8b5ef152d114ba7923593d90d&oe=5B074D69", "subtitle": "Ending with Va | SUMMER", "title": "Namratha"}, {"buttons": [{"type": "postback", "payload": "SONG_ID", "title": "Listen Now!"}], "image_url": "https://scontent.xx.fbcdn.net/v/t31.0-1/14311327_10153707092531260_1107716770927849084_o.jpg?oh=15cbfdf24dc3cf342dc7a609c4d4a9d9&oe=5B18E0B2", "subtitle": "Ending with  | SUMMER", "title": "Lakshmi"}]}}}

								sendMessage(sender, msgData, 'list test', 'list test', 'TEST', Date.now())*/

								/*request("https://antakshari-bot-py.herokuapp.com/list/SUMMER", function(error, response, body) {

							    	var data = JSON.parse(body)

							    	sendMessage(sender, data, 'list test', 'list test', 'TEST', Date.now())

							    })*/


							}else if(text.toLowerCase() == 'help' || text.toLowerCase() == 'play' || text.toLowerCase() == 'play now'){
								/*var msgData = { 
												"text":"Hey " + res[0].first_name + "! Welcome to Antakshari Bot. Antakshari ANYTIME, ANYWHERE with ANYONE. Have fun playing India's favorite musical game Antakshari, now online, on your Messenger. Get into one of the antakshari threads below, join to the string of songs sung by others, your song starting the with the last sound of the last song." 
											  }*/

								var msgData = { text: "Hey " + res[0].first_name + "!! Welcome to Antakshari Bot. Play Antakshari with others ANYTIME, ANYWHERE with ANYONE on your FACEBOOK MESSENGER. Have fun!!"}


								var msgData1 = theme_thread

								var sent_msg = text
								var received_msg = 'greeting'
								var msg_cat = 'GREET'
								var time_stamp = Date.now()

								sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, Date.now())
								sendMessage(sender, msgData1, sent_msg, received_msg, msg_cat, Date.now())
							}else if(text.toLowerCase() == 'my score' || text.toLowerCase() == 'score'){
								MongoClient.connect(url, function(err, db) {
								  	var cursor = db.collection('fb_user_profile').find({'fb_id': parseInt(sender)}).toArray(function(err, response){
								  		if(response.length != 0){
								  			var msgData1 = {text: 'Your score is ' + response[0]['score'] + ' :-)'}
								  			sendMessage(sender, msgData1, msgData1.text, 'score', 'score', Date.now())
								  		}else{
								  			var msgData1 = {text: 'Having trouble :-('}
								  			sendMessage(sender, msgData1, msgData1.text, 'score', 'score', Date.now())
								  		}
								  	})
								})
							}else if(text.toLowerCase() == 'commands'){
								var msgData = { "text": "My knowledge of understanding humans is limited :-P Try out any of these commands to continue : play, help or score" }
				
								var sent_msg = text
								var received_msg = text
								var msg_cat = 'ECHO'
								var time_stamp = Date.now()

								sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, Date.now())
								
							}else{
								var msgData = { "text": "My knowledge of understanding humans is limited :-P Try out any of these commands to continue : play, help or score" }
				
								var sent_msg = text
								var received_msg = text
								var msg_cat = 'ECHO'
								var time_stamp = Date.now()

								sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, Date.now())
								
							}
							
						}
					})	
				
				})

				

			}else if (event.postback) {
				var payload = event.postback.payload

				console.log('Postback : ' + JSON.stringify(event.postback.payload))

				if(payload){

				if(payload === 'HELP'){
					
				}else if(payload.startsWith('SONG')){

					var song_iter = payload.split('_')[1]
					var doc_id = payload.split('_')[2]

					request("https://antakshari-bot-py.herokuapp.com/song_valid/" + song_iter + '/' + doc_id, function(error, response, body) {

				    	var data_res = JSON.parse(body)

				    	if(data_res.status){
														
							sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"}, 'help', 'help', 'HELP', Date.now())

				    	}else{

					    	for(var i=0; i<data_res.data.length; i++){
					    		var sent_msg = 'validation req'
								var received_msg = 'validation info'
								var msg_cat = 'VALIDATION'
								var time_stamp = Date.now()

								sendMessage(sender, data_res.data[i], sent_msg, received_msg, msg_cat, Date.now())
					    	}
				    	}				    	

				    })


				}else if(payload.startsWith('PLAY')){

					MongoClient.connect(url, function(err, db){

						var cursor = db.collection('fb_audio_log').find({'cat': payload.split('_')[1]}).count(function(err, response){

							if(response == 0){
								var cursor = db.collection('fb_audio_log').insertOne({
								  		"fb_id": parseInt(sender),
								  		"flag": 1,
								  		"link": '',
								  		"cat": payload.split('_')[1],
								  		"ending": "Anything, as it's the first song in thread",
								  		"time_stamp": Date.now()
									  })
								var msgData = {text: "You are first one to sing in this thread. Sing a song now by long pressing the mic option :-)"}
					  			sendMessage(sender, msgData, payload.split('_')[1], 'sing','VAL', Date.now())
							}else{
								var cursor = db.collection('fb_audio_log').find({'fb_id': parseInt(sender), 'cat': payload.split('_')[1]}).sort({$natural:-1}).limit(1).toArray(function(err, response){
									console.log('LOG ||||||||||||||||||||||||||||||||||||||||||||||||')
									console.log(response)
									if(response.length != 0 && response[0].flag == 0){
							  			//var msgData1 = {text: 'Your last song is not validated yet. Try out other themes :-)'}
							  			var msgData1 = {text: "Oops! You sung the last song in the thread too. Lets wait and see if someone else can challenge you with another brilliant song. :-)"}
							  			sendMessage(sender, msgData1, msgData1.text, 'sing', 'sing', Date.now())
							  		}else{
							  			var cursor = db.collection('fb_audio_log').find({'cat': payload.split('_')[1]}).sort({$natural:-1}).limit(2).toArray(function(err1, response1){
							  				if(response1[0].fb_id == parseInt(sender) && response1[0].flag == 1){
							  					//var msgData1 = {text: 'Last song in this thread is yours. Try out other themes :-)'}
							  					var msgData1 = {text: "Oops! You sung the last song in the thread too. Lets wait and see if someone else can challenge you with another brilliant song. :-)"}

							  					sendMessage(sender, msgData1, msgData1.text, 'sing', 'sing', Date.now())
							  				}else if(response1[0].flag == 1 && (Math.abs(Date.now() - response1[0].time_stamp) < 45)){
							  					var msgData1 = {text: 'Someone is active in this thread now. Try after few seconds :-)'}
									  			sendMessage(sender, msgData1, msgData1.text, 'sing', 'sing', Date.now())
							  				}else{
							  			
							  					request("https://antakshari-bot-py.herokuapp.com/list/" + payload.split('_')[1], function(error, response, body) {

											    	var data = JSON.parse(body)

											    	if(data.status){
														
														sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"}, 'help', 'help', 'HELP', Date.now())

											    	}else{
											    		sendMessage(sender, data, 'list test', 'list test', 'TEST', Date.now())
											    	}


											    })

							  					
							  				}
							  			})
							  		}

								})		
							}

						})

					})

				}else if(payload.startsWith('YES')){
					var prev_fb_id = payload.split('_')[1]
					
					MongoClient.connect(url, function(err, db) {
					  	var cursor = db.collection('fb_user_profile').find({'fb_id': parseInt(prev_fb_id)}).toArray(function(err, response){
					  		if(response.length != 0){
					  			var cursor = db.collection('fb_user_profile').update({'fb_id': parseInt(prev_fb_id)},{'$set':{'score': response[0]['score']+1}}, function(err1, response1){
					  				//res.send({'data': 'Score is updated'})
					  				var cursor = db.collection('fb_audio_log').update({'_id': ObjectId(payload.split('_')[2])},{'$set':{'flag': 1}}, function(err1, response1){

					  					var cursor = db.collection('fb_audio_log').find({'_id': ObjectId(payload.split('_')[2])}).toArray(function(err2, response2){
					  						
					  						//var msgData1 = {text: "Thanks for validating :-) Sing the next song starting with " + response2[0].ending}
					  						var msgData1 = {text: "Super!! Now its your turn to rock. Sing the next song starting with " + response2[0].ending + ". Do use the microphone logo below and sing your heart out :-)"}
					  						sendMessage(sender, msgData1, response2[0].cat, 'sing','VAL', Date.now())

					  						sendMessage(prev_fb_id, {text: 'Your updated score is ' + (response[0]['score']+1)}, 'score', 'score', 'SCORE', Date.now())
					  					})
					  				})

					  				
					  			})
					  		}else{
					  			//res.send({'data': 'You can sing now'})
					  		}
					  	})
					})
				}else if(payload.startsWith('NO')){
					var prev_fb_id = payload.split('_')[1]
					//var cat = payload.split('_')[0]
					//console.log('Score - 1')
					MongoClient.connect(url, function(err, db) {
					  	var cursor = db.collection('fb_user_profile').find({'fb_id': parseInt(prev_fb_id)}).toArray(function(err, response){
					  		if(response.length != 0){
					  			var cursor = db.collection('fb_user_profile').update({'fb_id': parseInt(prev_fb_id)},{'$set':{'score': response[0]['score']-1}}, function(err1, response1){
					  				//res.send({'data': 'Score is updated'})
					  				var cursor = db.collection('fb_audio_log').update({'_id': ObjectId(payload.split('_')[2])},{'$set':{'flag': 1}}, function(err1, response1){
					  				
					  					var cursor = db.collection('fb_audio_log').find({'_id': ObjectId(payload.split('_')[2])}).toArray(function(err2, response2){
					  				
					  						//var msgData1 = {text: "Thanks for validating :-) Sing the next song starting with " + response2[0].ending}
					  						var msgData1 = {text: "Super!! Now its your turn to rock. Sing the next song starting with " + response2[0].ending + ". Do use the microphone logo below and sing your heart out :-)"}
					  						
					  						sendMessage(sender, msgData1, response2[0].cat, 'sing','VAL', Date.now())

					  						sendMessage(prev_fb_id, {text: 'Your updated score is ' + (response[0]['score']-1)}, 'score', 'score', 'SCORE', Date.now())
					  						
					  					})
					  				
					  				})
					  			})
					  		}else{
					  			//res.send({'data': 'You can sing now'})
					  		}
					  	})
					})
				}else if(payload == 'GET_STARTED'){
					var msgData = {}
					if(event.postback.referral){
						if(event.postback.referral.ref == "feedback"){
							
						}else{
							
						}
						

					}else{
						msgData1 = {text: "Hey " + res[0].first_name + " I'll help you book tickets for activities and events around you. Select 'Help' from the menu below anytime you get stuck :-)"}
						msgData2 = {
						    "text":"Help me locate you",
						    "quick_replies":[
						      {
						        "content_type":"location",
						      }
						    ]
						  }

						sendMessage(sender, msgData1, 'get_started', 'greeting', 'GREET', Date.now())
						sendMessage(sender, msgData2, 'get_started', 'greeting', 'GREET', Date.now())
					}
					
					
				}

			}

			}
		})
	})
}

function sendPostbackMessage(sender, msgData, m_cat, text){
	var mData = msgData
	var sent_msg = text.toLowerCase()
	var received_msg = msgData.text
	var msg_cat = m_cat
	var time_stamp = Date.now()
	sendMessage(sender, mData, sent_msg, received_msg, msg_cat, time_stamp)
}

function sendTextMessage(sender, text) {
	var messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}/*else{
			insertLog(sender, text, text, '', Date.now())
		}*/
	})
}


function sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp){

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
			sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"}, 'help', 'help', 'HELP', Date.now())

		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
			sendMessage(sender, {text: "Uhh.. I think I am stuck :-( Let's start again. Try these commands : Play, Help or Score"}, 'help', 'help', 'HELP', Date.now())

		}else{
			insertLog(sender, sent_msg, received_msg, msg_cat, time_stamp)
		}
	})
}

function insertLog(sender, sent_msg, received_msg, msg_cat, time_stamp){
	MongoClient.connect(url, function(err, db) {
		var cursor = db.collection('fb_msg_log').insertOne({
			"fb_id": parseInt(sender),
			"sent_msg": sent_msg,
			"received_msg": received_msg,
			"msg_cat": msg_cat,
			"timestamp": time_stamp
		}, function(err){
			if(err){
				console.log('Error logging message')
			}
		})
	})
}

app.listen(process.env.PORT || 5000, function () {
  console.log('Antakshari messenger app listening on port 5000!')
})