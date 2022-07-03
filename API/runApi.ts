
// import * as pgTypes from 'pg';
// const types = require('pg').types
import { pool } from '../ETL/databaseHandler'

import AWS from 'aws-sdk';

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
export var handler = async (event: any, context: any) => {
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
