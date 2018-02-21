'use strict';

const request = require('request');
const q = require('q');

const apiRequest = (path, callback) => {
    request({
        url: path.includes('http') ? path : `https://api.github.com${path}`,
        headers: {
            'Authorization': `token ${process.env.GITHUB_API_KEY}`,
            'User-Agent': 'request',
            'Accept': 'application/vnd.github.mercy-preview+json',
        }
    }, (err, response, body) => callback(JSON.parse(body)));
};

const determinePullRequestStatus = reviews => {
    let reviewsByUser = {};

    reviews
        // We only care about approvals and failures
        .filter(review => ['APPROVED', 'CHANGES_REQUESTED'].indexOf(review.state) !== -1)
        .map(review => reviewsByUser[review.user.login] = review.state);

    let approved = true;
    let numberOfApprovals = 0;
    for (var key in reviewsByUser) {
        const isApproved = reviewsByUser[key] === 'APPROVED';
        numberOfApprovals += (isApproved ? 1 : 0);
        if (!isApproved) {
            approved = false;
        }
    }

    return approved ? numberOfApprovals : -1;
}

const pullRequestData = (project, {number, title, html_url, state, head, user}) => {
    const deferred = q.defer();

    const prUrl = `/repos/${process.env.GITHUB_ORG}/${project}/pulls/${number}`;
    const getReviewData = reviewers => apiRequest(`${prUrl}/reviews`, data => {
        deferred.resolve({
            number,
            repo: head.repo,
            reviewers,
            state,
            status: determinePullRequestStatus(data),
            title,
            url: html_url,
            user,
        });
    });

    // Get requested reviewers
    apiRequest(`${prUrl}/requested_reviewers`, getReviewData);

    return deferred.promise;
};

const pullRequestInfoForProject = project => {
    const deferred = q.defer();

    apiRequest(`/repos/${process.env.GITHUB_ORG}/${project}/pulls`, pulls => {
        q.all(pulls.map(pull => pullRequestData(project, pull)))
            .then(results => deferred.resolve(results));
    });

    return deferred.promise;
};

const getOpenPullRequests = projects => {
    const deferred = q.defer();

    q.all(projects.map(project => pullRequestInfoForProject(project)))
        .then(pullRequestsByProject => {
                let pullRequests = [];
                pullRequestsByProject.forEach(projectPullRequests => {
                    pullRequests = pullRequests.concat(projectPullRequests);
                });

                const filteredPullRequests = pullRequests
                    // We only care about open pull requests with assigned reviewers
                    .filter(
                        pullRequest => pullRequest.state === 'open' &&
                        (pullRequest.reviewers.users.length > 0 || pullRequest.reviewers.teams.length > 0)
                    )
                    .sort((a, b) => a.status > b.status ? -1 : 1);

                deferred.resolve(filteredPullRequests);
        });

    return deferred.promise;
};

const getProjectsForTopicAndOrg = (topic, org) => {
    const deferred = q.defer();

    apiRequest(
        `/search/repositories?q=topic:${topic}+user:${org}`,
        ({items}) => getOpenPullRequests(items.map(repo => repo.name))
            .then(deferred.resolve)
    );

    return deferred.promise;
};

module.exports = { pullRequestInfoForProject, getProjectsForTopicAndOrg };
