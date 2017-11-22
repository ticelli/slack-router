const Builder = require('ticelli-bot/builder');

module.exports = class SlackComponentBuilder extends Builder {
  callback(id) {
    this.stack.push(({ payload: { callback_id } }) => callback_id === id);
    return this;
  }
  callbackPart(id, markup = ':') {
    this.stack.push(({ payload }) => {
      payload.callback = payload.callback_id.split(markup)
      return payload.callback.indexOf(id) > -1
    });
    return this;
  }
  action(name, value) {
    this.stack.push(
      ({ payload: { actions}  }) => actions
        .map(action => action.name === name && (!value || action.value === value))
        .reduce((a, b) => a || b),
      (req) => {
        req.actions = (req.payload.actions || []).reduce((a, b) => {
          if (b.value) {
            a[b.name] = b.value;
          }
          if (b.selected_options) {
            a[b.name] = b.selected_options.map(o => o.value).reduce((a, b) => b, null);
          }
          return a;
        }, {})
      },
    );

    return this;
  }
};