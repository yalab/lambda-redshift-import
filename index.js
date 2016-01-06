var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var pg = require('pg');
var _ = require("lodash");
var fs = require("fs");
// var dsn = "tcp://USER:PASSWORD@END_POINT:PORT/DBNAME";
var dsn = "tcp://yalab@localhost:15432/redshift_test";

var client = new pg.Client(dsn);
client.connect();

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

    var s3bucket = new aws.S3({params: {Bucket: 'test-bucket'}});
    var fname = '/tmp/test.log';
    fs.writeFile(fname, logs.join("\n") , function (err) {
//    s3bucket.upload({Key: "test-ext.log", Body: logs.join("\n")}, function(err, data) {
      var copy = "COPY meteors FROM '" + fname + "' WITH CSV";
      console.log(copy);
      client.query('BEGIN', function(err, result) {
        if(err){
          console.log("ERROR");
          return rollback(client)
        };
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

console.log(exports.handler({Records: [{s3: {bucket: {name: "test-bucket"},
                                             object: {key: "test.log"}}}]}));
