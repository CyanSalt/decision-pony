import type {
  ContentBlockParam,
  Message,
  MessageCreateParamsNonStreaming,
  MessageParam,
  Usage,
} from '@anthropic-ai/sdk/resources'
import type { Decision, DecisionCreateParams } from 'openai/resources'
import type { DecisionPonyData } from '../decision'
import { DECISION_RESPONSE_SCHEMA, DECISION_SYSTEM_PROMPT, getAnswers } from '../decision'

function toAnthropicMessages(input: DecisionCreateParams['input']): MessageParam[] {
  if (typeof input === 'string') {
    return [{ role: 'user', content: input }]
  }
  return input.map<MessageParam>(message => ({
    role: 'user',
    content: typeof message.content === 'string'
      ? message.content
      : message.content.map<ContentBlockParam>(part => {
        return part.type === 'input_text'
          ? {
            text: part.text,
            type: 'text',
          }
          : {
            source: {
              type: 'url',
              url: part.image_url,
            },
            type: 'image',
          }
      }),
  }))
}

export function toAnthropicMessagesRequest(
  request: DecisionCreateParams,
): MessageCreateParamsNonStreaming {
  return {
    max_tokens: 8_192,
    messages: [
      ...toAnthropicMessages(request.input),
      { role: 'user', content: JSON.stringify(request.questions) },
    ],
    metadata: request.safety_identifier === undefined
      ? undefined
      : { user_id: request.safety_identifier },
    model: request.model,
    output_config: {
      format: {
        schema: DECISION_RESPONSE_SCHEMA,
        type: 'json_schema',
      },
    },
    stream: false,
    system: DECISION_SYSTEM_PROMPT,
  }
}

function fromAnthropicMessagesUsage(usage: Usage): Decision['usage'] {
  const cachedTokens = usage.cache_read_input_tokens ?? 0
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0
  const inputTokens = usage.input_tokens + cacheWriteTokens + cachedTokens
  return {
    input_tokens: inputTokens,
    input_tokens_details: {
      cached_tokens: cachedTokens,
      cache_write_tokens: cacheWriteTokens,
    },
    output_tokens: usage.output_tokens,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: inputTokens + usage.output_tokens,
  }
}

export function fromAnthropicMessagesResponse(
  response: Message,
  request: DecisionCreateParams,
): Decision {
  const text = response.content.find(block => block.type === 'text')
  if (!text) {
    throw new TypeError('The response must contain a text block')
  }
  const result = JSON.parse(text.text) as DecisionPonyData
  const answers = getAnswers(result, request)
  return {
    model: response.model,
    answers,
    usage: fromAnthropicMessagesUsage(response.usage),
  }
}
