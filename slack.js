'use strict';

const request = require('request');

const NUMBER_OF_APPROVALS_NEEDED = process.env.NUMBER_OF_APPROVALS_NEEDED || 2;

const githubToSlackHandles = process.env.GITHUB_TO_SLACK_HANDLE_MAP
    ? JSON.parse(process.env.GITHUB_TO_SLACK_HANDLE_MAP)
    : null;

const getSlackHandle = (githubHandle) => {
    if (!githubToSlackHandles) {
        return githubHandle;
    }

    return typeof githubToSlackHandles[githubHandle] !== 'undefined'
        ? `@${githubToSlackHandles[githubHandle]}`
        : githubHandle;
};

const shortPrMessage = ({number, user, url}) => `_<${url}|*#${number}* by ${getSlackHandle(user.login)}>_`;
const fullPrMessage = ({url, title, repo, status}) => {
    const reviewsNeeded = Math.max(NUMBER_OF_APPROVALS_NEEDED - status, 0);
    return `*<${url}|${title}>*
_in <${repo.html_url}|${repo.name}> · ${reviewsNeeded} review${reviewsNeeded === 1 ? '' : 's'} needed_`;
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
    const text = "Take a little :clock1: for your fellow engineers and show these reviews some :heart:\n";
    const reviewablePrAttachments = reviewablePullRequests.length === 0
        ? [ attachment("You\'ve reviewed all the things. Good job! :allthethings:", '#f1c40f') ]
        : reviewablePullRequests.map(pr => attachment(fullPrMessage(pr), '#f1c40f'));

    request({
        url: process.env.SLACK_ENDPOINT,
        method: 'POST',
        json: {
            channel: process.env.SLACK_CHANNEL || null,
            text,
            attachments: [
                ...reviewablePrAttachments,
                approvedPullRequests.length === 0 ? null : attachment(
                    `:tada: ${approvedPullRequests.map(pr => shortPrMessage(pr)).join(" · ")}`,
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

const pushProjectsToSlack = pullRequests => {
    pushPrsToSlack(
        pullRequests.slice().filter(pr => pr.status >= 0 && pr.status < NUMBER_OF_APPROVALS_NEEDED),
        pullRequests.slice().filter(pr => pr.status >= NUMBER_OF_APPROVALS_NEEDED),
        pullRequests.slice().filter(pr => pr.status < 0)
    );
};

module.exports = { pushProjectsToSlack };
