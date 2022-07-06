import { dbHandlerClass, pool } from './databaseHandler';
var dotenv = require('dotenv');
dotenv.config();

/* —————————————————————- SEED DATABASE QUESRIES  ——————————————————— */
let queryStringDrop = `DROP TABLE $tableName;`;
let postgresFunction = `CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$
                        BEGIN
                            NEW.updated_at = NOW();
                            RETURN NEW;
                        END;
                        $$ LANGUAGE plpgsql;`;
let createTrigger = `CREATE OR REPLACE TRIGGER set_timestamp
                    BEFORE UPDATE ON $tableName
                    FOR EACH ROW
                    EXECUTE PROCEDURE trigger_set_timestamp();`;
let queryStringCreate = `CREATE TABLE IF NOT EXISTS $tableName (\
                id SERIAL PRIMARY KEY \
                , created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                ,	fips VARCHAR(8)
                ,	apn VARCHAR(32)
                ,	street_number VARCHAR(128)
                ,	street_pre_direction VARCHAR(16)
                ,	street_name VARCHAR(256)
                ,	street_suffix VARCHAR(32)
                ,	street_post_direction VARCHAR(32)
                ,	unit_type VARCHAR(32)
                ,	unit_number VARCHAR(64)
                ,	formatted_street_address VARCHAR(256)
                ,	city VARCHAR(128)
                ,	state VARCHAR(8)
                ,	zip_code VARCHAR(6)
                ,	zip_plus_four_code VARCHAR(24)
                ,	latitude VARCHAR(32)
                ,	longitude VARCHAR(32)
                ,	geocoding_accuracy VARCHAR(32)
                ,	census_tract VARCHAR(32)
                ,	carrier_code VARCHAR(32)
                                );`;


export async function seedDatabase(tableName: string): Promise<string> {
    /* Creates Database  */
        console.log(`☀️ CREATE TABLE: ${tableName}`)  // ** Sanity check **
        if (process.env.START_DROP_TABLES === "True") {
            // If DROP is enabled in .ENV file
            queryStringDrop = queryStringDrop.replace("$tableName", tableName);
            // console.log(`DROP DB Q:${queryStringDrop} — DB:${tableName}`); // ** Sanity check **
            let result = await dbHandlerClass.queryPool(pool, queryStringDrop, []);
            console.log(`⚠️ DROP TABLE RESULT:>${result[0].toString()}`); 
        }
        for (let queryString of [postgresFunction, queryStringCreate, createTrigger]) {
            queryString = queryString.replace("$tableName", tableName);
            // console.log(`seed DB Q:${queryString} on DB:${tableName}`);  // ** Sanity check **
            let result = await dbHandlerClass.queryPool(pool, queryString, []);
            console.log(`🔗 ${result[0].toString()}`);
        }
    return "CREATED";
    }