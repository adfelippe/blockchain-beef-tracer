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

async function createAnimal(request) {

  console.log('createAnimal');
  const factory = getFactory();
  const namespace = 'org.acme.beef_network';

  const creation = factory.newResource(namespace, 'Animal', request.geneticId);
  creation.animalId = request.animalId;
  creation.lifeStage = 'BREEDING';
  creation.breed = request.breed;
  creation.location = request.location;
  creation.weight = request.weight;
  creation.owner = factory.newRelationship(namespace, 'Farmer', request.owner.getIdentifier());

  // Check if owner exists
  const participantRegistry = await getParticipantRegistry(namespace + '.Farmer');
  const ownerCheck = await participantRegistry.exists(request.owner.getIdentifier());
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
 * Update a Animal in the ledger
 * @param {org.acme.beef_network.updateAnimal} updateAnimal
 * @brief A transaction to update data in the ledger of a given product
 * @transaction
 */
async function updateAnimal(request) {

    console.log('updateAnimal');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';

    // This is a mandatory field
    const animalRegistry = await getAssetRegistry(namespace + '.Animal');
    const idCheck = await animalRegistry.exists(request.geneticId.getIdentifier());

    if (!idCheck) {
        throw new Error("This Animal does not exist!");
        return;
    }

    let animal = await animalRegistry.get(request.geneticId.getIdentifier());

    // This is a mandatory field
    const participantRegistry = await getParticipantRegistry(namespace + '.Farmer');
    const ownerCheck = await participantRegistry.exists(request.owner.getIdentifier());
    if (ownerCheck) {
        animal.owner = await participantRegistry.get(request.owner.getIdentifier());
    } else {
        throw new Error("This Farmer does not exist!");
        return;
    }

    if (request.transportedBy) {
        transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
        transportCheck = await transportRegistry.exists(request.transportedBy.getIdentifier());
        // Throw error and leave if transportation is to be updated but company doesn't exist
        if (!transportCheck) {
            throw new Error("This Transportation company does not exist!");
            return;
        } else {
            animal.transportedBy = await transportRegistry.get(request.transportedBy.getIdentifier());
        }
    }

    // Get Slaughterhouse registry and perform proper checks
    if (request.slaughterhouse) {
        slaughterhouseRegistry = await getParticipantRegistry(namespace + '.Slaughterhouse');
        slaughterhouseCheck = await slaughterhouseRegistry.exists(request.slaughterhouse.getIdentifier());
        // Throw error and leave if transportation is to be updated but company doesn't exist
        if (!slaughterhouseCheck) {
            throw new Error("This Slaughterhouse company does not exist!")
            return;
        } else {
            animal.slaughterhouse = await slaughterhouseRegistry.get(request.slaughterhouse.getIdentifier());
        }
    }

    // Always mandatory
    animal.lifeStage = request.lifeStage;

    // Mandatory at creation only
    if (request.weight)
        animal.weight = animal.weight + ' | ' + request.weight;

    if (request.location)
        animal.location = animal.location + ' | ' + request.location;

    // Always optional
    if (request.animalId && animal.animalId)
        animal.animalId = animal.animalId + ' | ' + request.animalId;
    else if (request.animalId)
        animal.animalId = request.animalId;

    if (request.vaccines && animal.vaccines)
        animal.vaccines = animal.vaccines + ' | ' + request.vaccines;
    else if (request.vaccines)
        animal.vaccines = request.vaccines;

    if (request.diseases && animal.diseases)
        animal.diseases = animal.diseases + ' | ' + request.diseases;
    else if (request.diseases)
    animal.diseases = request.diseases;

    if (request.slaughterDate)
        animal.slaughterDate = request.slaughterDate;

    await animalRegistry.update(animal);
}

/**
 * Create a new product as an asset
 * This new product inherits information from its originary animal
 * @param {org.acme.beef_network.createProduct} createProduct - the createProduct transaction
 * @transaction
 */

async function createProduct(request) {

    console.log('createAnimal');
    const factory = getFactory();
    const namespace = 'org.acme.beef_network';

    const creation = factory.newResource(namespace, 'Product', request.productId);
    // Mandatory fields inherited from relationships
    creation.geneticId = factory.newRelationship(namespace, 'Animal', request.geneticId.getIdentifier());
    creation.slaughterhouse = factory.newRelationship(namespace, 'Slaughterhouse', request.slaughterhouse.getIdentifier());

    // Check if animal exists based on their ID
    // (Products can only be created if their source animal exists in the ledger)
    const animalRegistry = await getAssetRegistry(namespace + '.Animal');
    const animalCheck = await animalRegistry.exists(request.geneticId.getIdentifier());

    if (!animalCheck) {
      throw new Error('This Animal does not exist!');
      return;
    }

    // Create only if set - it's optional
    if (request.processingIndustry) {
        const procIndRegistry = await getParticipantRegistry(namespace + '.ProcessingIndustry');
        const procIndCheck = await procIndRegistry.exists(request.processingIndustry.getIdentifier());
        if (procIndCheck) {
            creation.processingCompany = await procIndRegistry.get(request.processingIndustry.getIdentifier());
        } else {
            throw new Error('This Processing Industry does not exist!');
            return;
        }
    }

    // Create only if set - it's optional
    if (request.retailSeller) {
        const retailRegistry = await getParticipantRegistry(namespace + '.Retail');
        const retailCheck = await retailRegistry.exists(request.retailSeller.getIdentifier());
        if (retailCheck) {
            creation.retailSeller = await retailRegistry.get(request.retailSeller.getIdentifier());
        } else {
            throw new Error('This Retail company does not exist!');
            return;
        }
    }

    // Mandatory fields
    creation.productId = request.productId;
    creation.productType = request.productType;
    creation.productStatus = request.productStatus;
    creation.weight = request.weight;
    creation.location = request.location;

    // Optional fields
    if (request.subType)
        creation.subType = request.subType

    if (request.price)
        creation.price = request.price

    if (request.productIssues)
        creation.productIssues = request.productIssues

    // Write transaction to the ledger
    const assetRegistry = await getAssetRegistry(creation.getFullyQualifiedType());
    await assetRegistry.add(creation);
}

/**
 * Update a product in the ledger
 * @param {org.acme.beef_network.updateProduct} updateProduct
 * @brief A transaction to update data in the ledger of a given product
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

    if (request.productType)
        product.productType = request.productType;

    if (request.subType)
        product.subType = request.subType;

    if (request.weight && product.weight)
        product.weight = product.weight + ' | ' + request.weight;
    else if (request.weight)
        product.weight = request.weight;

    if (request.location && product.location)
        product.location = product.location + ' | ' + request.location;
    else if (request.location)
        product.location = request.location;

    if (request.price && product.price)
        product.price = product.price + ' | ' + request.price;
    else if (request.price)
        product.price = request.price;

    if (request.productIssues && product.productIssues)
        product.productIssues = product.productIssues + ' | ' + request.productIssues;
    else if (request.productIssues)
        product.productIssues = request.productIssues;

    if (request.saleDate)
        product.saleDate = request.saleDate;

    await productRegistry.update(product);
}
