var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var pg = require('pg');
var _ = require("lodash");
var fs = require("fs");

var bucketName = 'test-bucket';
var destObjectName = "test-ext.log";
var dsn = "tcp://USERNAME:PASSWORD@END_POINT:PORT/DBNAME";

var awsAccessKeyId = "";
var awsAccessSecret = "";
var s3Region = "ap-northeast-1";

var client = new pg.Client(dsn);
client.connect();
var tableName = "meteors";

var rollback = function(client) {
  client.query('ROLLBACK', function() {
    client.end();
  });
};

exports.handler = function(event, context) {
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;
  s3.getObject({Bucket:bucket, Key:key}, function(err, data) {
    var lines = data.Body.toString("utf-8").split("\n");
    var logs = [];
    for(var i = 0; i < lines.length; i++){
      var body = lines[i].split("]:")[1]
      if(!body){
        break;
      }
      var csv = _.values(JSON.parse(body)["meteors"]).join(",");
      logs.push(csv);
    }

    var s3bucket = new aws.S3({params: {Bucket: bucketName}});

    s3bucket.upload({Key: destObjectName, Body: logs.join("\n")}, function(err, data) {
      var copy = "COPY " + tableName + " FROM 's3://" + bucketName + "/" + destObjectName + "' CREDENTIALS 'aws_access_key_id=" + awsAccessKeyId + ";aws_secret_access_key=" + awsAccessSecret + "' CSV;";
      client.query('BEGIN', function(err, result) {
        if(err){
          console.log("ERROR");
          return rollback(client)
        };
        console.log(copy);
        client.query(copy, function(err, result) {
          if(err){
            console.log("COPY ERROR");
            console.log(err);
            return rollback(client);
          }
          client.query("COMMIT;", client.end.bind(client));
        });
      });
    });
   });
};
