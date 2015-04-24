var _ = require('lodash'),
    config = require('nconf'),
    rest = require('rest'),
    mime = require('rest/interceptor/mime'),
    client = rest.wrap(mime, { mime: 'application/json' });

exports.receiveEvent = function (req, res) {
  var endpoint, body, transition, shortMessage, configProps, projectKey,
      ev = req.body;

  var hasTransition = _.has(ev, 'transition');

  if (!hasTransition && _.has(ev, 'changelog')) { // Newer jira versions
    _.each(ev.changelog.items, function (change) {
      if (change.field == 'status' && change.fromString) {
        ev.transition = { from_status: change.fromString, transitionName: change.toString }
        hasTransition = true;
      }
    });
  }

  projectKey = ev.issue.key.split('-')[0];

  configProps = {
    slackUrl: projectKey + ':SLACK_URL',
    jiraDomain: projectKey + ':JIRA_DOMAIN'
  };

  if (!config.get(configProps.slackUrl) || !config.get(configProps.jiraDomain))
    return;

  endpoint = config.get(configProps.slackUrl);

  if(_.has(ev, 'issue'))
    var issueUrl = 'https://' + config.get(configProps.jiraDomain) + '/browse/' + ev.issue.key;

  if (hasTransition) {
    /* jshint camelcase:false */
    transition = {
      issue: ev.issue.key,
      issueUrl: issueUrl,
      description: ev.issue.fields.summary,
      fromStatus: ev.transition.from_status,
      toStatus: ev.transition.transitionName,
      who: ev.user.displayName
    };

    transition.assignee = (ev.issue.fields.assignee) ?
        ev.issue.fields.assignee.displayName : 'Unassigned';

    shortMessage = _.template(
        '*<%= t.who %>* moved <<%= t.issueUrl %>|<%= t.issue %>>',
        { t: transition }
    );

    body = {
      attachments: [
        {
          "mrkdwn_in": ["pretext", "fallback"],
          fallback: shortMessage,
          pretext: shortMessage,
          color: '#C0C0C0',
          fields: [
            {
              title: 'Transition',
              value: _.template(
                  '<%= t.fromStatus %> → <%= t.toStatus %>',
                  { t: transition }
              ),
              short: true
            },
            {
              title: 'Current Assignee',
              value: _.template(
                  '<%= t.assignee %>',
                  { t: transition }
              ),
              short: true
            },
            {
              title: 'Summary',
              value: _.template(
                  '<%= t.description %>',
                  { t: transition }
              ),
              short: false
            }
          ]
        }
      ]
    };

    client({
      path: endpoint,
      entity: body
    }).then(function (response) {
      console.log('POST -- ' + endpoint);
      console.log(response.status);
    });
  }

  if (_.has(ev, 'comment') && !_.isNull(ev.comment)) {
    var isEdit = ev.comment.created != ev.comment.updated;

    var action = isEdit ? 'updated a comment' : 'commented';

    var commentUrl = issueUrl + '?focusedCommentId=' + ev.comment.id + '&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-' + ev.comment.id;

    var shortMessage = _.template(
        '*<%= c.author.displayName %>* <<%= commentUrl %>|<%= action %>> on issue <<%= issueUrl %>|<%= t.issue.id%> - <%= issueSummary %>>',
        { c: ev.comment, t: ev, issueUrl: issueUrl, action: action, commentUrl: commentUrl,
          issueSummary: ev.issue.fields.summary.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;')
        }
    );

    var body = {
      attachments: [
        {
          "mrkdwn_in": ["pretext", "fallback", "text"],
          fallback: shortMessage,
          pretext: shortMessage,
          color: '#C0C0C0',
          text: ev.comment.body.replace(/!([^\s]+)!/g, "$1").replace(/\{\{(.+)\}\}/g, "`$1`")
        }
      ]
    };

    client({
      path: endpoint,
      entity: body
    }).then(function (response) {
      console.log('POST -- ' + endpoint);
      console.log(response.status);
    });
  }

  res.json(200);
};
