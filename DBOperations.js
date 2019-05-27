var connection;
exports.setConnection = function(connection_)
{
    connection = connection_;
};

exports.addUser = function (username, password, email, callback)
{
    connection.query("insert into userInfo (name, passwd, email) VALUES (\""+username+"\", \""+password+"\", \""+email+"\");", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
    });
};

exports.findUser = function(username, callback)
{
    connection.query("select name from userInfo where name=\""+username+"\";", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
        // if(results[0])
        //     console.log("find!");
        // else console.log("no such user!");
    });
};

exports.validateUser = function(username, password, callback)
{
    connection.query("select name from userInfo where name=\""+username+"\" and passwd=\""+password+"\";", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
        // if(error)
        // {
        //     console.log(error);
        //     return;
        // }
        // if(results[0])console.log("validate!");
        // else console.log("password not right!");
        // if(callback)callback(results);
    });
};

exports.uploadFile = function (username, filename, content, callback)
{
    connection.query("insert into files (fileName, content, owner) VALUES (\""+filename+"\", \""+content+"\", \""+username+"\");", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
    });
};

exports.updateFile = function (owner, filename, content, callback)
{
    connection.query("update files set content=\""+content+"\" where fileName="+"\""+filename+"\" and owner=\""+owner+"\";", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
    });
};

exports.deleteFile = function (username, filename, callback)
{
    connection.query("delete from files where fileName=\""+filename+"\" and owner=\""+username+"\";", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
    });
};

exports.findFiles = function (username, callback)
{
    connection.query("select fileName from files where owner = \""+username+"\";", function (error, results)
    {
        if(error)
            console.log(error);
        if(callback)callback(error, results);
    });
};

exports.returnContent = function (username, fileName, callback)
{
    connection.query("select content from files where fileName = \""+fileName+"\" and owner=\""+username+"\";", function (error, results)
    {
        if(error)
            console.log(error);
        console.log(results);
        if(callback)callback(error, results);
    });
};