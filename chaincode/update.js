/*
 * Project Beef Tracer for my Master's Dissertation
 * This is an auxiliary set of functions to verify and update data
 * in the transaction objects
 */



async function verifyAndUpdateTransportation(request, product) {

    const namespace = 'org.acme.beef_network';

    if (request.transportedBy) {
        const transportRegistry = await getParticipantRegistry(namespace + '.Transportation');
        const transportCheck = await transportRegistry.exists(request.transportedBy.getIdentifier());
        if (transportCheck) {
            product.transportedBy = await transportRegistry.get(request.transportedBy.getIdentifier());
        } else {
            throw new Error('This Transportation company does not exist!');
            return false;
        }
    }

    return true;
}
