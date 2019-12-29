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
    createAnimalEvent.animalId = creation.animalId;
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

  // Get animal registry and perform proper checks
  const animalRegistry = await getAssetRegistry(namespace + '.Animal');
  const idCheck = await animalRegistry.exists(updateAnimalRequest.geneticId.getIdentifier());
  const animal = await animalRegistry.get(updateAnimalRequest.geneticId.getIdentifier());
  // Get Farmer registry and perform proper checks
  const participantRegistry = await getParticipantRegistry(namespace + '.Farmer');
  const ownerCheck = await participantRegistry.exists(updateAnimalRequest.owner.getIdentifier());
  animal.owner = await participantRegistry.get(updateAnimalRequest.owner.getIdentifier());

  if (!idCheck) {
    throw new Error("This Animal's genetic ID does not exist!")
  } else {
    // Check existence of owner
    if (!ownerCheck) {
    throw new Error('This Farmer does not exist!')
    } else {
      // Update animal in the ledger
      animal.lifeStage = updateAnimalRequest.lifeStage;
      animal.weight = updateAnimalRequest.weight;
      animal.location = updateAnimalRequest.location;
      animal.vaccines = updateAnimalRequest.vaccines;
      animal.diseases = updateAnimalRequest.diseases;
      animal.slaughterDate = updateAnimalRequest.slaughterDate;
      await animalRegistry.update(animal);
    }
    // Emit the event
    //const updateAnimalEvent = factory.newEvent(namespace, 'updateAnimalEvent');
  }
}
