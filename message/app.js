'use strict';
const sendgrid = require('@sendgrid/mail');
const validator = require('email-validator');

const serviceName = 'Localing';

/**
 * contactのメッセージををsendgridに仲介するLambda
 *
 * @param {*} event.body {
 *  name {string} お名前
 *  email {string} 送信元アドレス
 *  subject {string} 件名
 *  body {string} 本文
 * }
 * @returns {object} response
 */
exports.sendMessage = async (event) => {

  try {
    // sendgridのapiキーをセット
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

    // リクエストパラメータの分解
    const requestBody = JSON.parse(event.body);
    const name = requestBody.name;
    const email = requestBody.email;
    const subject = requestBody.subject ? requestBody.subject : '無題'; // 件名は必須ではない
    const body = requestBody.body;

    // お名前チェック
    if (isNotExists(name)) {
      throw { message: 'お名前が入力されていません。' };
    }
    if (!validateLength(name, 0, 20)) {
      throw { message: 'お名前が20文字以上入力されています。' }
    }

    // アドレスチェック
    if (isNotExists(email)) {
      throw { message: 'メールアドレスが入力されていません。' };
    }
    if (!validator.validate(email)) {
      throw { message: 'メールアドレスが正しくありません。' };
    }

    // 件名チェック
    if (!validateLength(subject, 0, 100)) {
      throw { message: '件名が100文字以上入力されています。' }
    }

    // 本文チェック
    if (isNotExists(body)) {
      throw { message: '本文が入力されていません。' };
    }
    if (!validateLength(body, 0, 400)) {
      throw { message: '本文が400文字以上入力されています。' }
    }

    let text = '';
    text += `${serviceName}にお問い合わせが到着\n`;
    text += `\n`;
    text += `お名前:\n`;
    text += `${name}\n`;
    text += `\n`;
    text += `お問い合わせ内容:\n`;
    text += `${body}\n`;

    // 送信
    const response = await sendgrid
      .send({
        to: process.env.TO_EMAIL,
        from: email,
        subject: subject,
        text: text,
      })
      .then((res) => { return res; })
      .catch((error) => { throw error; });

    console.log(response);

    // 成功レスポンス
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        message: 'メッセージを送信しました。',
      }),
      isBase64Encoded: false,
    };
  } catch (error) {
    console.log(error);

    // 失敗レスポンス
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        message: error.message,
      }),
      isBase64Encoded: false,
    };
  }
};

/**
 * 引数が存在するかチェック
 * @param {*} value 引数
 */
const isNotExists = (value) => {
  if (typeof value === 'undefined' || value === null || value === '') {
    return true;
  }
  return false;
};

/**
 * stringの長さのチェック （〜より大きい、〜より小さいを比較演算子に使用!!）
 * @param {string} str 入力値
 * @param {number} minLen 最小数
 * @param {number} maxLen 最大数
 */
const validateLength = (str, minLen, maxLen) => {
  if (minLen < str.length && str.length < maxLen) {
    return true;
  }
  return false;
}
