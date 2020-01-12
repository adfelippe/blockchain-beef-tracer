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
      if (!animal.slaughterDate) {
          animal.slaughterDate = updateAnimalRequest.slaughterDate;
      } else if (animal.slaughterDate && updateAnimalRequest.slaughterDate) {
          animal.slaughterDate = animal.slaughterDate + ' | ' + updateAnimalRequest.slaughterDate;
      }
      // Optional Transportation data
      if (updateAnimalRequest.transportedBy) {
          animal.transportedBy = await transportRegistry.get(updateAnimalRequest.transportedBy.getIdentifier());
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
    creation.geneticId = factory.newRelationship(namespace, 'Animal', creationRequest.geneticId.getIdentifier());
    creation.productType = creationRequest.productType;
    creation.productStatus = creationRequest.productStatus;
    creation.location = creationRequest.location;
    creation.weight = creationRequest.weight;

    // Check if animal exists based on the geneticID
    // (Products can only be created if their source animal exists in the ledger)
    const animalRegistry = await getParticipantRegistry(namespace + '.Animal');
    const animalCheck = await participantRegistry.exists(creationRequest.geneticId.getIdentifier());
    if (!animalCheck) {
      throw new Error('This Animal does not exist!')
    } else {
    	// save the order
      const assetRegistry = await getAssetRegistry(creation.getFullyQualifiedType());
      await assetRegistry.add(creation);
      // emit the event
      const createProductEvent = factory.newEvent(namespace, 'createProductEvent');
      createProductEvent.productId = creationRequest.productId;
      createProductEvent.productType = creationRequest.productType;
      createProductEvent.productStatus = creationRequest.productStatus;
      createProductEvent.location = creationRequest.location;
      createProductEvent.weight = creationRequest.weight;
      emit(createProductEvent);
    }
}
