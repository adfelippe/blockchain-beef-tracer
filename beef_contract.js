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
  // Check if farmer exists in the ledger
  creation.owner = factory.newRelationship(namespace, 'Farmer', creationRequest.owner.getIdentifier());
  if (!creation.owner) {
    throw new Error('Farmer does not exist!');
  }

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
