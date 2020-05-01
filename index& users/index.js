var express = require('express');
var router = express.Router();
const session = require('express-session');
var moment = require('moment');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb+srv://new_user:chirag99@cluster0-qwtph.mongodb.net/?retryWrites=true&w=majority';

var sess;

router.use(session({secret: 'secret_secret',saveUninitialized: true,resave: true}));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Menu' });
});

router.get('/search', function(req, res, next) {
  res.render('search', { title: 'Search Cars to Rent' });
});

router.get('/cars', function(req, res) {
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('cars');
      collection.find({}).toArray(function(err, result){
        if(err){
          res.send(err);
        }else if(result.length){
          res.render('carslist',{
            "cars": result
          });
        }else{
          res.send("No cars found");
        }
        client.close();
      });
    }
  });
});

router.get('/bookings', function(req, res) {
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('bookings');
      collection.find({}).toArray(function(err, result){
        if(err){
          res.send(err);
        }else if(result.length){
          res.render('bookings',{
            "bookings": result
          });
        }else{
          res.send("No bookings found");
        }
        client.close();
      });
    }
  });
});

router.get('/carbooking/:id', function(req, res) {
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");
      if(!mongodb.ObjectID.isValid(req.params.id)){
        res.send("Invalid request.");
        client.close();
        return;
      }
      var query={"car_details._id": new mongodb.ObjectID(req.params.id)};

      var db = client.db('cars');
      var collection = db.collection('bookings');
      collection.find({}).toArray(function(err, result){
        if(err){
          res.send(err);
        }else if(result.length){
          res.render('carbooking',{
            "bookings": result
          });
        }else{
          res.send("No bookings found for this car");
        }
        client.close();
      });
    }
  });
});

router.get('/viewbooking/:id', function(req, res) {
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");
      if(!mongodb.ObjectID.isValid(req.params.id)){
        res.send("Invalid request.");
        client.close();
        return;
      }
      var query={"_id": new mongodb.ObjectID(req.params.id)};

      var db = client.db('cars');
      var collection = db.collection('bookings');

      collection.findOne(query, function(err, result){
        if(err){
          res.send(err);
        }else if(result){
          
          var sdate = moment(result.booking_dates[0], "DD-MM-YYYY").format('YYYY-MM-DD');
          res.render('viewbooking',{
            "booking": result,
            "sdate": sdate
          });
        }else{
          res.send("No booking found");
        }
        client.close();
      });
    }
  });
});

router.post('/search_result', function(req, res) {
  sess = req.session;

  var days = req.body.days;
  var date = new Date(req.body.startdate);
  var today = moment(Date.now()).format('DD-MM-YYYY');
  var d = moment(date).format('DD-MM-YYYY');
  if(d<today){
    res.send('Invalid Date');
    return;
  }
  var dates = new Array();
  for(var i=0;i<days;i++){
    var nextDay = new Date(date);
    nextDay.setDate(date.getDate()+i);

    var datee = nextDay.getDate();
    var month = nextDay.getMonth() + 1;
    var year = nextDay.getFullYear();
    dates[i] = datee + "-" + month + "-" + year;
  }

  sess.startdate = req.body.startdate;
  sess.dates = dates;

  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('cars');

      var query =  { $and : [ { booking_dates: { $nin: dates }}, { seat_cap : req.body.seats} ] };

      collection.find(query).toArray(function(err, result){
        if(err){
          res.send(err);
        }else{
          res.render('search_result',{
            "cars": result
          });
        }
        client.close();
      });

    }
  });
});

router.get('/newcar', function(req, res) {
  res.render('newcar',{title: 'Add new car'});
});

router.post('/addcar', function(req, res) {
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('cars');

      var car1 = {name: req.body.name, vehicle_number: req.body.vehicleno, model: req.body.model, seat_cap: req.body.capacity, rent: req.body.rent, booking_dates: []};

      collection.insert([car1],function(err, result){
        if(err){
          console.log(err);
        }else{
          res.redirect("cars");
        }
      });
    }
    client.close();
  });
});

