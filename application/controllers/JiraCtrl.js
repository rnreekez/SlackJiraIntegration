var _ = require('lodash'),
    config = require('nconf'),
    rest = require('rest'),
    mime = require('rest/interceptor/mime'),
    client = rest.wrap(mime, { mime: 'application/json' });

exports.receiveEvent = function (req, res) {
    var endpoint, body, transition, shortMessage, configProps, projectKey,
        ev = req.body;

    if (_.has(ev, 'transition')) {
        projectKey = ev.issue.key.split('-')[0];

        configProps = {
          slackUrl: projectKey + ':SLACK_URL',
          jiraDomain: projectKey + ':JIRA_DOMAIN'
        };

        if(!config.get(configProps.slackUrl) || !config.get(configProps.jiraDomain))
          return;

        endpoint = config.get(configProps.slackUrl);

        /* jshint camelcase:false */
        transition = {
            issue: ev.issue.key,
            issueUrl: 'https://' + config.get(configProps.jiraDomain) + '/browse/' + ev.issue.key,
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
            attachments: [{
                "mrkdwn_in": ["pretext", "fallback"],
                fallback: shortMessage,
                pretext: shortMessage,
                color: '#C0C0C0',
                fields: [{
                    title: 'Transition',
                    value: _.template(
                        '<%= t.fromStatus %> → <%= t.toStatus %>',
                        { t: transition }
                    ),
                    short: true
                }, {
                    title: 'Current Assignee',
                    value: _.template(
                        '<%= t.assignee %>',
                        { t: transition }
                    ),
                    short: true
                },{
                  title: 'Summary',
                  value: _.template(
                      '<%= t.description %>',
                      { t: transition }
                  ),
                  short: false
                }]
            }]
        };

        client({
            path: endpoint,
            entity: body
        }).then(function(response) {
            console.log('POST -- ' + endpoint);
            console.log(response.status);
        });
    }

    res.json(200);
};
