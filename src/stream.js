require('dotenv').config()
const axios = require('axios')
const Twit = require('twit')
const mongoose = require('mongoose')
const _ = require('lodash')
const CursorModel = require('./models/cursorModel.js')
const HashTModel = require('./models/hashtagModel.js')

const app = require('http').createServer()
const io = require('socket.io')(app, {
  cors: {
    origin: '*'
  }
})
app.listen(8080, '0.0.0.0')

const client = new Twit({
  consumer_key: process.env.TW_CONSUMER_KEY,
  consumer_secret: process.env.TW_CONSUMER_SECRET,
  access_token: process.env.TW_ACCESS_TOKEN,
  access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000,
  strictSSL: true
})
let tags = [] //['#Bitcoin', '#BTS', '#Eternals', '#T20WorldCup', '#Rinkeby']
const initState = _.zipObject(tags, new Array(tags.length).fill(0))
let tweetCounts = { ...initState }

const parseTweet = tweet => {
  let fullTweet = tweet.text || ''
  let twitHashtags = fullTweet.match(/#[a-zA-Z0-9_]+/gi)
  return fullTweet.match(/#[a-zA-Z0-9_]+/gi) === null ? [] : twitHashtags
}

const isExist = (array, needle) =>
  array.some(x => x.toLowerCase() == needle.toLowerCase())

const formatOutput = input =>
  tags.map(tag => ({ hashTag: tag, twitter: tweetCounts[tag] }))

const streamCallback = tweet => {
  tweet = parseTweet(tweet)

  for (var tag of tags) {
    if (isExist(tweet, tag)) {
      tweetCounts[tag]++
    }
  }
}

const sendTweets = socket => {
  const formattedTweets = tweetCounts
  tweetCounts = { ...initState }
  socket.emit('action', {
    type: 'add',
    message: formattedTweets
  })
}

const handleCallback = async () => {
  console.log('mongo connected')
  let hashModel = new HashTModel()
  tags = await hashModel.getHashTags()
  io.on('connection', socket => {
    const stream = client.stream('statuses/filter', {
      track: tags
    })
    stream.on('tweet', streamCallback)
    setInterval(() => sendTweets(socket), 10000)
  })
}

mongoose
  .connect(process.env.MONGO_CONN, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(handleCallback)
