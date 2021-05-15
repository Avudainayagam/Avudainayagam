module.exports=function(app){

    app.post('/postJob',async(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var job_title="Angular Developer";
        // var location="Chennai";
        // var country="India";
        // var no_of_hires=5;
        // var job_description="Looking for a Angular Developer";
        // var min_salary="30000";
        // var max_salary="50000";
        // var yearsofexp=3;
        // var userid=1;
        // var companyName="Phantom Smart Solutions";

        var job_title=req.body.job_title;
        var location=req.body.location;
        var country=req.body.country;
        var no_of_hires=req.body.no_of_hires;
        var job_description=req.body.job_description;
        var min_salary=req.body.min_salary;
        var max_salary=req.body.max_salary;
        var yearsofexp=req.body.yearsofexp;
        var userid=req.body.userid;
        var companyName=req.body.companyName;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db,userid);

        var insert_post_job='INSERT INTO tblactivejobs_Jobportal SET ?';

        var post_post_job={
            iuserid:userid,
            sJobtitle:job_title,
            sJobDescription:job_description,
            sYearsofExperience:yearsofexp,
            nMinofSalary:min_salary,
            nMaxofSalary:max_salary,
            iNoofposition:no_of_hires,
            sLocation:location,
            sCountry:country,
            sCompanyName:companyName,
            sCreatedBy:get_user_name,
            dCreated:get_time,
            isActive:1
        };

        db.query(insert_post_job,post_post_job,(err,result)=>{

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
                message:'Jobs Posted'
            });

        });

    });

    app.post('/showPostedJobsbyUser',(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        var userid=req.body.userid;

        var show_posted_jobs='select sJobtitle,sJobDescription,sYearsofExperience,nMinofSalary,nMaxofSalary, \
        sLocation,sCountry,iNoofposition,sCompanyName \
        from tblactivejobs_Jobportal where iuserid=? and isActive=1';

        db.query(show_posted_jobs,[userid],(err,result)=>{

            if(err){
                console.log(err.sqlMessage);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }

            console.log(result);

            return res.send(result);

        });

    });



}
