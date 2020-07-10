#!/usr/bin/python3.6

# Usage: createAnimals.py [NumberOfAnimalsToCreate] [StartGeneticId]
# Example: createAnimals.py 10 1

import sys
import os

def runSubmitTransactionCommand(command):
    stream = os.popen(command)
    output = stream.read()
    print(output)

if (len(sys.argv) != 3):
    print('You must enter two arguments')
    print('Usage: createAnimals.py [NumberOfAnimalsToCreate] [StartGeneticId]')
    print('Example: createAnimals.py 10 1')
    exit(-1)


NumberOfAnimalsToCreate = int(sys.argv[1])

submit_command = 'composer transaction submit --card admin@beef-tracer --data '
function = '\'{\"$class\":\"org.acme.beef_network.createAnimal\", '
geneticId_field = '\"geneticId\":'
geneticId_value =  sys.argv[2]
geneticId = geneticId_field + '\"' + geneticId_value + '\", '
owner = '\"owner\":\"resource:org.acme.beef_network.Farmer#Fazendeiro_1\", '
breed = '\"breed\":\"Nelore\", '
location = '\"location\":\"Santa Helena de Goias/GO\", '
weight = '\"weight\":\"106.51 Kg\"}\''

for i in range(NumberOfAnimalsToCreate):
    geneticId = geneticId_field + '\"' + geneticId_value + '\", '
    command = submit_command + function + geneticId + owner + breed + location + weight
    print('Running transaction {}...'.format(i + 1))
    runSubmitTransactionCommand(command)
    geneticId_Integer = int(geneticId_value)
    geneticId_Integer += 1
    geneticId_value = str(geneticId_Integer)
