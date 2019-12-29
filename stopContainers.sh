#!/bin/bash

# Stop all containers
docker stop $(docker ps -aq)
