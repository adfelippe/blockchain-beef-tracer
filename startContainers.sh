#!/bin/bash

# Start all beef containers
docker start $(docker ps -aq)
