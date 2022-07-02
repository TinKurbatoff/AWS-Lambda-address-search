const AWS = require('aws-sdk');
const psql = require('pg');
const env = require('env');

const pool = new psql.Pool({ // Let use Pooling now
  // In production I will use environment variables
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  port: process.env.RDS_PORT,
  host: process.env.RDS_HOSTNAME,
  ssl: process.env.DB_SSL == "True",
});

// if a backend error or network problem happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err) // just report to console
  process.exit(-1)
}) 

// Connect to pool
pool.connect()

/* */
let queryString = `CREATE TABLE IF NOT EXISTS addresses (\
                id SERIAL PRIMARY KEY \
                , created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , zip_code VARCHAR(100);`,

let result = pool.query(queryString).then( (res: any) => {
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


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        console.log(`event.httpMethod:${event.httpMethod}`)
        switch (event.httpMethod) {
            case 'DELETE':
                body = await pool.delete(JSON.parse(event.body)).promise();
                break;
            case 'GET':
                body = await pool.scan({ TableName: event.queryStringParameters.TableName }).promise();
                break;
            case 'POST':
                body = await pool.put(JSON.parse(event.body)).promise();
                break;
            case 'PUT':
                body = await pool.update(JSON.parse(event.body)).promise();
                break;
            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};
