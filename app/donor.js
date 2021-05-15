var moment = require('moment');
var now = new Date();
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var url = require('url');
var ip = require("./config/ipaddressconfig.js").ipaddress;

const DONORDIR = './uploads/donorProofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DONORDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

// const upload = multer({
//     storage: storage
// });

const upload = multer({
    storage: storage
}).fields([{ name: "IdProof" }, { name: "PhotoProof" }]);

module.exports = function (app) {

    var donors_id = [];

    function FindDistance(lat1, lon1, lat2, lon2, id, search_donor_distance) {

        return new Promise((resolve, reject) => {

            console.log(lat1);

            console.log(lat2);

            console.log(lon1);
            console.log(lon2);

            if ((lat1 == lat2) && (lon1 == lon2)) {

                donors_id.push({ "id": id, "Km": 0 });
                return resolve();
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
                // if (unit == "K") {
                console.log("id:" + id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log(dist);
                if (dist <= search_donor_distance) {
                    donors_id.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();

                // }
                // if (unit == "N") {
                //     console.log("nautical miles");
                //     dist = dist * 0.8684;
                //     return resolve(dist);
                // }
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



    function fileRenameandUploadinDB(filename, id) {

        console.log("****************************");

        console.log(id);

        console.log(filename.originalname);

        var file_type = filename.originalname;

        console.log(file_type.split('.')[1]);

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(DONORDIR, filename.originalname);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = id + "." + file_type.split('.')[1];

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(DONORDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var Fileurl = `viewdonorProofUpload/?docname=`;

            console.log(Fileurl);

            return resolve({ Fileurl: Fileurl, newFileName: newGeneratedFileName });

        });

    }

    app.get('/viewdonorProofUpload', (req, res) => {

        const imageDir = './uploads/donorProofs/';

        var id = req.params.id;
        console.log(id);

        var query = url.parse(req.url, true).query;
        pic = query.docname;

        console.log("url");
        console.log(req.url);

        console.log("pic");
        console.log(pic);

        if (typeof pic === 'undefined') {
            console.log("undefined in...");

        } else {
            console.log("Not undefined");
            //read the image using fs and send the image content back in the response
            fs.readFile(imageDir + pic, function (err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {
                    //specify the content type in the response will be an image
                    res.writeHead(200, { 'Content-type': 'image/jpg' });
                    res.end(content);
                }
            });
        }

    });

    function deleteExistFile(iUserID, db) {

        return new Promise((resolve, reject) => {

            let getExistImage = 'select sPhotoProofFileName from tblblddonor where iUserID=?';

            db.query(getExistImage, [iUserID], (err, result) => {

                if (err) return console.log(err);

                console.log(result[0]);

                if (result[0].sPhotoProofFileName == undefined || result[0].sPhotoProofFileName == '') {
                    console.log('result.imgFileName', result[0].sPhotoProofFileName);
                    return resolve();
                }

                if (result.length > 0) {

                    var oldFileName = path.join(DONORDIR, result[0].sPhotoProofFileName);

                    console.log("----------");

                    console.log(oldFileName);

                    fs.unlink(oldFileName, (err) => {
                        if (err) return reject(err);
                        console.log("file deleted in folder...");

                        return resolve();
                    });
                }
                else {
                    return resolve();
                }


            });
        });
    }

    app.post('/Createdonor', upload, async(req, res) => {

        var db = require('./config/config.js').db;

        let eventEmit = require('./eventEmit')

        console.log(req.body);

        console.log(req.files, '******');

        // var iUserID = 88;
        // var sDonorName = "Vignesh RaviKumar";
        // var sBloodgroup = "A-";
        // var sOptionfrDonation = "12 Months";
        // var sPreRemainderService = "EMAIL";
        // var sAddress = "No. 13 Anna Nagar Chennai";
        // var sLatitude = "91.0989011";
        // var sLongitude = "12.9090901";
        // var sContactNo = "9597653749";
        // var sIDProofType = "Pan Card";
        // var sEmail="vigneshravideveloper@gmail.com";

        var iUserID = req.body.iUserID;
        var sDonorName = req.body.sDonorName;
        var sBloodgroup = req.body.sBloodgroup;
        var sOptionfrDonation = req.body.sOptionfrDonation;
        var sPreRemainderService = req.body.sPreRemainderService;
        var sAddress = req.body.sAddress;
        var sLatitude = req.body.sLatitude;
        var sLongitude = req.body.sLongitude;
        var sContactNo = req.body.sContactNo;
        var sIDProofType = req.body.sIDProofType;
        var sEmail=req.body.sEmail;

        var username = await require('./config/findusername.js')(db, iUserID);

        var get_time = await require('./config/time.js')(db);

        var check_already_donor = 'select id from tblblddonor where iUserID=? and isActive=1';

        db.query(check_already_donor, [req.body.iUserID], async (err, result3) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result3);

            if (result3.length == 0) {

                var getMaxId = 'select \
                CASE \
                  WHEN max(id) IS NULL THEN 1 \
                  WHEN max(id) IS NOT NULL THEN max(id)+1  \
                  END AS "max_value" \
                from tblblddonor';

                db.query(getMaxId, async (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    var id = result2[0].max_value;

                    var imgpath = '';
                    var imagename = '';
                    // let photoUrl='';
                    // let photoName='';

                    if (req.files.IdProof) {
                        var aa = await fileRenameandUploadinDB(req.files.IdProof[0], id);
                        console.log(aa);
                        imgpath = aa.Fileurl;
                        imagename = aa.newFileName;
                    }

        
                    var insert_donor = 'INSERT INTO tblblddonor SET ?';

                    var post_donor = {
                        iUserID: iUserID,
                        sDonorName: sDonorName,
                        sEmail:sEmail,
                        sBloodgroup: sBloodgroup,
                        sOptionfrDonation: sOptionfrDonation,
                        sPreRemainderService: sPreRemainderService,
                        sAddress: sAddress,
                        sLatitude: sLatitude,
                        sLongitude: sLongitude,
                        sContactNo: sContactNo,
                        sIDProofType: sIDProofType,
                        sIDProofFileName: imagename,
                        sIDProofFilePath: imgpath,
                        sCreatedBy: username,
                        dCreated: get_time,
                        isActive: 1
                    };

                    db.query(insert_donor, post_donor, async (err, result) => {

                        if (err) {
                            console.log(err.sqlMessage);

                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result);

                        if (req.files.PhotoProof) {
                            eventEmit.emit('photoUpload', iUserID, req.files.PhotoProof[0], id, db)
                        }

                        return res.send({
                            status: 1,
                            message: 'Donor Onboarded'
                        });

                    });

                });

            }
            else {

                console.log(`Already you are registered as a donor`);

                if (req.files.IdProof) {

                    await deleteExistFile(iUserID, db);
                    var aa = await fileRenameandUploadinDB(req.files.IdProof[0], result3[0].id);
                    console.log(aa);
                    imgpath = aa.Fileurl;
                    imagename = aa.newFileName;
                }

                if (req.files.PhotoProof) {
                    eventEmit.emit('photoUpload', iUserID, req.files.PhotoProof[0], id, db)
                }

                var update_donor_details = 'update tblblddonor SET sDonorName=?,sEmail=?,sBloodgroup=?,sOptionfrDonation=?,sPreRemainderService=?,sAddress=?, \
                sLatitude=?,sLongitude=?,sContactNo=?,sIDProofType=?,sModifiedBy=?,sModified=? \
                where iUserID=?';

                db.query(update_donor_details, [sDonorName,sEmail, sBloodgroup, sOptionfrDonation, sPreRemainderService, sAddress,
                    sLatitude, sLongitude, sContactNo, sIDProofType, username, get_time, iUserID], (err, result4) => {

                        if (err) {
                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result4);

                        return res.send({
                            status: 1,
                            message: `Donor Data Updated`
                        });

                    });

            }

        });

    });

    app.post('/searchDonorNearBy', async (req, res) => {

        const { db } = require('./config/config');

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        var search_donor_distance = await require('./config/findstatusvalue.js')(185, db);

        console.log(ip);

        // const bloodGroup = "A-";

        // const nLatitude1 = "12.9656320";

        // const nLongitude1 = "80.2485346";

        const bloodGroup = req.body.bloodGroup;

        const nLatitude1 = req.body.nLatitude;

        const nLongitude1 = req.body.nLongitude;

        //  immediate/scheduled
        // const booking_type=req.body.booking_type;

        const get_Matched_Donors = `select id,iUserID,sDonorName,sBloodgroup,sLatitude as nLatitude2 ,
        sLongitude as nLongitude2,sContactNo from tblblddonor where sBloodgroup='${bloodGroup}' and isActive=1`;

        db.query(get_Matched_Donors, async (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                })
            }
            console.log(result);

            for (var i = 0; i < result.length; i++) {

                var nLatitude2 = result[i].nLatitude2;
                var nLongitude2 = result[i].nLongitude2;
                var id = result[i].id;

                console.log(nLatitude1 + " " + nLongitude1 + " " + nLatitude2 + " " + nLongitude2);

                await FindDistance(nLatitude1, nLongitude1, nLatitude2, nLongitude2, id, search_donor_distance);
            }

            //   find Donors around 5KMs
            console.log(donors_id)

            if (donors_id.length == 0) {
                return res.send({
                    status: 0,
                    message: 'Donors are not available around 5KMs location'
                });

            }

            else {

                let donorDonated_id = donors_id.map((value) => value.id);

                console.log(donorDonated_id)

                let get_donorDonatedQuery = 'select t1.id,t1.iUserID,t1.sDonorName,t1.sBloodgroup, \
                t1.sLatitude,t1.sLongitude,CONCAT(?,t2.sProfileUrl,t2.sProfilePic) as profileURL from tblblddonor t1 \
                left join tblUserMaster t2 on t2.id=t1.iUserID  and t2.sActive \
                where t1.id IN(?)  and t1.isActive=1';

                // select t1.id,t1.iUserID,t1.sDonorName,t1.sBloodgroup,
                // t1.sLatitude,t1.sLongitude,CONCAT(?,t2.sProfileUrl,t2.sProfilePic) as profileURL from tblblddonor t1 
                //  join tblUserMaster t2 
                // where t1.id=1 and t2.id=t1.iUserID and t1.isActive=1 and t2.sActive=1;

                db.query(get_donorDonatedQuery, [ip, donorDonated_id], (err, result1) => {

                    if (err) {
                        console.log(err.sqlMessage)

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        })
                    }

                    console.log(result1);

                    // return res.send(result1);
                    if (result.length > 0) {
                        return res.send({
                            status: 1,
                            data: result1
                        })
                    } else {
                        return res.send({
                            status: 0,
                            data: result1
                        })
                    }

                })
            }
        })


    });

    app.post('/getDonorDetails', async (req, res) => {

        const { db } = require('./config/config');

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        const donorID = req.body.donorID;

        const getDonorQuery = 'select t1.id,t1.iUserID,t1.sDonorName,t1.sBloodgroup,t1.sOptionfrDonation,t1.sAddress,\
        t1.sPreRemainderService,t1.sContactNo,t1.sLatitude,t1.sLongitude,\
        CONCAT(?,t2.sProfileUrl,t2.sProfilePic) as profileURL from tblblddonor t1\
         join tblUserMaster t2 \
        where t1.id=? and t2.id=t1.iUserID and t1.isActive=1 and t2.sActive=1';


        db.query(getDonorQuery, [ip, donorID], async (err, result3) => {
            if (err) {
                console.log(err.sqlMessage)
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                })
            }

            console.log(result3)

            if (result3.length > 0) {

                return res.send({
                    status: 1,
                    data: result3
                })
            } else {
                return res.send({
                    status: 0,
                    data: result3
                })
            }

        })
    });

    app.post('/showDonorUser',async(req,res)=>{

        const { db } = require('./config/config');

        console.log(req.body);

        const iUserID = req.body.iUserID;
        const sLat = req.body.sLat;
        const sLong = req.body.sLong;

        var ip = await require('./config/ipaddressconfig.js')(db);

        var show_data='select t1.iUserID,t1.sDonorName,t1.sBloodgroup,t1.sOptionfrDonation,t1.sPreRemainderService,t1.sAddress, \
        t1.sLatitude,t1.sLongitude,t1.sContactNo,t1.sIDProofType, \
        concat(?,t1.sPhotoProofFilePath,t1.sPhotoProofFileName) as "IDProofURL",IFNULL(t3.noofunits,0) as "noofunits",IFNULL(t4.noofcount,0) as "noofcount", \
        concat(?,t2.sProfileUrl,t2.sProfilePic) as "PhotoProofURL",t1.sEmail \
        from tblblddonor t1 \
        left join tblUserMaster t2 on t2.id=t1.iUserID and t2.sActive=1 \
        left join (select donorContactNumber, SUM(nUnits)  as "noofunits" from tblBldRequestdtls where isActive=1 group by donorContactNumber) t3 on t3.donorContactNumber=t2.sMobileNum \
        left join (select donorContactNumber,count(id) as "noofcount" from tblBldRequestdtls where isActive=1 group by donorContactNumber) t4 on t4.donorContactNumber=t2.sMobileNum \
        where t1.iUserID=? and t1.isActive=1';

        db.query(show_data,[ip,ip,iUserID],(err,result)=>{

            if(err){
                console.log(err);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }

            console.log(result);

            var show_timeline='select DATE_FORMAT(t2.dCreated,"%W, %M %d %Y") as "date",t2.nUnits,t3.sHospName,t3.sCity \
            from tblUserMaster t1 \
            join tblBldRequestdtls t2 on t2.donorContactNumber=t1.sMobileNum \
            join tblBldRequest t3 on t3.id=t2.iBldReqID and t3.isActive=1 \
            where t1.id=? and t1.sActive=1';

            db.query(show_timeline,[iUserID],(err,result2)=>{

                if(err){
                    console.log(err.sqlMessage);
                    return res.send({
                        status:0,
                        message:err.sqlMessage
                    });
                }

                console.log(result2);

                var get_donor_lat_long='select t1.sLatitude,t1.sLongitude from tblblddonor t1 where t1.iUserID=? and t1.isActive=1';

                db.query(get_donor_lat_long,[iUserID],async(err,result3)=>{

                    if(err){
                        console.log(err.sqlMessage);
                        return res.send({
                            status:0,
                            message:err.sqlMessage
                        });
                    }

                    console.log(result3);

                    var kms;

                    if(result3.length >0)
                    {
                        kms=await CalculateKms(result3[0].sLatitude,result3[0].sLongitude,sLat,sLong);
                    }

                    if(result.length > 0){
                        result[0].timelines=result2
                        result[0].kms=kms.toFixed(1);
                    }

                    return res.send({
                        status:1,
                        data:result
                    });

                });
        
            });
        });

    });

    app.post('/showBloodRequestCounts',(req,res)=>{

        const { db } = require('./config/config');

        console.log(req.body);

        const iUserID = req.body.iUserID;

        var blood_request='select count(*) as "BloodRequest" from tblBldRequest where userID=? and isActive=1';

        var lives='select count(t2.id) as "lives" from tblUserMaster t1 \
        join tblBldRequestdtls t2 on t2.donorContactNumber=t1.sMobileNum and t2.isActive=1 \
        where t1.id=? and t1.sActive=1';

        db.query(blood_request,[iUserID],(err,result)=>{

            if(err){
                console.log(err);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }

            console.log(result);

            db.query(lives,[iUserID],(err,result2)=>{

                if(err){
                    console.log(err);
                    return res.send({
                        status:0,
                        message:err.sqlMessage
                    });
                }
    
                console.log(result2);

                return res.send({
                    status:1,
                    data:{
                        blood_request:result[0].BloodRequest,
                        lives:result2[0].lives,
                        shares:0,
                        newbloodrequest:0
                    }
                });
    
            });

        });

    });


}
