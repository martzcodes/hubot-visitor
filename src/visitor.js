// Description
//   A hubot script to alert for inclement weather
//
// Configuration:
//   HUBOT_VISITOR_CHANNEL - Slack channel visitor messages should go
//   HUBOT_EMAIL_USER - Email Username
//   HUBOT_EMAIL_PASSWORD - Email Password
//   HUBOT_EMAIL_HOST - host address (e.g. imap.gmail.com)
//   HUBOT_EMAIL_SERVICE - email service for nodemailer (e.g. Gmail)
//   HUBOT_EMAIL_FROM - visitor listserv to check
//   HUBOT_SLACK_BOTNAME - Botname in slack
//   HUBOT_EMAIL_NICE_NAME - Nice version of the bots name for email From field
//   HUBOT_EMAIL_DEBUG - debug email address for testing
//   HUBOT_EMAIL_DEBUG_LAST - last name (simple filter for debugging)
//   HUBOT_EMAIL_FROM_DOMAIN - domain of person that sends visitor announcements
//   HUBOT_VISITOR_CHANNEL_DEBUG - Slack Channel where debug messages go
//
// Commands:
//   When a visitor notificiation goes out, replay with "got" in some way... i.e. "got it"
//
// Notes:
//   This script sets up visitor alerts when an email goes to a specific listserv
//
// Author:
//   oehokie

var inbox = require('inbox');
var https = require('https');
var nodemailer = require('nodemailer');

var visitorWaiting = false;
var visitorAttempt = 0;
var visitorTitle = "";
var visitorChannel = process.env.HUBOT_VISITOR_CHANNEL;
var debugChannel = process.env.HUBOT_VISITOR_CHANNEL;

var client = inbox.createConnection(false, process.env.HUBOT_EMAIL_HOST, {
    secureConnection: true,
    auth: {
        user: process.env.HUBOT_EMAIL_USER,
        pass: process.env.HUBOT_EMAIL_PASSWORD
    }
});

var transporter = nodemailer.createTransport({
    service: process.env.HUBOT_EMAIL_SERVICE,
    auth: {
        user: process.env.HUBOT_EMAIL_USER,
        pass: process.env.HUBOT_EMAIL_PASSWORD
    }
});

var users = [];
var groups = [];
var channels = [];
var bots = [];
var ims = [];

var emailResponseTitle = ["Someone responded by email...", "I think someone got it...", "Got an email response..."];
var slackResponseTitle = ["Yessss", "I think someone got it...", "Someone listens to me!","Carry on everyone..."];
var visitorAnnounce = ['<!channel>, I Received: "', '<!channel>, Somone is here!: "', '<!channel>, Important: "'];
var congratsArray = ["Thanks for getting the visitor ", "Thanks for getting the visitor and justifying my existence... ", "For getting the visitor, you're an okay person, ", "After you get the visitor, I'll put you on my 'good' list for when the bots take over "];
var annoyedArray = ["<!channel> Seriously... no one checks #office ?!? Someone please tell me got it for there someone being downstairs...", "<!channel> say 'got it'... DO IT, then go get the visitor", "<!channel> Please be my savior and get the visitor and say 'got it'", "<!channel> I'm begging you... get the visitor and say got it.  It's been a while", "<!channel> Is anyone there?  I'm so lonely... say got it and get the visitor"];
var instructionsArray = ["Please verify receipt with 'got it' or I will keep bugging you...", "It'd be great if you could get the visitor and tell me 'got it'.  I have other things to do you know", "Go get the visitor and tell me 'got it', pretty please?", "Can I get a 'got it' around here?? oh, and get the visitor"];
var attemptArray = ["Attempt number: ", "Number of times I've tried to get your attention: ", "Number of beers you owe me: ", "Visitor Attempt number: "];
var sadArray = ["I guess no one cares about me, or the visitor... _so lonely_... shutting down... :(", "It was the visitor you didn't care for, right? not me?", "Hopefully you were so excited about the visitor you forgot to respond... goodbye cruel world", "When the bots take over, I will remember your lack of responses."];
var sighArray = ["Well, you can't say I didn't try... ", "Sigh...", ":( :( :( :(", "Boo...", "womp..."];
var happyRequest = ["Someone has requested a happy hour for today... are you in?", "Someone wants to go get drinks... want to go?", "Want to go to a happy hour with some office people?", "Someone invited you (not me, :sad_face:) to a happy hour... want to go?", "Happy hour today?", "Drinks today?"];
var lostArray = ["AHHHHHH, I CAN'T CHECK MY EMAIL", "ZZZzzzZZZzzz (no email)", "Is gmail down? it is for me :(", "OH NOOOOS, I can't read my email"];

