'use strict';
const AWS = require('aws-sdk');

/**
 * DynamoDBからメディアの一覧を取得する Lambda
 *
 * @param {object} event.queryStringParameters {
 *   order: {boolean} 順序 （true=昇順、false=降順）
 * }
 * @return {object} response.body {
 *   mediaList: {object} メディア一覧
 * }
 *
 * ==========================
 * [フロー]
 * 1. 初期パラメータ設定、リクエストパラメータ展開
 * 2. DynamoDBへのクエリパラメータを設定
 * 3. DynamoDBからメディアを取得
 * ==========================
 *
 */
module.exports.readMediaList = async (event) => {

  try {

    /**
     * 初期パラメータの設定
     */
    // 東京リージョンに
    AWS.config.update({region: 'ap-northeast-1'});

    // DynamoDBのクライアント
    const documentClient = new AWS.DynamoDB.DocumentClient();

    // データの日時順序。何も設定されていない場合は、昇順。
    let order = false;
    if (isExists(event.queryStringParameters.order)) {
      if (isStringBoolean(event.queryStringParameters.order)) {
        order = toBooleanFromStringBoolean(event.queryStringParameters.order);
      }
    }


    /**
     * DynamoDBへのスキャンパラメータを設定
     */
    let queryParam = {
      TableName: `localing-${process.env.ENVIRONMENT}-inoreader-media`,
      IndexName: 'public',
      ExpressionAttributeNames : {
        '#ps'  : 'publicState'
      },
      ExpressionAttributeValues: {
        ':publicState': 1
      },
      KeyConditionExpression: '#ps = :publicState',
      ExclusiveStartKey: null,
      Limit: null,
      ScanIndexForward: order
    }

    console.log(queryParam);


    /**
     * DynamoDBからメディアを取得
     */
    const queryResponse = await documentClient
      .query(queryParam)
      .promise()
      .then((data) => {
        return {
          'mediaList': data.Items
        };
      })
      .catch((error) => { throw error; });


    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        mediaList: queryResponse.mediaList
      }),
      isBase64Encoded: false,
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        message: error.message
      }),
      isBase64Encoded: false,
    };
  }
}


const isExists = (value) => {
  if (!(typeof(value) === 'undefined' || value === null || value === '')) {
    return true;
  }
  return false;
}

const isStringBoolean = (stringBoolean) => {
  const lowerStringBoolean = stringBoolean.toLowerCase();
  if (lowerStringBoolean === 'true' || lowerStringBoolean === 'false') {
    return true;
  }
  return false;
}

const toBooleanFromStringBoolean = (stringBoolean) => {
  return stringBoolean.toLowerCase() === 'true';
}
