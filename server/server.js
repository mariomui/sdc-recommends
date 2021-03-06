require('newrelic');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3123;

const redis = require('redis'); // redis
const responseTime = require('response-time');
const db = require('../database/');

const client = redis.createClient(); // redis

// / redis
client.on('error', (err) => {
  console.log(`Error ${err}`);
});

app.use(responseTime());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/rooms/:roomids/', express.static(path.join(__dirname, '/../public')));

// const findLatestPhoto = () => db.photoAdd.find({}).sort({ _id: 1 }).limit(1);

app.get('/rooms/:roomsid/house', (req, res) => {
  console.info('redismode');

  return client.get(`rooms${req.params.roomsid}`, (err, result) => {
    if (err) {
      res.sendStatus(404);
    }
    if (result) {
      res.status(200).send(result);
    } else {
      db.getSample(3, (error, data) => {
        const redisKey = `rooms${req.params.roomsid}`;
        if (error) {
          console.log(error);
          res.send(404);
        }
        client.set(`${redisKey}`, `${JSON.stringify(data)}`, 'EX', 6000, (err, data) => {
          res.status(200).json(data);
        });
      });
    }
  });
});


// app.get('/house/:roomsid', (req, res) => {
//   console.info('hello');
//   return db.getSample(10, (err, data) => {
//     if (err) {
//       console.log(err);
//       res.sendStatus(404);
//       return;
//     }
//     res.send(data);
//   });
// });

// app.get('/house', (req, res) => {
//   db.find({}, (err, data) => {
//     if (err) {
//       res.sendStatus(500);
//     } else {
//       res.send(data);
//     }
//   });
// });

// app.post is undoable without rewriting the schema.
// he overwrites _id. Mongoose is not allowed to overwrite _id.
app.post('/house/post', async (req, res) => {
  const photoToCreate = req.body.photodetails;
  const photodetail = await db.photoAdd.create(photoToCreate);
  res.status(201).json(photodetail.toJSON());
});

app.put('/rooms/:roomids/put', (req, res) => {
  const query = { _id: req.params.id };
  const {
    title,
    prem,
    cost,
    picture,
    rcount,
    stars,
    beds,
    favorite,
    description,
  } = req.query;
  const changeOptions = {
    title, prem, cost, picture, rcount, stars, favorite, beds, description,
  };
  db.photoAdd.findOneAndUpdate(query, changeOptions, (err, data) => {
    if (err) {
      res.sendStatus(501);
    } else {
      res.sendStatus(200);
    }
  });
});
// if i had to write it, it would be like the one above.

app.delete('rooms/:roomsid/delete/', (req, res) => {
  db.photoAdd.remove({ _id: req.params.roomids }, (err) => {
    if (err) {
      console.log(err);
      res.sendStatus(501);
    } else {
      res.sendStatus(200);
    }
  });
});

app.listen(port, () => {
  console.log('server is connected');
});
