import { pool } from './ETL/databaseHandler';
import { handler } from './API/runApi';
import { deployDataToDB } from './ETL/etlData'

// Get settings from environment
var dotenv = require('dotenv');
dotenv.config();

// Deploy fresh data to database
(async () => {
    try {
        const result = await deployDataToDB(pool);;
        console.log(result);
    } catch (err) {
        // Deal with the problem
        console.error(err.message)
    }
    })();