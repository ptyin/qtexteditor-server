const http = require('http');
const express = require('express');
const config = require('./config.js');
const privateKey = config.privateKey;
const publicKey = config.publicKey;
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const app = express();
const db = require('./DBOperations.js');
const bodyParser = require('body-parser');
const nodeMailer = require('nodemailer');
const emailUser = config.email;
const emailPass = config.authorizationCode;
const userRegex = /[\w]{5,20}/;
const passwdRegex = /[\w]*/;
const emailRegex = /^\w+@[a-zA-Z0-9]{2,10}(?:\.[a-z]{2,4}){1,3}$/;
const fileRegex = /[\w-_]{1,16}/;

const DB_USER = config.DB_USER;
const DB_PASSWD = config.DB_PASSWD;
const SRV_HOST = config.SRV_HOST;
const SRV_PORT = config.SRV_PORT;
const DB_HOST = config.DB_HOST;
const DB_PORT = config.DB_PORT;
const DB_NAME = config.DB_NAME;


app.set('port', SRV_PORT);
const connection = mysql.createConnection(
    {
        host: DB_HOST,
        user: DB_USER,
        port: DB_PORT,
        password: DB_PASSWD,
        database: DB_NAME
    }
);

// create reusable transporter object using the default SMTP transport
let transporter = nodeMailer.createTransport(
    {
        host: "smtp.qq.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: emailUser, // generated ethereal user
            pass: emailPass // generated ethereal password
        }
    });

let sendEmail = '<h1 align="center">Thanks for registering...</h1> Please Confirm your Email <a href="'+SRV_HOST+':'+SRV_PORT+'/validate?registerToken=(:placeholder)">'
    +SRV_HOST+':'+SRV_PORT+'/validate?registerToken=(:placeholder)</a>';

let data = {
    from: emailUser, // 发件地址
    to: 'test@test.com', // 收件列表
    subject: 'Welcome to QtLaTeX', // 标题
    text: 'Thanks for registering..., Please Confirm your Email.', // 标题
    html: ''
};

connection.connect();
db.setConnection(connection);
// connection.query("select name from userInfo", function (error, result)
// {
//     if(error)console.log(error);
//     for(let index in result)console.log(index+":"+result[index].name);
// });
// let content = base64Encode('123456');//MTIzNDU2
// console.log(base64Decode(content)+":"+content);
// db.deleteFile("filename-a5-html");
// db.uploadFile("peter", "filename-a5-html", content, (result)=>{});//文件上传别忘编码

app.use(bodyParser.json({limit:'100mb'}));
app.use(bodyParser.urlencoded({limit:'100mb', extended: true }));
//传送过来的参数password为md5加密后的password
/*
* @paras:username, password
* */
app.get('/login', (req, res) =>
{
    if(typeof req.query.username == 'string' &&req.query.username.length<=20&&userRegex.test(req.query.username)&&passwdRegex.test(req.query.password))
        db.findUser(req.query.username, (error, result)=>
        {
            if(error)
            {
                res.status(400).json({error:"unknown error"});
                return;
            }
            if(result[0])db.validateUser(req.query.username, req.query.password, (error, result)=>
            {
                if(error)
                {
                    res.status(400).json({error:"unknown error"});
                    return;
                }
                if(!result[0])res.status(401).json({error:"wrong password"});
                else
                {
                    res.status(200).json({message:req.query.username, token:generateCommonToken(req.query.username)});
                }
            });
            else res.status(401).json({error:'no such user!'});
        });
    else res.status(404).json({error: "username format invalid!"});
});

/*
* @paras:registerToken
* */
app.get('/validate', (req, res)=>
{
    if(req.query.registerToken!==undefined)
        verifyToken(req.query.registerToken, res,(results)=>
        {
            db.addUser(results.username, results.password, results.email, (error, results) =>
            {
                if(error)
                {
                    res.status(400).json({error:"unknown error"});
                    return;
                }
                if (results.affectedRows)
                    res.status(200).json({message: "register success!"});
                else
                    res.status(404).json({error: "unknown error!"});
            });
        });
    else
    {
        res.status(404).json({error:"unknown error"});
    }
});

/*
* @paras:username, password, email
* */
app.get('/register', (req, res) =>
{
    if(typeof req.query.username == 'string'&&req.query.username.length<=20&&userRegex.test(req.query.username)&&passwdRegex.test(req.query.password))
    {
        if(typeof req.query.email == 'string'&&req.query.email.length<=30&&emailRegex.test(req.query.email))// email验证
            db.findUser(req.query.username, (error, results)=>
            {
                if(error)
                {
                    res.status(400).json({error:"unknown error"});
                    return;
                }
                if(!results[0])//用户名可用
                {
                    data.to = req.query.email;
                    data.html = sendEmail.replace(/\(:placeholder\)/g, generateRegisterToken(req.query.username, req.query.password, req.query.email));
                    console.log(data);
                    transporter.sendMail(data, (err, info)=>
                    {
                        if(err)
                        {
                            res.status(400).json({error: "fail"});
                            return;
                        }
                        if(info.accepted!==undefined&&info.accepted.length>0)
                            res.status(200).json({message:"email sent! please check your email"});
                        else
                            res.stat(406).status({error:"fail"});
                    });
                }
                else res.status(401).json({error:'username repeat!'});
            });
        else
            res.status(401).json({error: "email format invalid"});
    }
    else res.status(401).json({error: "username format invalid!"});

});

