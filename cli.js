'use strict';

const { handler } = require('./index');

if (process.env.API_GATEWAY_REQUEST) {
    handler({apiRequest: true}, null, (error, pullRequestData) => {
        process.stdout.write(JSON.stringify(pullRequestData, null, ' '));
    });
} else {
    handler();
}
