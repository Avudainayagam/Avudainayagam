const fs = require('fs');
const path = require('path');
const url = require('url');
var ip = require("./config/ipaddressconfig.js").ipaddress;

module.exports = function (app) {

    app.get('/viewAmbulanceImages', function (req, res) {

        console.log("viewAmbulanceImages API...");
        const MEDICALDIR = './uploads/AmbulanceImages/';

        var query = url.parse(req.url, true).query;
        pic = query.fileName;

        console.log("url");
        console.log(req.url);

        console.log("pic");
        console.log(pic);

        var file_type = pic.split('.')[1];

        console.log(file_type);

        if (typeof pic === 'undefined') {
            console.log("undefined in...");

        } else {
            console.log("Not undefined");

            fs.readFile(MEDICALDIR + pic, function (err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {

                    var choose_type = '';

                    if (file_type == "pdf") {
                        choose_type = { 'Content-type': 'application/' + file_type }
                    }
                    else {
                        choose_type = { 'Content-type': 'image/' + file_type }
                    }

                    console.log(choose_type);

                    // res.writeHead(200, { 'Content-type': 'image/jpg' });
                    res.writeHead(200, choose_type);
                    res.end(content);
                }
            });
        }
    });


    app.get('/viewVechileImages', function (req, res) {

        console.log("viewVechileImages API...");
        const MEDICALDIR = './uploads/VechileImages/';

        var query = url.parse(req.url, true).query;
        pic = query.fileName;

        console.log("url");
        console.log(req.url);

        console.log("pic");
        console.log(pic);

        var file_type = pic.split('.')[1];

        console.log(file_type);

        if (typeof pic === 'undefined') {
            console.log("undefined in...");

        } else {
            console.log("Not undefined");

            fs.readFile(MEDICALDIR + pic, function (err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {

                    var choose_type = '';

                    if (file_type == "pdf") {
                        choose_type = { 'Content-type': 'application/' + file_type }
                    }
                    else {
                        choose_type = { 'Content-type': 'image/' + file_type }
                    }

                    console.log(choose_type);

                    // res.writeHead(200, { 'Content-type': 'image/jpg' });
                    res.writeHead(200, choose_type);
                    res.end(content);
                }
            });
        }
    });

    var amb_driver_id = [];

    function FindDistance(lat1, lon1, lat2, lon2, driver_id) {

        return new Promise((resolve, reject) => {

            if ((lat1 == lat2) && (lon1 == lon2)) {
                return resolve(0);
            }
            else {
                var radlat1 = Math.PI * lat1 / 180;
                var radlat2 = Math.PI * lat2 / 180;
                var theta = lon1 - lon2;
                var radtheta = Math.PI * theta / 180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180 / Math.PI;
                dist = dist * 60 * 1.1515;

                console.log("id:" + driver_id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log("Km distance:");
                console.log(dist);

                if (dist <= 5) {
                    amb_driver_id.push({ "driver_id": driver_id, "Km": Math.round(dist) });
                }

                return resolve();
            }

        });
    }


    var amb_driver_id_Two = [];

    function FindDistance_Two(lat1, lon1, lat2, lon2, driver_id) {

        return new Promise((resolve, reject) => {

            if ((lat1 == lat2) && (lon1 == lon2)) {
                return resolve(0);
            }
            else {
                var radlat1 = Math.PI * lat1 / 180;
                var radlat2 = Math.PI * lat2 / 180;
                var theta = lon1 - lon2;
                var radtheta = Math.PI * theta / 180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180 / Math.PI;
                dist = dist * 60 * 1.1515;

                console.log("id:" + driver_id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log("Km distance:");
                console.log(dist);

                if (dist <= 5) {
                    amb_driver_id_Two.push({ "driver_id": driver_id, "Km": Math.round(dist) });
                }

                return resolve();
            }

        });
    }

    function CalculateKms(lat1, lon1, lat2, lon2) {

        return new Promise((resolve, reject) => {

            if ((lat1 == lat2) && (lon1 == lon2)) {
                return resolve(0);
            }
            else {
                var radlat1 = Math.PI * lat1 / 180;
                var radlat2 = Math.PI * lat2 / 180;
                var theta = lon1 - lon2;
                var radtheta = Math.PI * theta / 180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180 / Math.PI;
                dist = dist * 60 * 1.1515;

                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log("Km distance:");
                console.log(dist);
                return resolve(dist);
            }

        });
    }

    function nonAvailable_Amb_types(db) {

        return new Promise(async (resolve, reject) => {

            var ip = await require('./config/ipaddressconfig.js')(db);

            console.log(ip);

            var non_available_ambulance_types = 'select t3.sAmbulanceType,MIN(t3.min_rate) as "MinAmount",MAX(t3.max_rate) as "MaxAmount", \
            "Not Available" as "status",concat(?,t3.sVechilePath,t3.sVechileImage) as "AmbulanceURL" \
            from tblAmbulanceMaster t3 where t3.isActive=1 group by t3.sAmbulanceType,AmbulanceURL';

            db.query(non_available_ambulance_types, [ip], (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                return resolve(result);

            });

        });
    }

    app.post('/getAmbulanceTypes', async (req, res) => {

        let db = require('./config/config').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var pickup_lat = req.body.pickup_lat;
        var pickup_long = req.body.pickup_long;

        var get_ambulance_driver_lat_long = 'select t1.id,t1.driver_id,t1.nlatitude,t1.nlongitude \
        from tblAmbdriverlatlongtracking t1 \
        join (select driver_id,MAX(id) as "id" from tblAmbdriverlatlongtracking group by driver_id) t2 \
        on t2.driver_id=t1.driver_id and t2.id=t1.id';

        db.query(get_ambulance_driver_lat_long, async (err, result) => {

            if (err) {

                console.log(err);

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {

                var nLatitude2 = result[i].nlatitude;
                var nLongitude2 = result[i].nlongitude;
                var driver_id = result[i].driver_id;

                await FindDistance(pickup_lat, pickup_long, nLatitude2, nLongitude2, driver_id);
            }

            console.log("After Calculating Kms:");

            console.log(amb_driver_id);

            var driver_id = amb_driver_id.map(function (value) {
                return value.driver_id;
            });

            console.log(driver_id);

            if (driver_id.length == 0) {

                console.log("Drivers Not Available surrounding 0.5 Kms....");

                var data = await nonAvailable_Amb_types(db);

                return res.send(data);

            }
            else {

                var get_available_Ambulance_types = 'select t3.sAmbulanceType,MIN(t3.min_rate) as "MinAmount",MAX(t3.max_rate) as "MaxAmount", "Available" as "status", \
                concat(?,t3.sVechilePath,t3.sVechileImage) as "AmbulanceURL" \
                from tblAmbulanceDriverMapping t1 \
                join tblAmbulancedtls t2 on t2.id=t1.iAmbulanceID and t2.isActive=1 \
                join tblAmbulanceMaster t3 on t3.id=t2.iAmbulanceType and t3.isActive=1 \
                where t1.iDriverID IN (?) AND t1.isActive=1 AND t1.dDutyDate=curdate() group by t3.sAmbulanceType';

                db.query(get_available_Ambulance_types, [ip, driver_id], async (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log("Available AmbulanceTypes:");

                    console.log(result2);

                    var available_ambulance_types = result2.map(function (value) {
                        return value.sAmbulanceType;
                    });

                    console.log(available_ambulance_types);

                    if (available_ambulance_types.length == 0) {

                        console.log("Ambulance Types are not Available....");

                        var data = await nonAvailable_Amb_types(db);

                        return res.send(data);

                    }
                    else {

                        var get_unavailable_Ambulance_types = 'select t1.sAmbulanceType,MIN(t1.min_rate) as "MinAmount",MAX(t1.max_rate) as "MaxAmount", "Not Available" as "status", \
                        concat(?,t1.sVechilePath,t1.sVechileImage) as "AmbulanceURL" \
                        from tblAmbulanceMaster t1 \
                        where t1.isActive=1 and t1.sAmbulanceType NOT IN (?) group by t1.sAmbulanceType';

                        db.query(get_unavailable_Ambulance_types, [ip, available_ambulance_types], (err, result3) => {

                            if (err) {
                                console.log(err.sqlMessage);
                                return res.send({
                                    status: 0,
                                    message: err.sqlMessage
                                });
                            }

                            console.log("UnAvailable AmbulanceTypes:");

                            console.log(result3);

                            var arr = result2.concat(result3);

                            console.log(arr);

                            return res.send(arr);
                        });

                    }

                });
            }

        });

    });

    app.post('/getDriversbasedAmbulanceType', async (req, res) => {

        let db = require('./config/config').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var pickup_lat = req.body.pickup_lat;
        var pickup_long = req.body.pickup_long;
        var drop_lat = req.body.drop_lat;
        var drop_long = req.body.drop_long;
        var ambtype = req.body.ambtype;

        var get_ambulance_driver_lat_long = 'select t1.id,t1.driver_id,t1.nlatitude,t1.nlongitude \
        from tblAmbdriverlatlongtracking t1 \
        join (select driver_id,MAX(id) as "id" from tblAmbdriverlatlongtracking group by driver_id) t2 \
        on t2.driver_id=t1.driver_id and t2.id=t1.id';

        db.query(get_ambulance_driver_lat_long, async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {

                var nLatitude2 = result[i].nlatitude;
                var nLongitude2 = result[i].nlongitude;
                var driver_id = result[i].driver_id;

                await FindDistance_Two(pickup_lat, pickup_long, nLatitude2, nLongitude2, driver_id);
            }


            console.log("After Calculating Kms:");

            console.log(amb_driver_id_Two);

            var driver_id = amb_driver_id_Two.map(function (value) {
                return value.driver_id;
            });

            console.log(driver_id);

            if (driver_id.length == 0) {

                return res.send([]);

            }

            var show_driver_details = 'select t2.sRegistrationNum,t1.Km_hr,concat(?,t2.sVechilePath,t2.sVechileImage) as "ImageUrl",t2.id as "Ambulanceid", \
            t2.iAmbulancetype,t3.iDriverID,t4.sName as "Driver_Name" \
            from tblAmbulanceMaster t1 \
            join tblAmbulancedtls t2 on t2.iAmbulancetype=t1.id and t2.isActive=1 \
            join tblAmbulanceDriverMapping t3 on t3.iAmbulanceID=t2.id and t3.isActive=1 and t3.iDriverID IN (?) and t3.dDutyDate=curdate() \
            join tblUserMaster t4 on t4.id=t3.iDriverID and t4.sActive=1 \
            where t1.sAmbulanceType=? and t3.iDriverID NOT IN (select t1.iDriverID \
            from tblAmbulanceBookingMaster t1  \
            where t1.isActive=1 and DATE(t1.dCreated)=curdate() and t1.sStatus <> 46 group by t1.iDriverID) and t1.isActive=1';

            db.query(show_driver_details, [ip, driver_id, ambtype], async (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var kms = await CalculateKms(pickup_lat, pickup_long, drop_lat, drop_long);

                console.log(kms);

                result2.map((data) => {

                    data.amount = data.Km_hr * kms;

                });

                console.log(result2);

                return res.send(result2);

            });
        });

    });

    




}