/*
* @paras:token, filename, content
* */
app.post("/uploadFile", (req, res)=>
{
    if(req.body.token !== undefined)
    {
        verifyToken(req.body.token, res, (decoded)=>
        {
            if(decoded.username===undefined)res.status(400).json({error: "unknown error"});
            else
            {
                db.findOneFile(decoded.username, decoded.username + "-" + req.body.filename, (error, result)=>
                {
                    if(error)
                    {
                        res.status(400).json({error:"unknown error"});
                        return;
                    }
                    if(result[0])//update
                    db.updateFile(decoded.username, decoded.username + "-" + req.body.filename, base64Encode(req.body.content), (error, results)=>
                    {
                        if(error)
                        {
                            res.status(400).json({error:"unknown error"});
                            return;
                        }
                        if (results.affectedRows)
                            res.status(200).json({message: "update successful!"});
                        else
                            res.status(404).json({error: "update fails!"});
                    });
                    else//create new file
                    {
                        if(req.body.filename!==undefined&&1<=req.body.filename<=16&&fileRegex.test(req.body.filename))
                            db.uploadFile(decoded.username, decoded.username + "-" + req.body.filename, base64Encode(req.body.content), (error, results) =>
                            {
                                if (error)
                                {
                                    res.status(400).json({error: "unknown error"});
                                    return;
                                }
                                if (results.affectedRows)
                                    res.status(200).json({message: "upload successful!"});
                                else
                                    res.status(404).json({error: "upload fails!"});
                            });
                        else
                            res.status(400).json({error:"invalid filename"})
                    }
                });
            }
        });
    }
});

/*
* @paras:token, filename, content
* */
// app.post("/updateFile", (req, res)=>
// {
//     if(req.query.token !== undefined)
//     {
//         verifyToken(req.query.token, res, (decoded)=>
//         {
//             if(decoded.username===undefined)res.status(400).json({error: "unknown error"});
//             else
//                 db.updateFile(decoded.username, req.query.filename, base64Encode(req.query.content), (error, results)=>
//                 {
//                     if(error)
//                     {
//                         res.status(400).json({error:"unknown error"});
//                         return;
//                     }
//                     if (results.affectedRows)
//                         res.status(200).json({message: "update successful!"});
//                     else
//                         res.status(404).json({error: "update fails!"});
//                 });
//         });
//     }
// });

// if(req.query.filename!==undefined&&1<=req.query.filename<=16&&fileRegex.test(req.query.filename))
//     db.uploadFile(decoded.username, decoded.username + "-" + req.query.filename, base64Encode(req.query.content), (error, results) =>
//     {
//         if (error)
//         {
//             res.status(400).json({error: "unknown error"});
//             return;
//         }
//         if (results.affectedRows)
//             res.status(200).json({message: "upload successful!"});
//         else
//             res.status(404).json({error: "upload fails!"});
//     });
// else
//     res.status(400).json({error:"invalid filename"})

/*
* @paras:token, filename
* */
app.get("/getContent", (req, res)=>
{
    if(req.query.token !== undefined)
    {
        verifyToken(req.query.token, res, (decoded)=>
        {
            if(decoded.username===undefined)res.status(400).json({error: "unknown error"});
            else
                db.returnContent(decoded.username, decoded.username+"-"+req.query.filename, (error, results)=>
                {
                    if(error)
                    {
                        res.status(400).json({error:"unknown error"});
                        return;
                    }
                    if (results[0]!==undefined)
                    {
                        res.status(200).json({message:"get contents successfully", content: base64Decode(results[0].content)});
                        console.log(base64Decode(results[0].content));
                    }
                    else
                        res.status(404).json({error: "get contents fails!"});
                });
        });
    }
});

/*
* @paras:token
* */
app.get("/getFiles", (req, res)=>
{
    if(req.query.token !== undefined)
    {
        verifyToken(req.query.token, res, (decoded)=>
        {
            if(decoded.username===undefined)res.status(400).json({error: "unknown error"});
            else
                db.findFiles(decoded.username, (error, results)=>
                {
                    if(error)
                    {
                        res.status(400).json({error:"unknown error"});
                        return;
                    }
                    res.status(200).json({message:"get files successfully", files: results});
                });
        });
    }
});

/*
* @paras:token, filename
* */
app.get('/deleteFile', (req, res)=>
{
    if(req.query.token !== undefined)
    {
        verifyToken(req.query.token, res, (decoded)=>
        {
            if(decoded.username===undefined)res.status(400).json({error: "unknown error"});
            else
            {
                db.deleteFile(decoded.username, decoded.username+"-"+req.query.filename, (error, results) =>
                {
                    if (error)
                    {
                        res.status(400).json({error: "unknown error"});
                        return;
                    }
                    if (results.affectedRows)
                        res.status(200).json({message: "delete successful!"});
                    else
                        res.status(404).json({error: "delete fails!"});
                });
            }
        });
    }
});

//token
function generateCommonToken(username)
{
    // let data = username;
    let created = Math.floor(Date.now() / 1000);
    return jwt.sign({username: username, exp: created + 24 * 60 * 60,}, privateKey, {algorithm: 'RS256'});
}
function generateRegisterToken(username, password, email)
{
    let created = Math.floor(Date.now() / 1000);
    return jwt.sign({username: username, password:password, email:email, exp: created + 24 * 60 * 60,}, privateKey, {algorithm: 'RS256'});
}
function verifyToken(token, res, callback)
{
    jwt.verify(token, publicKey, {algorithms: ['RS256']}, (error, result) =>
    {
        if(error)res.status(401).json({error:"token malformed!"});
        else
        {
            if(Math.floor(Date.now() / 1000)<=result.exp)
            {
                // console.log(Date.now() / 1000+":"+result.exp);
                callback(result);
            }
            else
                res.status(401).json({message:"expired!"});
        }
    });
}
function base64Encode(content)
{
    return Buffer.from(content).toString('base64');
}
function base64Decode(encoded)
{
    return Buffer.from(encoded, 'base64').toString();
}


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + SRV_PORT);
});
