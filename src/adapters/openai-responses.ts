import type { Decision, DecisionCreateParams, Responses } from 'openai/resources'
import type { DecisionPonyData } from '../decision'
import { DECISION_RESPONSE_SCHEMA, DECISION_SYSTEM_PROMPT, getAnswers } from '../decision'

function toOpenAIResponsesInput(input: DecisionCreateParams['input']): Responses.ResponseInput {
  if (typeof input === 'string') {
    return [{ role: 'user', content: input }]
  }
  return input.map<Responses.ResponseInputItem>(message => ({
    role: message.role,
    content: typeof message.content === 'string'
      ? message.content
      : message.content.map<Responses.ResponseInputContent>(part => {
        return part.type === 'input_text'
          ? part
          : {
            type: 'input_image',
            image_url: part.image_url,
            detail: part.detail ?? 'auto',
          }
      }),
  }))
}

export function toOpenAIResponsesRequest(
  request: DecisionCreateParams,
): Responses.ResponseCreateParamsNonStreaming {
  return {
    model: request.model,
    instructions: DECISION_SYSTEM_PROMPT,
    input: [
      ...toOpenAIResponsesInput(request.input),
      { role: 'user', content: JSON.stringify(request.questions) },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'decision',
        schema: DECISION_RESPONSE_SCHEMA,
        strict: true,
      },
    },
    safety_identifier: request.safety_identifier,
    stream: false,
  }
}

function fromOpenAIResponsesUsage(usage: Responses.ResponseUsage): Decision['usage'] {
  // `Responses.ResponseUsage` is already assignable to `Decision['usage']`
  return usage
}

export function fromOpenAIResponsesResponse(
  response: Responses.Response,
  request: DecisionCreateParams,
): Decision {
  const message = response.output.find((item): item is Responses.ResponseOutputMessage => {
    return item.type === 'message' && item.status === 'completed'
  })
  if (!message) {
    throw new TypeError('The response must contain a completed output message')
  }
  let answers: Decision['answers']
  if (message.content.some(part => part.type === 'refusal')) {
    answers = request.questions.map<Decision.AnswerResourceRefusal>(question => ({
      name: question.name ?? null,
      type: 'refusal',
    }))
  } else {
    const outputPart = message.content.find(part => part.type === 'output_text')
    if (!outputPart) {
      throw new TypeError('The completed output message must contain text')
    }
    const result = JSON.parse(outputPart.text) as DecisionPonyData
    answers = getAnswers(result, request)
  }
  return {
    model: response.model,
    answers,
    usage: response.usage ? fromOpenAIResponsesUsage(response.usage) : undefined as never,
  }
}
