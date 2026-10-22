import type {
  ChatCompletion,
  ChatCompletionContentPart,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionUserMessageParam,
  CompletionUsage,
  Decision,
  DecisionCreateParams,
} from 'openai/resources'
import type { DecisionPonyData } from '../decision'
import { DECISION_RESPONSE_SCHEMA, DECISION_SYSTEM_PROMPT, getAnswers } from '../decision'

function toOpenAICompletionMessages(input: DecisionCreateParams['input']): ChatCompletionUserMessageParam[] {
  if (typeof input === 'string') {
    return [{ role: 'user', content: input }]
  }
  return input.map<ChatCompletionUserMessageParam>(message => ({
    role: 'user',
    content: typeof message.content === 'string'
      ? message.content
      : message.content.map<ChatCompletionContentPart>(part => {
        return part.type === 'input_text'
          ? {
            type: 'text',
            text: part.text,
          }
          : {
            type: 'image_url',
            image_url: {
              url: part.image_url,
            },
          }
      }),
  }))
}

export function toOpenAICompletionsRequest(
  request: DecisionCreateParams,
): ChatCompletionCreateParamsNonStreaming {
  return {
    model: request.model,
    messages: [
      { role: 'developer', content: DECISION_SYSTEM_PROMPT },
      ...toOpenAICompletionMessages(request.input),
      { role: 'user', content: JSON.stringify(request.questions) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'decision',
        schema: DECISION_RESPONSE_SCHEMA,
        strict: true,
      },
    },
    safety_identifier: request.safety_identifier,
    reasoning_effort: 'none',
    stream: false,
  }
}

function fromOpenAICompletionsUsage(usage: CompletionUsage): Decision['usage'] {
  return {
    input_tokens: usage.prompt_tokens,
    input_tokens_details: {
      cached_tokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
      cache_write_tokens: usage.prompt_tokens_details?.cache_write_tokens ?? 0,
    },
    output_tokens: usage.completion_tokens,
    output_tokens_details: {
      reasoning_tokens: usage.completion_tokens_details?.reasoning_tokens ?? 0,
    },
    total_tokens: usage.total_tokens,
  }
}

export function fromOpenAICompletionsResponse(
  response: ChatCompletion,
  request: DecisionCreateParams,
): Decision {
  const message = response.choices[0].message
  const usage = response.usage
  let answers: Decision['answers']
  if (message.refusal) {
    answers = request.questions.map<Decision.AnswerResourceRefusal>(question => ({
      name: question.name ?? null,
      type: 'refusal',
    }))
  } else {
    if (!message.content) {
      throw new TypeError('The message content must be a string')
    }
    const result = message.content
      ? JSON.parse(message.content) as DecisionPonyData
      : { answers: [] }
    answers = getAnswers(result, request)
  }
  return {
    model: response.model,
    answers,
    usage: usage ? fromOpenAICompletionsUsage(usage) : undefined as never,
  }
}
