const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI;
// var url = "mongodb://localhost:27017/mydb";

var users = [{"id":111, "username":"admin", "password":"admin"}];

/* REQUIRED SERIALIZING */

passport.serializeUser(function (user, done) {
    done(null, users[0].id);
});
passport.deserializeUser(function (id, done) {
    done(null, users[0]);
});

/* RETRIEVES USERNAME AND PASSWORD FROM FORM WHEN POST /LOGIN IS SENT */

passport.use('local', new LocalStrategy(
    function (username, password, done) {
        console.log(done);
        console.log("entered username: "+username+" retrieved username: "+users[0].username);
        console.log("entered password: "+password+" retrieved password: "+users[0].password);
        if (username === users[0].username && password === users[0].password) {
            return done(null, users[0]);
        } else {
            return done(null, false, {"message": "User not found."});
        }
    })
);

/* REQUIRED MIDDLEWARE THAT READS THE FORM DATA AND PASSES IT TO LOCALSTRATEGY */

app.use(bodyParser.urlencoded({ extended: false }));


/* REQUIRED MIDDLEWARE */

app.use(session({
    secret: "tHiSiSasEcRetStr",
    resave: true,
    saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
 
/* REQUIRED AND ACTIVATES ON GET /ADMIN */

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
 
    res.sendStatus(401);
}

/* 1st */

app.post('/login',
  passport.authenticate('local', { successRedirect: '/admin',
                                   failureRedirect: '/error'})
);

app.get("/logout", function (req, res) {
    req.session.destroy();
    req.logout();
    res.sendFile('public/login.html', { root : __dirname });
});

app.get('/', (req, res) => res.sendFile('public/index.html', { root : __dirname }))

app.get('/login', (req, res) => res.sendFile('public/login.html', { root : __dirname }))

app.get('/error', (req, res) => res.sendFile('public/error.html', { root : __dirname }))

app.get('/admin', isLoggedIn, (req, res) => res.sendFile('public/admin.html', { root : __dirname }))

app.post('/survey', function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        console.log(req.body.color);
        if (err) throw err;
        var dbo = db.db("heroku_zcg4h7lr");
        var myquery = { name: req.body.color };
        var newvalues = { $inc: { count: 1 } };
        dbo.collection("colors").updateOne(myquery, newvalues, function(err, response) {
          if (err) throw err;
          console.log(response);
          res.sendFile('public/thankyou.html', { root : __dirname }); 
        });
      });
});

app.get('/find', function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("heroku_zcg4h7lr");
        dbo.collection("colors").find({}).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          return res.json(result);
          db.close();
        });
      });
});

app.get('/create', function (req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        console.log("Database created!");
        db.close();
    });
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("heroku_zcg4h7lr");
        var myobj = [
          { _id: 1, name: 'Blue', count: 0},
          { _id: 2, name: 'Red', count: 0},
          { _id: 3, name: 'Green', count: 0},
          { _id: 4, name: 'Yellow', count: 0}
        ];
        dbo.collection("colors").insertMany(myobj, function(err, res) {
          if (err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
          db.close();
        });
    }); 
});

app.get('/destroy', function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("heroku_zcg4h7lr");
        dbo.collection("colors").drop(function(err, delOK) {
          if (err) throw err;
          if (delOK) console.log("Collection deleted");
          db.close();
        });
      }); 
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))