# Azure RAG Infrastructure

This directory contains Bicep templates for deploying a secure RAG (Retrieval-Augmented Generation) architecture on Azure.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Azure Function  │────▶│  Azure OpenAI   │
│ (Static Web App)│     │   (Python v2)    │     │   + On Your Data│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               │                         ▼
                               │                 ┌─────────────────┐
                               └────────────────▶│ Azure AI Search │
                                                 └─────────────────┘
```

## Resources Deployed

| Resource | Purpose |
|----------|---------|
| Azure OpenAI | LLM service with GPT-4o and embedding models |
| Azure AI Search | Vector search for document retrieval |
| Azure Function App | Secure proxy API (Python 3.11) |
| Azure Key Vault | Secure storage for API keys |
| Application Insights | Monitoring and logging |
| Storage Account | Function App state storage |

## Prerequisites

1. Azure CLI installed and logged in
2. Bicep CLI installed (or use Azure CLI's built-in Bicep)
3. Contributor access to an Azure subscription
4. Azure OpenAI access approved for your subscription

## Deployment

### 1. Create Resource Group

```bash
az group create \
  --name rg-rag-dev \
  --location eastus
```

### 2. Deploy Infrastructure

```bash
# Deploy with default parameters
az deployment group create \
  --resource-group rg-rag-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam

# Or with custom parameters
az deployment group create \
  --resource-group rg-rag-dev \
  --template-file infra/main.bicep \
  --parameters environment=prod searchSku=standard
```

### 3. Get Deployment Outputs

```bash
az deployment group show \
  --resource-group rg-rag-dev \
  --name main \
  --query properties.outputs
```

## Post-Deployment Steps

### 1. Deploy the Azure Function Code

```bash
cd api
func azure functionapp publish <functionAppName>
```

### 2. Create Search Index

Upload your documents and create an index in Azure AI Search. The default index name is `documents-index`.

### 3. Update React App

Update your React app to call the Azure Function endpoint instead of calling Azure OpenAI directly.

## Security Features

- **Managed Identity**: Function App uses system-assigned managed identity
- **Key Vault Integration**: API keys stored securely, accessed via Key Vault references
- **CORS**: Configured for your Static Web App domain
- **HTTPS Only**: All traffic encrypted in transit
- **Network Security**: Can be enhanced with VNet integration (not included in base template)

## Cost Estimation (Monthly)

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| Azure OpenAI | S0 | Pay per token (~$10-50) |
| Azure AI Search | Basic | ~$75 |
| Azure Functions | Consumption | ~$0-5 |
| Key Vault | Standard | ~$1 |
| Application Insights | Pay-as-you-go | ~$2-5 |

**Total Estimated**: ~$90-140/month for development workloads

## Troubleshooting

### Function App Can't Access Key Vault

Wait 5-10 minutes after deployment for RBAC propagation. If still failing:

```bash
# Verify role assignment
az role assignment list --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>
```

### OpenAI Model Not Available

Check regional availability at [Azure OpenAI Service Models](https://learn.microsoft.com/azure/ai-services/openai/concepts/models). GPT-4o is available in: East US, East US 2, North Central US, South Central US, Sweden Central, West US, West US 3.
