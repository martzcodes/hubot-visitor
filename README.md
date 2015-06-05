# hubot-visitor

[![npm version](http://img.shields.io/npm/v/hubot-forecast.svg)](https://www.npmjs.org/package/hubot-visitor)
[![Build Status](http://img.shields.io/travis/oehokie/hubot-visitor.svg)](https://travis-ci.org/oehokie/hubot-visitor)

A hubot script to alert slack channel with office visitors.

My office is in a controlled building.  The receptionist downstairs will email a special visitor listserv for my company so someone knows to go downstairs to get the visitor.  This bot checks an email account that is on that listserv, and whenever it receives an email it notifies a channel in slack.  It then waits for a response either from slack with a "got" (as in "got it") or a response by email, and notifies both slack and the listserv that someone got it.  Whew.

## Installation

In hubot project repo, run:

```bash
$ npm install hubot-visitor --save
```

Then add **hubot-visitor** to your `external-scripts.json`:

```json
["hubot-visitor"]
```

Finally, set the necessary EnvVars:

```
HUBOT_VISITOR_CHANNEL - Slack channel visitor messages should go
HUBOT_EMAIL_USER - Email Username
HUBOT_EMAIL_PASSWORD - Email Password
HUBOT_EMAIL_HOST - host address (e.g. imap.gmail.com)
HUBOT_EMAIL_SERVICE - email service for nodemailer (e.g. Gmail)
HUBOT_EMAIL_FROM - visitor listserv to check
HUBOT_SLACK_BOTNAME - Botname in slack
HUBOT_EMAIL_NICE_NAME - Nice version of the bots name for email From field
HUBOT_EMAIL_DEBUG - debug email address for testing
HUBOT_EMAIL_DEBUG_LAST - last name (simple filter for debugging)
HUBOT_EMAIL_FROM_DOMAIN - domain of person that sends visitor announcements
```