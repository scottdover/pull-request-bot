'use strict';

const request = require('request');

const NUMBER_OF_APPROVALS_NEEDED = 2;

const shortPrMessage = ({number, user, url}) => `_<${url}|(#${number}) by ${user.login}>_`;
const fullPrMessage = ({url, title, number, repo, status}) => {
    const reviewsNeeded = Math.max(NUMBER_OF_APPROVALS_NEEDED - status, 0);
    return `> *<${url}|(#${number})> ${title}*
> _in <${repo.html_url}|${repo.name}> · ${reviewsNeeded} review${reviewsNeeded === 1 ? '' : 's'} needed_`;
};

const attachment = (text, color) => ({
    color,
    mrkdwn_in: ['text'],
    text,
});

const pushPrsToSlack = (
    reviewablePullRequests,
    approvedPullRequests,
    rejectedPullRequests
) => {
    const text = "Take a little :clock1: for your fellow engineers and show these reviews some :heart:\n"
        + (reviewablePullRequests.length === 0
                ? "You\'ve reviewed all the things. Good job! :allthethings:"
                : reviewablePullRequests.map(pr => fullPrMessage(pr)).join("\n")
        );

    request({
        url: process.env.SLACK_ENDPOINT,
        method: 'POST',
        json: {
            channel: process.env.SLACK_CHANNEL || null,
            text,
            attachments: [
                approvedPullRequests.length === 0 ? null : attachment(
                    `:thumbsup_all: ${approvedPullRequests.map(pr => shortPrMessage(pr)).join(" · ")}`,
                    '#2ecc71'
                ),
                rejectedPullRequests.length === 0 ? null : attachment(
                    `:fire: ${rejectedPullRequests.map(pr => shortPrMessage(pr)).join(" · ")}`,
                    '#e74c3c'
                ),
            ].filter(x => x)
        }
    });
};

const pushProjectsToSlack = pullRequestsByProject => {
    let pullRequests = [];
    pullRequestsByProject.forEach(projectPullRequests => pullRequests = pullRequests.concat(projectPullRequests));

    const filteredPullRequests = pullRequests
        // We only care about open pull requests
        .filter(pullRequest => pullRequest.state === 'open')
        .sort((a, b) => a.status > b.status ? -1 : 1);

    pushPrsToSlack(
        filteredPullRequests.slice().filter(pr => pr.status >= 0 && pr.status < NUMBER_OF_APPROVALS_NEEDED),
        filteredPullRequests.slice().filter(pr => pr.status >= NUMBER_OF_APPROVALS_NEEDED),
        filteredPullRequests.slice().filter(pr => pr.status < 0)
    );
};

module.exports = { pushProjectsToSlack };
