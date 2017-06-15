'use strict';

const { getProjectsForTopicAndOrg } = require('./project');
const { pushProjectsToSlack } = require('./slack');

const apiRequest = (event, context, callback) => {
    getProjectsForTopicAndOrg(process.env.GITHUB_TOPIC, process.env.GITHUB_ORG)
        .then(pullRequests => callback(null, pullRequests));
};

exports.handler = (event, context, callback) => {
    if (
        !process.env.GITHUB_API_KEY
        || !process.env.GITHUB_ORG
        || !process.env.GITHUB_TOPIC
        || !process.env.SLACK_ENDPOINT
    ) {
        process.stdout.write(`
Please include the following environment variables to execute this script:
- GITHUB_API_KEY
- GITHUB_ORG
- GITHUB_TOPIC
- SLACK_ENDPOINT
        `);

        process.exit(1);
    }

    if (event && event.apiRequest) {
        return apiRequest(event, context, callback);
    }

    apiRequest(event, context, (error, pullRequests) => pushProjectsToSlack(pullRequests));
};
