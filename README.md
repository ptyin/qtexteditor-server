# QtLaTeX Server

QtLaTeX项目的服务器端
- 在config.js配置相关参数
- e.g.
```javascript
const fs = require('fs');
const path = require('path');

exports.SRV_HOST = 'www.peter-sia.top';//服务器地址, e.g. 'localhost'
exports.SRV_PORT = 2333;// 服务器端口
exports.DB_USER = "root";//你的mysql账户
exports.DB_PASSWD = "nihao20000514";//你的mysql用户密码
exports.DB_HOST = 'localhost';//数据库地址
exports.DB_PORT = 3306;//数据库端口
exports.DB_NAME = 'QtLaTeX';//数据库名

exports.privateKey = fs.readFileSync(path.join(__dirname, 'rsa_private.pem'));//私钥文件,加密
exports.publicKey = fs.readFileSync(path.join(__dirname, 'rsa_public_key.pem'));//公钥文件,解密
exports.email = "1604764210@qq.com";//qq邮箱
exports.authorizationCode = "sqqzwpjtxqqtgdeb";//qq邮箱SMTP授权码
```

## Prerequisite
    npm install    
- 安装mysql
- 初始化数据库/创建表结构


    create database if not exists QtLaTeX;
    use QtLaTeX;
    create table if not exists userInfo(
        `name` varchar(30),
        `passwd` varchar(30) NOT NULL ,
        `email` varchar(30) NOT NULL ,
        primary key (`name`)
    )ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
    create table if not exists files(
        `fileName` varchar(40),
        `content` longtext,
        `owner` varchar(30),
        PRIMARY KEY (`fileName`),
        constraint `file_fileName_fk` foreign key (`owner`) references `userInfo` (`name`)
    )ENGINE=InnoDB DEFAULT CHARSET=utf8; 
    
- 生成私钥/公钥


    # 私钥
    ssl genrsa -out rsa_private.pem 1024
    # 公钥
    openssl rsa -in rsa_private.pem -pubout -out rsa_public_key.pem
                                            

## Launch

    node app.js

## 注意事项

- 安全和保密性起见，客户端应将密码md5加密后保存至数据库中

## 原理

- 利用token进行无状态的用户登录，从而实现多人协作