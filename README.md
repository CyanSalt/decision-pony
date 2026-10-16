# decision-pony

[![npm](https://img.shields.io/npm/v/decision-pony.svg)](https://www.npmjs.com/package/decision-pony) [![AI-DECLARATION: copilot](https://img.shields.io/badge/䷼%20AI--DECLARATION-copilot-fee2e2?labelColor=fee2e2)](https://ai-declaration.md)

`decision-pony` converts [OpenAI Decisions API](https://developers.openai.com/api/docs/guides/decisions) requests to OpenAI Chat Completions, OpenAI Responses, Anthropic Messages, or TypeSafe System One requests, then converts their responses back.

## Installation

```shell
pnpm add decision-pony
```

## Usage

<details>
<summary>With OpenAI Chat Completions API</summary><br>

```typescript
import {
  fromOpenAICompletionsResponse,
  toOpenAICompletionsRequest,
} from 'decision-pony'
import type OpenAI from 'openai'
import type { Decision, DecisionCreateParams } from 'openai/resources'

// Polyfill for `client.decisions.create` on OpenAI-compatible endpoints without
// Decisions API support or with non-System-One models.
async function createDecisions(client: OpenAI, body: DecisionCreateParams): Promise<Decision> {
  const request = toOpenAICompletionsRequest(body)
  return fromOpenAICompletionsResponse(
    await client.chat.completions.create(request),
    body,
  )
}
```

<br></details>

<details>
<summary>With OpenAI Responses API</summary><br>

```typescript
import {
  fromOpenAIResponsesResponse,
  toOpenAIResponsesRequest,
} from 'decision-pony'
import type OpenAI from 'openai'
import type { Decision, DecisionCreateParams } from 'openai/resources'

// Polyfill for `client.decisions.create` on OpenAI-compatible endpoints without
// Decisions API support or with non-System-One models.
async function createDecisions(client: OpenAI, body: DecisionCreateParams): Promise<Decision> {
  const request = toOpenAIResponsesRequest(body)
  return fromOpenAIResponsesResponse(
    await client.responses.create(request),
    body,
  )
}
```

<br></details>

<details>
<summary>With Anthropic Messages API</summary><br>

```typescript
import type Anthropic from '@anthropic-ai/sdk'
import {
  fromAnthropicMessagesResponse,
  toAnthropicMessagesRequest,
} from 'decision-pony'
import type { Decision, DecisionCreateParams } from 'openai/resources'

// Polyfill for `client.decisions.create` with the Anthropic Messages API.
async function createDecisions(client: Anthropic, body: DecisionCreateParams): Promise<Decision> {
  const request = toAnthropicMessagesRequest(body)
  return fromAnthropicMessagesResponse(
    await client.messages.create(request),
    body,
  )
}
```

<br></details>

<details>
<summary>With TypeSafe System One</summary><br>

```typescript
import type { TypeSafeClient } from '@typesafe-ai/sdk'
import {
  fromTypeSafeSystemOneResponse,
  toTypeSafeSystemOneRequest,
} from 'decision-pony'
import type { Decision, DecisionCreateParams } from 'openai/resources'

// Polyfill for `client.decisions.create` with TypeSafe System One.
// System One accepts text input only.
async function createDecisions(
  client: TypeSafeClient,
  body: DecisionCreateParams,
): Promise<Decision> {
  const request = toTypeSafeSystemOneRequest(body)
  return fromTypeSafeSystemOneResponse(
    await client.systemOne(request),
    body,
  )
}
```

<br></details>

## Limitations

OpenAI Decisions API is designed for System One models. `decision-pony` simulates it through an LLM's text-generation capability, so the two approaches are not equivalent. `decision-pony` may use more tokens, take longer, and generally produce less accurate decisions than the native Decisions API.
