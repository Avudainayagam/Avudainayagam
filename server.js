var cluster = require('cluster');
var cron=require('node-cron');
var dotenv=require('dotenv');

// if (cluster.isMaster) {
//     var numWorkers = require('os').cpus().length;
//     console.log(numWorkers);
//     for (var i = 0; i < numWorkers; i++) {
//         cluster.fork();
//     }

//     cluster.on('exit', function (worker, code, signal) {
//         cluster.fork();
//     });
// }
//  else {
    app.use("/uploads",express.static(root,[options]))

    const express = require('express');
    const mysql = require('mysql');
    var bodyParser = require('body-parser')

    const app = express();

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // parse application/json
    app.use(bodyParser.json())
    app.use(function (req, res, next) {

        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers you wish to allow
        // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        res.setHeader('Access-Control-Allow-Headers', '*');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', false);

        // Pass to next layer of middleware
        next();
    });

    require('./app/user.js')(app);
    require('./app/master.js')(app);
    require('./app/doctorOnboard.js')(app);
    require('./app/appointmentBooking.js')(app);
    require('./app/medicalRecords.js')(app);
    require('./app/ambulance.js')(app);
    require('./app/ambulancebooking.js')(app);
    require('./app/bloodbank.js')(app);
    require('./app/donor.js')(app);
    require('./app/bloodrequest.js')(app);
    require('./app/jobportal.js')(app);
    require('./app/partnerwithus.js')(app);
    require('./app/categories.js')(app);
    require('./app/product.js')(app);
    require('./app/userprescription.js')(app);
    require('./app/knowurhospital.js')(app);
    require('./app/pillInfo.js')(app);
    require('./app/config/cronjob.js')();
    require('./app/labonboard.js')(app);
    require('./app/medicalproducts.js')(app);
    require('./app/pharmacy.js')(app);
    require('./app/labTest.js')(app);
    require('./app/ambulanceagency.js')(app);
    require('./app/ambulanceonboard.js')(app);
    require('./app/bloodbankonboard.js')(app);
    require('./app/community.js')(app);

 
    
    dotenv.config();

    app.listen('9060', () => {
        console.log(`Server started on port 9060  - ${process.pid}`);
    });

// }
