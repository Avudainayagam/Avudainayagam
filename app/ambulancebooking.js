const fs = require('fs');
const path = require('path');
const url = require('url');
const { db } = require('./config/config.js');
var ip = require("./config/ipaddressconfig.js").ipaddress;

module.exports = function (app) {

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

    app.post('/ambulanceBooking', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var pickuplat="91.8742000"
        // var pickuplong="12.2562000";
        // var droplat="92.2030401";
        // var droplong="13.1230909";
        // var pickupaddress="N0.10 Poes garden Chennai";
        // var dropaddress="No 12 Adyar";
        // var ambulanceid=4
        // var paymenttype="ONLINE";
        // var userid=3;
        // var patientid=3;
        // var patienttype="SELF";
        // var ambulancetype=5;
        // var ridefee=250;
        // var driverid=6;
        // var amb_booking_status=41;

        var pickuplat = req.body.pickuplat;
        var pickuplong = req.body.pickuplong;
        var droplat = req.body.droplat;
        var droplong = req.body.droplong;
        var pickupaddress = req.body.pickupaddress;
        var dropaddress = req.body.dropaddress;
        var ambulanceid = req.body.ambulanceid;
        var paymenttype = req.body.paymenttype;
        var userid = req.body.userid;
        var patientid = req.body.patientid;
        var patienttype = req.body.patienttype;
        var ambulancetype = req.body.ambulancetype;
        var ridefee = req.body.ridefee;
        var driverid = req.body.driverid;
        var amb_booking_status = req.body.amb_booking_status;

        var get_Max_id = 'select \
    CASE \
      WHEN max(id) IS NULL THEN 1 \
      WHEN max(id) IS NOT NULL THEN max(id)+1 \
      END AS "max_value" \
    from tblAmbulanceBookingMaster';

        db.query(get_Max_id, async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);


            var max_value = result[0].max_value;

            var id_length = max_value.toString().length;

            console.log("Id length:");

            console.log(id_length);

            var booking_id = "";

            if (id_length == 1) {
                booking_id = "AMBU0000".concat(max_value);
            }
            else if (id_length == 2) {
                booking_id = "AMBU000".concat(max_value);
            }
            else if (id_length == 3) {
                booking_id = "AMBU00".concat(max_value);
            }
            else if (id_length == 4) {
                booking_id = "AMBU0".concat(max_value);
            }
            else if (id_length == 5) {
                booking_id = "AMBU".concat(max_value);
            }

            console.log("Booking Id:");

            console.log(booking_id);

            var username = await require('./config/findusername.js')(db, userid);

            var get_time = await require('./config/time.js')(db);

            var amb_booking_value = await require('./config/findstatusvalue.js')(amb_booking_status, db);

            var insert_ambulance_booking = 'INSERT INTO tblAmbulanceBookingMaster SET ?';

            var post_ambulance_booking = {
                iUserID: userid,
                sAmbBookingID: booking_id,
                ipatientID: patientid,
                iDriverID: driverid,
                iAmbulanceID: ambulanceid,
                iAmbulanceType: ambulancetype,
                sPatientType: patienttype,
                sPickupLocation: pickupaddress,
                sPickupLat: pickuplat,
                sPickupLong: pickuplong,
                sStatus: amb_booking_status,
                sDropLocation: dropaddress,
                sDropLat: droplat,
                sDropLong: droplong,
                nRidefee: ridefee,
                sPaymenttype: paymenttype,
                sPaymentStatus: 'UNPAID',
                sCreatedBy: username,
                dCreated: get_time,
                isActive: 1
            };

            db.query(insert_ambulance_booking, post_ambulance_booking, (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var amb_booking_id = result2.insertId;

                var insert_ambulance_booking_status = 'INSERT INTO tblAmbulanceBookingStatus SET ?';

                var post_ambulance_booking_status = {
                    ibooking_id: amb_booking_id,
                    istatus: amb_booking_status,
                    sStatus: amb_booking_value,
                    sCreated_by: username,
                    dCreated: get_time,
                    sActive: 1
                };

                db.query(insert_ambulance_booking_status, post_ambulance_booking_status, (err, result3) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    return res.send({
                        status: 1,
                        message: "Ambulance Booked",
                        id: amb_booking_id
                    });

                });

            });

        });


    });

    app.post('/showBookingstoDriver', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var driver_id = req.body.driver_id;

        var new_show_bookings_driver = 'select t1.id,t1.sAmbBookingID,DATE_FORMAT(t1.dCreated,"%d-%b-%y") as "date", \
        time_format(t1.dCreated,"%h:%i %p") as "time", \
        (CASE \
        WHEN t1.sPatientType = "SELF" THEN t2.sName \
        WHEN t1.sPatientType = "OTHERS" THEN t3.sName \
        END) as "Pt_name",t1.sPickupLocation,t1.sDropLocation,t4.sMobileNum as "Driver_Mob",t4.id as "Driver_id", \
        t1.sstatus,t5.sStatus as "Booking_Status",t5.sLabel,t5.id as "Label_id", \
        (CASE \
            WHEN t1.sPatientType = "SELF" THEN t2.sMobileNum \
            WHEN t1.sPatientType = "OTHERS" THEN t3.sContactNum \
            END) as "Pt_Mob" \
        from tblAmbulanceBookingMaster t1 \
        LEFT OUTER JOIN tblUserMaster t2 on t2.id=t1.iUserID and t2.sActive=1 \
        LEFT OUTER JOIN tblFamilyMemberdtls t3 on t3.id=t1.ipatientID and t3.isActive=1 \
        join tblUserMaster t4 on t4.id=t1.iDriverID and t4.sActive=1 \
        join tblAmbStatusFlowLabel t5 on t5.iStatus=t1.sStatus and t5.isActive=1 \
        where t1.iDriverID=? and t1.sStatus IN (41,42,43,44,45) and t1.isActive=1 order by t1.id DESC';

        var completed_show_booking_driver = 'select t1.id,t1.sAmbBookingID,DATE_FORMAT(t1.dCreated,"%d-%b-%y") as "date", \
        time_format(t1.dCreated,"%h:%i %p") as "time", \
        (CASE \
        WHEN t1.sPatientType = "SELF" THEN t2.sName \
        WHEN t1.sPatientType = "OTHERS" THEN t3.sName \
        END) as "Pt_name",t1.sPickupLocation,t1.sDropLocation,t4.sMobileNum as "Driver_Mob",t4.id as "Driver_id", \
        t1.sstatus,t5.sStatus as "Booking_Status",t5.sLabel,t5.id as "Label_id", \
        (CASE  \
            WHEN t1.sPatientType = "SELF" THEN t2.sMobileNum \
            WHEN t1.sPatientType = "OTHERS" THEN t3.sContactNum \
            END) as "Pt_Mob" \
        from tblAmbulanceBookingMaster t1 \
        LEFT OUTER JOIN tblUserMaster t2 on t2.id=t1.iUserID and t2.sActive=1 \
        LEFT OUTER JOIN tblFamilyMemberdtls t3 on t3.id=t1.ipatientID and t3.isActive=1 \
        join tblUserMaster t4 on t4.id=t1.iDriverID and t4.sActive=1 \
        join tblAmbStatusFlowLabel t5 on t5.iStatus=t1.sStatus and t5.isActive=1 \
        where t1.iDriverID=? and t1.sStatus IN (46) and t1.isActive=1 order by t1.id DESC';

        db.query(new_show_bookings_driver, [driver_id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(completed_show_booking_driver, [driver_id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                return res.send({
                    new: result,
                    completed: result2
                });


            });


        });

    });

    app.post('/updateAmbulanceStatus', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var id=4;
        // var driver_id=7;
        // var label_id=5;

        var id = req.body.id;
        var driver_id = req.body.driver_id;
        var label_id = req.body.label_id;

        if (label_id == 1) { // ACCEPT => UPDATE = STATUS  AS A ACCEPTED

            var amb_booking_value = await require('./config/findstatusvalue.js')(42, db);

            var username = await require('./config/findusername.js')(db, driver_id);

            var get_time = await require('./config/time.js')(db);

            var insert_ambulance_booking_status = 'INSERT INTO tblAmbulanceBookingStatus SET ?';

            var post_ambulance_booking_status = {
                ibooking_id: id,
                istatus: 42,
                sStatus: amb_booking_value,
                sCreated_by: username,
                dCreated: get_time,
                sActive: 1
            };

            db.query(insert_ambulance_booking_status, post_ambulance_booking_status, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_appointment_status = 'update tblAmbulanceBookingMaster SET sStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [42, username, get_time, id], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);


                    return res.send({
                        status: 1,
                        message: "Ambulance Driver Accepted"
                    });

                });


            });

        }
        else if (label_id == 2) { // START DIRECTIONS => UPDATE STATUS AS A WAY TO PICKUP

            var amb_booking_value = await require('./config/findstatusvalue.js')(43, db);

            var username = await require('./config/findusername.js')(db, driver_id);

            var get_time = await require('./config/time.js')(db);

            var insert_ambulance_booking_status = 'INSERT INTO tblAmbulanceBookingStatus SET ?';

            var post_ambulance_booking_status = {
                ibooking_id: id,
                istatus: 43,
                sStatus: amb_booking_value,
                sCreated_by: username,
                dCreated: get_time,
                sActive: 1
            };

            db.query(insert_ambulance_booking_status, post_ambulance_booking_status, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_appointment_status = 'update tblAmbulanceBookingMaster SET sStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [43, username, get_time, id], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);


                    return res.send({
                        status: 1,
                        message: "Ambulance on the way to Pickup"
                    });

                });


            });

        }
        else if (label_id == 3) { // REACHED => UPDATE STATUS AS A REACHED PICKUP LOCATION

            var amb_booking_value = await require('./config/findstatusvalue.js')(44, db);

            var username = await require('./config/findusername.js')(db, driver_id);

            var get_time = await require('./config/time.js')(db);

            var insert_ambulance_booking_status = 'INSERT INTO tblAmbulanceBookingStatus SET ?';

            var post_ambulance_booking_status = {
                ibooking_id: id,
                istatus: 44,
                sStatus: amb_booking_value,
                sCreated_by: username,
                dCreated: get_time,
                sActive: 1
            };

            db.query(insert_ambulance_booking_status, post_ambulance_booking_status, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_appointment_status = 'update tblAmbulanceBookingMaster SET sStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [44, username, get_time, id], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);


                    return res.send({
                        status: 1,
                        message: "Reached Pickup Location"
                    });

                });


            });

        }
        else if (label_id == 4) { // START DIRECTIONS => UPDATE STATUS AS A WAY TO HOSPITAL

            var amb_booking_value = await require('./config/findstatusvalue.js')(45, db);

            var username = await require('./config/findusername.js')(db, driver_id);

            var get_time = await require('./config/time.js')(db);

            var insert_ambulance_booking_status = 'INSERT INTO tblAmbulanceBookingStatus SET ?';

            var post_ambulance_booking_status = {
                ibooking_id: id,
                istatus: 45,
                sStatus: amb_booking_value,
                sCreated_by: username,
                dCreated: get_time,
                sActive: 1
            };

            db.query(insert_ambulance_booking_status, post_ambulance_booking_status, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_appointment_status = 'update tblAmbulanceBookingMaster SET sStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [45, username, get_time, id], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);


                    return res.send({
                        status: 1,
                        message: "Way to hospital"
                    });

                });


            });

        }
        else if (label_id == 5) { // COMPLETED => UPDATE STATUS AS A COMPLETED

            var amb_booking_value = await require('./config/findstatusvalue.js')(46, db);

            var username = await require('./config/findusername.js')(db, driver_id);

            var get_time = await require('./config/time.js')(db);

            var insert_ambulance_booking_status = 'INSERT INTO tblAmbulanceBookingStatus SET ?';

            var post_ambulance_booking_status = {
                ibooking_id: id,
                istatus: 46,
                sStatus: amb_booking_value,
                sCreated_by: username,
                dCreated: get_time,
                sActive: 1
            };

            db.query(insert_ambulance_booking_status, post_ambulance_booking_status, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_appointment_status = 'update tblAmbulanceBookingMaster SET sStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [46, username, get_time, id], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);


                    return res.send({
                        status: 1,
                        message: "Completed"
                    });

                });

            });

        }
        else {

            return res.send({
                status: 0,
                message: 'Label Not found'
            });

        }

    });

    app.post('/checkdriverAcceptOrNot', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var id = req.body.id;
        //var id = 1;

        var check_Accepted = 'select count(*) as "checkAccepted" from tblAmbulanceBookingStatus where ibooking_id=? and iStatus=42 and sActive=1';

        db.query(check_Accepted, [id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result[0].checkAccepted == 0) {

                return res.send({
                    status: 0,
                    message: "Driver Not Accepted",
                    data: []
                });

            }
            else {

                var show_data = 'select t1.id,t1.sAmbBookingID,t2.sName as "DriverName",t3.sContactNum, \
                concat(?,t3.sDriverProfilePath,t3.sDriverProfilePic) as "ProfilerURL",t4.sAmbulanceType as "AmbulanceType", \
                t1.iAmbulanceID as "AmbulanceId",t5.sRegistrationNum as "VechileNo",t1.sPickupLat,t1.sPickupLong,t1.sDropLat,t1.sDropLong, \
                t1.sPickupLocation,t1.sDropLocation,t6.sValue as "BookingStatus",t1.nRidefee as "paymentAmount",t1.sPaymenttype \
                from tblAmbulanceBookingMaster t1 \
                join tblUserMaster t2 on t2.id=t1.iDriverID and t2.sActive=1 \
                join tblAmbulanceDriverdtls t3 on t3.sContactNum=t2.sMobileNum and t3.isActive=1 \
                join tblAmbulanceMaster t4 on t4.id=t1.iAmbulanceType and t4.isActive=1 \
                join tblAmbulancedtls t5 on t5.id=t1.iAmbulanceID and t5.isActive=1 \
                join tblAppConfig t6 on t6.id=t1.sStatus and t6.isActive=1 \
                where t1.id=? and t1.isActive=1';

                db.query(show_data, [ip, id], (err, result2) => {


                    if (err) {
                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    return res.send({
                        status: 1,
                        message: "Accepted",
                        data: result2
                    });

                });


            }

        });


    });

    app.post('/checkStatusCompletedorNot', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;

        var check_Completed = 'select count(*) as "checkCompleted" from tblAmbulanceBookingStatus where ibooking_id=? and iStatus=46 and sActive=1';

        db.query(check_Completed, [id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result[0].checkCompleted == 0) {

                return res.send({
                    status: 0,
                    message: "Driver Not Completed",
                    data: []
                });

            }
            else {

                var show_data = 'select t1.id,t1.sAmbBookingID,t1.nRidefee,t1.sPaymenttype,t1.sStatus as "statusid",t2.sValue as "status" \
                from tblAmbulanceBookingMaster t1 \
                join tblAppConfig t2 on t2.id=t1.sStatus and t2.isActive=1 \
                where t1.id=? and t1.isActive=1';

                db.query(show_data, [id], (err, result2) => {


                    if (err) {
                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    return res.send({
                        status: 1,
                        message: "Driver Completed",
                        data: result2
                    });

                });

            }

        });


    });

    app.post('/updatePaymentStatus', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var id = 2;
        // var payment_status = "PAID";
        // var transaction_id = "XCVTEYI86632JN2N3W211098NDWS";
        // var paym_response = "SUCCESS";
        // var spay_mode = "ONLINE";
        // var user_id = 3;

        var id = req.body.id;
        var payment_status = req.body.payment_status;
        var transaction_id = req.body.transaction_id;
        var paym_response = req.body.paym_response;
        var spay_mode = req.body.spay_mode;
        var user_id = req.body.user_id;

        var username = await require('./config/findusername.js')(db, user_id);
        var get_time = await require('./config/time.js')(db);

        console.log(username);

        var insert_payment_history = 'INSERT INTO AmbulancePayment_history SET ?';

        var post_payment_history = {
            booking_id: id,
            sTransid: transaction_id,
            sPay_res: paym_response,
            sPayment_status: payment_status,
            sPayment_mode: spay_mode,
            sPaid_by: username,
            dCreated: get_time,
            sCreated_by: username,
            isActive: 1
        };

        db.query(insert_payment_history, post_payment_history, (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            var update_amb_booking = 'update tblAmbulanceBookingMaster SET sPaymentStatus=?,sModifiedBy=?,dModified=? where id=?';

            db.query(update_amb_booking, [payment_status, username, get_time, id], (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                return res.send({
                    status: 1,
                    message: `Payment updated`
                });

            });

        });

    });


    app.get('/viewDriverImages', function (req, res) {

        console.log("viewDriverImages API...");
        const MEDICALDIR = './uploads/driverImages/';

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

    app.post('/showAmbulanceBookingInfo', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var id = req.body.id;

        var show_amb_booking_info = 'select t1.id,t1.sAmbBookingID,t2.sName as "DriverName",t3.sContactNum, \
        concat(?,t3.sDriverProfilePath,t3.sDriverProfilePic) as "ProfilerURL",t4.sAmbulanceType as "AmbulanceType", \
        t1.iAmbulanceID as "AmbulanceId",t5.sRegistrationNum as "VechileNo",t1.sPickupLat,t1.sPickupLong,t1.sDropLat,t1.sDropLong, \
        t1.sPickupLocation,t1.sDropLocation,t6.sValue as "BookingStatus" \
        from tblAmbulanceBookingMaster t1 \
        join tblUserMaster t2 on t2.id=t1.iDriverID and t2.sActive=1 \
        join tblAmbulanceDriverdtls t3 on t3.sContactNum=t2.sMobileNum and t3.isActive=1 \
        join tblAmbulanceMaster t4 on t4.id=t1.iAmbulanceType and t4.isActive=1 \
        join tblAmbulancedtls t5 on t5.id=t1.iAmbulanceID and t5.isActive=1 \
        join tblAppConfig t6 on t6.id=t1.sStatus and t6.isActive=1 \
        where t1.id=? and t1.isActive=1';

        db.query(show_amb_booking_info, [ip, id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            return res.send(result);

        });

    });


    app.post('/getKms', async (req, res) => {

        console.log(req.body);

        var pickup_lat = req.body.pickup_lat;
        var pickup_long = req.body.pickup_long;
        var drop_lat = req.body.drop_lat;
        var drop_long = req.body.drop_long;

        var kms = await CalculateKms(pickup_lat, pickup_long, drop_lat, drop_long);

        console.log(kms);

        return res.send({
            kms: kms
        });

    });


    app.post('/updateAmbDriverLatLong',async(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        var driver_id=req.body.driver_id;
        var nLatitude=req.body.nLatitude;
        var nLongitude=req.body.nLongitude;

        var username = await require('./config/findusername.js')(db, user_id);
        var get_time = await require('./config/time.js')(db);

        var insert_driver_lat_long="INSERT INTO tblAmbdriverlatlongtracking SET ?";

        var post_driver_lat_long={
            driver_id:driver_id,
            nlatitude:nLatitude,
            nlongitude:nLongitude,
            dCreated_by:username,
            dCreated:get_time,
            isActive:1
        };

        db.query(insert_driver_lat_long,post_driver_lat_long,(err,result)=>{

            if(err){
                console.log(err.sqlMessage);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status:1,
                message:'Ambulance driver Lat Long Updated...'
            });

        });

    });

}
