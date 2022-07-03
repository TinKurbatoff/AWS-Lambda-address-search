import { PoolClient, QueryResult, ResultBuilder } from 'pg';
const pg = require('pg');
var dotenv = require('dotenv');

console.log(`ENVIRONMENT:${process.env.ENVIRONMENT}`);
console.log(`RDS_USERNAME:${process.env.RDS_USERNAME}`);
console.log(`RDS_DATABASE:${process.env.RDS_DATABASE}`);

export const pool = new pg.Pool({ // Let use Pooling now
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

// let queryString = queryStringCreate;              
// let result = pool.query(queryString).then( (res: ResultBuilder) => {
//             console.log(res.command)
//             console.debug(`📬  Executed action ${queryString} OKAY.`)
//             return res.rows;
//             }).catch((err: { message: any; }) => {
//             console.log(err.message)
//             console.log(`⛔️  Query failed: ${queryString}`)
//             // throw err;
//             // console.log(err.stack)    
//             return [{}];
//             })

/* */
export class dbHandlerClass {
  /*  Class handles connection to a database and returns rows */
  static async queryPool(conn: PoolClient, queryString:string, params: any): Promise<Array<Object>> {
      return conn.query(queryString, params)
      .then( (res: QueryResult<any>) => {
          // console.log(res.command)
          // console.debug(`📬  Executed action ${queryString} OKAY.`)
          return res?.rows;
          })
      .catch((err: { message: any; }) => {
          console.log(err.message)
          console.log(`⛔️  Query failed: ${queryString}`)
          // throw err;
          // console.log(err.stack)    
          return [{}];
          })        
  }
}

// module.exports = dbHandlerClass