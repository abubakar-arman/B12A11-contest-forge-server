// Imports
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config();
const mongoClient = require('./config/db');
const { ObjectId } = require('mongodb');

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())


const port = process.env.PORT || 3000

const db = mongoClient.db('contestforge-db')
const usersCol = db.collection('users')
const contestsCol = db.collection('contests')

const isUserExist = async (email) => {
    const result = await usersCol.find({email}).toArray()
    // console.log(result);
    return result.length ? true : false
}

app.get('/', async (req, res) => {
    // console.log(await isUserExist('bdcybergang21@gmail.com'))
    return res.send({'msg': 'Server is Running'})
})

// USERS ENDPOINTS //
app.get('/api/users', async (req, res) => {
    const result = await usersCol.find({}).toArray()
    return res.send({success: true, result})
})

app.post('/api/users', async (req, res) => {
    const {name, email, password, photoUrl} = req.body
    // console.log(data);

    const userExists = await isUserExist(email)
    if(userExists){
        // console.log('user exists', email);
        return res.send({success: 'false', msg: 'user_exists'})
    }

    const result = await usersCol.insertOne({
        name,
        email,
        password,
        photoUrl,

        role: "user",
        rank_title: "Newbie",
        joined_date: new Date(),
        address: "No address yet",
        bio: "No bio yet",
        total_wins: 0,
        total_participated: 0,
    })
    // console.log('user created:', result);
    return res.send({ success: 'true', msg: 'user_created', result })
})

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params
    const data = req.body

    if (!ObjectId.isValid(id)) {
        return res.send({ err: 'invalid id' })
    }
    // console.log(req.params);
    // console.log(req.body);

    const filter = { _id: new ObjectId(id) }
    const update = { $set: data }

    const result = await usersCol.updateOne(filter, update)

    return res.send({
        success: true,
        result
    })
})

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
        return res.send({ err: 'invald id' })
    }

    const filter = { _id: new ObjectId(id) }
    const result = await usersCol.deleteOne(filter)

    res.send({
        success: true,
        result
    })
})

app.get('/api/user/exists/:email', async (req, res) => {
    const {email} = req.params
    const userExist = await isUserExist(email)
    // console.log(userExist);
    return res.send({success: 'true', msg: userExist})
})

app.get('/api/user/:id', async (req, res) => {
    const {id} = req.params

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    const query = { _id: new ObjectId(id) }
    const result = await usersCol.findOne(query)
    // console.log(result);
    return res.send({success: 'true', result})
})


// CONTESTS ENDPOINDS //

app.get('/api/contests', async (req, res) => {
    const result = await contestsCol.find({}).toArray()
    return res.send({success: true, result})
})

app.post('/api/contests', async (req, res) => {
    // const { 
    //   name,
    //   contest_type,
    //   image,
    //   description,
    //   task_instruction,
    //   price,
    //   prize_money,
    //   deadline
    //  } = req.body
    // console.log(data);

    const result = await contestsCol.insertOne({
        ...req.body,
        participants_count: 0,
        winner: {}
    })
    console.log('contest created:', result);
    return res.send({ success: 'true', msg: 'contest_created', result })
})

app.listen(port, () => {
    console.log('Server listening on port', port);

})