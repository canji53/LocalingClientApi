'use strict';
const AWS = require('aws-sdk');
const dayjs = require('dayjs');
const qs = require('querystring');

/**
 * DynamoDBからコンテンツ一覧を取得する Lambda
 *
 * @param {object} event.queryStringParameters {
 *   lastEvaluatedKey: {object}  一時終端キー
 *   limit:            {int}     一度のコールで所得できるデータ数
 *   prefecture:       {number}  対象の県（例. 46=kagoshima）
 *   order:            {boolean} 順序（true=昇順, false=降順）
 * }
 * @return {object} response.body {
 *   contentList: {object} コンテンツ一覧
 * }
 *
 * ==========================
 * [フロー]
 * 1. 初期パラメータ設定、リクエストパラメータ展開
 * 2. DynamoDBへのクエリパラメータを設定
 * 3. DynamoDBからコンテンツ一覧を取得
 * ==========================
 *
 */
module.exports.readContentList = async (event, context) => {

  try {

    /**
     * 初期パラメータの設定
     */
    // 東京リージョンに
    AWS.config.update({region: 'ap-northeast-1'});

    // DynamoDBのクライアント
    const documentClient = new AWS.DynamoDB.DocumentClient();


    /**
     * リクエストパラメータを分解、パラメータ設定を確認
     */
    // 一時終端キーがない場合は、nullにして先頭もしくは後頭から取得
    let lastEvaluatedKey = null;
    let tmpLastEvaluatedKey = event.queryStringParameters.lastEvaluatedKey;
    if (isExists(tmpLastEvaluatedKey)) {
      tmpLastEvaluatedKey = JSON.parse(JSON.stringify(qs.parse(tmpLastEvaluatedKey)));
      tmpLastEvaluatedKey.publishedDate = parseInt(tmpLastEvaluatedKey.publishedDate);
      if (typeof(tmpLastEvaluatedKey) === 'object') {
        lastEvaluatedKey = tmpLastEvaluatedKey;
      }
    }

    // 一度のコールで所得できるデータ数。設定されていない場合は、nullで制限なし
    let limit = null;
    if (isFinite(event.queryStringParameters.limit)) {
      if (parseInt(event.queryStringParameters.limit) >= 0) {
        limit = parseInt(event.queryStringParameters.limit); // 文字列を数値に
      }
    }

    // 対象の県。設定されていない場合は、nullで全ての県を対象とする
    let prefecture = null;
    let tmpPrefecture = event.queryStringParameters.prefecture;
    if (isFinite(tmpPrefecture)) {
      if (1 <= parseInt(tmpPrefecture) && parseInt(tmpPrefecture) <= 47) {
        prefecture = parseInt(tmpPrefecture);
      }
    }

    // データの日時順序。何も設定されていない場合は、昇順。
    let order = false;
    if (isExists(event.queryStringParameters.order)) {
      if (isStringBoolean(event.queryStringParameters.order)) {
        order = toBooleanFromStringBoolean(event.queryStringParameters.order);
      }
    }


    /**
     * DynamoDBへのクエリパラメータを設定
     *
     * 以下のクエリーは当初 "Scan"を想定していたが、
     * Scanでは並び替えができず、ランダムにコンテンツが取得される結果になった。
     * 並び替えたい場合、"Query"で取得する必要がある。
     * ところが、Queryでは、"KeyConditionExpression"で条件式を示す必要があるのだが、
     * 欲しいのは全てのデータなため、わざわざ条件を示す必要がない。
     * 仕方がないので、ここでは現在時刻を取得して、それより前に登録されたデータを条件にすることで、
     * 擬似的に全データを取得するクエリーを実現する。
     */
    const nowTimestamp = dayjs().unix(); // 現在時間の取得
    let queryParam = {
      TableName: `localing-${process.env.ENVIRONMENT}-inoreader-content`,
      IndexName: 'public',
      ExpressionAttributeNames: {
        '#ps': 'publicState',
        '#pd': 'publishedDate'
      },
      ExpressionAttributeValues: {
        ':publicState': 1,
        ':nowTimestamp': nowTimestamp,
      },
      KeyConditionExpression: '#ps = :publicState and #pd < :nowTimestamp',
      ExclusiveStartKey: lastEvaluatedKey,
      Limit: limit,
      ScanIndexForward: order
    }

    // 県が設定されている場合は、prefectureで絞り込んで、そうでない場合は何も絞り込まず全て取得
    if (prefecture !== null) {
      if (typeof(queryParam.ExpressionAttributeValues) === 'undefined') {
        queryParam.ExpressionAttributeValues = {};
      }

      queryParam.ExpressionAttributeNames['#pl'] = 'prefectureList';
      queryParam.ExpressionAttributeValues[':prefecture'] = prefecture;

      if (typeof(queryParam.FilterExpression) !== 'undefined') {
        queryParam.FilterExpression = queryParam.FilterExpression + ' AND ';
        queryParam.FilterExpression = queryParam.FilterExpression + 'contains (#pl, :prefecture)';
      } else {
        queryParam.FilterExpression = 'contains (#pl, :prefecture)';
      }
    }

    console.log(queryParam);


    /**
     * DynamoDBからコンテンツ一覧を取得
     */
    const queryResponse = await documentClient
      .query(queryParam)
      .promise()
      .then((data) => {
        return {
          'contentList': data.Items,
          'lastEvaluatedKey': data.LastEvaluatedKey
        };
      })
      .catch((error) => { throw error; });


    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        contentList: queryResponse.contentList,
        lastEvaluatedKey: queryResponse.lastEvaluatedKey
      }),
      isBase64Encoded: false,
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
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

