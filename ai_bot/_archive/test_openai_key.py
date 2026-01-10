#!/usr/bin/env python3
import os
os.environ['OPENAI_API_KEY'] = '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'

from openai import OpenAI

client = OpenAI(
    api_key=os.environ['OPENAI_API_KEY'],
    base_url="https://api.openai.com/v1"  # Direct OpenAI
)

try:
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[{"role": "user", "content": "Say OK"}],
        max_tokens=10
    )
    print(f"✅ OpenAI API Key çalışıyor!")
    print(f"Model: {response.model}")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ OpenAI API Key hatası: {e}")
