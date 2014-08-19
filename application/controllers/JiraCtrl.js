var _ = require('lodash'),
    config = require('nconf'),
    rest = require('rest'),
    mime = require('rest/interceptor/mime'),
    client = rest.wrap(mime, { mime: 'application/json' });

exports.receiveEvent = function (req, res) {
    var endpoint, body, transition, shortMessage,
        ev = req.body;

    if (_.has(ev, 'transition')) {
        /* jshint camelcase:false */
        transition = {
            issue: ev.issue.key,
            issueUrl: 'https://jira.rax.io/browse/' + ev.issue.key,
            description: ev.issue.fields.summary,
            fromStatus: ev.transition.from_status,
            toStatus: ev.transition.transitionName,
            who: ev.user.displayName,
        };

        transition.assignee = (ev.issue.fields.assignee) ?
            ev.issue.fields.assignee.displayName : 'Unassigned';

        shortMessage = _.template(
            '<%= t.who %> moved <<%= t.issueUrl %>|<%= t.issue %>>',
            { t: transition }
        );

        body = {
            attachments: [{
                fallback: shortMessage,
                pretext: shortMessage,
                color: '#C0C0C0',
                fields: [{
                    title: 'Summary',
                    value: _.template(
                        '<%= t.description %>',
                        { t: transition }
                    ),
                    short: false
                }, {
                    title: 'Transition',
                    value: _.template(
                        '<%= t.fromStatus %> → <%= t.toStatus %>',
                        { t: transition }
                    ),
                    short: false
                }, {
                    title: 'Current Assignee',
                    value: _.template(
                        '<%= t.assignee %>',
                        { t: transition }
                    ),
                    short: false
                }]
            }]
        };

        var project = ev.issue.key.split('-');

        if(project[0] === 'EN') {
            endpoint = config.get('cloud').slackUrl;
        }

        if(endpoint) {
            client({
                path: endpoint,
                entity: body
            }).then(function(response) {
                console.log('POST -- ' + endpoint);
                console.log(response.status);
            });
        }
    }

    res.json(200);
};
