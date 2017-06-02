# Pull Request bot

This script grabs a list of pull requests, formats them, and posts them to Slack to notify team members they are needed for review.


## Prerequisites

 - You'll need to setup an incoming webhook in slack
 - You'll need a Github API key


## How to use

Pull request bot operates with the following environment variables:
 - `GITHUB_API_KEY`: github api key
 - `GITHUB_ORG`: The organization where your repos are stored
 - `GITHUB_TOPIC`: Use a topic here to limit the returned repositories considered for pull requests
 - `SLACK_CHANNEL`: (optional) The channel to post to (useful for multiple teams)
 - `SLACK_ENDPOINT`: incoming webhook URL

### Running via Cron

- Run `make install`
- Setup a cron script to run the following at your desired intervals
  ```
  GITHUB_API_KEY="<GITHUB_API_KEY>" \
  SLACK_ENDPOINT="<SLACK_ENDPOINT>" \
  GITHUB_ORG="<GITHUB_ORG>" \
  GITHUB_TOPIC="<GITHUB_TOPIC>" \
  node cli.js
  ```

### Running via Lambda

 - Create a new blank, javascript lambda function
 - run `make` in this repository
 - Upload the resultant zip file to lambda
 - configure environment variables
 - click Save & Test
