/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getFactory getAsRegistry getParticipantRegistry emit */

// FARMER FUNCTIONS
/**
 * Create a new animal as an asset
 * @param {org.acme.beef_network.createAnimal} createAnimal - the createAnimal transaction
 * @transaction
 */

async function createAnimal(creationRequest) {

  console.log('createAnimal');
  const factory = getFactory();
  const namespace = 'org.acme.beef_network';

  const creation = factory.newResource(namespace, 'Animal', creationRequest.geneticId);
  creation.animalId = creationRequest.animalId;
  creation.lifeStage = 'BREEDING';
  creation.breed = creationRequest.breed;
  creation.location = creationRequest.location;
  creation.weight = creationRequest.weight;
  creation.owner = factory.newRelationship(namespace, 'Farmer', creationRequest.owner.getIdentifier());

  // Check if owner exists
  const participantRegistry = await getParticipantRegistry(namespace + '.Farmer');
  const ownerCheck = await participantRegistry.exists(creationRequest.owner.getIdentifier());
  if (!ownerCheck) {
    throw new Error('This Farmer does not exist!')
  } else {
  	// save the order
    const assetRegistry = await getAssetRegistry(creation.getFullyQualifiedType());
    await assetRegistry.add(creation);
    // emit the event
    const createAnimalEvent = factory.newEvent(namespace, 'createAnimalEvent');
    createAnimalEvent.geneticId = creation.geneticId;
    createAnimalEvent.owner = creation.owner;
    createAnimalEvent.location = creation.location;
    createAnimalEvent.breed = creation.breed;
    createAnimalEvent.weight = creation.weight;
    emit(createAnimalEvent);
  }
}

/**
 * Create a new animal as an asset
 * @param {org.acme.beef_network.updateAnimal} updateAnimal
 * @brief A transaction to update information of a given animal (based on geneticId)
 * @transaction
 */
async function updateAnimal(updateAnimalRequest) {

  console.log('updateAnimal');
  const factory = getFactory();
  const namespace = 'org.acme.beef_network';
  let transportRegistry = '';
  let transportCheck = '';
  let slaughterhouseRegistry = '';
  let slaughterhouseCheck = '';

  // Get animal registry and perform proper checks
  const animalRegistry = await getAssetRegistry(namespace + '.Animal');
  const idCheck = await animalRegistry.exists(updateAnimalRequest.geneticId.getIdentifier());
  const animal = await animalRegistry.get(updateAnimalRequest.geneticId.getIdentifier());

  // Get Farmer registry and perform proper checks
  const participantRegistry = await getParticipantRegistry(namespace + '.Farmer');
  const ownerCheck = await participantRegistry.exists(updateAnimalRequest.owner.getIdentifier());
  animal.owner = await participantRegistry.get(updateAnimalRequest.owner.getIdentifier());

  // Get Transportation registry and perform proper checks
  if (updateAnimalRequest.transportedBy) {
    transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
    transportCheck = await transportRegistry.exists(updateAnimalRequest.transportedBy.getIdentifier());
    // Throw error and leave if transportation is to be updated but company doesn't exist
    if (!transportCheck) {
        throw new Error("This Transportation company does not exist!")
        return;
    }
  }

  // Get Slaughterhouse registry and perform proper checks
  if (updateAnimalRequest.slaughterhouse) {
    slaughterhouseRegistry = await getParticipantRegistry(namespace + '.Slaughterhouse');
    slaughterhouseCheck = await slaughterhouseRegistry.exists(updateAnimalRequest.slaughterhouse.getIdentifier());
    // Throw error and leave if transportation is to be updated but company doesn't exist
    if (!slaughterhouseCheck) {
        throw new Error("This Slaughterhouse company does not exist!")
        return;
    }
  }


  if (!idCheck) {
    throw new Error("This Animal's genetic ID does not exist!")
  } else {
    // Check existence of owner
    if (!ownerCheck) {
    throw new Error('This Farmer does not exist!')
    } else {
      // Update animal in the ledger
      // Optional and mandatory fields are checked againt themselves to be updated

      // Mandatory
      animal.lifeStage = updateAnimalRequest.lifeStage;

      // Mandatory at creation only
      if (!animal.weight || (animal.weight && !updateAnimalRequest.weight)) {
        animal.weight = animal.weight;
      } else if (animal.weight && updateAnimalRequest.weight) {
        animal.weight = animal.weight + ' | ' + updateAnimalRequest.weight;
      }
      // Mandatory at creation only
      if (!animal.location || (animal.location && !updateAnimalRequest.location)) {
        animal.location = animal.location;
      } else if (animal.location && updateAnimalRequest.location){
        animal.location = animal.location + ' | ' + updateAnimalRequest.location;
      }
      // Optional
      if (!animal.animalId) {
        animal.animalId = updateAnimalRequest.animalId;
      } else if (animal.animalId && updateAnimalRequest.animalId) {
        animal.animalId = animal.animalId + ' | ' + updateAnimalRequest.animalId;
      }
      // Optional
      if (!animal.vaccines) {
        animal.vaccines = updateAnimalRequest.vaccines;
      } else if (animal.vaccines && updateAnimalRequest.vaccines) {
        animal.vaccines = animal.vaccines + ' | ' + updateAnimalRequest.vaccines;
      }
      // Optional
      if (!animal.diseases) {
        animal.diseases = updateAnimalRequest.diseases;
      } else if (animal.diseases && updateAnimalRequest.diseases) {
        animal.diseases = animal.diseases + ' | ' + updateAnimalRequest.diseases;
      }
      // Optional
      // Always updated if requested
      // It is useful if some data needs to be fixed
      if (updateAnimalRequest.slaughterDate) {
          animal.slaughterDate = updateAnimalRequest.slaughterDate;
      }
      // Optional Transportation data
      if (updateAnimalRequest.transportedBy) {
          animal.transportedBy = await transportRegistry.get(updateAnimalRequest.transportedBy.getIdentifier());
      }
      // Optional Slaughterhouse data
      if (updateAnimalRequest.slaughterhouse) {
          animal.slaughterhouse = await slaughterhouseRegistry.get(updateAnimalRequest.slaughterhouse.getIdentifier());
      }
      // Update ledger
      await animalRegistry.update(animal);
    }
    // Emit the event
    //const updateAnimalEvent = factory.newEvent(namespace, 'updateAnimalEvent');
  }
}

