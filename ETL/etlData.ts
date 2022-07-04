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
    // Read data to DB

    
    // data input values:
    // const values = [{col_a: 'a1', col_b: 'b1'}, {col_a: 'a2', col_b: 'b2'}];
        
    // generating a multi-row insert query:
    // const addRowsAtOnce = pgpromise.helpers.insert(values, cs);

    // const addRowsAtOnce = `INSERT INTO $tableName
    //                         (fips,apn,street_number,street_pre_direction,street_name,street_suffix
    //                         ,street_post_direction,unit_type,unit_number,formatted_street_address
    //                         ,city,state,zip_code,zip_plus_four_code,latitude,longitude
    //                         ,geocoding_accuracy,census_tract,carrier_code)
    //                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id;`.replace('$tableName', addressesTableName)
    
    let x = 0
    let linebuffer: Array<strObj> = []
    let tableColumns: Array<string> = []
    let tableColumnsArray: Array<string> = []
    let startTime = performance.now()
    let timeElapsedOld = startTime
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
                  if (linebuffer.length == 500) {
                    // console.log(linebuffer.toString())  // *** Sanity check ***
                    /* Generating a multi-row insert query */
                    const addRowsAtOnce = pgpromise.helpers.insert(linebuffer, tableColumns) + ' RETURNING id';
                    linebuffer.length = 0; // Empty array                     
                    let result = await dbHandlerClass.queryPool(pool, addRowsAtOnce, [])  
                    // console.log(`RESULT length:${result.length}`)
                    // Measure timeing 
                    let timeElapsed = (performance.now() - startTime) / 1000
                    if (timeElapsedOld < Math.floor(timeElapsed)) {
                      console.log(`Inserted ${x} lines | took ${timeElapsed.toFixed(6)} s`) 
                      }
                    timeElapsedOld = Math.floor(timeElapsed)
                    
                  }
                  
                }
                x++;
                // console.log(x);
              })
            .on("end", function () {
                console.log("finished");
                // process.exit(0) //  *** DEBUG ***
              })
            .on("error", function (error) {
                console.log(`Error on x:${x} line`)
                console.log(error.message);
            });
    return result? "OK" : "FAIL";
}
