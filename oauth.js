const AbstractRouter = require('ticelli-bot');
const request = require('request-promise-native');
module.exports = class SlackComponentRouter extends AbstractRouter {
  get requestAccess() {
    this.push(async (train) => {
      if (!(this.config.redirect_uri && this.config.client_secret && this.config.client_id)) {
        throw new Error('Oauth misconfigured');
      }
      const oauthAuthentication = await request.get({
        url: this.config.slack_oauth_access_url || 'https://slack.com/api/oauth.access',
        json: true,
        qs: {
          code: train.request.query.code,
          client_id: this.config.client_id,
          client_secret: this.config.client_secret,
          redirect_uri: this.config.redirect_uri,
        },
      });
      if (!oauthAuthentication.ok) {
        throw new Error('Oauth authentication failed');
      }
      delete oauthAuthentication.ok;
      train.hang({ oauthAuthentication })
    });
    return this;
  }

  persistToMemory() {
    this.push(({oauthAuthentication, memory}) => memory.set('oauth', oauthAuthentication));
    return this;
  }

  httpRedirect(url) {
    this.push(async (train) => {
      train.setStatus(302).setHeader('Location', url).setBody(`Redirect to ${url}`).close();
    });
    return this;
  }
};
