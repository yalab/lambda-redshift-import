# Lambda Reshift import

## Prepare

```
$ git clone URL
$ cd redshift-import
```

Open index.js and write 'dsn', 'awsAccessKeyId', 'awsAccessSecret', 's3Region', 'bucketName', 'destObjectName'

zip it.

```
$ zip -r ../redshift-import.zip *
```

## Upload to lambda

https://ap-northeast-1.console.aws.amazon.com/lambda/home?region=ap-northeast-1#/

'Skip' BLUE PRINT.

Choose 'Upload a .ZIP file' 

## Set EVENT SOURCE

Event Source type: S3
Bucket: <YOUR BUCKET>
EventType: ObjectCreated(All)
Prefix: <blank>
Suffix: .log




