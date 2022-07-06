type strObj = {[key:string]:string}

// Import AMD
import { seedDatabase } from './seedDB';
import { PoolClient } from 'pg';
import { dbHandlerClass, pool } from './databaseHandler';
import { parse } from "csv-parse";
import { performance } from 'perf_hooks';
import fs from "fs";

// CommonJS import
var dotenv = require('dotenv');
const pgpromise = require('pg-promise')({
  /* initialization options */
  capSQL: true // capitalize all generated SQL
  });

dotenv.config();

/* Module loads data into database */
var addressesTableName = process.env?.ADDR_TABLE_NAME || 'addresses_default';


export async function deployDataToDB(pool: PoolClient): Promise<string> {    
    // Create an empty table in database
    const result = await seedDatabase(addressesTableName);
    if (process.env.START_DEPLOY_DATA !== "True") { return "⚠️  NO DATA DEPLOYMENT MODE"}
    // Read data into DB
    let x = 0 // rows counter
    let linebuffer: Array<strObj> = []  // Buffer for insert multiline
    let tableColumns: Array<string> = []  // columns names in the special view
    let tableColumnsArray: Array<string> = []  // just a list of columns names
    // Calculate start time
    let startTime = performance.now()
    let timeElapsedOld = startTime
    let fileFinished = false
    fs.createReadStream(process.env.DATA_FILE_URI || './property.csv')
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
                  if (fileFinished || linebuffer.length == 50) {
                    // console.log(linebuffer.toString())  // *** Sanity check ***
                    /* Generating a multi-row insert query */
                    const addRowsAtOnce = pgpromise.helpers.insert(linebuffer, tableColumns) + ' RETURNING id';
                    linebuffer.length = 0; // Empty array                     
                    let result = await dbHandlerClass.queryPool(pool, addRowsAtOnce, [])  
                    // console.log(`RESULT length:${result.length}`)
                    // Measure timeing 
                    let timeElapsed = (performance.now() - startTime) / 1000  // convert ms to seconds
                    if (timeElapsedOld < Math.floor(timeElapsed)) {
                      console.log(`Inserted ${x} lines | took ${timeElapsed.toFixed(6)} s`) 
                      }
                    timeElapsedOld = Math.floor(timeElapsed)
                    
                  }               
                }
                x++;
              })
            .on("end", function () {
                fileFinished = true;
                console.log("finished");
              })
            .on("error", function (error) {
                console.log(`Error on x:${x} line`)
                console.log(error.message);
            });
    return result? "OK" : "FAIL";
}
