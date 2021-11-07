require('dotenv').config()
const axios = require('axios')
const Twitter = require('twitter')
const mongoose = require('mongoose')
const _ = require('lodash')
const CursorModel = require('./models/cursorModel.js')
const HashTModel = require('./models/hashtagModel.js')

// let tags = [
//     '#Test001ABCPQRS',
//     '#Test001ABCPQR',
//     '#Test001ABCPQRTT',
//     '#T20WorldCup'
//   ],
//   list = tags.join(', OR')
mongoose
  .connect(process.env.MONGO_CONN, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(async k => {
    try {
      const cursorModel = new CursorModel(),
        hashModel = new HashTModel()
      //ssconsole.log(await CursorModel.deleteMany({}))
      // console.log(
      //   await HashTModel.findOneAndUpdate(
      //     { nftId: '3' },
      //     { $set: { hashTag: '#Eternals' } }
      //   )
      // )
      let client = new Twitter({
          consumer_key: process.env.TW_CONSUMER_KEY,
          consumer_secret: process.env.TW_CONSUMER_SECRET,
          access_token_key: process.env.TW_ACCESS_TOKEN,
          access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET
        }),
        len = 0,
        tags = await hashModel.getHashTags(),
        list = tags.join(', OR')

      async function twitCall() {
        let cursor = await cursorModel.getCursor(),
          obj = {},
          temp_obj = {}
        since_id = cursor ? cursor.since_id : 1 //cursor.since_id+1
        console.log('-------since_id------', since_id)
        let tweets = await client.get('search/tweets', {
          q: list,
          count: 200,
          //until: '2021/10/20'
          //max_id: 1450025588643668000 - 1,
          since_id: since_id || 1
        })
        if (tweets) {
          console.log('###')
          inc_since_id = incrementHugeNumberBy1(tweets.search_metadata.max_id)
          await cursorModel.updateCursor(since_id, inc_since_id)

          let tweetList = tweets.statuses
          len = tweetList.length
          if (tweetList.length > 0) {
            for (i = 0; i < len; i++) {
              let fullTweet = tweetList[i].text || ''
              let twitHashtags = fullTweet.match(/#[a-zA-Z0-9_]+/gi)
              if (twitHashtags !== null) {
                for (j = 0; j < twitHashtags.length; j++) {
                  let key = twitHashtags[j]
                  obj[key] ? obj[key]++ : (obj[key] = 1)
                }
              }
            }
            //console.log('%%%', obj)
            for (i = 0; i < tags.length; i++) {
              for (let key in obj) {
                temp_obj[tags[i]] = obj[tags[i]] ? obj[tags[i]] : 0
              }
            }
            if (!_.isEmpty(temp_obj)) {
              await hashModel.updateTwitterOccurnace(temp_obj)
            } else {
              console.log('here')
            }
            console.log('------DATA----', temp_obj)
          }
        }
      }

      setInterval(twitCall, 30 * 1000)

      function incrementHugeNumberBy1(n) {
        // make sure s is a string, as we can't do math on numbers over a certain size
        n = n.toString()
        let allButLast = n.substr(0, n.length - 1),
          lastNumber = n.substr(n.length - 1)

        if (lastNumber === '0') {
          return incrementHugeNumberBy1(allButLast) + '9'
        } else {
          let finalResult =
            allButLast + (parseInt(lastNumber, 10) + 1).toString()
          return trimLeft(finalResult, '0')
        }
      }

      function trimLeft(s, c) {
        let i = 0
        while (i < s.length && s[i] === c) {
          i++
        }

        return s.substring(i)
      }
    } catch (e) {
      console.log(e)
    }
  })
