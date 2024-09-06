const {
  getMentionList,
  getPostData,
  getPostOptions,
  getMessageObject,
  getPostChannelId
} = require('../../common');

describe('getMentionList', () => {
  test('convert mention user', () => {
    const convertData = getMentionList('@ma3tk aaa');
    expect(convertData).toStrictEqual(['<@U1KTF129J>']);
  });

  test('convert mention users', () => {
    const convertData = getMentionList(
      '@ma3tk aaa @kxmxyx'
    );
    expect(convertData).toStrictEqual([
      '<@U02JR88JRQU>',
      '<@U1KTF129J>'
    ]);
  });

  test('return empty array when not in mapping.json', () => {
    const convertData = getMentionList('@dummy');
    expect(convertData).toStrictEqual([]);
  });

  test('return empty array when body is null or undefined', () => {
    expect(getMentionList(null)).toStrictEqual([]);
    expect(getMentionList(undefined)).toStrictEqual([]);
  });
});

describe('getPostData', () => {
  test('get data', () => {
    process.env.API_TOKEN = 'DEF456';
    const message = { title: 'post data title' };
    const channelId = 'ABC123';
    expect(getPostData(message, channelId)).toStrictEqual({
      username: 'github2slack',
      channel: 'ABC123',
      text: message.title,
      token: 'DEF456'
    });
  });
});

describe('getPostOptions', () => {
  test('get options', () => {
    process.env.API_TOKEN = 'ABC123';
    expect(getPostOptions()).toStrictEqual({
      host: 'slack.com',
      port: '443',
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        Authorization: `Bearer ABC123`,
        'Content-Type': 'application/json'
      }
    });
  });
});

describe('getMessageObject', () => {
  let event = null;
  beforeEach(() => {
    event = {
      headers: { 'X-GitHub-Event': '' },
      body: {
        action: '',
        pull_request: {
          title: 'test pull_request title',
          html_url: 'https://github.com/hoge/fuga/pull/1',
          body: 'pull_request body',
          user: {
            login: 'author'
          }
        },
        requested_reviewer: { login: 'reviewer user' },
        review: {
          state: '',
          user: {
            login: 'reviewer'
          }
        },
        issue: {
          title: 'test issue title',
          html_url: 'https://github.com/hoge/fuga/issues/1',
          body: 'issue body'
        },
        comment: {
          html_url: 'https://github.com/hoge/fuga/issues/1#issuecomment-12345',
          body: 'issue comment body',
          user: {
            login: 'author'
          }
        },
        discussion: {
          html_url: 'https://github.com/hoge/fuga/discussions/1',
          title: 'discussion title',
          body: 'discussion body',
          user: {
            login: 'author'
          }
        }
      }
    };
  });

  test('pull_request opened', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'opened';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'author Pullrequest Opened [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: 'pull_request body'
    });
  });

  test('pull_request closed', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'closed';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Pullrequest Closed [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: ''
    });
  });

  test('pull_request review_requested', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'review_requested';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Review requested [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: '@reviewer user'
    });
  });

  test('issues opened', () => {
    event.headers['X-GitHub-Event'] = 'issues';

    event.body.action = 'opened';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Issue Opened [<https://github.com/hoge/fuga/issues/1|test issue title>]',
      body: 'issue body'
    });
  });

  test('issues closed', () => {
    event.headers['X-GitHub-Event'] = 'issues';

    event.body.action = 'closed';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Issue Closed [<https://github.com/hoge/fuga/issues/1|test issue title>]',
      body: ''
    });
  });

  test('issue_comment created', () => {
    event.headers['X-GitHub-Event'] = 'issue_comment';

    event.body.action = 'created';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'author Comment on [<https://github.com/hoge/fuga/issues/1#issuecomment-12345|test issue title>]',
      body: 'issue comment body'
    });
  });

  test('pull_request_review approval', () => {
    event.headers['X-GitHub-Event'] = 'pull_request_review';

    event.body.action = 'submitted';
    event.body.review.state = 'approved';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'reviewer Pullrequest approval [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: '@author'
    });
  });

  test('pull_request_review change_request', () => {
    event.headers['X-GitHub-Event'] = 'pull_request_review';

    event.body.action = 'submitted';
    event.body.review.state = 'changes_requested';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'reviewer Pullrequest change request [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: ''
    });
  });

  test('pull_request_review comment', () => {
    event.headers['X-GitHub-Event'] = 'pull_request_review_comment';

    event.body.action = 'created';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'author Review on [<https://github.com/hoge/fuga/issues/1#issuecomment-12345|test pull_request title>]',
      body: 'issue comment body'
    });
  });

  test('discussion', () => {
    event.headers['X-GitHub-Event'] = 'discussion';

    event.body.action = 'created';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Discussion Created [<https://github.com/hoge/fuga/discussions/1|discussion title>]',
      body: 'discussion body'
    });
  });

  test('discussion_comment created', () => {
    event.headers['X-GitHub-Event'] = 'discussion_comment';

    event.body.action = 'created';
    event.body = JSON.stringify(event.body);

    //TODO: mockデータがissue_commentと同じものになっているので要変更
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'author Comment on [<https://github.com/hoge/fuga/issues/1#issuecomment-12345|discussion title>]',
      body: 'issue comment body'
    });
  });

  test('convert mention', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'opened';
    event.body.pull_request.body = '@ma3tk abc';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        '<@U1KTF129J> author Pullrequest Opened [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: '@ma3tk abc'
    });
  });

  test('other event', () => {
    event.headers['X-GitHub-Event'] = 'hoge';

    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title: null,
      body: null
    });
  });
});

describe('getPostChannelId', () => {
  let event = null;
  beforeEach(() => {
    event = {
      headers: { 'X-GitHub-Event': '' },
      body: {
        pull_request: {
          title: 'test pull_request title',
          html_url: 'https://github.com/hoge/fuga/pull/1',
          body: 'pull_request body',
          user: {
            login: 'author'
          }
        },
        repository: {
          id: 830276446,
          name: 'REPOSITORY_NAME_1',
          full_name: 'REPOSITORY_NAME_1',
          private: true
        }
      }
    };
  });

  test('get data', () => {
    event.body = JSON.stringify(event.body);
    expect(getPostChannelId(event)).toStrictEqual('SLACK_CHANNEL_ID_1');
  });

  test('get empty data', () => {
    event.body.repository.name = 'Sample-Repository';
    event.body = JSON.stringify(event.body);
    expect(getPostChannelId(event)).toStrictEqual('');
  });
});
