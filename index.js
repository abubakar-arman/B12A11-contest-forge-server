// Imports
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config();
const mongoClient = require('./config/db');
const { ObjectId } = require('mongodb');
const { verifyFBToken } = require('./middlewares/auth');

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())


const port = process.env.PORT || 3000

const db = mongoClient.db('contestforge-db')
const usersCol = db.collection('users')
const contestsCol = db.collection('contests')
const submissionsCol = db.collection('submissions')

// MIDDLEWARES //
const verifyAdmin = async (req, res, next) => {
    const email = req.decoded_email;
    const query = { email };
    const user = await usersCol.findOne(query);

    if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access to admin route' });
    }

    next();
}
const verifyCreator = async (req, res, next) => {
    const email = req.decoded_email;
    const query = { email };
    const user = await usersCol.findOne(query);

    if (!user || user.role !== 'creator') {
        return res.status(403).send({ message: 'forbidden access to creator route' });
    }

    next();
}
const verifyAdminOrCreator = async (req, res, next) => {
    const email = req.decoded_email;
    const query = { email };
    const user = await usersCol.findOne(query);

    if (!user || user.role !== 'admin' || user.role !== 'creator') {
        return res.status(403).send({ message: 'forbidden access' });
    }

    next();
}

const isUserExist = async (email) => {
    const result = await usersCol.find({ email }).toArray()
    // console.log(result);
    return result.length ? true : false
}

app.get('/', async (req, res) => {
    // console.log(await isUserExist('bdcybergang21@gmail.com'))
    return res.send({ 'msg': 'Server is Running' })
})

// USERS ENDPOINTS //
app.get('/api/users', verifyFBToken, async (req, res) => {
    const result = await usersCol.find({}).toArray()
    return res.send({ success: true, result })
})

