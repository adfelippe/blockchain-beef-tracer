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

async function updateAnimal(request) {

    console.log('updateAnimal');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';
    let animal;

    request.animal = request.animal.getIdentifier();

    const animalRegistry = await getAssetRegistry(namespace + '.Animal');
    const animalCheck = await animalRegistry.exists(request.animal);

    if (!animalCheck) {
        throw new Error('This Animal does not exist!')
        return
    } else {
        animal = await animalRegistry.get(request.animal);
    }

    if (request.owner) {
        request.owner = request.owner.getIdentifier();
        const farmerRegistry = await getParticipantRegistry(namespace + '.Farmer');
        const ownerCheck = await farmerRegistry.exists(request.owner);

        if (!ownerCheck) {
            throw new Error('This Farmer does not exist!');
            return;
        }

        animal.owner = await farmerRegistry.get(request.owner);
    }

    await animalRegistry.update(animal);
}

/**
 * Create a new product as an asset
 * This new product inherits information from its originary animal
 * @param {org.acme.beef_network.createProduct} createProduct - the createProduct transaction
 * @transaction
 */

async function createProduct(creationRequest) {

    console.log('createProduct');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';

    const creation = factory.newResource(namespace, 'Product', creationRequest.productId);
    creation.productId = creationRequest.productId;
    creation.productType = creationRequest.productType;
  	creation.subType = creationRequest.subType;
    creation.productStatus = creationRequest.productStatus;
    creation.location = creationRequest.location;
    creation.weight = creationRequest.weight;
  	creation.price = creationRequest.price;
  	creation.saleDate = creationRequest.saleDate;
  	creation.productIssues = creationRequest.productIssues;
    creation.geneticId = factory.newRelationship(namespace, 'Animal', creationRequest.geneticId.getIdentifier());
  	creation.slaughterhouse = factory.newRelationship(namespace, 'Slaughterhouse', creationRequest.slaughterhouse.getIdentifier());

  	// Optional
  	if (creationRequest.transportedBy)
      creation.transportedBy = factory.newRelationship(namespace, 'Transportation', creationRequest.transportedBy.getIdentifier());
  	if (creationRequest.retailSeller)
      creation.retailSeller = factory.newRelationship(namespace, 'Retail', creationRequest.retailSeller.getIdentifier());
   	if (creation.processingCompany)
      creation.processingCompany = factory.newRelationship(namespace, 'ProcessingIndustry', creationRequest.processingCompany.getIdentifier());

    // Check if exstent participants
    // (Products can only be created if their source animal exists in the ledger)
    const animalRegistry = await getAssetRegistry(namespace + '.Animal');
    const animalCheck = await animalRegistry.exists(creationRequest.geneticId.getIdentifier());

    const slaughterhouseRegistry = await getParticipantRegistry(namespace + '.Slaughterhouse');
    const slaughterhouseCheck = await slaughterhouseRegistry.exists(creationRequest.slaughterhouse.getIdentifier());

  	const procIndustryRegistry = await getParticipantRegistry(namespace + '.ProcessingIndustry');
    const procIndustryCheck = await procIndustryRegistry.exists(creationRequest.processingCompany.getIdentifier());

  	const retailRegistry = await getParticipantRegistry(namespace + '.Retail');
    const retailCheck = await retailRegistry.exists(creationRequest.retailSeller.getIdentifier());

  	const transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
    const transportCheck = await transportRegistry.exists(creationRequest.transportedBy.getIdentifier());

    if (!animalCheck) {
      throw new Error('This Animal does not exist!')
      return
    }

  	if (!slaughterhouseCheck) {
      throw new Error('This Slaughterhouse Company does not exist!')
      return
    }

  	if (!procIndustryCheck) {
      throw new Error('This Processing Industry does not exist!')
      return
    }

	if (!retailCheck) {
      throw new Error('This Retail Seller does not exist!')
      return
    }

  	if (!transportCheck) {
      throw new Error('This Transportation Company does not exist!')
      return
    }

	// save the order
    const assetRegistry = await getAssetRegistry(creation.getFullyQualifiedType());
    await assetRegistry.add(creation);
}

/**
 * Update an existing product
 * @param {org.acme.beef_network.updateAnimal} updateAnimal
 * @brief A transaction to update information of a given animal (based on geneticId)
 * @transaction
 */

async function updateProduct(updateProductRequest) {

  	console.log('updateProduct');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';

    // Get product registry and perform proper checks
  	const productRegistry = await getAssetRegistry(namespace + '.Product');
  	const idCheck = await productRegistry.exists(updateProductRequest.productId.getIdentifier());

   	// Get retail seller registry and perform proper checks
  	const retailSellerRegistry = await getParticipantRegistry(namespace + '.Retail');
  	const retailCheck = await retailSellerRegistry.exists(updateProductRequest.retailSeller.getIdentifier());

  	// Get transportation registry and perform proper checks
  	const transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
    const transportCheck = await transportRegistry.exists(updateProductRequest.transportedBy.getIdentifier());

  	if (!idCheck) {
    	throw new Error("This Product's ID does not exist!")
      	return;
  	}

  	if (!transportCheck) {
      throw new Error('This Transportation Company does not exist!')
      return
    }

  	if (!retailCheck) {
      throw new Error('This Retail Company does not exist!')
      return
    }

  	// After checks are validm, get productId from the ledger
  	let product = await productRegistry.get(updateProductRequest.productId.getIdentifier());

  	if (updateProductRequest.retailSeller)
  		product.retailSeller = await retailSellerRegistry.get(updateProductRequest.retailSeller.getIdentifier());

  	if (updateProductRequest.transportedBy)
          product.transportedBy = await transportRegistry.get(updateProductRequest.transportedBy.getIdentifier());

  	// Update ledger
    await productRegistry.update(product);
}
