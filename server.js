const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')


function isValidDateString(string){
  return !isNaN(Date.parse(string))
}

function filterInterval(from, to, data){
  let fromDate = new Date(from)
  let toDate = new Date (to)
  return data.filter(element => {
    let curDate = new Date(element.date)
    if(curDate >= fromDate && curDate <= toDate)
      return true
    return false
  })
}

mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology: true })

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
})

const userSchema = new mongoose.Schema({
  username: String
})

// const logSchema = new mongoose.Schema({
//   username: String,
//   count: Number,
//   log: [{
//     description: String,
//     duration: Number,
//     date: String
//   }]
// })

const Exercise = mongoose.model('Exercise', exerciseSchema)
const User = mongoose.model('User', userSchema)
// const Log = mongoose.model('Log', logSchema)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


  
function utcDateString(date){
  let stringDate = date.toUTCString().replace(/,/g, '').split(' ').slice(0, 4)
  let month = stringDate[2]
  stringDate[2] = stringDate[1]
  stringDate[1] = month
  return stringDate.join(" ")
}

console.log(utcDateString(new Date()))



app.post('/api/users', (req, res) => {
  let newUser = new User({
    username: req.body.username
  })

  newUser.save((err, data) => {
    res.json({
      username: data.username,
      _id: data._id
    })
  })
})

app.get('/api/users', (req, res) => {

  console.log('/api/users')

  User.find().select('-__v').exec((err, data) => {
    res.json(data)
  })
})

app.post('/api/users/:id/exercises', (req, res) => {

  // console.log(req.params.id, req.body)

  let currentDate = isValidDateString(req.body.date) ? utcDateString(new Date(req.body.date)) : utcDateString(new Date()) 

  User.findOne({ _id: req.params.id }, (err, data) => {

    // console.log(data)

    let newExercise = new Exercise({
      username: data.username,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: currentDate
    })

    newExercise.save((err, data) => {

      // console.log(currentDate)

      res.json({
        _id: req.params.id,
        username: data.username,
        date: currentDate,
        duration: parseInt(req.body.duration),
        description: req.body.description,
      })
    })
  })
})


app.get('/api/users/:id/logs', (req, res) => {

  // console.log(req.query)

  User.findOne({ _id: req.params.id }, (err, dataUser) => {
    Exercise.find({ username: dataUser.username }).select('-username -__v -_id ').exec((err, dataExercises) => {

      let logExercises = [...dataExercises]
      if(req.query.from)
        logExercises = filterInterval(req.query.from, req.query.to, logExercises)

      if(req.query.limit)
        logExercises = logExercises.slice(0, req.query.limit)

      res.json({
        username: dataUser.username,
        count: dataExercises.length,
        _id: req.params.id,
        log: logExercises
      })
       
    })
  })
})





