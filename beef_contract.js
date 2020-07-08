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

    // Get Animal registry from ledger (if any)
    const animalRegistry = await getAssetRegistry(namespace + '.Animal');
    const idCheck = await animalRegistry.exists(updateAnimalRequest.geneticId.getIdentifier());

    // Get Farmer registry from ledger (if any)
    const participantRegistry = await getParticipantRegistry(namespace + '.Farmer');
    const ownerCheck = await participantRegistry.exists(updateAnimalRequest.owner.getIdentifier());

    // Get Transportation Company registry from ledger (if any)
    /*const transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
    const transportCheck = await transportRegistry.exists(updateAnimalRequest.transportedBy.getIdentifier());

    const slaughterhouseRegistry = await getParticipantRegistry(namespace + '.Slaughterhouse');
    const slaughterhouseCheck = await slaughterhouseRegistry.exists(updateAnimalRequest.slaughterhouse.getIdentifier());*/

    // Throw error and leave if transportation is to be updated but company doesn't exist
    if (!idCheck) {
        throw new Error("This Animal does not exist!")
        return;
    }

    // Throw error and leave if transportation is to be updated but company doesn't exist
    if (!ownerCheck) {
        throw new Error("This Farmer does not exist!")
        return;
    }

    // Throw error and leave if transportation is to be updated but company doesn't exist
    /*if (!transportCheck) {
        throw new Error("This Transportation Company does not exist!")
        return;
    }

    // Throw error and leave if transportation is to be updated but company doesn't exist
    if (!slaughterhouseCheck) {
        throw new Error("This Slaughterhouse does not exist!")
        return;
    }*/

    // Get current Animal registry from the ledger
    let animal = await animalRegistry.get(updateAnimalRequest.geneticId.getIdentifier());

    // Get Farmer ID from ledger
    //animal.owner = await participantRegistry.get(updateAnimalRequest.owner.getIdentifier());

    // Update animal in the ledger
    // Optional and mandatory fields are checked againt themselves to be updated
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
    } else if (animal.location && updateAnimalRequest.location) {
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
    if (updateAnimalRequest.slaughterDate)
        animal.slaughterDate = updateAnimalRequest.slaughterDate;

    // Optional Transportation data
    /*if (updateAnimalRequest.transportedBy)
        animal.transportedBy = await transportRegistry.get(updateAnimalRequest.transportedBy.getIdentifier());

    // Optional Slaughterhouse data
    if (updateAnimalRequest.slaughterhouse)
        animal.slaughterhouse = await slaughterhouseRegistry.get(updateAnimalRequest.slaughterhouse.getIdentifier());*/

    // Update ledger
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

