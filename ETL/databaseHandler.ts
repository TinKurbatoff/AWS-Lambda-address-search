import { PoolClient, ResultBuilder } from 'pg';

dotenv.config();
console.log(`ENVIRONMENT:${process.env.ENVIRONMENT}`);
console.log(`RDS_USERNAME:${process.env.RDS_USERNAME}`);
console.log(`RDS_DATABASE:${process.env.RDS_DATABASE}`);

const pool = new pg.Pool({ // Let use Pooling now
  // In production I will use environment variables
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  port: process.env.RDS_PORT,
  host: process.env.RDS_HOSTNAME,
  ssl: process.env.DB_SSL == "True",
});

// if a backend error or network problem happens
pool.on('error', (err: Error, client: PoolClient): void => {
  console.error('Unexpected error on idle client', err) // just report to console
  process.exit(-1)
}) 

// Connect to pool
pool.connect()

/* */
let queryStringDrop = `DROP DATABASE addresses;`
let queryStringCreate = `CREATE TABLE IF NOT EXISTS addresses (\
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
                                );
                `

let queryString = queryStringCreate;              
let result = pool.query(queryString).then( (res: ResultBuilder) => {
            console.log(res.command)
            console.debug(`📬  Executed action ${queryString} OKAY.`)
            return res.rows;
            }).catch((err: { message: any; }) => {
            console.log(err.message)
            console.log(`⛔️  Query failed: ${queryString}`)
            // throw err;
            // console.log(err.stack)    
            return [{}];
            })

/* */