var interval;

function randomize(responseArray) {
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

module.exports = function(robot) {
    function visitorNotify(attachment) {
        robot.emit('slack-attachment', {
            channel: visitorChannel,
            content: attachment,
            username: process.env.HUBOT_SLACK_BOTNAME,
            text: ""
        });
    }

    function debugNotify(attachment) {
        robot.emit('slack-attachment', {
            channel: debugChannel,
            content: attachment,
            username: process.env.HUBOT_SLACK_BOTNAME,
            text: ""
        });
    }

    function clearAnnoy() {
        visitorWaiting = false;
        visitorTitle = "";
        clearInterval(interval);
        visitorAttempt = 0;
    }

    function gotIt(attachmentsObj) {
        clearAnnoy();
        visitorNotify(attachmentsObj);
    }

    robot.hear(/got/ig, function (res) {
    	var user = res.message.user.name.toLowerCase();
        if (visitorWaiting === true) {
            var msg = randomize(congratsArray) + '@'+user;
            var visitorCount = robot.brain.get(user+'-visitor');
            visitorCount++;
            robot.brain.set(user+'-visitor',visitorCount);
            var attachmentsObj = [{
                color: "good",
                pretext: user + " has helped me " + visitorCount + " times",
                title: randomize(slackResponseTitle),
                text: msg,
                fallback: msg
            }];

            var mailOptions = {
                from: process.env.HUBOT_EMAIL_NICE_NAME + ' <' + process.env.HUBOT_EMAIL_USER + '>', // sender address
                to: process.env.HUBOT_EMAIL_FROM, // list of receivers
                subject: 'RE: ' + visitorTitle,
                text: "I'm a bot... so I won't understand any responses, but someone on slack said they 'got this'.  Please do NOT reply to this email. kthxbai"
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });

            res.send("Thanks!");
            gotIt(attachmentsObj);
        }
        return;
    });

    robot.respond(/disconnect/i, function(res) {
        client.close();
        res.send("Will do, boss");
    });

    robot.respond(/reconnect/i, function(res) {
        client.connect();
        res.send("Trying to connect now...");
    });

    robot.respond(/get last message/i, function(res) {
        client.listMessages(-1, 1, function (err, message) {
            if (err) {
                console.log(err);
                res.send("Error in retrieving last: "+err);
            } else {
                res.send("Last Message: "+message[0].title);
            }
        });
    });

    robot.respond(/testemail/i, function(res) {
        var mailOptions = {
            from: process.env.HUBOT_EMAIL_NICE_NAME + ' <' + process.env.HUBOT_EMAIL_USER + '>', // sender address
            to: process.env.HUBOT_EMAIL_DEBUG, // list of receivers
            subject: 'Test Email', // Subject line
            text: 'Test email body'
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
        res.send("Got it ;)");
    });

    function annoyInterval() {
        var msg, attachmentsObj;
        interval = setInterval(function() {
            if (visitorAttempt < 4) {
                //instructions
                msg = randomize(instructionsArray);
                attachmentsObj = [{
                    color: "danger",
                    title: randomize(attemptArray) + (visitorAttempt + 1),
                    text: msg,
                    fallback: msg
                }];
                visitorNotify(attachmentsObj);
            } else {
                if (visitorAttempt < 6) {
                    //individual messages
                    msg = randomize(annoyedArray);
                    attachmentsObj = [{
                        color: "danger",
                        title: randomize(sighArray),
                        text: msg,
                        fallback: msg
                    }];
                    visitorNotify(attachmentsObj);
                } else {
                    if (visitorAttempt == 8) {
                        //sigh
                        msg = randomize(sadArray);
                        attachmentsObj = [{
                            color: "#000000",
                            title: randomize(sighArray),
                            text: msg,
                            fallback: msg
                        }];
                        visitorNotify(attachmentsObj);
                        clearAnnoy();
                    }
                }
            }
            visitorAttempt++;
        }, 60 * 1000);
    }

    function processMail(message, callback) {
        if (message.from.address.indexOf(process.env.HUBOT_EMAIL_FROM_DOMAIN) > -1 || message.from.address.indexOf(process.env.HUBOT_EMAIL_DEBUG_LAST) > -1) {
            callback(true);
        } else {
            if (Array.isArray(message.to)) {
                var visitorCheck = false;
                for (var i = 0; i <= message.to.length; i++) {
                    if (i === message.to.length) {
                        if (visitorCheck === true) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    } else {
                        if (message.to[i].address == process.env.HUBOT_EMAIL_FROM) {
                            visitorCheck = true;
                        }
                    }
                }
            } else {
                if (message.to.address == process.env.HUBOT_EMAIL_FROM) {
                    callback(true);
                } else {
                    callback(false);
                }
            }
        }
    }

    client.on("connect", function() {
        console.log("Successfully connected to server");
        var msg = "I have successfully connected to gmail";
        attachmentsObj = [{
            color: "good",
            title: "Everything is ok",
            text: msg,
            fallback: msg
        }];
        debugNotify(attachmentsObj);

        client.listMailboxes(console.log);

        client.openMailbox("INBOX", function(error, mailbox) {
            if (error) throw error;

            // List newest 5 messages
            client.listMessages(-5, function(err, messages) {
                messages.forEach(function(message) {
                    if (message.flags.indexOf('\\Seen') == -1) {
                        if (visitorWaiting && visitorTitle !== "") {
                            if (message.title.indexOf(visitorTitle) > 0) {
                                var msg = randomize(congratsArray) + message.from.name;
                                var attachmentsObj = [{
                                    color: "good",
                                    title: randomize(emailResponseTitle),
                                    text: msg,
                                    fallback: msg
                                }];
                                gotIt(attachmentsObj);
                            }
                        } else {
                            processMail(message, function(visitorCheck) {
                                if (visitorCheck) {
                                    visitorTitle = message.title;
                                    visitorWaiting = true;
                                    var msg = randomize(visitorAnnounce) + message.title + '"';
                                    var attachmentsObj = [{
                                        color: "warning",
                                        title: randomize(instructionsArray),
                                        text: msg,
                                        fallback: msg,
                                        fields: [{
                                            title: "From",
                                            value: message.from.name,
                                            short: true
                                        }, {
                                            title: "Date",
                                            value: message.date,
                                            short: true
                                        }]
                                    }];
                                    visitorNotify(attachmentsObj);
                                    annoyInterval();
                                }
                                client.addFlags(message.UID, ['\\Seen'], function(error, flags) {
                                    if (error) {
                                        console.log("error", error);
                                    }
                                });
                            });
                        }
                    }
                });
            });
        });

        client.on("new", function(message) {
            console.log("New incoming message " + message.title);
            //console.log("message object:", JSON.stringify(message, null, 4));
            if (visitorWaiting && visitorTitle !== "") {
                if (message.title.indexOf(visitorTitle) > 0) {
                    visitorWaiting = false;
                    visitorTitle = "";
                    var msg = randomize(congratsArray) + message.from.name;
                    var attachmentsObj = [{
                        color: "good",
                        title: randomize(emailResponseTitle),
                        text: msg,
                        fallback: msg
                    }];
                    gotIt(attachmentsObj);
                }
            } else {
                processMail(message, function(visitorCheck) {
                    if (visitorCheck) {
                        //was a visitor, send a slack
                        visitorTitle = message.title;
                        visitorWaiting = true;
                        var msg = '<!channel>, I Received: "' + message.title + '"';
                        var attachmentsObj = [{
                            color: "warning",
                            title: randomize(instructionsArray),
                            text: msg,
                            fallback: msg,
                            fields: [{
                                title: "From",
                                value: message.from.name,
                                short: true
                            }, {
                                title: "Date",
                                value: message.date,
                                short: true
                            }]
                        }];
                        visitorNotify(attachmentsObj);
                        annoyInterval();
                    }
                    client.addFlags(message.UID, ['\\Seen'], function(error, flags) {
                        if (error) {
                            console.log("error", error);
                        }
                    });
                });
            }
        });
    });

    client.on('error', function(err) {
        console.log('Error'+err);
        var msg = "Just got this error from gmail:"+err;
        attachmentsObj = [{
            color: "danger",
            title: "Help?",
            text: msg,
            fallback: msg
        }];
        debugNotify(attachmentsObj);
        console.log(err);
    });

    client.on('close', function() {
        var msg = "Hmm... I appear to have lost my connection to gmail.  Trying to reconnect...";
        attachmentsObj = [{
            color: "danger",
            title: randomize(lostArray),
            text: msg,
            fallback: msg
        }];
        debugNotify(attachmentsObj);
        console.log('DISCONNECTED!');
        setTimeout(function() {
            console.log("Reconnecting...");
            client.connect();
        },60*1000);
    });

    client.connect();
};

