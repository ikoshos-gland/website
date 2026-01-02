// Azure RAG Infrastructure - Secured
// Includes: AI Search, Function App with security settings, Key Vault
// WAF protection via Azure Front Door (optional add-on)

@description('Location for all resources')
param location string = 'westeurope'

@description('Unique suffix for resource names')
param uniqueSuffix string = uniqueString(resourceGroup().id)

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure AI Search SKU')
@allowed(['free', 'basic', 'standard'])
param searchSku string = 'basic'

@description('Your Static Web App URL for CORS')
param staticWebAppUrl string = 'https://proud-grass-02ea7a610.azurestaticapps.net'

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING AZURE OPENAI (already deployed)
// ═══════════════════════════════════════════════════════════════════════════
@description('Existing Azure OpenAI endpoint')
param existingOpenAiEndpoint string = 'https://defaultresourcegroup-itn-resource-1727.cognitiveservices.azure.com/'

@description('Existing Azure OpenAI API Key')
@secure()
param existingOpenAiKey string

@description('Chat model deployment name')
param chatDeployment string = 'gpt-4o'

@description('Embedding model deployment name')
param embeddingDeployment string = 'text-embedding-3-large'

// Optional API secret for request signing
@description('API secret key for HMAC signing (optional)')
@secure()
param apiSecretKey string = ''

// Resource names
var searchName = 'search-rag-${environment}-${take(uniqueSuffix, 8)}'
var functionAppName = 'func-rag-${environment}-${uniqueSuffix}'
var storageAccountName = take('strag${environment}${uniqueSuffix}', 24)
var appServicePlanName = 'asp-rag-${environment}-${uniqueSuffix}'
var appInsightsName = 'ai-rag-${environment}-${uniqueSuffix}'
var keyVaultName = take('kv-rag-${environment}-${take(uniqueSuffix, 8)}', 24)

// ═══════════════════════════════════════════════════════════════════════════
// AZURE AI SEARCH
// ═══════════════════════════════════════════════════════════════════════════
resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchName
  location: location
  sku: {
    name: searchSku
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'enabled'
    semanticSearch: searchSku == 'free' ? 'disabled' : 'standard'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE ACCOUNT (Secured)
// ═══════════════════════════════════════════════════════════════════════════
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// APPLICATION INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 30
    DisableIpMasking: false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KEY VAULT (Secured)
// ═══════════════════════════════════════════════════════════════════════════
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource openAiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-openai-key'
  properties: {
    value: existingOpenAiKey
  }
}

resource searchKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-search-key'
  properties: {
    value: searchService.listAdminKeys().primaryKey
  }
}

resource apiSecretKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(apiSecretKey)) {
  parent: keyVault
  name: 'api-secret-key'
  properties: {
    value: apiSecretKey
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// APP SERVICE PLAN
// ═══════════════════════════════════════════════════════════════════════════
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AZURE FUNCTION APP (Secured)
// ═══════════════════════════════════════════════════════════════════════════
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      pythonVersion: '3.11'
      linuxFxVersion: 'Python|3.11'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      cors: {
        allowedOrigins: [
          staticWebAppUrl
          'http://localhost:3000'
          'http://localhost:5173'
          'https://mertoshi.online'
          'https://www.mertoshi.online'
        ]
        supportCredentials: false
      }
      ipSecurityRestrictions: [
        {
          ipAddress: 'Any'
          action: 'Allow'
          priority: 100
          name: 'Allow all (use Front Door for WAF)'
          description: 'Default allow - protect with rate limiting in code'
        }
      ]
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        // Azure OpenAI (from Key Vault)
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: existingOpenAiEndpoint
        }
        {
          name: 'AZURE_OPENAI_API_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-openai-key)'
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT'
          value: chatDeployment
        }
        {
          name: 'AZURE_EMBEDDING_DEPLOYMENT'
          value: embeddingDeployment
        }
        {
          name: 'AZURE_OPENAI_API_VERSION'
          value: '2024-12-01-preview'
        }
        // Azure AI Search (from Key Vault)
        {
          name: 'AZURE_SEARCH_ENDPOINT'
          value: 'https://${searchService.name}.search.windows.net'
        }
        {
          name: 'AZURE_SEARCH_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-search-key)'
        }
        {
          name: 'AZURE_SEARCH_INDEX'
          value: 'documents-index'
        }
        // Security settings
        {
          name: 'ALLOWED_ORIGINS'
          value: '${staticWebAppUrl},http://localhost:3000,http://localhost:5173,https://mertoshi.online,https://www.mertoshi.online'
        }
        {
          name: 'RATE_LIMIT_WINDOW'
          value: '60'
        }
        {
          name: 'RATE_LIMIT_MAX_REQUESTS'
          value: '20'
        }
        {
          name: 'RATE_LIMIT_CHAT_MAX'
          value: '10'
        }
        {
          name: 'API_SECRET_KEY'
          value: !empty(apiSecretKey) ? '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=api-secret-key)' : ''
        }
      ]
    }
  }
}

// Key Vault access for Function App
resource keyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, functionApp.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUTS
// ═══════════════════════════════════════════════════════════════════════════
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppName string = functionApp.name
output searchEndpoint string = 'https://${searchService.name}.search.windows.net'
output searchIndexName string = 'documents-index'
output keyVaultName string = keyVault.name
output appInsightsName string = appInsights.name

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY NOTES
// ═══════════════════════════════════════════════════════════════════════════
//
// This deployment includes:
// 1. TLS 1.2 minimum on all services
// 2. HTTPS only on Function App
// 3. FTPS disabled
// 4. Key Vault for all secrets with RBAC
// 5. CORS restricted to your domains
// 6. Application-level rate limiting
// 7. Request validation and sanitization
//
// For additional WAF protection, consider adding Azure Front Door:
// - DDoS protection
// - Bot protection
// - Custom WAF rules
// - Geographic filtering
//
// To add Front Door, see: infra/frontdoor.bicep (create separately)
