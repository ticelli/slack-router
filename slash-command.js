const AbstractRouter = require('ticelli-bot');
const { WebClient: SlackClient } = require('@slack/client');
const SlackSlashBuilder = require('./builder/slash');


module.exports = class SlackSlashCommandRouter extends AbstractRouter {
  async run(train) {
    const answers = [];
    train.state.answers = answers;
    const { channel_id, user_id, team_id } = train.request.body;
    train
      .hang({
        locale: 'fr', // @todo: hardcoded
        slack: {
          validationToken: this.config.verification_token,
          ephemeral: (messageId, ...options) => {
            if (!train.slackClient) {
              throw new Error('Slack Client not defined.');
            }
            const { chat } = train.slackClient;
            answers.push('ephemeral');
            const message = train.answerPicker ? train.answerPicker.pick(train.locale, messageId, train) : messageId;
            chat.postEphemeral(channel_id, message, user_id, ...options);
          },
        },
      });
    return super.run(train);
  }

  get when() {
    const builder = new SlackSlashBuilder(this);
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
