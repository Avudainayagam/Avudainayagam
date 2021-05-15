module.exports = function (app) {

    var blood_banks = [];

    var blood_banks_bloodgroups = [];

    function FindDistance(lat1, lon1, lat2, lon2, id) {

        return new Promise((resolve, reject) => {

            if ((lat1 == lat2) && (lon1 == lon2)) {

                console.log("Equal...");
                blood_banks.push({ "id": id, "Km": 0 });
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

                console.log("id:" + id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log(dist);
                if (dist <= 5) {
                    blood_banks.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();
            }

        });
    }

    function FindDistancebasedBg(lat1, lon1, lat2, lon2, id) {

        return new Promise((resolve, reject) => {

            if ((lat1 == lat2) && (lon1 == lon2)) {
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
                console.log("id:" + id);
                console.log("Kilometers");
                dist = dist * 1.609344;
                console.log(dist);
                if (dist <= 5) {
                    blood_banks_bloodgroups.push({ "id": id, "Km": Math.round(dist) });
                }
                return resolve();
            }

        });
    }

    app.post('/nearbyBloodBanks', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var lat = "91.9771510";
        // var long = "12.3581910";

        var lat = req.body.lat;
        var long = req.body.long;

        var show_lat_long = 'select id,sLat,sLong from tblbldbankRegs where isActive=1';

        db.query(show_lat_long, async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            for (var i = 0; i < result.length; i++) {

                var id = result[i].id;
                var sLat = result[i].sLat;
                var sLong = result[i].sLong;

                await FindDistance(lat, long, sLat, sLong, id);

            }

            console.log(blood_banks);

            if (blood_banks.length == 0) {

                return res.send({
                    status: 0,
                    message: `Blood Banks are Not Available Sorrounding 5 Kms`
                });

            }
            else {

                var blood_banks_id = blood_banks.map((n) => {

                    return n.id;

                });

                console.log(blood_banks_id);

                var show_blood_banks = 'select id,sBBName,sLat,sLong from tblbldbankRegs where id IN (?) and isActive=1';

                db.query(show_blood_banks, [blood_banks_id], (err, result2) => {

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

        });

    });

    app.post('/BloodBanksbasedBgandLoc', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var bloodgroup = req.body.bloodgroup;
        var lat = req.body.lat;
        var long = req.body.long;

        var find_blood_groups = 'SELECT t1.id,t1.sBBName,sLat,sLong from tblbldbankRegs t1 \
        join tblbldbankbldgroups t2 on t2.idbldbankRegs=t1.id and t2.isActive=1 and t2.sBloodGroup=? \
        where t1.isActive=1';

        db.query(find_blood_groups, [bloodgroup], async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                console.log(`Blood Group Not Available....`);

                return res.send({
                    status: 0,
                    message: `Blood Group Not Available in any Blood Banks`
                });

            }
            else {

                console.log(`Blood Group Available...`);

                for (var i = 0; i < result.length; i++) {

                    var sLat = result[i].sLat;
                    var sLong = result[i].sLong;
                    var id = result[i].id;

                    await FindDistancebasedBg(lat, long, sLat, sLong, id);

                }

                console.log(blood_banks_bloodgroups);

                if (blood_banks_bloodgroups.length == 0) {

                    return res.send({
                        status: 0,
                        message: `Blood Group Not Available Sorrounding 5Kms`
                    });

                }
                else {

                    var blood_banks_bloodgroups_id = blood_banks_bloodgroups.map((n) => {
                        return n.id
                    });

                    console.log(blood_banks_bloodgroups_id);

                    var show_blood_banks = 'select id,sBBName,sLat,sLong,sBBType,sAddress,sCity,sDistrict,sState,sPincode,sContactNumber,sContactLannumber, \
                    sServiceTime,sLicense,dLicenseDate \
                    from tblbldbankRegs where id IN (?) and isActive=1';

                    db.query(show_blood_banks, [blood_banks_bloodgroups_id], (err, result2) => {

                        if (err) {

                            console.log(err.sqlMessage);

                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });

                        }

                        console.log(result2);

                        if(result2.length > 0){
                            return res.send({
                                status:1,
                                data:result2
                            });
                        }else{
                            return res.send({
                                status:0,
                                data:result2
                            })
                        }
                       

                    });

                }



            }

        });

    });

    app.post('/showBloodBankInfo', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;

        var show_blood_info = 'select t1.sAddress,t1.sDistrict,t1.sCity,t1.sState,t1.sPincode,t1.sContactNumber,t1.sContactLannumber,t1.sLicense, \
        t1.dLicenseDate,t1.dLicenseDate from tblbldbankRegs t1 \
        where t1.id=? and t1.isActive=1';

        db.query(show_blood_info, [id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var show_blood_units = 'select t1.sBloodGroup,t1.iBloodUnit from tblbldbankbldgroups t1 where t1.idbldbankRegs=? and t1.isActive=1';

            db.query(show_blood_units, [id], (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                result[0].bloodgroups = result2;

                console.log(result2);

                if(result.length >0){
                    return res.send({
                        status:1,
                        data:result
                    });
                }else{
                    return res.send({
                        status:0,
                        data:result
                    });
                }
                

            });

        });

    });

}
