const EventEmitter = require('events');
var path = require('path');
var fs = require('fs');

const myEmitter = new EventEmitter();

const DONORDIR = './uploads/donorProofs';

myEmitter.on('photoUpload',photoUploadUserMaster);

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
async function photoUploadUserMaster(userId,file,id,db){

    console.log('enter emit.........')
    // if(req.files.PhotoProof){
    //     var aa = await fileRenameandUploadinDB(req.files.PhotoProof[0], id);
    //     console.log(aa);
    //     photoUrl = aa.Fileurl;
    //     photoName = aa.newFileName;
    // }
    if(file){
        let aa = await fileRenameandUploadinDB(file, id);
        console.log(aa);
        let photoUrl = aa.Fileurl;
        let photoName = aa.newFileName;

        let photoUpdated = `UPDATE tblUserMaster SET ? where id=?`;

        let post={
            sProfileUrl:photoUrl,
            sProfilePic:photoName
        }

        db.query(photoUpdated,[post,userId],(err,result)=>{
            if(err){
                console.log(err.sqlMessage)
                return err.sqlMessage
            }else{
               console.log(result,'aaaaaaaaa')
               return result
            }
        })

    }else{
        return 'empty'
    }
    

}

module.exports=myEmitter