app.post('/api/users', async (req, res) => {
    const { name, email, password, photoUrl } = req.body
    // console.log(data);

    const userExists = await isUserExist(email)
    if (userExists) {
        // console.log('user exists', email);
        return res.send({ success: 'false', msg: 'user_exists' })
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

app.put('/api/users/:id', verifyFBToken, async (req, res) => {
    const { id } = req.params
    const { _id, ...data } = req.body

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

app.delete('/api/users/:id', verifyFBToken, verifyAdmin, async (req, res) => {
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

app.get('/api/users/:email/role', async (req, res) => {
    const email = req.params.email;

    const query = { email }
    // console.log('kk');

    const user = await usersCol.findOne(query)
    return res.send({ success: true, result: user?.role || 'user' })
})

app.get('/api/user/exists/:email', async (req, res) => {
    const { email } = req.params
    const userExist = await isUserExist(email)
    // console.log(userExist);
    return res.send({ success: 'true', msg: userExist })
})

app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    const query = { _id: new ObjectId(id) }
    const result = await usersCol.findOne(query)
    // console.log(result);
    return res.send({ success: 'true', result })
})

app.get('/api/user/find/:email', async (req, res) => {
    const { email } = req.params

    const query = { email }
    const result = await usersCol.findOne(query)
    // console.log(result);
    return res.send({ success: 'true', result })
})


// CONTESTS ENDPOINDS //

app.get('/api/contests', async (req, res) => {
    const result = await contestsCol.find({}).toArray()
    return res.send({ success: true, result })
})

app.post('/api/contests', verifyFBToken, verifyCreator, async (req, res) => {
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
    console.log('rej', req.decoded_email);

    const result = await contestsCol.insertOne({
        ...req.body,
        participants_count: 0,
        winner: {},
        participated_users: [],
        status: 'pending', // pending/approved/rejected,
        created_by: req.decoded_email,
    })
    console.log('contest created:', result);
    return res.send({ success: 'true', msg: 'contest_created', result })
})

app.put('/api/contests/:id', verifyFBToken, async (req, res) => {
    const { id } = req.params
    const data = req.body

    if (!ObjectId.isValid(id)) {
        return res.send({ err: 'invalid id' })
    }
    // console.log(req.params);
    // console.log(req.body);

    const filter = { _id: new ObjectId(id) }
    const update = { $set: data }

    const result = await contestsCol.updateOne(filter, update)

    return res.send({
        success: true,
        result
    })
})

app.delete('/api/contests/:id', verifyFBToken, async (req, res) => {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
        return res.send({ err: 'invald id' })
    }

    const filter = { _id: new ObjectId(id) }
    const result = await contestsCol.deleteOne(filter)

    res.send({
        success: true,
        result
    })
})

app.get('/api/contest/:id', async (req, res) => {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    const query = { _id: new ObjectId(id) }
    const result = await contestsCol.findOne(query)
    // console.log(result);
    return res.send({ success: true, result })
})

app.put('/api/contest/register/:id', verifyFBToken, async (req, res) => {
    const { id } = req.params
    const { email } = req.body

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    let query = { _id: new ObjectId(id) }
    let result = await contestsCol.findOne(query)
    const { _id, ...rest } = result
    rest.participated_users.push(email)
    rest.participants_count += 1;

    let update = { $set: rest }
    result = await contestsCol.updateOne(query, update)

    // increment in user table
    query = { email }
    let userResult = await usersCol.findOne(query)
    let { _id: uid, ...userRest } = userResult
    userRest.total_participated += 1
    const userQuery = { _id: new ObjectId(uid) }
    update = { $set: userRest }
    userResult = await usersCol.updateOne(userQuery, update)


    return res.send({
        success: true,
        result
    })
})

app.put('/api/contest/deregister/:id', verifyFBToken, verifyCreator, async (req, res) => {
    const { id } = req.params
    const { email } = req.body

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    let query = { _id: new ObjectId(id) }
    let result = await contestsCol.findOne(query)
    const { _id, ...rest } = result
    const newList = rest.participated_users.filter(i => i !== email)
    rest.participated_users = newList
    rest.participants_count -= 1

    let update = { $set: rest }
    result = await contestsCol.updateOne(query, update)
    // console.log('jj', rest, req.body);

    // decrement in user table
    query = { email }
    let userResult = await usersCol.findOne(query)
    let { _id: uid, ...userRest } = userResult
    userRest.total_participated = userRest.total_participated > 0 ? userRest.total_participated - 1 : 0
    const userQuery = { _id: new ObjectId(uid) }
    update = { $set: userRest }
    userResult = await usersCol.updateOne(userQuery, update)

    return res.send({
        success: true,
        result
    })
})

app.put('/api/contest/declare-winner/:id', verifyFBToken, verifyCreator, async (req, res) => {
    const { id } = req.params
    const { _id: submissionId, contestId, email, solution, submission_date } = req.body
    // console.log('lk', req.body);
    // return

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    let query = { _id: new ObjectId(submissionId) }
    let result = await submissionsCol.findOne(query)
    let { _id, ...rest } = result
    rest.is_winner = true
    rest.status = 'accepted'
    rest
    // console.log('rest',rest)


    let update = { $set: rest }
    result = await submissionsCol.updateOne(query, update)

    // fetch winner name and image_url from users table
    query = { email }
    let userResult = await usersCol.findOne(query)

    let { name, photoUrl } = userResult

    // increment in user table
    let { _id: uid, ...userRest } = userResult
    userRest.total_wins += 1
    const userQuery = { _id: new ObjectId(uid) }
    update = { $set: userRest }
    userResult = await usersCol.updateOne(userQuery, update)

    // set winner info in contest
    query = { _id: new ObjectId(contestId) }
    result = await contestsCol.findOne(query)
    const { _id: contest_id, ...contestRest } = result
    contestRest.winner = {
        name,
        photoUrl,
        email
    }
    update = { $set: contestRest }
    result = await contestsCol.updateOne(query, update)

    return res.send({
        success: true,
        result
    })
})


app.put('/api/contest/undo-winner/:id', verifyFBToken, verifyCreator, async (req, res) => {
    const { id } = req.params
    const { _id: submissionId, contestId, email, solution, submission_date } = req.body
    // console.log('lk', req.body);
    // return

    if (!ObjectId.isValid(id)) {
        return res.send({ success: false, err: 'invalid id' })
    }

    // set submission to false
    let query = { _id: new ObjectId(submissionId) }
    let result = await submissionsCol.findOne(query)
    let { _id, ...rest } = result
    rest.is_winner = false
    rest.status = 'pending'
    // console.log('rest',rest)


    let update = { $set: rest }
    result = await submissionsCol.updateOne(query, update)

    // remove winner info in contest
    query = { _id: new ObjectId(contestId) }
    result = await contestsCol.findOne(query)
    const { _id: contest_id, ...contestRest } = result
    contestRest.winner = {}
    update = { $set: contestRest }
    result = await contestsCol.updateOne(query, update)

    // decrement in user table
    query = { email }
    let userResult = await usersCol.findOne(query)
    let { _id: uid, ...userRest } = userResult
    userRest.total_wins = userRest.total_wins > 0 ? userRest.total_wins - 1 : 0
    const userQuery = { _id: new ObjectId(uid) }
    update = { $set: userRest }
    userResult = await usersCol.updateOne(userQuery, update)

    return res.send({
        success: true,
        result
    })
})

app.get('/api/popular-contests', async (req, res) => {
    const result = await contestsCol.find().sort({ participants_count: 'desc' }).limit(5).toArray()
    // console.log(result);
    return res.send({ success: true, result })
})

// SUBMISSIONS ENDPOINTS //
app.get('/api/submissions', verifyFBToken, verifyCreator, async (req, res) => {
    const result = await submissionsCol.find({}).toArray()
    return res.send({ success: true, result })
})

app.post('/api/submissions', verifyFBToken, async (req, res) => {
    const { contestId, email, solution } = req.body
    // console.log('lkl', req.body);

    const result = await submissionsCol.insertOne({
        contestId,
        email,
        solution,
        submission_date: new Date(),
        is_winner: false,
        status: 'pending' // pending/accepted/rejected
    })
    // console.log('user created:', result);
    return res.send({ success: 'true', msg: 'submission_created', result })
})

app.delete('/api/submissions/:id', verifyFBToken, verifyCreator, async (req, res) => {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
        return res.send({ err: 'invald id' })
    }

    const filter = { _id: new ObjectId(id) }
    const result = await submissionsCol.deleteOne(filter)

    res.send({
        success: true,
        result
    })
})



app.listen(port, () => {
    console.log('Server listening on port', port);

})