var moment = require('moment');
var now = new Date();

module.exports = function (app) {

    app.post('/confirmAppointment', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var doctorid = 2;
        // var userid = 3;
        // var patientid = 3;
        // var date = moment("2021-02-13").format('YYYY-MM-DD');
        // var timeslot = 12;
        // var doctorstatusid = 29;
        // var patientstatusid = 26;
        // var patientType = "SELF";
        // var time = moment("10:30:00").format('YYYY-MM-DD HH:mm:ss');

        // var type="consultation";

        var doctorid = req.body.doctorid;
        var userid = req.body.userid;
        var patientid = req.body.patientid;
        var date = moment(req.body.date).format('YYYY-MM-DD');
        var timeslot = req.body.timeslot;
        var doctorstatusid = req.body.doctorstatusid;
        var patientstatusid = req.body.patientstatusid;
        var patientType = req.body.patientType;
        var time = moment(req.body.time).format('HH:mm:ss');
        var type = req.body.type;

        var getMaxId = 'select \
        CASE \
          WHEN max(id) IS NULL THEN 1 \
          WHEN max(id) IS NOT NULL THEN max(id) \
          END AS "max_value" \
        from tblAppointmentBookingMaster';

        db.query(getMaxId, (err, result) => {

            if (err) {
                console.log(err);
                return res.send(err.sqlMessage);
            }

            console.log(result);

            var max_value = result[0].max_value + 1;

            var id_length = max_value.toString().length;

            console.log("Id length:");

            console.log(id_length);

            var booking_id = "";

            if (id_length == 1) {
                booking_id = "MEDI0000".concat(max_value);
            }
            else if (id_length == 2) {
                booking_id = "MEDI000".concat(max_value);
            }
            else if (id_length == 3) {
                booking_id = "MEDI00".concat(max_value);
            }
            else if (id_length == 4) {
                booking_id = "MEDI0".concat(max_value);
            }
            else if (id_length == 5) {
                booking_id = "MEDI".concat(max_value);
            }

            console.log("Booking Id:");

            console.log(booking_id);

            var get_Username = 'select sName,sMobileNum from tblUserMaster where id=? and sActive=1';

            db.query(get_Username, [userid], async (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var user_name = result2[0].sMobileNum;

                var get_time = await require('./config/time.js')(db);

                var insert_booking_appointment = 'INSERT INTO tblAppointmentBookingMaster SET ?';

                var post_booking_appointment = {
                    sAppointmentID: booking_id,
                    iUserID: userid,
                    iDoctorID: doctorid,
                    ipatientID: patientid,
                    iDocStatus: doctorstatusid,
                    iUserStatus: patientstatusid,
                    sPatientType: patientType,
                    type: type,
                    dDate: date,
                    tTime: time,
                    sCreatedBy: user_name,
                    dCreated: get_time,
                    sActive: 1
                };

                db.query(insert_booking_appointment, post_booking_appointment, async (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    var appointment_id = result3.insertId;

                    var doctor_status = await require('./config/findstatusvalue.js')(doctorstatusid, db);
                    var patient_status = await require('./config/findstatusvalue.js')(patientstatusid, db);

                    var insert_booking_status_dtls = 'INSERT INTO tblAppointmentBookingStatusdtls SET ?';

                    var post_booking_status_dtls = {
                        iAppointmentid: appointment_id,
                        iDocStatus: doctorstatusid,
                        iUserStatus: patientstatusid,
                        sDocStatus: doctor_status,
                        sUserStatus: patient_status,
                        sCreatedBy: user_name,
                        dCreated: get_time,
                        sActive: 1
                    };

                    db.query(insert_booking_status_dtls, post_booking_status_dtls, (err, result4) => {

                        if (err) {

                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });

                        }

                        console.log(result4);

                        var book_slot_for_booking = 'update tblDocScheduledtls SET iAllocated=1,iAppointmentId=?,dModified=?,sModifiedBy=? where id=?';

                        db.query(book_slot_for_booking, [appointment_id, get_time, user_name, timeslot], (err, result) => {

                            if (err) {

                                console.log(err.sqlMessage);

                                return res.send({
                                    status: 0,
                                    message: err.sqlMessage
                                });
                            }

                            console.log(result);

                            return res.send({
                                status: 1,
                                message: 'Appointment Booked'
                            });

                        });


                    });

                });

            });


        });

    });


    app.post('/patientupcomingAppointments', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userid = req.body.userid;

        var patient_upcoming_appointments = 'select t1.id,t1.type,t1.sAppointmentID,t2.sName as "Dr_Name",DATE_FORMAT(t4.dDate, "%d %b %Y") as "Date", \
        TIME_FORMAT(t4.dTime,"%h:%i %p") as "Time", \
        t3.sHospital as "hospitalname",t5.doctor_status_id,t5.patient_status_id,t5.patient_Label as "Label",t5.id as "Label_id" \
        from tblAppointmentBookingMaster t1 \
        join tblUserMaster t2 on t2.id=t1.iDoctorID and t2.sActive=1 \
        join tblDoctorMaster t3 on t3.sMobileNumber=t2.sMobileNum and t3.sActive=1 \
        join tblDocScheduledtls t4 on t4.iAppointmentId=t1.id and t4.isActive=1 and now() < t4.dTime \
        join tblstatusflowlabel t5 on t5.doctor_status_id=t1.iDocStatus and t5.patient_status_id=t1.iUserStatus and t5.isActive=1 \
        where t1.iUserID=? and t1.sActive=1 order by t1.id desc';

        db.query(patient_upcoming_appointments, [userid], (err, result) => {

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

    app.post('/doctorupcomingAppointments', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var doctorid = req.body.doctorid;

        var doctor_upcoming_appointments = 'select t1.id ,t1.type, t1.sAppointmentID, \
        t1.sPatientType, \
            (CASE \
              WHEN t1.sPatientType = "SELF" THEN t2.sName \
              WHEN t1.sPatientType = "OTHERS" THEN t3.sName \
              END) as "Pt_name", \
              DATE_FORMAT(t4.dDate,"%d %b %Y") as "Date" ,TIME_FORMAT(t4.dTime,"%h:%i %p") as "time", \
               t6.sHospital as "hospitalname" \
               ,t7.doctor_status_id,t7.patient_status_id,t7.doctor_Label as "Label",t7.id as "Label_id",t6.sConsultationfee as "consultationFees" \
        from \
        tblAppointmentBookingMaster t1 \
        LEFT OUTER JOIN tblUserMaster t2 on t2.id=t1.ipatientID and t2.sActive=1 \
        LEFT OUTER JOIN tblFamilyMemberdtls t3 on t3.id=t1.ipatientID and t3.isActive=1 \
        JOIN tblDocScheduledtls t4 on t4.iAppointmentId=t1.id and t4.isActive=1 and now() < t4.dTime \
        JOIN tblUserMaster t5 on t5.id=t1.iDoctorID and t5.sActive=1 \
        JOIN tblDoctorMaster t6 on t6.sMobileNumber=t5.sMobileNum and t6.sActive=1 \
        left join tblstatusflowlabel t7 on t7.doctor_status_id=t1.iDocStatus and t7.patient_status_id=t1.iUserStatus and t7.isActive=1 \
        where t1.iDoctorID=? and t1.sActive=1 order by t1.id desc';

        db.query(doctor_upcoming_appointments, [doctorid], (err, result) => {

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



    app.post('/PatientpastAppointments', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userid = req.body.userid;

        var past_patient_appointments = 'select t1.id ,t1.type,t1.sAppointmentID,t3.sName as "Dr_Name",DATE_FORMAT(t4.dDate, "%d %b %Y") as "Date", \
        TIME_FORMAT(t4.dTime,"%h:%i %p") as "Time", \
        t3.sHospital as "hospitalname" \
        from tblAppointmentBookingMaster t1 \
        join tblUserMaster t2 on t2.id=t1.iDoctorID and t2.sActive=1 \
        join tblDoctorMaster t3 on t3.sMobileNumber=t2.sMobileNum and t3.sActive=1 \
        join tblDocScheduledtls t4 on t4.iAppointmentId=t1.id and t4.isActive=1 and now() > t4.dTime \
        where t1.iUserID=? and t1.sActive=1 order by t1.id desc';

        db.query(past_patient_appointments, [userid], (err, result) => {

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


    app.post('/DoctorpastAppointments', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var doctorid = req.body.doctorid;

        var past_Doctor_appointments = 'select t1.id,t1.type, t1.sAppointmentID, \
        t1.sPatientType, \
            (CASE \
              WHEN t1.sPatientType = "SELF" THEN t2.sName \
              WHEN t1.sPatientType = "OTHERS" THEN t3.sName \
              END) as "patientname", \
              DATE_FORMAT(t4.dDate,"%d %b %Y") as "Date" ,TIME_FORMAT(t4.dTime,"%h:%i %p") as "time" \
        from \
        tblAppointmentBookingMaster t1 \
        LEFT OUTER JOIN tblUserMaster t2 on t2.id=t1.ipatientID and t2.sActive=1 \
        LEFT OUTER JOIN tblFamilyMemberdtls t3 on t3.id=t1.ipatientID and t3.isActive=1 \
        JOIN tblDocScheduledtls t4 on t4.iAppointmentId=t1.id and t4.isActive=1 and  now() > t4.dTime \
        where t1.iDoctorID=? and t1.sActive=1';

        db.query(past_Doctor_appointments, [doctorid], (err, result) => {

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


    function groupBy(arr, property) {

        return arr.reduce(function (memo, x) {
            if (!memo[x[property]]) { memo[x[property]] = []; }
            memo[x[property]].push(x);
            return memo;
        }, {});

    }

    app.post('/showslotstoPatient', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var doctorid = req.body.doctorid;

        var show_time_slot = 'select t2.id as "SeqID",TIME_FORMAT(t2.dTime,"%h:%i %p") as "slots",t2.sSession as "SessionID", "false" as "selected",t2.dTime as "Time" \
        from tblDocScheduleMaster t1 \
        join tblDocScheduledtls t2 on t2.iDocScheduleMasterID=t1.id and t2.isActive=1 \
        where t1.iDoctorID=? and t2.iAllocated=0 \
        and DATE_FORMAT(t2.dDate,"%M %d %Y")=(DATE_FORMAT(now(),"%M %d %Y")) \
        and TIME_FORMAT(t2.dTime,"%H:%i:%s") >=TIME_FORMAT(current_timestamp(),"%H:%i:%s") \
        and t1.isActive=1';

        db.query(show_time_slot, [doctorid], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var o = groupBy(result, 'SessionID');

            console.log(o);

            var demoObject = {};

            console.log(demoObject);

            var dateslot = 'select date_format(t2.dDate,"%Y-%m-%d") as "datestring",date_format(t2.dDate,"%a") as "day", \
            date_format(t2.dDate,"%d") as "date","false" as "selected",date_format(t2.dDate,"%b %Y") as "year" \
            from tblDocScheduleMaster t1 \
            join tblDocScheduledtls t2 on t2.iDocScheduleMasterID=t1.id and t2.isActive=1 \
            where t1.iDoctorID=? and t2.iAllocated=0 and (t2.dDate BETWEEN DATE_SUB(NOW(),INTERVAL 1 DAY ) AND DATE_ADD(NOW(), INTERVAL 6 DAY)) \
            and t1.isActive=1 group by t2.dDate';

            db.query(dateslot, [doctorid], (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                demoObject["dateslot"] = result2;

                console.log("After dateSlot.....");

                console.log(demoObject);

                demoObject["timeslot"] = o;

                console.log(typeof demoObject["timeslot"].morning === 'undefined');
                console.log(typeof demoObject["timeslot"].afternoon === 'undefined');
                console.log(typeof demoObject["timeslot"].evening === 'undefined');
                console.log(typeof demoObject["timeslot"].night === 'undefined');

                if (typeof demoObject["timeslot"].morning === 'undefined') {
                    demoObject["timeslot"].morning = [];

                }
                if (typeof demoObject["timeslot"].afternoon === 'undefined') {
                    demoObject["timeslot"].afternoon = [];

                }
                if (typeof demoObject["timeslot"].evening === 'undefined') {
                    demoObject["timeslot"].evening = [];

                }
                if (typeof demoObject["timeslot"].night === 'undefined') {
                    demoObject["timeslot"].night = [];
                }

                console.log(demoObject);

                return res.send(demoObject);

            });

        });

    });

    app.post('/showslotstoPatientbasedDate', (req, res) => {

        var db = require("./config/config.js").db;

        var doctorid = req.body.doctorid;

        var date = req.body.date;

        var check_curdate = 'select curdate()=? as "check_value"';

        db.query(check_curdate, [date], (err, result10) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }
            else {

                console.log(result10);

                if (result10[0].check_value == 1) { // curdate()

                    var show_time_slot = 'select t2.id as "SeqID",TIME_FORMAT(t2.dTime,"%h:%i %p") as "slots",t2.sSession as "SessionID", "false" as "selected",t2.dTime as "Time"  \
                    from tblDocScheduleMaster t1 \
                    join tblDocScheduledtls t2 on t2.iDocScheduleMasterID=t1.id and date_format(t2.dDate,"%Y-%m-%d")=? \
                    and t2.iAllocated=0 and t2.isActive=1 \
                    where t1.iDoctorID=? and t1.isActive=1 \
                    and DATE_FORMAT(t2.dDate,"%M %d %Y")=(DATE_FORMAT(now(),"%M %d %Y")) \
                    and TIME_FORMAT(t2.dTime,"%H:%i:%s") >=TIME_FORMAT(current_timestamp(), "%H:%i:%s")';

                    db.query(show_time_slot, [date, doctorid], (err, result) => {

                        if (err) {

                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });

                        }

                        console.log(result);

                        var o = groupBy(result, 'SessionID');

                        console.log(o);

                        var demoObject = {};

                        console.log(demoObject);

                        demoObject["timeslot"] = o;

                        console.log(typeof demoObject["timeslot"].morning === 'undefined');
                        console.log(typeof demoObject["timeslot"].afternoon === 'undefined');
                        console.log(typeof demoObject["timeslot"].evening === 'undefined');
                        console.log(typeof demoObject["timeslot"].night === 'undefined');

                        if (typeof demoObject["timeslot"].morning === 'undefined') {
                            demoObject["timeslot"].morning = [];

                        }
                        if (typeof demoObject["timeslot"].afternoon === 'undefined') {
                            demoObject["timeslot"].afternoon = [];

                        }
                        if (typeof demoObject["timeslot"].evening === 'undefined') {
                            demoObject["timeslot"].evening = [];

                        }
                        if (typeof demoObject["timeslot"].night === 'undefined') {
                            demoObject["timeslot"].night = [];
                        }

                        return res.send(demoObject);

                    });

                }
                else { //not Curdate()

                    var show_time_slot = 'select t2.id as "SeqID",TIME_FORMAT(t2.dTime,"%h:%i %p") as "slots",t2.sSession as "SessionID", "false" as "selected",t2.dTime as "Time"  \
                    from tblDocScheduleMaster t1 \
                    join tblDocScheduledtls t2 on t2.iDocScheduleMasterID=t1.id and date_format(t2.dDate,"%Y-%m-%d")=? \
                    and t2.iAllocated=0 and t2.isActive=1 \
                    where t1.iDoctorID=? and t1.isActive=1 \
                    and DATE_FORMAT(t2.dDate,"%M %d %Y")=(DATE_FORMAT(?,"%M %d %Y")) ';

                    db.query(show_time_slot, [date, doctorid,date], (err, result) => {

                        if (err) {

                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });

                        }

                        console.log(result);

                        var o = groupBy(result, 'SessionID');

                        console.log(o);

                        var demoObject = {};

                        console.log(demoObject);

                        demoObject["timeslot"] = o;

                        console.log(typeof demoObject["timeslot"].morning === 'undefined');
                        console.log(typeof demoObject["timeslot"].afternoon === 'undefined');
                        console.log(typeof demoObject["timeslot"].evening === 'undefined');
                        console.log(typeof demoObject["timeslot"].night === 'undefined');

                        if (typeof demoObject["timeslot"].morning === 'undefined') {
                            demoObject["timeslot"].morning = [];

                        }
                        if (typeof demoObject["timeslot"].afternoon === 'undefined') {
                            demoObject["timeslot"].afternoon = [];

                        }
                        if (typeof demoObject["timeslot"].evening === 'undefined') {
                            demoObject["timeslot"].evening = [];

                        }
                        if (typeof demoObject["timeslot"].night === 'undefined') {
                            demoObject["timeslot"].night = [];
                        }

                        return res.send(demoObject);

                    });

                }

            }

        });


    });

    app.post('/showAppointmentstoDoctor', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var doctorid = req.body.doctorid;

        var show_appointments = 'select t1.id, t1.sAppointmentID, \
    t1.sPatientType, \
        (CASE \
          WHEN t1.sPatientType = "SELF" THEN t2.sName \
          WHEN t1.sPatientType = "OTHERS" THEN t3.sName \
          END) as "patientname", \
          DATE_FORMAT(t4.dDate,"%M %d %Y") as "Date" ,TIME_FORMAT(t4.dTime,"%h:%i %p") as "time" \
    from \
    tblAppointmentBookingMaster t1 \
    LEFT OUTER JOIN tblUserMaster t2 on t2.id=t1.ipatientID and t2.sActive=1 \
    LEFT OUTER JOIN tblFamilyMemberdtls t3 on t3.id=t1.ipatientID and t3.isActive=1 \
    LEFT OUTER JOIN tblDocScheduledtls t4 on t4.iAppointmentId=t1.id and t4.isActive=1 \
    where t1.iDoctorID=? and t1.iDocStatus=26 and t1.iUserStatus=29 and t1.sActive=1';

        db.query(show_appointments, [doctorid], (err, result) => {

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

    app.post('/updatedoctorStatus', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        // var id = 1;

        // var label_id = 1;

        // var doctor_id = 1;

        var id = req.body.id;

        var label_id = req.body.label_id;

        var doctor_id = req.body.doctor_id;

        var doctor_name = 'SELECT sName FROM tblUserMaster where id=? and sActive=1';

        db.query(doctor_name, [doctor_id], async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var doctor_name = result[0].sName;

            var get_time = await require('./config/time.js')(db);

            console.log(get_time);

            if (label_id == 1) { // Accept

                var doctor_status_id = 30; // Accepted
                var patient_status_id = 27; // Not Paid

                var doctor_status = await require('./config/findstatusvalue.js')(doctor_status_id, db);
                var patient_status = await require('./config/findstatusvalue.js')(patient_status_id, db);

                var update_appointment_status = 'update tblAppointmentBookingMaster set iDocStatus=?,iUserStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [doctor_status_id, patient_status_id, doctor_name, get_time, id], (err, result2) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    var insert_appointment_status_dtls = 'INSERT INTO tblAppointmentBookingStatusdtls SET ?';

                    var post_appointment_status = {
                        iAppointmentid: id,
                        iDocStatus: doctor_status_id,
                        iUserStatus: patient_status_id,
                        sDocStatus: doctor_status,
                        sUserStatus: patient_status,
                        sCreatedBy: doctor_name,
                        dCreated: get_time,
                        sActive: 1
                    };

                    db.query(insert_appointment_status_dtls, post_appointment_status, (err, result3) => {

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
                            message: 'Booking has been Accepted Successfully'
                        });

                    });
                });

            }
            else {
                return res.send({
                    status: 0,
                    message: 'Label Not Found'
                });
            }

        });

    });

    app.post('/updatepatientstatus', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        // var id = 1;

        // var label_id = 2;

        // var doctor_id = 1;

        var id = req.body.id;

        var label_id = req.body.label_id;

        var doctor_id = req.body.doctor_id;

        var doctor_name = 'SELECT sName FROM tblUserMaster where id=? and sActive=1';

        db.query(doctor_name, [doctor_id], async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var doctor_name = result[0].sName;

            var get_time = await require('./config/time.js')(db);

            console.log(get_time);

            if (label_id == 2) { // PAY NOW & SUCCESS

                var doctor_status_id = 31; // scheduled
                var patient_status_id = 28; // scheduled

                var doctor_status = await require('./config/findstatusvalue.js')(doctor_status_id, db);
                var patient_status = await require('./config/findstatusvalue.js')(patient_status_id, db);

                var update_appointment_status = 'update tblAppointmentBookingMaster set iDocStatus=?,iUserStatus=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_appointment_status, [doctor_status_id, patient_status_id, doctor_name, get_time, id], (err, result2) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    var insert_appointment_status_dtls = 'INSERT INTO tblAppointmentBookingStatusdtls SET ?';

                    var post_appointment_status = {
                        iAppointmentid: id,
                        iDocStatus: doctor_status_id,
                        iUserStatus: patient_status_id,
                        sDocStatus: doctor_status,
                        sUserStatus: patient_status,
                        sCreatedBy: doctor_name,
                        dCreated: get_time,
                        sActive: 1
                    };

                    db.query(insert_appointment_status_dtls, post_appointment_status, (err, result3) => {

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
                            message: 'PATIENT PAID'
                        });

                    });
                });

            }
            else {
                return res.send({
                    status: 0,
                    message: 'Label Not Found'
                });
            }

        });

    });


}
