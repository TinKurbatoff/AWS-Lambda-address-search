// runApi.ts
import { parse } from "csv-parse";
import fs from "fs";
import { performance } from "perf_hooks";
import serverless from 'serverless-http';
import express, { Request, Response } from 'express';

const app = express()



// Envoronment settings
require('dotenv').config();

// Postgres
import { Client, PoolClient } from 'pg';
const pgpromise = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
    });

let client = new Client({ // Let use Pooling now
  // In production I will use environment variables
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  host: process.env.RDS_HOSTNAME,
  port: Number(process.env.RDS_PORT) || 5234,
  ssl: process.env.DB_SSL === "True"? { rejectUnauthorized: false } : false,
});

// Connect to pool
console.log(`ENVIRONMENT:${process.env.ENVIRONMENT}`);
console.log(`RDS_DATABASE:${process.env.RDS_HOSTNAME}`);
console.log(`RDS_USERNAME:${process.env.RDS_USERNAME}`);
console.log(`RDS_DATABASE:${process.env.RDS_DATABASE}`);
client.connect()
console.log("DB connected!")


// Table name
var addressesTableName = process.env?.ADDR_TABLE_NAME || 'addresses';
type strObj = { [ key:string ]:string }

async function deployDataToDB(pool: PoolClient): Promise<string> {    
    // Create an empty table in database
    // const result = await seedDatabase(addressesTableName);
    if (process.env.START_DEPLOY_DATA !== "True") { return "⚠️  NO DATA DEPLOYMENT MODE"}
    // Read data into DB
    let result = "idle";
    let x = 0 // rows counter
    let linebuffer: Array<strObj> = []  // Buffer for insert multiline
    let tableColumns: Array<string> = []  // columns names in the special view
    let tableColumnsArray: Array<string> = []  // just a list of columns names
    // Calculate start time
    let startTime = performance.now()
    let timeElapsedOld = startTime
    let fileFinished = false
    async function insertLines(rowsBuffer:Array<strObj> , tableColumnsValues:any) {
        /* Generating a multi-row insert query */
        const addRowsAtOnce = pgpromise.helpers.insert(rowsBuffer, tableColumnsValues) + ' RETURNING id';
        linebuffer.length = 0; // Empty array                     
        let result = await client.query(addRowsAtOnce, [])  
        // console.log(`RESULT length:${result.length}`)
        // Measure timeing 
        let timeElapsed = (performance.now() - startTime) / 1000  // convert ms to seconds
        if (timeElapsedOld < Math.floor(timeElapsed)) {
          console.log(`Inserted ${x} lines | took ${timeElapsed.toFixed(6)} s | csv_read_all:${fileFinished}`) 
          }
        timeElapsedOld = Math.floor(timeElapsed)

        }
    // EXAMPLE
    // var s3 = new AWS.S3({apiVersion: '2006-03-01'});
    // var params = {Bucket: 'myBucket', Key: 'myImageFile.jpg'};
    // var file = require('fs').createWriteStream('/path/to/file.jpg');
    // s3.getObject(params).createReadStream().pipe(file);        
    // * EXAMPLE 
    
    fs.createReadStream(process.env.DATA_FILE_URI || './property.csv')
    // s3.getObject(params).createReadStream(process.env.DATA_FILE_URI || './property.csv')
            .pipe(parse({ delimiter: ",", from_line: 1 }))
            .on("data", async function (row) {
                // console.log(row);
                if (x == 0) {
                  // Get columns names (first row)
                  tableColumns = new pgpromise.helpers.ColumnSet(row, {table: addressesTableName});
                  tableColumnsArray = row // Array of columns names
                } else {
                  // Get data input values (consequent rows)
                  let params: strObj = {}; // object of values — {column1:value1,..})
                  tableColumnsArray.forEach((key:string, i) => params[key] = row[i]); // fill with actual values
                  linebuffer.push(params) // add to array of values 
                  if (linebuffer.length == 50) {
                    // console.log(linebuffer.toString())  // *** Sanity check ***
                    await insertLines(linebuffer, tableColumns);
                  }               
                }
                x++;
              })
            .on("end", async function () {
                fileFinished = true;
                await insertLines(linebuffer, tableColumns);
                console.log("finished");
              })
            .on("error", function (error) {
                console.log(`Error on x:${x} line`)
                console.log(error.message);
            });
    return result? "OK" : "FAIL";
}


app.get('/', function (req: Request, res: Response ) {
  res.send('You successfully called your first Lambda function!')
})

exports.handler = serverless(app);

