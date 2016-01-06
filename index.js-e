var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});

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

      logs.push(JSON.stringify(JSON.parse(body)["meteors"]));
    }
    var s3bucket = new aws.S3({params: {Bucket: 'test-bucket'}});
    s3bucket.upload({Key: "test-ext.log", Body: logs.join("\n")}, function(err, data) {
      console.log(err);
      });

    console.log(logs.join("\n"));
   });
};

console.log(exports.handler({Records: [{s3: {bucket: {name: "test-bucket"},
                                             object: {key: "test.log"}}}]}));
