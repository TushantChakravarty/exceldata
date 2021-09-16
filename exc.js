    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    var multer = require('multer');
    var xlstojson = require("xls-to-json-lc");
    var xlsxtojson = require("xlsx-to-json-lc");
    const mongoose=require('mongoose');
    const urll='mongodb://127.0.0.1:27017/excel';
    const url="mongodb+srv://tushant07:tushant07@cluster0.b6dej.mongodb.net/excel?retryWrites=true&w=majority"
    mongoose.connect(url,{
        useNewUrlParser:true
    });
    const db=mongoose.connection
    db.on('error',error=>console.error(error));
    db.once('open',()=>{
        console.log('connected to database');
    })
    var nameschema=new mongoose.Schema({
        exceldata:[{}]
    })
    var user=mongoose.model("user",nameschema);
    app.use(bodyParser.json());
    var storage = multer.diskStorage({ 
        destination: function (req, file, cb) {
            cb(null, './uploads/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        }
    });
    var upload = multer({ 
                    storage: storage,
                    fileFilter : function(req, file, callback) { 
                        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
                            return callback(new Error('Wrong extension type'));
                        }
                        callback(null, true);
                    }
                }).single('file');
    
    app.post('/', function(req, res) {
        var exceltojson;
        upload(req,res,async function(err){
            if(err){
                 res.json({error_code:1,err_desc:"file type not allowed"});
                 return;
            }
            
            if(!req.file){
                res.json({error_code:1,err_desc:"No file passed"});
                return;
            }
            
            if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
                exceltojson =  xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            try {
                exceltojson({
                    input: await req.file.path,
                    output: null, 
                    lowerCaseHeaders:true
                }, function(err,result){
                    if(err) {
                        return res.json({error_code:1,err_desc:'File type not allowed', data: null});
                    }
                    //res.json({error_code:0,err_desc:null, data: result});
                    //res.send('file uploaded')
                    console.log(result)
                     user.findOne({"exceldata":result},function(err,resl){
                        if(err) console.log(err);
                        if(resl){
                             res.json({error_code:1,err_desc:'This data has already been saved', data: null});
                            
                            console.log('this data has already been saved');
                        }else{
                            var mydata=new user({
                                "exceldata":result});
                            
                             mydata.save()
                             .then(item=>{
                                 res.send('item saved to database');
                             })
                        }
                    })
                    
                   
                });
            } catch (e){
                res.json({error_code:1,err_desc:"Corupted excel file"});
            }
        })
    });
    app.get('/',function(req,res){
        res.sendFile(__dirname + "/index.html");
    });
    app.listen('1000', function(){
        console.log('running on port 1000');
    });
