
module.exports = function (app) {

    app.post('/requestBlood', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        const { patientName,
            contactName,
            contactNumber,
            emailID, bldType,
            city, units,
            reqDate, doctorName,
            hospName,
            comments, userId } = req.body;

        const reqCodeBldID = req.body.reqCodeBldID ? req.body.reqCodeBldID : null;

        var check_available = 'select count(*) as "isAvailable" from tblBldRequest where id=? and isActive=1';

        db.query(check_available, [reqCodeBldID], async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                })
            }

            console.log("result", result);

            if (result[0].isAvailable == 0) { // NOT AVAILABLE

                console.log(`New Blood request...`);

                var get_time = await require('./config/time.js')(db);
                var get_user_name = await require('./config/findusername')(db, userId)

                console.log(get_time);

                var insert_bloodRequest = 'INSERT INTO tblBldRequest SET ?';

                var getMaxId = 'select \
                CASE \
                  WHEN max(id) IS NULL THEN 1 \
                  WHEN max(id) IS NOT NULL THEN max(id) \
                  END AS "max_value" \
                from tblBldRequest';

                db.query(getMaxId, (err, result3) => {



                    if (err) {
                        console.log(err);
                        return res.send(err.sqlMessage);
                    }

                    console.log(result3);

                    var max_value = result3[0].max_value + 1;

                    var id_length = max_value.toString().length;

                    console.log("Id length:");

                    console.log(id_length);

                    var reqCodeBldID = "";

                    if (id_length == 1) {
                        reqCodeBldID = "BLDR0000".concat(max_value);
                    }
                    else if (id_length == 2) {
                        reqCodeBldID = "BLDR000".concat(max_value);
                    }
                    else if (id_length == 3) {
                        reqCodeBldID = "BLDR00".concat(max_value);
                    }
                    else if (id_length == 4) {
                        reqCodeBldID = "BLDR0".concat(max_value);
                    }
                    else if (id_length == 5) {
                        reqCodeBldID = "BLDR".concat(max_value);
                    }

                    console.log("Booking Id:");

                    console.log(reqCodeBldID);

                    var post_bloodRequest = {
                        sPatientName: patientName,
                        sBldRequestID: reqCodeBldID,
                        sContactNumber: contactNumber,
                        sContactName: contactName,
                        iCurrentIntrestedStatus: 0,
                        seMailID: emailID,
                        sBldTYpe: bldType,
                        nUnits: units,
                        sCity: city,
                        dReqDate: reqDate,
                        sDoctorName: doctorName,
                        sHospName: hospName,
                        sComments: comments,
                        userId: userId,
                        sCreatedBy: get_user_name,
                        dCreated: get_time,
                        isActive: 1
                    };

                    db.query(insert_bloodRequest, post_bloodRequest, async (err, result2) => {

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
                            message: 'success',

                        });

                    })
                });

            }
            else {

                console.log(`Existing BldRequester....`);

                var get_time = await require('./config/time.js')(db);
                var get_user_name = await require('./config/findusername')(db, userId)

                var update_reqBld = `update tblBldRequest SET ? where id='${reqCodeBldID}' and isActive=1`;

                const update_obj = {
                    sPatientName: patientName,
                    sContactNumber: contactNumber,
                    sContactName: contactName,
                    seMailID: emailID,
                    sBldTYpe: bldType,
                    nUnits: units,
                    sCity: city,
                    dReqDate: reqDate,
                    sDoctorName: doctorName,
                    sHospName: hospName,
                    sComments: comments,
                    userId: userId,
                    sModifiedBy: get_user_name,
                    dModified: get_time,
                    isActive: 1
                }


                db.query(update_reqBld, update_obj, (err, result6) => {

                    if (err) {
                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    return res.send({
                        status: 1,
                        message: 'success',

                    });

                });

            }

        });
    });

    // view and get


    app.get('/getAllRequestBlood/:id', (req, res) => {

        var db = require('./config/config.js').db;
        
        var id=req.params.id;

        const getAlldata = 'SELECT t1.userId,t1.id,t1.sBldRequestID,t1.sPatientName,t1.sContactName,t1.sContactNumber,t1.seMailID, \
        t1.sBldTYpe,t1.nUnits,t1.sCity,t1.dReqDate,t1.sDoctorName,t1.sHospName,t1.sComments,t2.TotalUnitCounts,t1.iIntrestedCount, \
        IFNULL(t3.iCurrentIntrestedStatus,0) as "iCurrentIntrestedStatus" \
        FROM tblBldRequest t1 \
        left join (select iBldReqID,SUM(nUnits) as "TotalUnitCounts" from tblBldRequestdtls where isActive=1 group by iBldReqID) t2 \
        on t2.iBldReqID=t1.id \
        left join tblBldRequestInterset t3 on t3.iBldReqID=t1.id and t3.iUserid=? \
        where t1.isActive=1';

        db.query(getAlldata,[id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage)

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                })
            }

            console.log(result)

            if (result.length > 0) {

                return res.send({
                    status: 1,
                    data: result
                });

            } else {

                return res.send({
                    status: 0,
                    data: result
                });
            }


        })
    });


    app.get('/showBloodRequest/:id', (req, res) => {

        var db = require('./config/config.js').db;

        var id = req.params.id;

        console.log(id);

        const selectedIdQuery = ` SELECT t1.userId,t1.sBldRequestID
        ,t1.sPatientName,t1.sContactName,t1.sContactNumber,t1.seMailID,                                                           
        t1.sBldTYpe,t1.nUnits,t1.sCity,t1.dReqDate,t1.sDoctorName,t1.sHospName,t1.sComments                                                                   
        from tblBldRequest t1                                                                           
        where t1.id=? and t1.isActive=1`;

        db.query(selectedIdQuery, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var get_donar_data = 'SELECT iBldReqID,nUnits,donorName,donorContactNumber,donorDate FROM tblBldRequestdtls where iBldReqID=? and isActive=1';

            db.query(get_donar_data, [id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                if (result.length > 0) {
                    result[0].donar_details = result2;
                }

                console.log(result2);

                if (result.length > 0) {

                    return res.send({
                        status: 1,
                        data: result
                    });

                } else {
                    return res.send({
                        status: 0,
                        data: result
                    })
                }

            });

        });

    });

    app.post('/deleteRequestBlood', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        const reqCodeBldID = req.body.reqCodeBldID;

        const updateDeleteReqBlood = 'update tblBldRequest SET isActive=0 where id=?';

        const deleteReqBloodDtls = 'update tblBldRequestdtls SET isActive=0 where iBldReqID=?';

        db.query(updateDeleteReqBlood, [reqCodeBldID], (err, result3) => {

            if (err) {

                console.log(err)

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result3);

            db.query(deleteReqBloodDtls, [reqCodeBldID], (err, result4) => {

                if (err) {

                    console.log(err);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    })
                }

                console.log(result4);

                return res.send({
                    status: 1,
                    message: "successfully deleted "
                });

            });

        })

    });


    app.post('/updateDonorbloodReq', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);
        // id->bldreqID
        const { donorName, donorContactNumber, Units, Date, Id, donorID, userId } = req.body;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, userId);

        var check_blood_req_units = 'select SUM(t1.nUnits) as "noofunitsconsumed",t2.nUnits as "noofunitsrequired" \
        from tblBldRequestdtls t1 \
        join tblBldRequest t2 on t2.id=t1.iBldReqID and t2.isActive=1 \
        where t1.iBldReqID=? and t1.isActive=1';

        db.query(check_blood_req_units, [Id], (err, result2) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result2);

            var totalreceivedunits = result2[0].noofunitsconsumed + Units;

            if (totalreceivedunits <= result2[0].noofunitsrequired) {

                var insert_donor_blood = 'INSERT INTO tblBldRequestdtls SET ?';

                var post_donor_blood = {
                    iBldReqID: Id,
                    iDonorID: donorID,
                    donorName: donorName,
                    donorContactNumber: donorContactNumber,
                    donorDate: Date,
                    nUnits: Units,
                    dCreated: get_time,
                    sCreatedBy: get_user_name,
                    isActive: 1,
                };

                db.query(insert_donor_blood, post_donor_blood, (err, result) => {

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
                        message: 'Donor Blood Requests Updated...'
                    });

                });

            }
            else {

                var required = result2[0].noofunitsrequired - result2[0].noofunitsconsumed;

                return res.send({
                    status: 1,
                    message: `You are giving extra units.we need ${required} units Only`
                });

            }


        });

    });


    app.post('/provideSOSEmergency', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = 65;
        var userid = 1;

        // var id = req.body.id;
        // var userid=req.body.userid;

        if (id == 61 || id == 62 || id == 63 || id == 66) { //Ambulance,Fire Service,police,Medical Counsillor

            var get_services = 'SELECT sDescription as "sRelationName",sValue as "sRelationPhNo" FROM tblAppConfig where id=?';

            db.query(get_services, [id], (err, result) => {

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
        }
        else {

            if (id == 64) { //Neighbour

                var get_memebers = 'select sRelationName,sRelationPhNo from tblUserRelation \
                where iUserid=? and (sRelationName="FAMILY MEMBERS" OR sRelationName="NEIGHBOUR") and isActive=1';

                db.query(get_memebers, [userid], (err, result) => {

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

            }
            else {  // DOCTOR

                var get_memebers = 'select sRelationName,sRelationPhNo from tblUserRelation \
                where iUserid=? and sRelationName="DOCTOR" and isActive=1';

                db.query(get_memebers, [userid], (err, result) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result);

                    if (result.length == 0) {

                        var get_services = 'SELECT sDescription as "sRelationName",sValue as "sRelationPhNo" FROM tblAppConfig where id=?';

                        db.query(get_services, [id], (err, result2) => {

                            if (err) {

                                console.log(err.sqlMessage);

                                return res.send({
                                    status: 0,
                                    message: err.sqlMessage
                                });
                            }

                            console.log(result2);

                            return res.send(result2);

                        });

                    }
                    else {

                        return res.send(result);

                    }

                });

            }

        }

    });

    function updateIntersetStatus(iUserid, bldReqid, status, db, username, get_time) {

        return new Promise((resolve, reject) => {


            var check_interseted_count = 'select iIntrestedCount from tblBldRequest where id=? and isActive=1';

            db.query(check_interseted_count, [bldReqid], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);

                }

                console.log(result);

                var update_value;

                if (status == 1) {
                    update_value = result[0].iIntrestedCount + 1;
                }
                else {
                    update_value = result[0].iIntrestedCount - 1;
                }

                console.log("******");
                console.log(update_value);
                console.log(status);

                var update_interseted = 'update tblBldRequest set iIntrestedCount=?,sModifiedBy=?,dModified=? where id=?';

                db.query(update_interseted, [update_value, username, get_time, bldReqid], (err, result2) => {

                    if (err) {
                        console.log(err.sqlMessage);
                    }

                    console.log(result2);

                    return resolve();

                });
            });

        });
    }

    app.post('/updateInterestforBldReq', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var iUserid = req.body.iUserid;
        // var bldReqid = req.body.bldReqid;
        // var status = req.body.status;

        var iUserid = 76;
        var bldReqid = 6;
        var status = 1;

        var username = await require('./config/findusername.js')(db, iUserid);
        var get_time = await require('./config/time.js')(db);


        var check_already_interset = 'select * from tblBldRequestInterset where iUserid=? and iBldReqId =? and isActive=1';

        db.query(check_already_interset, [iUserid, bldReqid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                var insert_BldRequestInterset = 'INSERT INTO tblBldRequestInterset SET ?';

                var post_BldRequestInterset = {
                    iUserid: iUserid,
                    iBldReqId: bldReqid,
                    iCurrentIntrestedStatus: status,
                    sCreated_by: username,
                    dCreated_at: get_time,
                    isActive: 1
                };

                db.query(insert_BldRequestInterset, post_BldRequestInterset, async (err, result2) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    await updateIntersetStatus(iUserid, bldReqid, status, db, username, get_time);

                    return res.send({
                        status:1,
                        message:'Updated'
                    });

                });

            }
            else {

                var update_Bld_interest = 'update tblBldRequestInterset SET iCurrentIntrestedStatus=?,sModified_by=?,dModified_at=? where iUserid=? and iBldReqId=?';

                db.query(update_Bld_interest, [status, username, get_time, iUserid, bldReqid], async(err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    await updateIntersetStatus(iUserid, bldReqid, status, db, username, get_time);

                    return res.send({
                        status:1,
                        message:'Updated'
                    });


                });

            }

        });

    });

   
    app.post('/showUserBloodRequest',(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        var userid=req.body.userid;

        var show_user_blood_request='SELECT t1.id,t1.sBldRequestID,t1.userId,t1.sPatientName,t1.sContactName,IFNULL(t1.iIntrestedCount,0) as "iIntrestedCount", \
        t1.sContactNumber,t1.seMailID,t1.sBldTYpe,t1.nUnits,t1.sCity,DATE_FORMAT(t1.dReqDate,"%d %b %Y") as "Req_date",t1.sDoctorName, \
        t1.sHospName,t1.sComments,IFNULL(t2.iCurrentIntrestedStatus,0) as "iCurrentIntrestedStatus" \
        FROM tblBldRequest t1 \
        left join tblBldRequestInterset t2 on t2.iBldReqId=t1.id and t2.iUserid=t1.userId and t2.isActive=1 \
        where t1.userId=? and t1.isActive=1';

        db.query(show_user_blood_request,[userid],(err,result)=>{

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
                data:result
            });

        });

    });


    app.post('/showBldReqIntrestedList',async(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        var bldReqid=req.body.bldReqid;

        var show_donor_bldreq='select t1.iUserid,t1.iBldReqId,t1.iCurrentIntrestedStatus,t2.sName,t2.sAddress,t2.sLat,t2.sLong,t2.sMobileNum,concat(?,t2.sProfileUrl,sProfilePic) as "ImgUrl" \
        from tblBldRequestInterset t1 \
        left join tblUserMaster t2 on t2.id=t1.iUserid \
        where t1.iBldReqId=? and t1.iCurrentIntrestedStatus=1 and t1.isActive=1';

        db.query(show_donor_bldreq,[bldReqid],(err,result)=>{

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
                data:result
            });

        });

    });

}
