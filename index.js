'use strict';

const { getProjectsForTopicAndOrg, pullRequestInfoForProject } = require('./project');
const { pushProjectsToSlack } = require('./slack');
const q = require('q');

exports.handler = () => {
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

    const postOpenPullRequests = projects => {
        q.all(projects.map(project => pullRequestInfoForProject(project)))
            .then(pushProjectsToSlack);
    };

    getProjectsForTopicAndOrg(process.env.GITHUB_TOPIC, process.env.GITHUB_ORG).then(postOpenPullRequests);
};
