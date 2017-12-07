const AbstractRouter = require('ticelli-bot');
const { WebClient: SlackClient } = require('@slack/client');
const SlackBuilder = require('./builder');


module.exports = class SlackRouter extends AbstractRouter {
  async run(train) {
    const { event = {} } = train.request.body;
    const answers = [];
    train.state.answers = answers;
    train
      .hang({
        slack: {
          validationToken: this.config.verification_token,
          reply: (messageId, ...params) => {
            let message = messageId;
            if (train.translate) {
              if (Array.isArray(message)) {
                message = train.translate(...message);
              } else {
                message = train.translate(messageId, train);
              }
            }
            train.slackClient.chat.postMessage(event.channel, message, ...params);
            answers.push('reply');
          },
          react: (emoji) => {
            train.slackClient.reactions.add(emoji, { channel: event.channel, timestamp: event.ts });
            answers.push('react');
          },
        },
      });
    return super.run(train);
  }

  get when() {
    const builder = new SlackBuilder(this);
    this.push(builder);
    return builder;
  }

  async setClient(train) {
    let accessToken = this.config.access_token;
    if (this.config.client_id && this.config.client_secret) {
      if (train.memory && await train.memory.get('oauth.bot.bot_access_token')) {
        accessToken = await train.memory.get('oauth.bot.bot_access_token');
      }
    }
    if (!accessToken) {
      throw new Error('No access token found');
    }
    train.hang({ slackClient: new SlackClient(accessToken) });
  }
};
