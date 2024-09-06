const { getMessageObject, post, getPostChannelId } = require('./common');

exports.handler = async event => {
  const msgObj = getMessageObject(event);

  if (!msgObj.title && !msgObj.body) {
    return {
      statusCode: 200,
      body: 'No message'
    };
  }
  const channelId = getPostChannelId(event);

  await Promise.all([post(msgObj, channelId)]);

  return {
    statusCode: 200,
    body: JSON.stringify('Finish')
  };
};
