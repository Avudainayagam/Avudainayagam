var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');

const ASSESSMENTDIR = './uploads/Prescription';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ASSESSMENTDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});

module.exports = function (app) {

    var pharmacy_id = [];

    function FindDistance(lat1, lon1, lat2, lon2, id, kms) {

        return new Promise((resolve, reject) => {

            console.log(lat1, lon1, lat2, lon2, id, kms);

            if ((lat1 == lat2) && (lon1 == lon2)) {
                console.log("equal....");
                return resolve(0);
            }
            else {

                console.log("Not equal....");

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
                console.log(kms);
                if (dist <= kms) {
                    pharmacy_id.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();


            }

        });
    }

    app.post('/getTest', async(req, res) => {

        var db = require("./config/config.js").db;

        var show_package_data = 'select t2.isSampleCollection as "samplecollection",t2.id as "id",ROUND((t2.dCost-((of1.sOfferPercentage/100)*t2.dCost))) as "amount", \
        t2.sPackageName as "Name",t2.dCost as "offerValue",t3.testcount,of1.sOfferPercentage as "offerPercentage",sPackageCode as "code","PACAKAGE" as "type", \
        t1.sLabName,t1.id as "labid",concat("",t4.sFilePath,t4.sFileName) as "Url",t2.sGenderfor as "Gender", \
        t2.sAgeGroupFor as "Age" \
        from \
        (select id,sLabName,sPremiumCost from tblLabMaster \
        where isActive=1 and id IN (2,3,4,5,6)) t1 \
        join tbl_Package_Master t2 on t2.iLabid=t1.id and t2.isActive=1 \
        join (select iPackageID,count(*) as "testcount" from tbl_PackageTest_Mapping where isActive=1 group by iPackageID) t3 on t3.iPackageID=t2.id \
        join tbl_packageMasterImages t4 on t4.iPackageid=t2.id and t4.isActive=1 \
        left join tbl_offerMaster of1 on of1.sType = "PACKAGE" and of1.iPackageORTestID = t2.id \
        order by t1.sPremiumCost desc LIMIT 4';

        db.query(show_package_data, (err, result4) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result4);

            return res.send(result4);


        });

    });

    app.get('/viewPrescriptionImages', function (req, res) {

        console.log("viewPrescriptionImages API...");

        const PROOFDIR = './uploads/Prescription/';

        var query = url.parse(req.url, true).query;
        pic = query.docname;

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

            fs.readFile(PROOFDIR + pic, function (err, content) {
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


    function fileRename(id, img_id, data) {

        return new Promise((resolve, reject) => {

            console.log(data);

            var oldFileName = path.join(ASSESSMENTDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var newGeneratedFileName = id + "_" + img_id + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(ASSESSMENTDIR, newGeneratedFileName);

            fs.renameSync(oldFileName, newFileName);

            console.log('File Renamed in Folder...');

            var Fileurl = `viewPrescriptionImages/?docname=`;

            console.log(Fileurl);

            return resolve({ Fileurl: Fileurl, newFileName: newGeneratedFileName, id: id });

        });

    }

    function InsertPrescriptionFiles(storage_files, db, username, get_time) {

        return new Promise((resolve, reject) => {

            var insert_tblproductImages = 'INSERT INTO tblPrescriptionFiles SET ?';

            var post_tblproductImages = {
                iOrderid: storage_files.id,
                sFileName: storage_files.newFileName,
                sFilePath: storage_files.Fileurl,
                isActive: 1,
                sCreated_by: username,
                sCreated_at: get_time
            }

            db.query(insert_tblproductImages, post_tblproductImages, (err, result) => {

                if (err) {
                    console.log(err);
                    return res.send(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });

    }

    app.post('/uploadPrescription', upload.array('image'), async(req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var iUserid = req.body.iUserid;
        var sOrdertype=req.body.sOrdertype;

        console.log(req.files);

        var data = req.files;

        var n = req.files.length;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);

        var getMaxId = 'select \
        CASE \
          WHEN max(id) IS NULL THEN 1 \
          WHEN max(id) IS NOT NULL THEN max(id)+1 \
          END AS "max_value" \
        from tblorderMedicine';

        db.query(getMaxId, (err, result) => {

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

            var order_id = "";

            if (id_length == 1) {
                order_id = "OMED0000".concat(max_value);
            }
            else if (id_length == 2) {
                order_id = "OMED000".concat(max_value);
            }
            else if (id_length == 3) {
                order_id = "OMED00".concat(max_value);
            }
            else if (id_length == 4) {
                order_id = "OMED0".concat(max_value);
            }
            else if (id_length == 5) {
                order_id = "OMED".concat(max_value);
            }

            console.log("order_id:");

            console.log(order_id);

            var insert_tblorderMedicine = "INSERT INTO tblorderMedicine SET ?";

            var post_tblorderMedicine = {
                sOrderNo: order_id,
                iStatus_id: 133,
                iUserid: iUserid,
                sOrdertype: sOrdertype,
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_tblorderMedicine, post_tblorderMedicine, async (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var iorderid = result2.insertId;

                var insert_tblorderMedicinebookingstatusdtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                var post_tblorderMedicinebookingstatusdtls = {
                    iOrderid: iorderid,
                    iStatusid: 133,
                    sStatus: "Order Requested",
                    sCreated_by: get_user_name,
                    dCreated_at: get_time,
                    isActive: 1
                }

                db.query(insert_tblorderMedicinebookingstatusdtls, post_tblorderMedicinebookingstatusdtls, async (err, result3) => {

                    if (err) {
                        console.log(err);
                        return res.send(err.sqlMessage);
                    }

                    console.log(result3);

                    var storage_path = [];

                    if (req.files) {

                        for (var i = 0; i < n; i++) {

                            var result = await fileRename(max_value, i + 1, data[i]);

                            console.log(result);

                            storage_path.push(result);
                        }

                    }

                    console.log(storage_path);

                    for (var i = 0; i < storage_path.length; i++) {

                        await InsertPrescriptionFiles(storage_path[i], db, get_user_name, get_time);

                    }

                    return res.send({
                        status: 1,
                        message: 'Prescription Added'
                    });


                });

            });

        });


    });




}
