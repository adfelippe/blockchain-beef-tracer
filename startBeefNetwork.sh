#!/bin/bash

# Install archive file card
composer network install --card PeerAdmin@hlfv1 --archiveFile beef-tracer.bna
# Start beef-tracer network
composer network start --networkName beef-tracer --networkVersion 0.0.2-deploy.81 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file admin.card
# Start composer playground
composer-playground
