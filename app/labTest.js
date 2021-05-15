var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');


module.exports = function(app) {

    app.get('/viewPackageImages/', function(req, res) {

        console.log("viewpharmacyproofUpload API...");
        const PHARMACYDIR = './uploads/packageImages/';

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

            fs.readFile(PHARMACYDIR + pic, function(err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {

                    var choose_type = '';

                    if (file_type == "pdf") {
                        choose_type = { 'Content-type': 'application/' + file_type }
                    } else {
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

    app.get('/viewTestLabImages/', function(req, res) {

        console.log("viewpharmacyproofUpload API...");
        const PHARMACYDIR = './uploads/testLabImages/';

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

            fs.readFile(PHARMACYDIR + pic, function(err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {

                    var choose_type = '';

                    if (file_type == "pdf") {
                        choose_type = { 'Content-type': 'application/' + file_type }
                    } else {
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


    var Lab_id = [];

    function FindDistanceofLab(lat1, lon1, lat2, lon2, id, kms) {

        return new Promise((resolve, reject) => {

            if ((lat1 == lat2) && (lon1 == lon2)) {
                // return resolve(0);
                //edited by gopi
                Lab_id.push({ "id": id, "Km": 0 });
                return resolve();
            } else {
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
                if (dist <= kms) {
                    Lab_id.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();


            }

        });
    }

    app.post('/getPremiumPackages', async(req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userLat = req.body.userLat;
        var userLong = req.body.userLong;
        var user_lab_distance = await require('./config/findstatusvalue.js')(148, db);
        var ip = await require('./config/ipaddressconfig.js')(db);

        var lab_lat_long = 'select t1.id,t1.sLat,t1.sLong from tblLabMaster t1 where t1.isActive=1 ';

        db.query(lab_lat_long, async(err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {
                await FindDistanceofLab(userLat, userLong, result[i].sLat, result[i].sLong, result[i].id, user_lab_distance);
            }

            console.log("-------------");

            console.log(Lab_id);

            var labid = Lab_id.map(function(n) {
                return n.id
            });

            console.log("---------");

            console.log(labid);

            if (labid.length == 0) {

                return res.send({
                    status: 1,
                    message: 'Labs are not found',
                    data: []
                });

            } else {

                var show_package_data = 'select t2.isSampleCollection as "samplecollection",t2.id as "id",ROUND((t2.dCost-((of1.sOfferPercentage/100)*t2.dCost))) as "amount", \
                t2.sPackageName as "Name",t2.dCost as "offerValue",t3.testcount,of1.sOfferPercentage as "offerPercentage",sPackageCode as "code","PACAKAGE" as "type", \
                t1.sLabName,t1.id as "labid",concat(?,t4.sFilePath,t4.sFileName) as "Url",t2.sGenderfor as "Gender", \
                t2.sAgeGroupFor as "Age" \
                from \
                (select id,sLabName,sPremiumCost from tblLabMaster \
                where isActive=1 and id IN (?)) t1 \
                join tbl_Package_Master t2 on t2.iLabid=t1.id and t2.isActive=1 \
                join (select iPackageID,count(*) as "testcount" from tbl_PackageTest_Mapping where isActive=1 group by iPackageID) t3 on t3.iPackageID=t2.id \
                join tbl_packageMasterImages t4 on t4.iPackageid=t2.id and t4.isActive=1 \
                left join tbl_offerMaster of1 on of1.sType = "PACKAGE" and of1.iPackageORTestID = t2.id \
                order by t1.sPremiumCost desc LIMIT 4';

                db.query(show_package_data, [ip, labid], (err, result) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result);
                    if (result.length > 0) {
                        return res.send({
                            status: 1,
                            message: 'Premium Package are listed',
                            data: result
                        });
                        // return res.send(result);
                    } else {
                        return res.send({
                            status: 1,
                            message: 'Premium Package not found',
                            data: []
                        });
                    }


                });

            }

        });


    });

    app.post('/getPremiumTestList', async(req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userLat = req.body.userLat;
        var userLong = req.body.userLong;
        var user_lab_distance = await require('./config/findstatusvalue.js')(148, db);
        var ip = await require('./config/ipaddressconfig.js')(db);

        var lab_lat_long = 'select t1.id,t1.sLat,t1.sLong from tblLabMaster t1 where t1.isActive=1 ';

        db.query(lab_lat_long, async(err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {
                await FindDistanceofLab(userLat, userLong, result[i].sLat, result[i].sLong, result[i].id, user_lab_distance);
            }

            console.log("-------------");

            console.log(Lab_id);

            var labid = Lab_id.map(function(n) {
                return n.id
            });

            console.log("---------");

            console.log(labid);

            if (labid.length == 0) {

                return res.send({
                    status: 1,
                    message: 'Labs are not found',
                    data: []
                });

            } else {

                var show_package_data = 'select t2.isSampleCollection as "samplecollection",t2.iId as "id", \
                t2.sTestName as "Name",t2.dCost as"offerValue", \
                of1.sOfferPercentage as "offerPercentage","TEST" as "type",sTestCode as "code", \
                (t2.dCost-((of1.sOfferPercentage/100)*t2.dCost)) as "amount",t2.sAgeGroupFor as "Age", \
                t2.sGenderFor as "Gender", \
                concat(?,t4.sFilePath,t4.sFileName) as "Url",t1.id as "labid",t1.sLabName as "sLabName"\
                from \
                (select id,sLabName,sPremiumCost from tblLabMaster \
                where isActive=1 and id IN (?)) t1 \
                join tbl_TestMaster t2 on t2.iLabId=t1.id and t2.isActive=1 \
                join tbl_labtestMasterImages t4 on t4.iTestid=t2.iId and t4.isActive=1 \
                left join tbl_offerMaster of1 on of1.sType = "TEST" and of1.iPackageORTestID = t2.iId \
                order by t1.sPremiumCost desc LIMIT 4';

                db.query(show_package_data, [ip, labid], (err, result) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result);

                    if (result.length > 0) {
                        return res.send({
                            status: 1,
                            message: 'Premium Test are listed',
                            data: result
                        });
                        // return res.send(result);
                    } else {
                        return res.send({
                            status: 1,
                            message: 'Premium Test not found',
                            data: []
                        });
                    }

                });

            }

        });

    });

    app.post('/getAllPackages', async(req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userLat = req.body.userLat;
        var userLong = req.body.userLong;
        var user_lab_distance = await require('./config/findstatusvalue.js')(148, db);
        var ip = await require('./config/ipaddressconfig.js')(db);

        var lab_lat_long = 'select t1.id,t1.sLat,t1.sLong from tblLabMaster t1 where t1.isActive=1 ';

        db.query(lab_lat_long, async(err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {
                console.log(userLat, userLong, result[i].sLat, result[i].sLong, result[i].id, user_lab_distance)
                await FindDistanceofLab(userLat, userLong, result[i].sLat, result[i].sLong, result[i].id, user_lab_distance);
            }

            // console.log("-------------");

            console.log(Lab_id);

            var labid = Lab_id.map(function(n) {
                return n.id
            });

            // console.log("---------");

            // console.log(labid);

            if (labid.length == 0) {

                return res.send({
                    status: 1,
                    message: 'Labs are not found',
                    data: []
                });

            } else {

                var show_package_data = 'select t2.isSampleCollection as "samplecollection",t2.id as "id",ROUND((t2.dCost-((of1.sOfferPercentage/100)*t2.dCost))) as "amount", \
                t2.sPackageName as "Name",t2.dCost as "offerValue",of1.sOfferPercentage as "offerPercentage",sPackageCode as "code","PACKAGE" as "type",t3.testcount, \
                t1.sLabName,t1.id as "labid",concat(?,t4.sFilePath,t4.sFileName) as "Url",t2.sGenderfor as "Gender", \
                t2.sAgeGroupFor as "Age" \
                from \
                (select id,sLabName,sPremiumCost from tblLabMaster \
                where isActive=1 and id IN (?)) t1 \
                join tbl_Package_Master t2 on t2.iLabid=t1.id and t2.isActive=1 \
                join (select iPackageID,count(*) as "testcount" from tbl_PackageTest_Mapping where isActive=1 group by iPackageID) t3 on t3.iPackageID=t2.id \
                join tbl_packageMasterImages t4 on t4.iPackageid=t2.id and t4.isActive=1 \
                left join tbl_offerMaster of1 on of1.sType = "PACKAGE" and of1.iPackageORTestID = t2.id';


                db.query(show_package_data, [ip, labid], (err, result) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result);

                    if (result.length > 0) {
                        return res.send({
                            status: 1,
                            message: 'All Package are listed',
                            data: result
                        });
                        // return res.send(result);
                    } else {
                        return res.send({
                            status: 1,
                            message: 'Packages not found',
                            data: []
                        });
                    }

                });

            }

        });
    });

    app.post('/getPackageAllTestList', function(req, res) {
        const { db } = require('./config/config.js');

        var package_id = req.body.id;

        var get_test_list = `select * from tbl_PackageTest_Mapping tp1 \ 
        join (select iID,sTestName,isActive,sTestCode from tbl_TestMaster) t2 \
        join (select id,iLabid,sPackageName,sPackageDescription,iNoofTests,dCost as "fullAmount", \
        vReportgenerationtime,sGenderfor,sAgeGroupFor,specialMention,sPackageCode from tbl_Package_Master) p1 \
        join (select id from tblLabMaster) l1 on l1.id = p1.iLabid and t2.iID=tp1.iTestID \
        and p1.id = tp1.iPackageID and tp1.iPackageID = '${package_id}' \
        left join tbl_offerMaster of1 on of1.sType = "PACKAGE" and of1.iPackageORTestID = p1.id \
        and tp1.isActive = '1' and t2.isActive = '1'`;

        db.query(get_test_list, async(err, result) => {

            if (err) {

                console.log(err);

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }
            // return res.send(result);

            var result1 = result[0]
            var data = {
                "Name": result1.sPackageName,
                "testinclude": result1.iNoofTests,
                "includetests": [],
                "reportgenerationtime": result1.vReportgenerationtime,
                "offerValue": result1.fullAmount,
                "offerPercentage": result1.sOfferPercentage,
                "amount": Math.round(result1.fullAmount - (result1.sOfferPercentage / 100) * result1.fullAmount),
                "gender": result1.sGenderfor,
                "agegroup": result1.sAgeGroupFor,
                "specialmention": result1.specialMention,
                "packagedescription": result1.sPackageDescription,
                "code": result1.sPackageCode,
                "type": "PACKAGE"
            }
            result.forEach(key => {
                data.includetests.push({
                    "Name": key.sTestName,
                    "code": key.sTestCode,
                    "type": "Test"
                })
            })
            if (data != null) {
                return res.send({
                    status: 1,
                    message: 'Package Test are listed',
                    data: data
                });
                // return res.send(result);
            } else {
                return res.send({
                    status: 1,
                    message: 'Packages Test not found',
                    data: []
                });
            }
        });


    });

    app.post('/getAllTestList', async(req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userLat = req.body.userLat;
        var userLong = req.body.userLong;
        var user_lab_distance = await require('./config/findstatusvalue.js')(148, db);
        var ip = await require('./config/ipaddressconfig.js')(db);

        var lab_lat_long = 'select t1.id,t1.sLat,t1.sLong from tblLabMaster t1 where t1.isActive=1 ';

        db.query(lab_lat_long, async(err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {
                await FindDistanceofLab(userLat, userLong, result[i].sLat, result[i].sLong, result[i].id, user_lab_distance);
            }

            console.log("-------------");

            console.log(Lab_id);

            var labid = Lab_id.map(function(n) {
                return n.id
            });

            console.log("---------");

            console.log(labid);

            if (labid.length == 0) {

                return res.send({
                    status: 1,
                    message: 'Labs are not found',
                    data: []
                });

            } else {

                var show_package_data = 'select t2.isSampleCollection as "samplecollection",t2.iId as "id",t2.sTestName as "Name",t2.dCost as "offerValue", \
                of1.sOfferPercentage as "offerPercentage",t2.sTestCode as "code","TEST" as "type", \
                (t2.dCost-((of1.sOfferPercentage/100)*t2.dCost)) as "amount",t2.sAgeGroupFor as "Age", \
                t2.sGenderFor as "Gender", \
                concat(?,t4.sFilePath,t4.sFileName) as "Url",t1.id as "labid",t1.sLabName as "sLabName"\
                from \
                (select id,sLabName,sPremiumCost from tblLabMaster \
                where isActive=1 and id IN (?)) t1 \
                join tbl_TestMaster t2 on t2.iLabId=t1.id and t2.isActive=1 \
                join tbl_labtestMasterImages t4 on t4.iTestid=t2.iId and t4.isActive=1 \
                left join tbl_offerMaster of1 on of1.sType = "TEST" and of1.iPackageORTestID = t2.iId';

                db.query(show_package_data, [ip, labid], (err, result) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result);

                    if (result.length > 0) {
                        return res.send({
                            status: 1,
                            message: 'All Test are listed',
                            data: result
                        });
                        // return res.send(result);
                    } else {
                        return res.send({
                            status: 1,
                            message: 'Test not found',
                            data: []
                        });
                    }

                });

            }

        });

    });


}
