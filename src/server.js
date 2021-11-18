'use strict'

// Read the .env file.
require('dotenv').config()

require('v8-compile-cache')
// Require the framework
const Fastify = require('fastify')
const socketio = require('fastify-socket.io')
const axios = require('axios')
const Twit = require('twit')
const mongoose = require('mongoose')
const _ = require('lodash')
const CursorModel = require('./models/cursorModel.js')
const HashTModel = require('./models/hashtagModel.js')

// Instantiate Fastify with some config
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV !== 'production' ? 'info' : 'warn'
  },
  pluginTimeout: 10000
})

// Register your application as a normal plugin.
app.register(require('./app.js'))
app.register(socketio, {
  cors: {
    origin: '*'
  }
})

// Start listening.
app.listen(process.env.PORT || 3000, process.env.HOST || '0.0.0.0', err => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  handleCallback()
})

// app.ready().then(() => {
//   app.io.on('connection', socket => {
//     console.log('user connected' + socket.id)
//     handleCallback(socket)
//   })
// })

const client = new Twit({
  consumer_key: process.env.TW_CONSUMER_KEY,
  consumer_secret: process.env.TW_CONSUMER_SECRET,
  access_token: process.env.TW_ACCESS_TOKEN,
  access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000,
  strictSSL: true
})
let tags = [] //['#Bitcoin', '#BTS', '#Eternals', '#T20WorldCup', '#Rinkeby']
let tweetCounts = {},
  //initState = {},
  hashModel = new HashTModel()

const parseTweet = tweet => {
  let fullTweet = tweet.text || ''
  let twitHashtags = fullTweet.match(/#[a-zA-Z0-9_]+/gi)
  return fullTweet.match(/#[a-zA-Z0-9_]+/gi) === null ? [] : twitHashtags
}

const isExist = (array, needle) =>
  array.some(x => x.toLowerCase() == needle.toLowerCase())

const formatOutput = input =>
  tags.map(tag => ({ hashTag: tag, twitter: tweetCounts[tag] }))

const streamCallback = async tweet => {
  tweet = parseTweet(tweet)
  for (var tag of tags) {
    if (isExist(tweet, tag)) {
      tweetCounts[tag]++
    }
  }
}

const sendTweets = async (socket, initState) => {
  const formattedTweets = tweetCounts
  await hashModel.updateTwitterOccurnace(formattedTweets)
  tweetCounts = { ...initState }
  socket.emit('action', {
    type: 'add',
    message: formattedTweets
  })
}

const handleCallback = async () => {
  console.log('mongo connected')
  tags = await hashModel.getHashTags()
  let initState = _.zipObject(tags, new Array(tags.length).fill(0))
  tweetCounts = { ...initState }
  app.io.on('connection', socket => {
    const stream = client.stream('statuses/filter', {
      track: tags
    })
    stream.on('tweet', streamCallback)
    setInterval(() => sendTweets(socket, initState), 20000)
  })
}
