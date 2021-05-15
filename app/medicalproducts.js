var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
var _ = require('lodash');
var { HmacSHA256 } = require('crypto-js');
var fetch = require('node-fetch');
var { encode } = require('base-64');
const e = require('express');

module.exports = function (app) {

    function InserttblOrderMedicinedtls(db, data, iorderid, dTotAmt, get_user_name, get_time, iVersion) {

        return new Promise((resolve, reject) => {

            let InserttblOrderMedicinedtls = 'INSERT INTO tblOrderMedicinedtls SET ?';

            let PosttblOrderMedicinedtls = {
                iorderid: iorderid,
                iproductid: data.iproductid,
                sProductName: data.sProductName,
                sProductCode: data.sProductCode,
                iqty: data.iqty,
                dPrice: data.dPrice,
                dAmt: data.dAmt,
                dTotAmt: dTotAmt,
                iVersion: iVersion,
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1,
            };

            db.query(InserttblOrderMedicinedtls, PosttblOrderMedicinedtls, (err, result2) => {

                if (err) return console.log(err);

                console.log(result2);

                return resolve();

            });

        });
    }


    var pharmacy_id = [];

    function FindDistance(lat1, lon1, lat2, lon2, id, kms) {

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
                // if (unit == "K") {
                console.log("id:" + id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log(dist);
                if (dist <= kms) {
                    pharmacy_id.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();


            }

        });
    }

    var rider_id = [];

    function FindDistanceofRider(lat1, lon1, lat2, lon2, id, kms) {

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
                // if (unit == "K") {
                console.log("id:" + id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log(dist);
                if (dist <= kms) {
                    rider_id.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();


            }

        });
    }



    function getProductImages(id, db) {

        return new Promise(async (resolve, reject) => {

            var ip = await require('./config/ipaddressconfig.js')(db);

            var product_images = 'select concat(?,sFileUrl,sFileName) as "FileUrl" from tblMpImages where iMedicalProductid=? and isActive=1';

            db.query(product_images, [ip, id], (err, result) => {

                if (err) {
                    console.log(err);
                }
                console.log(result);

                return resolve(result);

            });

        });
    }

    function InsertOrderPharmacyNotification(orderid, pharmacistid, get_user_name, get_time, db) {

        return new Promise((resolve, reject) => {

            var insert_tblOrderPharmacyNotification = 'INSERT INTO tblOrderPharmacyNotification SET ?';

            var post_tblOrderPharmacyNotification = {
                iOrderid: orderid,
                iPharmacistid: pharmacistid,
                iAccept: 0,
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_tblOrderPharmacyNotification, post_tblOrderPharmacyNotification, (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });
    }

    function InsertPharmacyRiderNotification(iOrderid, iRider_id, get_user_name, get_time, db) {

        return new Promise((resolve, reject) => {

            var insert_PharmacyRiderNotification = 'INSERT INTO tblPharmacyRiderNotification SET ?';

            var post_tblPharmacyRiderNotification = {
                iOrderid: iOrderid,
                iRider_id: iRider_id,
                iAccept: 0,
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_PharmacyRiderNotification, post_tblPharmacyRiderNotification, (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });

    }


    app.get('/viewMedicalProductImages', function (req, res) {

        console.log("viewMedicalProductImages API...");

        const PROOFDIR = './uploads/medicalProducts/';

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

    app.get('/getAllMedicalProducts', async (req, res) => {

        var db = require("./config/config.js").db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        var show_medical_products = 'select t1.id,t1.sName,t1.sProductCode,t1.iVariant,t1.dPrice,t1.dOfferprice,t1.iOffer,t2.FileUrl as "ImgUrl" \
        from tblMedicalProducts t1 \
        left join (select b.iMedicalProductid,concat(?,b.sFileUrl,b.sFileName) as "FileUrl" from  \
        (select MIN(id) as "id",iMedicalProductid \
        from tblMpImages where isActive=1 group by iMedicalProductid) a \
        join tblMpImages b on b.iMedicalProductid=a.iMedicalProductid and b.id=a.id and b.isActive=1 ) t2 on t2.iMedicalProductid=t1.id \
        where t1.isActive=1 ';

        db.query(show_medical_products, [ip], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
            }

            console.log(result);

            return res.send(result);

        });

    });

    app.get('/getMedicalProduct/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var show_product = 'select t1.id,t1.sName,t1.sProductCode,t1.iVariant,t1.dPrice,t1.dOfferprice,t1.iOffer, \
        t1.sDescription,t1.sFormulaProduct,t1.sDirectionofUse,t1.sBrandofProducts, \
        t1.sManufacturer,t2.sCategoryName,t3.sSubCatgeoryName \
        from tblMedicalProducts t1 \
        left join tblMpCategory t2 on t2.id=t1.iCategory and t2.isActive=1 \
        left join tblMpSubCategory t3 on t3.id=t1.iSubCategory and t3.isActive=1 \
        where t1.id=? and t1.isActive=1';

        db.query(show_product, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var show_product_benfits = "select id, iMedicalproductid ,sBenefitsName from tblMpBenefits where iMedicalproductid=? and isActive=1";

            db.query(show_product_benfits, [id], (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var show_caution_Name = "select id, iMedicalproductid,sCautionName from tblMpCaution where iMedicalproductid=? and isActive=1";

                db.query(show_caution_Name, [id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    var show_images = 'SELECT concat(?,sFileUrl,sFileName) as "Fileurl" FROM Medi360.tblMpImages where iMedicalProductid=? and isActive=1';

                    db.query(show_images, [ip, id], (err, result4) => {

                        if (err) {
                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result4);

                        result[0].benefits = result2;
                        result[0].caution = result3;
                        result[0].images = result4;

                        return res.send(result);

                    });

                });

            });
        });
    });


    app.post('/addordermedicinedetails', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        // var iUserid = 4;
        // var dTotAmt = 1212.00;
        // var data = [
        //     {
        //         iproductid: 1,
        //         sProductName: "Everherb Digestion Support Blend Of 11 Powerful Herbs and Gut Protector Tablet 60 Tablets",
        //         sProductCode: "EDS602",
        //         iqty: "5",
        //         dPrice: "120.00",
        //         dAmt: "600.00"
        //     },
        //     {
        //         iproductid: 2,
        //         sProductName: "Medlife Essentials Sto-Nab 60 Tablets",
        //         sProductCode: "MES603",
        //         iqty: "6",
        //         dPrice: "102.00",
        //         dAmt: "612.00"
        //     }
        // ];
        // var sOrdertype = "PRODUCTS";
        // var sAddress = "No.13 Anna Nagar chennai";

        var iUserid = req.body.iUserid;
        var data = req.body.data;
        var dTotAmt = req.body.dTotAmt;
        var sOrdertype = req.body.sOrdertype;
        var sAddress = req.body.sAddress;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);

        if (sOrdertype == "PRODUCTS") {

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
                    sAddress: sAddress,
                    sLat: sLat,
                    sLong: sLong,
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

                        const m = data.length;

                        for (var i = 0; i < m; i++) {
                            await InserttblOrderMedicinedtls(db, data[i], iorderid, dTotAmt, get_user_name, get_time, 1);
                        }

                        return res.send({
                            status: 1,
                            bookingid: iorderid,
                            bookingcode: order_id,
                            message: 'Order Requested'
                        });


                    });

                });

            });

        }
        else {

            return res.send({
                status: 0,
                message: 'Order Type Invalid'
            });

        }


    });


    app.get('/getorderdetails', (req, res) => {

        var db = require("./config/config.js").db;

        let orderdetails = 'select t1.id,t1.sOrderNo,t2.sValue as "Status_name",t3.sName as "Username",t3.sMobileNum,t1.sOrdertype \
        from tblorderMedicine t1 \
        join tblAppConfig t2 on t1.iStatus_id = t2.id and t2.isActive=1 \
        join tblUserMaster t3 on t1.iUserid = t3.id and t3.sActive=1 \
        where t1.iStatus_id IN (133,134) and t1.isActive=1';

        db.query(orderdetails, (err, result) => {

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


    app.get('/getorderdetails/:id/:ordertype', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ordertype = req.params.ordertype;

        var ip = await require('./config/ipaddressconfig.js')(db);

        let order_details = 'select t1.id,t1.sOrderNo,t2.sValue as "Status_name",t3.sName as "Username",t3.sMobileNum,t1.sOrdertype \
        from tblorderMedicine t1 \
        join tblAppConfig t2 on t1.iStatus_id = t2.id and t2.isActive=1 \
        join tblUserMaster t3 on t1.iUserid = t3.id and t3.sActive=1 WHERE t1.id=? and t1.isActive=1';

        db.query(order_details, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            if (ordertype == "PRODUCTS") {

                let product_details = 'select t1.iproductid,t1.sProductName,t1.sProductCode,t1.iqty,t1.dPrice,t1.dAmt,t1.dTotAmt,t1.iversion \
                from tblOrderMedicinedtls t1 \
                WHERE t1.iorderid=? and t1.iversion=1 and t1.isActive=1';

                db.query(product_details, [id], async (err, result2) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });

                    }

                    console.log(result2);

                    if (result.length > 0) {

                        result[0].productdetails = result2;

                        result[0].productdetails = result[0].productdetails.map(v => ({ ...v, images: [] }));

                        for (var j = 0; j < result[0].productdetails.length; j++) {

                            console.log(result[0].productdetails[j].iproductid);

                            result[0].productdetails[j].images.push(await getProductImages(result[0].productdetails[j].iproductid, db))

                        }

                        return res.send(result);


                    }
                    else {
                        return res.send([]);
                    }

                });

            }
            else {

                var prescription_images = 'SELECT concat(?,sFilePath,sFileName) as "FileURL" FROM tblPrescriptionFiles where iOrderid=? and isActive=1';

                db.query(prescription_images, [ip, id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                    }

                    console.log(result3);

                    result[0].productdetails = result3;

                    return res.send(result);

                });

            }



        });

    });


    app.post('/updateverifyMedicine', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var orderid = req.body.orderid;
        var iuserid = req.body.iuserid;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iuserid);

        var check_available_order = 'select * from tblorderMedicine where id=? and isActive=1';

        db.query(check_available_order, [orderid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                return res.send({
                    status: 0,
                    message: `Order id does not exist`
                });

            }
            else {

                var update_order_status = 'update tblorderMedicine SET iStatus_id=134,sModified_by=?,dModified_at=? where id=?';

                db.query(update_order_status, [get_user_name, get_time, orderid], (err, result2) => {

                    if (err) {
                        console.log(err);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    var insert_tblorderMedicinebookingstatusdtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                    var post_tblorderMedicinebookingstatusdtls = {
                        iOrderid: orderid,
                        iStatusid: 134,
                        sStatus: "Order Verified",
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

                        return res.send({
                            status: 1,
                            message: 'updated Order verified'
                        });

                    });

                });
            }

        });

    });

    app.post('/updateOrderMedicine', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        // var iUserid = 4;
        // var sPharmacyname = "Best Care Pharmacy";
        // var ipharmacistid = 30;
        // var orderid = 4;
        // var dTotAmt = 110.00;
        // var data = [
        //     {
        //         iproductid: 15,
        //         sProductName: "Everherb Ashwagandha Immunity Booster Bottle 60 Capsule",
        //         sProductCode: "EAI500",
        //         iqty: "5",
        //         dPrice: "10.00",
        //         dAmt: "50.00"
        //     },
        //     {
        //         iproductid: 13,
        //         sProductName: "Hand Sanitizer IPA Based 200 ML",
        //         sProductCode: "HSI200",
        //         iqty: "6",
        //         dPrice: "10.00",
        //         dAmt: "60.00"
        //     }
        // ];
        // var ipharmacyid = 1;


        var iUserid = req.body.iUserid;
        // var sPharmacyname = req.body.sPharmacyname;
        // var ipharmacistid = req.body.ipharmacistid;
        var orderid = req.body.orderid;
        var dTotAmt = req.body.dTotAmt;
        var data = req.body.data;
        // var ipharmacyid = req.body.ipharmacyid;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);

        var update_order_medicine = 'update tblorderMedicine SET iStatus_id=135,sModified_by=?,dModified_at=? where id=?';

        db.query(update_order_medicine, [get_user_name, get_time, orderid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var insert_tblorderMedicinebookingstatusdtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

            var post_tblorderMedicinebookingstatusdtls = {
                iOrderid: orderid,
                iStatusid: 135,
                sStatus: "Waiting for Pharmacy Approval",
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            }

            db.query(insert_tblorderMedicinebookingstatusdtls, post_tblorderMedicinebookingstatusdtls, async (err, result2) => {

                if (err) {
                    console.log(err);
                    return res.send(err.sqlMessage);
                }

                console.log(result2);

                var max_version = 'select MAX(iVersion) as "Maxversion" from tblOrderMedicinedtls where iorderid=? and isActive=1';

                db.query(max_version, [orderid], async (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    var max_version = result3[0].Maxversion + 1;

                    for (var i = 0; i < data.length; i++) {
                        await InserttblOrderMedicinedtls(db, data[i], orderid, dTotAmt, get_user_name, get_time, max_version);
                    }

                    return res.send({
                        status: 1,
                        message: 'waiting for Pharmacy Approval'
                    });

                });

            });

        });

    });

    app.get('/showPharmacy', (req, res) => {

        var db = require("./config/config.js").db;

        var show_pharmacy = 'select t1.id as "pharmacyid",t1.sPharmacyName,t2.id as "pharmacistid" from tblPharmacyMaster t1 \
    join tblUserMaster t2 on t2.sMobileNum=t1.sContactNoPrimary and t2.sActive=1 \
    where t1.isActive=1';

        db.query(show_pharmacy, (err, result) => {

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

    app.post('/showproductstoCustomer', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var ipharmacistid = req.body.ipharmacistid;

        var show_waiting_for_pharmacist_approval = 'select t1.id,t1.sOrderNo,t1.sOrdertype,t1.sPharmacyname,t1.ipharmacyid \
        from tblorderMedicine t1 where t1.ipharmacistid=? and t1.iStatus_id=135 and \
        t1.isActive=1';

        db.query(show_waiting_for_pharmacist_approval, [ipharmacistid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var order_id = result.map(function (n) {
                return n.id;
            });

            console.log(order_id);

            var show_products = 'select t1.id,t2.iorderid,t2.Maxversion, \
            t3.iproductid,t3.sProductName,t3.sProductCode,t3.iqty,t3.dPrice,t3.dAmt,t3.dTotAmt \
            from tblOrderMedicinedtls t1 \
            join (select iorderid,MAX(iversion) as "Maxversion" from tblOrderMedicinedtls group by iorderid) t2 on t2.iorderid=t1.iorderid and t2.Maxversion=t1.iversion \
            join tblOrderMedicinedtls t3 on t3.iorderid=t2.iorderid and t3.iversion=t2.Maxversion  and t3.id=t1.id and t3.isActive=1 \
            where t1.iorderid IN (?) and t1.isActive=1';

            db.query(show_products, order_id, (err, result2) => {

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

        });

    });

    function checkPaymentSignature(orderId, paymentId, signature) {

        return new Promise((resolve, reject) => {

            console.log(orderId);
            console.log(paymentId);
            console.log(signature);

            console.log("SECRET KEY:");
            console.log(process.env.RAZORPAY_API_SECRET_KEY);

            if (paymentId && signature == null) {
                console.log("paymentId and signature are null....");
                return resolve("FAILURE");
            }
            else {
                const generated_signature = HmacSHA256(
                    orderId + "|" + paymentId,
                    process.env.RAZORPAY_API_SECRET_KEY
                );

                console.log(generated_signature);

                if (generated_signature == signature) {
                    console.log("genearted signature and signature Equal....");
                    return resolve("SUCCESS");
                }
                if (generated_signature != signature) {
                    console.log("geneartedsignature and signature not Equal....");
                    return resolve("FAILURE");
                }
            }

        });
    }


    app.post("/genearteorderID", async (req, res) => {

        console.log(process.env.RAZORPAY_API_ID);

        console.log(process.env.RAZORPAY_API_SECRET_KEY);

        console.log(req.body);

        const { amount, currency, receipt } = req.body;

        const data = {
            amount,
            currency,
            receipt,
        };

        fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization:
                    "Basic " +
                    encode(
                        process.env.RAZORPAY_API_ID +
                        ":" +
                        process.env.RAZORPAY_API_SECRET_KEY
                    ),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    return res.send({ status: 200, message: "success", data });
                }
            })
            .catch((err) => {
                console.log(err);
                return res.send({ status: 500, message: "failed" });
            });

    });


    app.post('/checkPaymentStatus', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        // var id = 3;
        // var ordercode = "OMED00003";
        // var paymentid = "pay_GkZmeK6XxB6BSX";
        // var signature = "d067fe69c01d17529718d7b0c200867395ae1a6f3fa5d28f685ae3a4742ad094";
        // var paymentamount = 2567;
        // var orderid = "order_GkZliWuiAa59Pp";
        // var iUserid = 1;

        var id = req.body.id;
        var ordercode = req.body.ordercode;
        var paymentid = req.body.paymentid;
        var signature = req.body.signature;
        var paymentamount = req.body.paymentamount;
        var orderid = req.body.orderid;
        var iUserid = req.body.iUserid;

        // var transactionstatus = await checkPaymentSignature(orderid, paymentid, signature);

        var transactionstatus = "SUCCESS";

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);
        var pharmacy_kms_distance = await require('./config/findstatusvalue.js')(139, db);

        if (transactionstatus == "SUCCESS") {

            console.log("SUCCESS");

            var update_lab_test = 'update tblorderMedicine SET iStatus_id=137,ipaymentAmount=?,sModified_by=?,dModified_at=? where id=?';

            db.query(update_lab_test, [paymentamount, get_user_name, get_time, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var insert_tblorderMedicinebookingstatusdtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                var post_tblorderMedicinebookingstatusdtls = {
                    iOrderid: id,
                    iStatusid: 137,
                    sStatus: "Payment Success",
                    sCreated_by: get_user_name,
                    dCreated_at: get_time,
                    isActive: 1
                }

                db.query(insert_tblorderMedicinebookingstatusdtls, post_tblorderMedicinebookingstatusdtls, async (err, result2) => {

                    if (err) {
                        console.log(err);
                        return res.send(err.sqlMessage);
                    }

                    console.log(result2);


                    var insert_payment_status = 'INSERT INTO tblpaymenttransaction SET ?';

                    var post_payment_status = {
                        iOrder_id: id,
                        sTransaction_id: paymentid,
                        sPaymentStatus: "Payment Success",
                        sCreated_by: get_user_name,
                        dCreated_at: get_time,
                        isActive: 1
                    };

                    db.query(insert_payment_status, post_payment_status, (err, result3) => {

                        if (err) {

                            console.log(err.sqlMessage);

                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result3);

                        var check_user_lat_long = 'select t2.sLat,t2.sLong from tblorderMedicine t1 \
                            join tblUserMaster t2 on t2.id=t1.iUserid and t2.sActive=1 \
                            where t1.id=? and t1.isActive=1';

                        db.query(check_user_lat_long, [id], (err, result4) => {

                            if (err) {
                                console.log(err.sqlMessage);
                                return res.send({
                                    status: 0,
                                    message: err.sqlMessage
                                });
                            }

                            console.log(result4);

                            var sLat1 = result4[0].sLat;
                            var sLong1 = result4[0].sLong;

                            var pharmacy_lat_long = 'select id,sLat,sLong from tblPharmacyMaster where isActive=1';

                            db.query(pharmacy_lat_long, async (err, result5) => {

                                if (err) {
                                    console.log(err.sqlMessage);
                                    return res.send({
                                        status: 0,
                                        message: err.sqlMessage
                                    });
                                }

                                console.log(result5);

                                for (var i = 0; i < result5.length; i++) {

                                    await FindDistance(sLat1, sLong1, result5[i].sLat, result5[i].sLong, result5[i].id, pharmacy_kms_distance);

                                }

                                console.log("Pharmacy id:");

                                console.log(pharmacy_id);

                                if (pharmacy_id.length == 0) {

                                    return res.send({
                                        sttaus: 0,
                                        message: 'Pharmacy Not Available in your sorroundings'
                                    });

                                }
                                else {

                                    var phar_id = pharmacy_id.map(function (n) {
                                        return n.id;
                                    });

                                    console.log(phar_id);

                                    var get_pharamcist_id = 'SELECT t2.id,t1.sContactNoPrimary \
                                    FROM tblPharmacyMaster t1 \
                                    join tblUserMaster t2 on t2.sMobileNum=t1.sContactNoPrimary and t2.sActive=1 \
                                    where t1.id IN(?) and t1.isActive=1';

                                    db.query(get_pharamcist_id, [phar_id], async (err, result6) => {

                                        if (err) {
                                            console.log(err.sqlMessage);
                                            return res.send({
                                                status: 0,
                                                message: err.sqlMessage
                                            });
                                        }

                                        console.log(result6);

                                        for (var i = 0; i < result6.length; i++) {
                                            await require('./config/Pillsnotify.js')(result6[i].id, "New Orders Arrived", "Medi360", ordercode);

                                            // await require('./config/Pillsnotify.js')(1, "New Orders Arrived", "Medi360", "");
                                        }

                                        for (var i = 0; i < result6.length; i++) {
                                            await InsertOrderPharmacyNotification(id, result6[i].id, get_user_name, get_time, db);
                                        }

                                        return res.send({
                                            status: 1,
                                            message: 'SUCCESS'
                                        });

                                    });

                                }

                            });

                        });


                    });

                });

            });

        }
        else {
            console.log("FAILURE");

            var update_order_medicine = 'update tblorderMedicine SET iStatus_id=138,sModified_by=?,dModified_at=? where id=?';

            db.query(update_order_medicine, [get_user_name, get_time, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var insert_tblorderMedicinebookingstatusdtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                var post_tblorderMedicinebookingstatusdtls = {
                    iOrderid: id,
                    iStatusid: 138,
                    sStatus: "Payment Failure",
                    sCreated_by: get_user_name,
                    dCreated_at: get_time,
                    isActive: 1
                }

                db.query(insert_tblorderMedicinebookingstatusdtls, post_tblorderMedicinebookingstatusdtls, async (err, result2) => {

                    if (err) {
                        console.log(err);
                        return res.send(err.sqlMessage);
                    }

                    console.log(result2);

                    var insert_payment_status = 'INSERT INTO tblpaymenttransaction SET ?';

                    var post_payment_status = {
                        iOrder_id: id,
                        sTransaction_id: paymentid,
                        sPaymentStatus: "Payment Failure",
                        sCreated_by: get_user_name,
                        dCreated_at: get_time,
                        isActive: 1
                    };

                    db.query(insert_payment_status, post_payment_status, (err, result3) => {

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
                            message: 'FAILURE'
                        });

                    });

                });

            });
        }

    });


    app.post('/checkLabPaymentStatus', async(req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        // var id = 3;
        // var ordercode = "OMED00003";
        // var paymentid = "pay_GkZmeK6XxB6BSX";
        // var signature = "d067fe69c01d17529718d7b0c200867395ae1a6f3fa5d28f685ae3a4742ad094";
        // var paymentamount = 2567;
        // var orderid = "order_GkZliWuiAa59Pp";
        // var iUserid = 1;

        var id = req.body.id;
        var ordercode = req.body.ordercode;
        var paymentid = req.body.paymentid;
        var signature = req.body.signature;
        var paymentamount = req.body.paymentamount;
        var orderid = req.body.orderid;
        var iUserid = req.body.iUserid;

        var transactionstatus = await checkPaymentSignature(orderid, paymentid, signature);

       // var transactionstatus = "SUCCESS";

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);

        if (transactionstatus == "SUCCESS") {

            console.log("SUCCESS");

            var update_order_medicine = 'update tblorderMedicine SET iStatus_id=137,ipaymentAmount=?,sModified_by=?,dModified_at=? where id=?';

            db.query(update_order_medicine, [paymentamount, get_user_name, get_time, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var insert_tblorderMedicinebookingstatusdtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                var post_tblorderMedicinebookingstatusdtls = {
                    iOrderid: id,
                    iStatusid: 137,
                    sStatus: "Payment Success",
                    sCreated_by: get_user_name,
                    dCreated_at: get_time,
                    isActive: 1
                }

                db.query(insert_tblorderMedicinebookingstatusdtls, post_tblorderMedicinebookingstatusdtls, async (err, result2) => {

                    if (err) {
                        console.log(err);
                        return res.send(err.sqlMessage);
                    }

                    console.log(result2);

                    var insert_payment_status = 'INSERT INTO tblpaymenttransaction SET ?';

                    var post_payment_status = {
                        iOrder_id: id,
                        sTransaction_id: paymentid,
                        sPaymentStatus: "Payment Success",
                        sCreated_by: get_user_name,
                        dCreated_at: get_time,
                        isActive: 1
                    };

                    db.query(insert_payment_status, post_payment_status, (err, result3) => {

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
                            message: 'SUCCESS'
                        });

                    });

                });

            });

        }
        else{

        }


    });

    function getProductImagestoPharmacy(orderid, db) {

        return new Promise(async (resolve, reject) => {

            var ip = await require('./config/ipaddressconfig.js')(db);

            var getproductImages = 'select b.iorderid,b.iproductid,b.iVersion,concat(?,c.sFileUrl,c.sFileName) as "FileURL" from ( \
                SELECT iorderid,MAX(iversion) as "Maxversion" FROM Medi360.tblOrderMedicinedtls where iorderid=? and isActive=1)a \
                join tblOrderMedicinedtls b on b.iorderid=a.iorderid and b.iVersion=a.Maxversion and b.isActive=1 \
                join tblMpImages c on c.iMedicalProductid=b.iproductid and c.isActive=1';

            db.query(getproductImages, [ip, orderid], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                return resolve(result);

            });

        });


    }


    function getProductCount(id, db) {

        return new Promise((resolve, reject) => {

            var getProductCount = 'select count(*) as "Quantity" \
            from \
            (SELECT iorderid,MAX(iVersion) as "version" FROM tblOrderMedicinedtls \
            where iorderid=? and isActive=1) t1 \
            join tblOrderMedicinedtls t2 on t2.iorderid=t1.iorderid and t2.iVersion=t1.version and t2.isActive=1 ';

            db.query(getProductCount, [id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }
                console.log(result);

                if (result.length == 0) {
                    return resolve(0);
                }
                else {
                    return resolve(result[0].Quantity);
                }


            });

        });

    }

    function getProductDetails(id, db) {

        return new Promise(async (resolve, reject) => {

            var ip = await require('./config/ipaddressconfig.js')(db);

            var getProductdetails = 'select \
            t2.sProductName,t2.dTotAmt,concat(?,t3.sFileUrl,t3.sFileName) as "FilePath" \
            from \
            (SELECT iorderid,MAX(iVersion) as "version" FROM tblOrderMedicinedtls \
            where iorderid=? and isActive=1) t1 \
            join tblOrderMedicinedtls t2 on t2.iorderid=t1.iorderid and t2.iVersion=t1.version and t2.isActive=1 \
            left join tblMpImages t3 on t3.iMedicalProductid=t2.iproductid and t3.isActive=1 \
            order by t2.id ASC';

            db.query(getProductdetails, [ip, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }
                console.log(result);

                if (result.length == 0) {
                    return resolve({});
                }
                else {
                    return resolve(result[0]);
                }


            });

        });

    }

    app.post('/showOrderstopharmacy', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var id = req.body.id;

        var show_orders = 'SELECT t1.id as "order_id",t1.sOrderNo as "order_code", \
        DATE_FORMAT(t1.dCreated_at,"%d-%m-%Y") as "date",TIME_FORMAT(t1.dCreated_at,"%h:%i %p") as "time",t2.sMobileNum,t2.sName,t3.dTotAmt, \
        t4.sValue as "status",t1.iStatus_id,t5.iAccept \
        FROM tblorderMedicine t1 \
        join tblUserMaster t2 on t2.id=t1.iUserid and t2.sActive=1 \
        join (select DISTINCT(b.iorderid) as "orderid",b.iVersion,b.dTotAmt from \
        (select iorderid,MAX(iversion) as "Maxversion" from tblOrderMedicinedtls group by iorderid)a \
        join tblOrderMedicinedtls b on b.iorderid=a.iorderid and b.iversion=a.Maxversion and b.isActive=1) t3 on t3.orderid=t1.id  \
        join tblAppConfig t4 on t4.id=t1.iStatus_id and t4.isActive=1 \
		join tblOrderPharmacyNotification t5 on t5.iOrderid=t1.id and t5.iPharmacistid=? and t5.isActive=1';

        db.query(show_orders, [id], async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {

                result[i].images = [];

                result[i].images = await getProductImagestoPharmacy(result[i].order_id, db);
            }

            return res.send(result);

        });

    });

    app.post('/showMedicalProductstopharmacy', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var id = req.body.id;
        var ipharmacistid = req.body.ipharmacistid;

        var ip = await require('./config/ipaddressconfig.js')(db);

        let order_details = 'select t1.id,t1.sOrderNo,t2.sValue as "Status_name",t3.sName as "Username",t3.sMobileNum,t1.sAddress,t1.sLat,t1.sLong,t1.iStatus_id, \
        DATE_FORMAT(t1.dCreated_at,"%d-%m-%Y") as "date",TIME_FORMAT(t1.dCreated_at,"%h:%i %p") as "time",t1.sOrdertype,concat(?,t4.sFilePath,t4.sFileName) as "PrescriptionFilePath" ,t5.iAccept \
        from tblorderMedicine t1 \
        join tblAppConfig t2 on t1.iStatus_id = t2.id and t2.isActive=1 \
        join tblUserMaster t3 on t1.iUserid = t3.id and t3.sActive=1 \
		left join tblPrescriptionFiles t4 on t4.iOrderid=t1.id and t4.isActive=1 \
        left join tblOrderPharmacyNotification t5 on t5.iOrderid=t1.id and t5.iPharmacistid=? and t5.isActive=1 \
        WHERE t1.id=? and t1.isActive=1';

        db.query(order_details, [ip, ipharmacistid, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            let product_details = 'select t2.iorderid,t2.iVersion,t2.iproductid, \
            t2.sProductName,t2.sProductCode,t2.iqty,t2.dPrice,t2.dAmt,t2.dTotAmt \
            from \
            (SELECT iorderid,MAX(iVersion) as "version" FROM tblOrderMedicinedtls \
            where iorderid=? and isActive=1) t1 \
            join tblOrderMedicinedtls t2 on t2.iorderid=t1.iorderid and t2.iVersion=t1.version and t2.isActive=1';

            db.query(product_details, [id], async (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }

                console.log(result2);

                if (result.length > 0) {

                    result[0].productdetails = result2;

                    result[0].productdetails = result[0].productdetails.map(v => ({ ...v, images: [] }));

                    for (var j = 0; j < result[0].productdetails.length; j++) {

                        console.log(result[0].productdetails[j].iproductid);

                        result[0].productdetails[j].images.push(await getProductImages(result[0].productdetails[j].iproductid, db))

                    }

                    return res.send(result);


                }
                else {
                    return res.send([]);
                }

            });



        });

    });

    app.post('/showMedicalProductstoCustomer', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var id = req.body.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        let order_details = 'select t1.id,t1.sOrderNo,t2.sValue as "Status_name",t3.sName as "Username",t3.sMobileNum,t1.sAddress,t1.sLat,t1.sLong,t1.iStatus_id, \
        DATE_FORMAT(t1.dCreated_at,"%d-%m-%Y") as "date",TIME_FORMAT(t1.dCreated_at,"%h:%i %p") as "time",t1.sOrdertype,concat(?,t4.sFilePath,t4.sFileName) as "PrescriptionFilePath" \
        from tblorderMedicine t1 \
        join tblAppConfig t2 on t1.iStatus_id = t2.id and t2.isActive=1 \
        join tblUserMaster t3 on t1.iUserid = t3.id and t3.sActive=1 \
		left join tblPrescriptionFiles t4 on t4.iOrderid=t1.id and t4.isActive=1 \
        WHERE t1.id=? and t1.isActive=1';

        db.query(order_details, [ip, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            let product_details = 'select t2.iorderid,t2.iVersion,t2.iproductid, \
            t2.sProductName,t2.sProductCode,t2.iqty,t2.dPrice,t2.dAmt,t2.dTotAmt \
            from \
            (SELECT iorderid,MAX(iVersion) as "version" FROM tblOrderMedicinedtls \
            where iorderid=? and isActive=1) t1 \
            join tblOrderMedicinedtls t2 on t2.iorderid=t1.iorderid and t2.iVersion=t1.version and t2.isActive=1';

            db.query(product_details, [id], async (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }

                console.log(result2);

                if (result.length > 0) {

                    result[0].productdetails = result2;

                    result[0].productdetails = result[0].productdetails.map(v => ({ ...v, images: [] }));

                    for (var j = 0; j < result[0].productdetails.length; j++) {

                        console.log(result[0].productdetails[j].iproductid);

                        result[0].productdetails[j].images.push(await getProductImages(result[0].productdetails[j].iproductid, db))

                    }

                    return res.send(result);


                }
                else {
                    return res.send([]);
                }

            });



        });

    });


    app.post('/showMyOrdersList', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userid = req.body.userid;

        var ip = await require('./config/ipaddressconfig.js')(db);

        var show_orders = 'select t1.id,t1.sOrderNo,t2.sValue as "Status_name", \
        DATE_FORMAT(t1.dCreated_at,"%d-%m-%Y") as "date",TIME_FORMAT(t1.dCreated_at,"%h:%i %p") as "time",t1.sOrdertype ,concat(?,t3.sFilePath,t3.sFileName) as "prescriptionFilePath" \
        from tblorderMedicine t1 \
        join tblAppConfig t2 on t1.iStatus_id = t2.id and t2.isActive=1 \
        left join tblPrescriptionFiles t3 on t3.iOrderid=t1.id and t3.isActive=1 \
        WHERE t1.iUserid=? and t1.isActive=1';

        db.query(show_orders, [ip, userid], async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {

                result[i].Quantity = await getProductCount(result[i].id, db);
                result[i].details = await getProductDetails(result[i].id, db);

            }

            console.log(result);

            return res.send(result);

        });



    });


    app.post('/showMyTrackingOrder', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var orderid = req.body.orderid;

        var show_order_details = 'select t1.id,t1.sOrderNo,t2.sValue as "Status_name", \
        DATE_FORMAT(t1.dCreated_at,"%d-%m-%Y") as "date",TIME_FORMAT(t1.dCreated_at,"%h:%i %p") as "time" , \
        concat(t3.sAddress,t3.sLandMark) as "Address" \
        from tblorderMedicine t1 \
        join tblAppConfig t2 on t1.iStatus_id = t2.id and t2.isActive=1 \
        join tblUserMaster t3 on t3.id=t1.iUserid and t3.sActive=1 \
        WHERE t1.id=? and t1.isActive=1';

        db.query(show_order_details, [orderid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var order_statuses = 'select t1.iOrderid,t1.iStatusid,t1.sStatus as "status",t2.sDescription as "statusdescription",TIME_FORMAT(dCreated_at,"%h.%i") as "time" \
            from tblorderMedicinebookingstatusdtls t1 \
            join tblAppConfig t2 on t2.id=t1.iStatusid and t2.isActive=1 \
            where t1.iOrderid=? and t1.isActive=1';

            db.query(order_statuses, [orderid], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                if (result.length > 0) {

                    result[0].statusflow = result2;

                    return res.send(result);
                }
                else {
                    return res.send(result);
                }

            });

        });

    });


    app.post('/AcceptOrder', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var orderid = req.body.orderid;
        var pharmacistid = req.body.pharmacistid;
        var status = req.body.status;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, pharmacistid);

        var check_order_exist = 'select count(*) as "orderlength" from tblorderMedicine where id=? and isActive=1';

        db.query(check_order_exist, [orderid], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            if (result.length == 0) {

                return res.send({
                    sttaus: 0,
                    message: 'Order does not exist'
                });

            }
            else {

                console.log(`Order Exist`);

                var check_order_accept = 'select * from tblOrderPharmacyNotification where iOrderid=? and iAccept=1 and isActive=1';

                db.query(check_order_accept, [orderid], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    if (result2.length == 0) {

                        if (status == 1) { // Accept

                            var get_pharamacy_data = 'select t1.id as "pharmacistid",t2.sContactNoPrimary,t2.sPharmacyName,t2.id as "pharmacyid" from tblUserMaster t1 \
                            join tblPharmacyMaster t2 on t2.sContactNoPrimary=t1.sMobileNum and t2.isActive=1 \
                            where t1.id=? and t1.sActive=1';

                            db.query(get_pharamacy_data, [pharmacistid], (err, result3) => {

                                if (err) {
                                    console.log(err.sqlMessage);
                                    return res.send({
                                        status: 0,
                                        message: err.sqlMessage
                                    });
                                }

                                console.log(result3);

                                var pharmacyid = result3[0].pharmacyid;
                                var sPharmacyName = result3[0].sPharmacyName;
                                var pharmacistid = result3[0].pharmacistid;

                                var update_order_pharmacy = 'update tblorderMedicine SET iStatus_id=144,ipharmacyid=?,ipharmacistid=?,sPharmacyname=?,sModified_by=?,dModified_at=? where id=?';

                                db.query(update_order_pharmacy, [pharmacyid, pharmacistid, sPharmacyName, get_user_name, get_time, orderid], (err, result4) => {

                                    if (err) {
                                        console.log(err.sqlMessage);
                                        return res.send({
                                            status: 0,
                                            message: err.sqlMessage
                                        });
                                    }

                                    console.log(result4);

                                    var update_accept_order_pharmacy = 'update tblOrderPharmacyNotification SET iAccept=1,sModified_by=?,dModified_at=?  \
                                    where iOrderid=? and iPharmacistid=?';

                                    db.query(update_accept_order_pharmacy, [get_user_name, get_time, orderid, pharmacistid], (err, result5) => {

                                        if (err) {
                                            console.log(err.sqlMessage);
                                            return res.send({
                                                status: 0,
                                                message: err.sqlMessage
                                            });
                                        }

                                        console.log(result5);

                                        var insert_order_booking_status_dtls = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                                        var post_order_booking_status_dtls = {
                                            iOrderid: orderid,
                                            iStatusid: 144,
                                            sStatus: "Order Accepted by Pharmacy",
                                            sCreated_by: get_user_name,
                                            dCreated_at: get_time,
                                            isActive: 1
                                        };

                                        db.query(insert_order_booking_status_dtls, post_order_booking_status_dtls, (err, result6) => {

                                            if (err) {
                                                console.log(err.sqlMessage);
                                                return res.send({
                                                    status: 0,
                                                    message: err.sqlMessage
                                                });
                                            }

                                            console.log(result6);

                                            return res.send({
                                                status: 1,
                                                message: 'Accepted'
                                            });

                                        });

                                    });

                                });

                            });

                        }
                        else {

                            return res.send({
                                status: 1,
                                message: 'Rejected'
                            });

                        }

                    }
                    else {

                        return res.send({
                            status: 1,
                            message: 'Already this Order Accepted by Other Pharmacy'
                        });

                    }

                });

            }

        });
    });

    app.post('/updateReadytoAccept', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var orderid = req.body.orderid;
        var iUserid = req.body.iUserid;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);
        var pharmacy_rider_kms_distance = await require('./config/findstatusvalue.js')(143, db);

        var update_status_order_medicine = 'update tblorderMedicine SET iStatus_id=142,sCreated_by=?,dCreated_at=? where id=?';

        db.query(update_status_order_medicine, [get_user_name, get_time, orderid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var insert_order_status = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

            var post_order_status = {
                iOrderid: orderid,
                iStatusid: 142,
                sStatus: 'ReadytoPickup',
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_order_status, post_order_status, (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var get_pharmacy_lat_long = 'select t1.ipharmacyid,t2.sLat,t2.sLong from tblorderMedicine t1 \
                join tblPharmacyMaster t2 on t2.id=t1.ipharmacyid and t2.isActive=1 \
                where t1.id=? and t1.isActive=1';

                db.query(get_pharmacy_lat_long, [orderid], (err, result3) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    var sLat1 = result3[0].sLat;
                    var sLong1 = result3[0].sLong;

                    var rider_lat_long = 'select t2.iRider_id,t2.sLat,t2.sLong from \
                    (select MAX(id) as "id",iRider_id from tblRiderLatLong where isActive=1 group by iRider_id) t1 \
                    join tblRiderLatLong t2 on t2.id=t1.id and t2.iRider_id=t1.iRider_id and t2.isActive=1';

                    db.query(rider_lat_long, async (err, result4) => {

                        if (err) {
                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                messsage: err.sqlMessage
                            });
                        }

                        console.log(result4);

                        for (var i = 0; i < result4.length; i++) {

                            await FindDistanceofRider(sLat1, sLong1, result4[i].sLat, result4[i].sLong, result4[i].iRider_id, pharmacy_rider_kms_distance,);

                        }

                        console.log(rider_id);

                        if (rider_id.length == 0) {

                            return res.send({
                                sttaus: 1,
                                message: 'Rider Not Available in your sorroundings'
                            });

                        }
                        else {

                            var r_id = rider_id.map(function (n) {
                                return n.id;
                            });

                            console.log(r_id);

                            for (var i = 0; i < rider_id.length; i++) {
                                await require('./config/Pillsnotify.js')(rider_id[i].id, "New Orders Arrived to deliver", "Medi360", orderid);
                                // await require('./config/Pillsnotify.js')(1, "New Orders Arrived to deliver", "Medi360", orderid);
                            }

                            for (var i = 0; i < rider_id.length; i++) {
                                await InsertPharmacyRiderNotification(orderid, rider_id[i].id, get_user_name, get_time, db);
                            }

                            return res.send({
                                status: 1,
                                message: 'SUCCESS'
                            });

                        }
                    });

                });

            });

        });

    });


    app.post('/showOrderstoRider', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var riderid = req.body.riderid;

        var show_orders_riders = 'select t2.id,t2.sOrderNo,DATE_FORMAT(t2.dCreated_at,"%d-%m-%Y") as "date",TIME_FORMAT(t2.dCreated_at,"%h:%i %p") as "time", \
        t2.sPharmacyname,t2.ipharmacyid,t2.ipharmacistid,t3.sName as "pharmacist_name",t4.id as "userid",t4.sName as "CustomerName",t5.dTotAmt as "Total_Amount", \
        t2.sAddress as "deliveryAddress",t2.sLat as "deliveryLat",t2.sLong as "deliveryLong" ,t6.sPharmacyAddress as "pharmacyAddress",t6.sLat as "pharmacyLat",t6.sLong as "pharmacyLong", \
        t3.sMobileNum as "pharmacistmobileno",t4.sMobileNum as "usermobileno",t7.sValue as "status",t2.iStatus_id,t8.iAccept \
        from ( \
        select iOrderid from tblPharmacyRiderNotification where iOrderid NOT IN ( \
        select iOrderid from tblPharmacyRiderNotification where iAccept=1 AND isActive=1) and iRider_id=? group by iOrderid) t1 \
        join tblorderMedicine t2 on t2.id=t1.iOrderid and t2.isActive=1 \
        join tblUserMaster t3 on t3.id=t2.ipharmacistid and t3.sActive=1 \
        join tblUserMaster t4 on t4.id=t2.iUserid and t4.sActive=1 \
        join(select DISTINCT(b.iorderid) as "orderid",b.iVersion,b.dTotAmt from \
        (select iorderid,MAX(iversion) as "Maxversion" from tblOrderMedicinedtls group by iorderid)a \
        join tblOrderMedicinedtls b on b.iorderid=a.iorderid and b.iversion=a.Maxversion and b.isActive=1) t5 on t5.orderid=t2.id \
        join tblPharmacyMaster t6 on t6.id=t2.ipharmacyid and t6.isActive=1 \
        join tblAppConfig t7 on t7.id=t2.iStatus_id and t7.isActive=1 \
        join tblPharmacyRiderNotification t8 on t8.iOrderid=t2.id and t8.iRider_id=?';

        db.query(show_orders_riders, [riderid, riderid], (err, result) => {

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


    app.post('/updateRiderAcceptance', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var orderid = req.body.orderid;
        var riderid = req.body.riderid;
        var status = req.body.status;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, riderid);

        var check_order_exist = 'select * from tblorderMedicine where id=? and isActive=1';

        db.query(check_order_exist, [orderid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                return res.send({
                    status: 0,
                    message: 'OrderId does not exist'
                });

            }
            else {

                var check_order_accpetance = 'select * from tblPharmacyRiderNotification where iOrderid=? and iAccept=1 and isActive=1';

                db.query(check_order_accpetance, [orderid], (err, result4) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }
                    else {

                        console.log(result4);

                        if (result4.length == 0) {

                            if (status == 1) { //Accept

                                var update_order_medicine_status = 'update tblorderMedicine SET iStatus_id=145,iRiderid=?,sModified_by=?,dModified_at=? where id=?';

                                db.query(update_order_medicine_status, [riderid, get_user_name, get_time, orderid], (err, result2) => {

                                    if (err) {
                                        console.log(err.sqlMessage);
                                        return res.send({
                                            status: 0,
                                            message: err.sqlMessage
                                        });
                                    }

                                    console.log(result2);

                                    var update_assigned_rider_order = 'update tblPharmacyRiderNotification SET iAccept=1,sModified_by=?,dModified_at=? where iOrderid=? and iRider_id=?';

                                    db.query(update_assigned_rider_order, [get_user_name, get_time, orderid, riderid], (err, result3) => {

                                        if (err) {
                                            console.log(err.sqlMessage);
                                            return res.send({
                                                status: 0,
                                                message: err.sqlMessage
                                            });
                                        }

                                        console.log(result3);

                                        var insert_order_medicine_status_details = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

                                        var post_order_medicine_status_details = {
                                            iOrderid: orderid,
                                            iStatusid: 145,
                                            sStatus: 'Accepted by Rider',
                                            sCreated_by: get_user_name,
                                            dCreated_at: get_time,
                                            isActive: 1
                                        };

                                        db.query(insert_order_medicine_status_details, post_order_medicine_status_details, (err, result4) => {

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
                                                message: 'Accepted'
                                            });

                                        });

                                    });

                                });

                            }
                            else { // Reject

                                return res.send({
                                    status: 1,
                                    message: 'Rejected'
                                });

                            }

                        }
                        else {
                            return res.send({
                                status: 1,
                                message: 'Already this Order Accepted by Another Rider'
                            });
                        }

                    }

                });
            }

        });

    });


    app.post('/getRiderdeliveryOrders', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var riderid = req.body.riderid;

        var new_status = 'select t1.sOrderNo,t1.id as "orderid",t2.id as "Label_id",t2.sLabel, \
        t1.ipharmacyid,t1.sPharmacyname,t3.sPharmacyAddress as "pharmacyAddress",t3.sLat as "pharmacyLat",t3.sLong as "pharmacyLong", \
        t3.sContactNoPrimary as "phprimaryconatctno",t3.sContactNoSecondary as "phsecondarycontatcno",t3.sContactName as "pharmacyContactName", \
        t1.iUserid as "userid",t4.sName as "Username",t1.sAddress as "deliveryAddress",t4.sMobileNum as "userMobileNo",t1.sLat as "userLat",t1.sLong as "userLong",t1.iStatus_id,t5.iAccept \
        from tblorderMedicine t1 \
        join tblRiderStatusFlowLabel t2 on t2.iStatus_id=t1.iStatus_id and t2.isActive=1 \
        join tblPharmacyMaster t3 on t3.id=t1.ipharmacyid and t3.isActive=1 \
        join tblUserMaster t4 on t4.id=t1.iUserid and t4.sActive=1 \
        join tblPharmacyRiderNotification t5 on t5.iOrderid=t1.id and t5.iRider_id=? \
        where t1.iRiderid=? and t1.iStatus_id=145 and t1.isActive=1';

        var ongoing_status = 'select t1.sOrderNo,t1.id as "orderid",t2.id as "Label_id",t2.sLabel, \
        t1.ipharmacyid,t1.sPharmacyname,t3.sPharmacyAddress as "pharmacyAddress",t3.sLat as "pharmacyLat",t3.sLong as "pharmacyLong", \
        t3.sContactNoPrimary as "phprimaryconatctno",t3.sContactNoSecondary as "phsecondarycontatcno",t3.sContactName as "pharmacyContactName", \
        t1.iUserid as "userid",t4.sName as "Username",t1.sAddress as "deliveryAddress",t4.sMobileNum as "userMobileNo",t1.sLat as "userLat",t1.sLong as "userLong",t1.iStatus_id,t5.iAccept \
        from tblorderMedicine t1 \
        join tblRiderStatusFlowLabel t2 on t2.iStatus_id=t1.iStatus_id and t2.isActive=1 \
        join tblPharmacyMaster t3 on t3.id=t1.ipharmacyid and t3.isActive=1 \
        join tblUserMaster t4 on t4.id=t1.iUserid and t4.sActive=1 \
        join tblPharmacyRiderNotification t5 on t5.iOrderid=t1.id and t5.iRider_id=? \
        where t1.iRiderid=? and t1.iStatus_id=146 and t1.isActive=1';

        var completed_status = 'select t1.sOrderNo,t1.id as "orderid",t2.id as "Label_id",t2.sLabel, \
        t1.ipharmacyid,t1.sPharmacyname,t3.sPharmacyAddress as "pharmacyAddress",t3.sLat as "pharmacyLat",t3.sLong as "pharmacyLong", \
        t3.sContactNoPrimary as "phprimaryconatctno",t3.sContactNoSecondary as "phsecondarycontatcno",t3.sContactName as "pharmacyContactName", \
        t1.iUserid as "userid",t4.sName as "Username",t1.sAddress as "deliveryAddress",t4.sMobileNum as "userMobileNo",t1.sLat as "userLat",t1.sLong as "userLong",t1.iStatus_id,t5.iAccept \
        from tblorderMedicine t1 \
        join tblRiderStatusFlowLabel t2 on t2.iStatus_id=t1.iStatus_id and t2.isActive=1 \
        join tblPharmacyMaster t3 on t3.id=t1.ipharmacyid and t3.isActive=1 \
        join tblUserMaster t4 on t4.id=t1.iUserid and t4.sActive=1 \
        join tblPharmacyRiderNotification t5 on t5.iOrderid=t1.id and t5.iRider_id=? \
        where t1.iRiderid=? and t1.iStatus_id=147 and t1.isActive=1';

        db.query(new_status, [riderid, riderid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(ongoing_status, [riderid, riderid], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);


                db.query(completed_status, [riderid, riderid], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    return res.send({
                        new: result,
                        ongoing: result2,
                        completed: result3
                    });

                });

            });

        });

    });


    app.post('/updateRiderStatus', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var orderid = req.body.orderid;
        var labelid = req.body.labelid;
        var riderid = req.body.riderid;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, riderid);



        if (labelid == 1) {

            var insert_order_medicine_status_details = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

            var post_order_medicine_status_details = {
                iOrderid: orderid,
                iStatusid: 146,
                sStatus: 'Order Pickedup',
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_order_medicine_status_details, post_order_medicine_status_details, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_rider_status = 'update tblorderMedicine SET iStatus_id=146,sModified_by=?,dModified_at=?  where id=?';

                db.query(update_rider_status, [get_user_name, get_time, orderid], (err, result2) => {

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
                        message: 'Rider Status updated'
                    });

                });


            });

        }
        else if (labelid == 2) {
            var insert_order_medicine_status_details = 'INSERT INTO tblorderMedicinebookingstatusdtls SET ?';

            var post_order_medicine_status_details = {
                iOrderid: orderid,
                iStatusid: 147,
                sStatus: 'Order Completed',
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_order_medicine_status_details, post_order_medicine_status_details, (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                var update_rider_status = 'update tblorderMedicine SET iStatus_id=147,sModified_by=?,dModified_at=?  where id=?';

                db.query(update_rider_status, [get_user_name, get_time, orderid], (err, result2) => {

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
                        message: 'Rider Status updated'
                    });

                });

            });
        }

    });






}