router.get('/deletecar/:id', function(req, res){
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('cars');

      var query={_id: new mongodb.ObjectID(req.params.id)};

      collection.findOne(query, function(err, result){
        if(err){
          console.log(err);
        }else if(result){
          var del = 1;
          var today = moment(Date.now()).format('DD-MM-YYYY');
          for (i=0;i<result.booking_dates.length;i++){
            var d = moment(result.booking_dates[i],"DD-MM-YYYY").format('DD-MM-YYYY')
            if(d>today){
              console.log("del1",del);
              del=0;
              console.log("del2",del);
              break;
            }
          }
          if(del){
            MongoClient.connect(url, function(err, client){
              if(err){
                console.log("Unable to connect to server",err);
              }else{
                console.log("Connection established");
          
                var db = client.db('cars');
                var collection = db.collection('cars');
                collection.deleteOne(query, function(err,obj){
                  if(err){
                    res.json(err);
                    console.log(err);
                  }
                  else{
                    res.redirect("/cars");
                  }
                });
              }
            });
          }else{
            res.send("Can't be deleted. Some bookings are pending for this car.");
          }
        }else{
          res.send("Invalid request1.");
        }
        client.close();
      });
    }
    client.close();
  });
});

router.get('/editcar/:id', function(req, res) {
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('cars');
      if(!mongodb.ObjectID.isValid(req.params.id)){
        res.send("Invalid request.");
        client.close();
        return;
      }
      var query={"_id": new mongodb.ObjectID(req.params.id)};

      collection.findOne(query, function(err, result){
        if(err){
          console.log(err);
        }else if(result){
          res.render('editcar',{
            "car": result,
            title: 'Edit details'
          });
        }else{
          res.send("Invalid request1.");
        }
        client.close();
      });
    }
  });
});

router.post('/updatecar/:id', function(req, res){
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var collection = db.collection('cars');

      var query={"_id": new mongodb.ObjectID(req.params.id)};
      var newvalues  = { $set: {name: req.body.name, vehicle_number: req.body.vehicleno, model: req.body.model, seat_cap: req.body.capacity, rent: req.body.rent}};

      collection.updateOne(query, newvalues, function(err,obj){
        if(err){
          res.json(err);
          console.log(err);
        }
        else{
          res.redirect("/cars");
        }
      });
    }
    client.close();
  });
});


router.get('/bookcar/:id', function(req, res){
  sess = req.session;
  if(!sess.dates){
    res.redirect('/search');
    return;
  }
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      var db = client.db('cars');
      var collection = db.collection('cars');
      if(!mongodb.ObjectID.isValid(req.params.id)){
        res.send("Invalid request.");
        client.close();
        return;
      }
      var query={"_id": new mongodb.ObjectID(req.params.id)};

      collection.findOne(query, function(err, result){
        if(err){
          console.log(err);
        }else if(result){
          sess.car_details = result;
          res.render('bookcar',{
            "car": result,
            title: 'Book Now',
            session: sess
          });
        }else{
          res.send("Invalid request1.");
        }
        client.close();
      });
    }
  });
});

router.post('/confirmbook', function(req, res) {
  sess= req.session;
  if(!sess.dates){
    res.redirect('/search');
    return;
  }
  var data;
  MongoClient.connect(url, function(err, client){
    if(err){
      console.log("Unable to connect to server",err);
    }else{
      console.log("Connection established");

      var db = client.db('cars');
      var today = moment(Date.now()).format('DD-MM-YYYY HH:mm:ss');
      var collection = db.collection('bookings');
      var person = {"name": req.body.name, "id": req.body.id, "phone": req.body.phone, "email": req.body.email};
      delete sess.car_details['booking_dates'];
      var booking1 = {person_details: person, car_details: sess.car_details, booking_dates: sess.dates, total_rent: sess.dates.length*sess.car_details.rent, booking_date: today};

      collection.insertOne(booking1,function(err, result){
        if(err){
          console.log(err);
        }else{
          data = result.insertedId;
          console.log(data);
          console.log("booking done");
          MongoClient.connect(url, function(err, client){
            if(err){
              console.log("Unable to connect to server",err);
            }else{
              console.log("Connection established");
        
              var db = client.db('cars');
              var collection = db.collection('cars');
              var query={"_id": new mongodb.ObjectID(sess.car_details._id)};
              console.log("Query",query);
              var newvalues  = { $addToSet: { booking_dates:{ $each : sess.dates}}};
              collection.updateOne(query, newvalues, function(err,obj){
                if(err){
                  res.json(err);
                  console.log("Error1 ",err);
                }
                else{
                  req.session.destroy();
                  console.log(data);
                  res.render("booking_confirm",{
                    data : data
                  });
                }
              });
            }
          });
        }
      });
    }
    client.close();
  });
});

module.exports = router;
