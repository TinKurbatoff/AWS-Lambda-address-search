import { dbHandlerClass} from './databaseHandler';
import { seedDatabase } from './seedDB';
import { PoolClient } from 'pg';
var dotenv = require('dotenv');
dotenv.config();

/* Module loads data into database */
var addressesDBname = process.env?.ADDR_TABLE_NAME || 'addresses_default';

export async function deployDataToDB(pool: PoolClient): Promise<string> {    
    const result = await seedDatabase(addressesDBname);
    return result? "OK" : "FAIL";
}
