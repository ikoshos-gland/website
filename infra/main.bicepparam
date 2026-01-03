using './main.bicep'

// Development environment parameters
// NOT: Azure OpenAI Italy North'ta ama Function App West Europe'ta olacak
param location = 'westeurope'
param environment = 'dev'
param searchSku = 'basic'
