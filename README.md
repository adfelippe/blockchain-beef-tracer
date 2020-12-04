# blockchain-beef-tracer
A beef traceability smart contract developed mostly in Javascript (alongside some Shell and Python scripts) using Hyperledger Fabric Composer.
This code is the prototype used to perform tests and validations for my Master's thesis.


## Setup
Please, follow the instructions [here](https://hyperledger.github.io/composer/latest/installing/development-tools.html) to install the Hyperledger Composer and the Hyperledger Fabric environment.

Once you're done with Fabric download, run the scripts inside the `fabric-dev-serves` folder in the following order:

```
./createPeerAdminCard.sh
./startFabric.sh
```

After that, the docker containers will be created and ready to be deployed.

Bring-up the containers running `startContainers.sh`
If you need to stop the containers, run `stopContainers.sh`

In order to deploy the beef-tracer blockchain, run `startBeefNetwork.sh`. It needs to be done only once.

Then, everytime you need to stop or start the system, run start and stopContainers.
If you run start, also run `composer-playground` to start the composer at the port `8080`.

In case you need to clean up and reset the Blockchain database (the Hyperledger World State), run `reset_database.sh`.
