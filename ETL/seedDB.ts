import { dbHandlerClass, pool } from './databaseHandler';

/* —————————————————————- SEED DATABASE QUESRIES  ——————————————————— */
let queryStringDrop = `DROP DATABASE $1;`
let postgresFunction = `CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$
                        BEGIN
                            NEW.updated_at = NOW();
                            RETURN NEW;
                        END;
                        $$ LANGUAGE plpgsql;`
let createTrigger = `CREATE OR REPLACE TRIGGER set_timestamp
                    BEFORE UPDATE ON $1
                    FOR EACH ROW
                    EXECUTE PROCEDURE trigger_set_timestamp();`                        
let queryStringCreate = `CREATE TABLE IF NOT EXISTS $1 (\
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
                                );`


export async function seedDatabase(){
    /* Creates Database  */
        for (const queryString of [queryStringDrop, postgresFunction, createTrigger, queryStringCreate])
        {
            const databaseName = process.env.ADDR_TABLE_NAME;
            console.log(`seed DB Q:${queryString} on DB:${databaseName}`)
            let result = await dbHandlerClass.queryPool(pool, queryString, databaseName);
            console.log(result[0]) 
        }}