/**
 * Create a new product as an asset
 * This new product inherits information from its originary animal
 * @param {org.acme.beef_network.createProduct} createProduct - the createProduct transaction
 * @transaction
 */

async function createProduct(creationRequest) {

    console.log('createAnimal');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';

    const creation = factory.newResource(namespace, 'Product', creationRequest.productId);
    creation.productId = creationRequest.productId;
    creation.productType = creationRequest.productType;
    creation.productStatus = creationRequest.productStatus;
    creation.location = creationRequest.location;
    creation.weight = creationRequest.weight;
    creation.geneticId = factory.newRelationship(namespace, 'Animal', creationRequest.geneticId.getIdentifier());
    creation.slaughterhouse = factory.newRelationship(namespace, 'Slaughterhouse', creationRequest.slaughterhouse.getIdentifier());

    // Check if animal and slaughterhouse exists based on their ID
    // (Products can only be created if their source animal exists in the ledger)
    const animalRegistry = await getAssetRegistry(namespace + '.Animal');
    const animalCheck = await animalRegistry.exists(creationRequest.geneticId.getIdentifier());
    const slaughterhouseRegistry = await getParticipantRegistry(namespace + '.Slaughterhouse');
    const slaughterhouseCheck = await slaughterhouseRegistry.exists(creationRequest.slaughterhouse.getIdentifier());
    if (!animalCheck) {
      throw new Error('This Animal does not exist!')
    } else if (!slaughterhouseCheck) {
      throw new Error('This Slaughterhouse Company does not exist!')
    } else {
    	// save the order
      const assetRegistry = await getAssetRegistry(creation.getFullyQualifiedType());
      await assetRegistry.add(creation);
      // emit the event
      const createProductEvent = factory.newEvent(namespace, 'createProductEvent');
      createProductEvent.geneticId = creation.geneticId;
      createProductEvent.productId = creation.productId;
      createProductEvent.productType = creation.productType;
      createProductEvent.productStatus = creation.productStatus;
      createProductEvent.location = creation.location;
      createProductEvent.weight = creation.weight;
      emit(createProductEvent);
    }
}

/**
 * Update a product in the ledger
 * @param {org.acme.beef_network.updateProduct} updateAnimal
 * @brief A transaction to update information of a given animal (based on geneticId)
 * @transaction
 */
async function updateProduct(request) {

    console.log('updateProduct');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';

    const productRegistry = await getAssetRegistry(namespace + '.Product');
    const idCheck = await productRegistry.exists(request.product.getIdentifier());

    if (!idCheck) {
        throw new Error('This product does not exist in the ledger!');
        return;
    }

    let product = await productRegistry.get(request.product.getIdentifier());

    if (request.transportedBy) {
        const transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
        const transportCheck = await transportRegistry.exists(request.transportedBy.getIdentifier());
        if (transportCheck) {
            product.transportedBy = await transportRegistry.get(request.transportedBy.getIdentifier());
        } else {
            throw new Error('This Transportation company does not exist!');
            return;
        }
    }

    if (request.retailSeller) {
        const retailRegistry = await getParticipantRegistry(namespace + '.Retail');
        const retailCheck = await retailRegistry.exists(request.retailSeller.getIdentifier());
        if (retailCheck) {
            product.retailSeller = await retailRegistry.get(request.retailSeller.getIdentifier());
        } else {
            throw new Error('This Retail company does not exist!');
            return;
        }
    }

    if (request.processingIndustry) {
        const procIndRegistry = await getParticipantRegistry(namespace + '.ProcessingIndustry');
        const procIndCheck = await procIndRegistry.exists(request.processingIndustry.getIdentifier());
        if (procIndCheck) {
            product.processingCompany = await procIndRegistry.get(request.processingIndustry.getIdentifier());
        } else {
            throw new Error('This Processing Industry does not exist!');
            return;
        }
    }

    if (request.productStatus)
        product.productStatus = request.productStatus;

    if (request.subType)
        product.subType = request.subType;

    if (request.weight)
        if (product.weight)
            product.weight = product.weight + ' | ' + request.weight;
        else
            product.weight = request.weight;

    if (request.location) {
        if (product.location)
            product.location = product.location + ' | ' + request.location;
        else
            product.location = request.location;
    }

    if (request.price) {
        if (product.price)
            product.price = product.price + ' | ' + request.price;
        else
            product.price = request.price;
    }

    if (request.productIssues) {
        if (product.productIssues)
            product.productIssues = product.productIssues + ' | ' + request.productIssues;
        else
            product.productIssues = request.productIssues;
    }

    await productRegistry.update(product);
}
