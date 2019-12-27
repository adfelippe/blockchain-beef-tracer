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

/* global getFactory getAssetRegistry getParticipantRegistry emit */

// FARMER FUNCTIONS
/**
 * Create a new animal as an asset
 * @param {org.acme.beef_network.createAnimal} createAnimal - the createAnimal transaction
 * @transaction
 */

async function createAnimal(creationRequest) {

  console.log('creationRequest');
  const factory = getFactory();
  const namespace = 'org.acme.beef_network';

  const create = factory.newResource(namespace, 'Animal', creationRequest.geneticId);
  create.owner = factory.newRelationship(namespace, 'Farmer', creationRequest.owner.getIdentifier());
  create.animalId = creationRequest.animalId;
  create.lifeStage = 'BREEDING';
  create.breed = creationRequest.breed;
  create.location = creationRequest.location;
  create.weight = creationRequest.weight;

  // save the order
  const assetRegistry = await getAssetRegistry(create.getFullyQualifiedType());
  await assetRegistry.add(create);

  // emit the event
  const createAnimalEvent = factory.newEvent(namespace, 'createAnimalEvent');
  createAnimal.geneticId = create.geneticId;
  createAnimal.owner = create.owner;
  createAnimal.animalId = create.animalId;
  createAnimal.location = create.location;
  createAnimal.weight = create.weight;
  emit(createAnimal);
}
