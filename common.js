const https = require('https');
const USERS = require('./users.json');
const REPOSITORIES = require('./repositories.json');

function getMentionList(body) {
  const mentionList = [];

  if (body == null || body === undefined) {
    return mentionList;
  }

  Object.keys(USERS).forEach(key => {
    if (body.indexOf(`@${key}`) >= 0) {
      mentionList.push(`<@${USERS[key]}>`);
    }
  });

  return mentionList;
}

function getPostData(message, channelId) {
  return {
    username: 'github2slack',
    channel: channelId,
    text: message.title,
    token: process.env.API_TOKEN
  };
}

function getPostOptions() {
  return {
    host: 'slack.com',
    port: '443',
    path: '/api/chat.postMessage',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
}

function post(message, channelId) {
  return new Promise((resolve, _reject) => {
    const data = getPostData(message, channelId);
    const options = getPostOptions();
    const req = https.request(options, res => {
      res.setEncoding('utf8');
      res.on('data', chunk => {
        const result = JSON.parse(chunk);
        if (result.ok) {
          resolve(chunk);
        } else {
          resolve(new Error());
        }
      });
    });
    req.on('error', e => {
      resolve(new Error(e));
    });
    req.write(JSON.stringify(data));
    req.end();
  });
}

function getMessageObject(event) {
  const gitHubBody = JSON.parse(event.body);
  const eventName = event.headers['X-GitHub-Event'];

  const msgObj = {
    title: null,
    body: null
  };

  if (eventName === 'pull_request') {
    const pullRequestLink = `[<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
    const pullRequestUser = gitHubBody.pull_request.user.login;
    if (gitHubBody.action === 'opened') {
      msgObj.title = `${pullRequestUser} Pullrequest Opened ${pullRequestLink}`;
      msgObj.body = gitHubBody.pull_request.body;
    } else if (gitHubBody.action === 'closed') {
      msgObj.title = `Pullrequest Closed ${pullRequestLink}`;
      msgObj.body = '';
    } else if (gitHubBody.action === 'review_requested') {
      msgObj.title = `Review requested ${pullRequestLink}`;
      msgObj.body = `@${gitHubBody.requested_reviewer.login}`;
    }
  } else if (eventName === 'issues') {
    const issueLink = `[<${gitHubBody.issue.html_url}|${gitHubBody.issue.title}>]`;
    if (gitHubBody.action === 'opened') {
      msgObj.title = `Issue Opened ${issueLink}`;
      msgObj.body = gitHubBody.issue.body;
    } else if (gitHubBody.action === 'closed') {
      msgObj.title = `Issue Closed ${issueLink}`;
      msgObj.body = '';
    }
  } else if (eventName === 'issue_comment' && gitHubBody.action === 'created') {
    msgObj.title = `${gitHubBody.comment.user.login} Comment on [<${gitHubBody.comment.html_url}|${gitHubBody.issue.title}>]`;
    msgObj.body = gitHubBody.comment.body;
  } else if (
    eventName === 'pull_request_review' &&
    gitHubBody.action === 'submitted'
  ) {
    const pullRequestLink = `[<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
    if (gitHubBody.review.state === 'approved') {
      msgObj.title = `${gitHubBody.review.user.login} Pullrequest approval ${pullRequestLink}`;
      msgObj.body = `@${gitHubBody.pull_request.user.login}`;
    } else if (gitHubBody.review.state === 'changes_requested') {
      msgObj.title = `${gitHubBody.review.user.login} Pullrequest change request ${pullRequestLink}`;
      msgObj.body = '';
    }
  } else if (
    eventName === 'pull_request_review_comment' &&
    gitHubBody.action === 'created'
  ) {
    msgObj.title = `${gitHubBody.comment.user.login} Review on [<${gitHubBody.comment.html_url}|${gitHubBody.pull_request.title}>]`;
    msgObj.body = gitHubBody.comment.body;
  } else if (
    eventName === 'discussion' &&
    gitHubBody.action === 'created'
  ) {
    const discussionLink = `[<${gitHubBody.discussion.html_url}|${gitHubBody.discussion.title}>]`;
    msgObj.title = `Discussion Created ${discussionLink}`;
    msgObj.body = gitHubBody.discussion.body;
  } else if (eventName === 'discussion_comment' && gitHubBody.action === 'created') {
    msgObj.title = `${gitHubBody.comment.user.login} Comment on [<${gitHubBody.comment.html_url}|${gitHubBody.discussion.title}>]`;
    msgObj.body = gitHubBody.comment.body;
  } else {
    return msgObj;
  }

  const mentionList = getMentionList(msgObj.body);
  if (mentionList.length > 0) {
    msgObj.title = `${mentionList.join(' ')} ${msgObj.title}`;
  }

  return msgObj;
}

function getPostChannelId(event) {
  const gitHubBody = JSON.parse(event.body);
  const repositories = JSON.stringify(REPOSITORIES);

  if (repositories.indexOf(gitHubBody.repository.name) >= 0) {
    return REPOSITORIES[gitHubBody.repository.name];
  }
  return '';
}

module.exports = {
  getMentionList,
  getPostData,
  getPostOptions,
  post,
  getMessageObject,
  getPostChannelId
};
