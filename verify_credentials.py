import os
from openai import AzureOpenAI

# 1. Yeni Endpoint
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "https://vectorizervascularr.cognitiveservices.azure.com")

# 2. Yeni Deployment
deployment = "gpt-4o"

# 3. Yeni Key
api_key = os.getenv("AZURE_OPENAI_API_KEY")
api_version = "2024-12-01-preview"

print(f"Test ediliyor...\nEndpoint: {endpoint}\nDeployment: {deployment}\nKey Length: {len(api_key)}")

client = AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=api_key,
    api_version=api_version
)

try:
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "user", "content": "Hello GPT-4o"}
        ],
        max_tokens=50
    )
    print("\n✅ BAŞARILI! GPT-4o çalışıyor.")
    print("Cevap:", response.choices[0].message.content)
except Exception as e:
    print("\n❌ HATA OLUŞTU:")
    print(e)
