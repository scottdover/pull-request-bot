NAME=pull-request-bot
VERSION=0.0.1

.PHONY: install build

all: install build

install:
	yarn install

build:
	zip -r ../pull-request-bot.zip *
	echo "Wrote zip file to ../pull-request-bot.zip"
