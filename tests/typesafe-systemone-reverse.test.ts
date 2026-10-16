import type { Questions, SystemOneResult } from '@typesafe-ai/sdk'
import type { DecisionCreateParams } from 'openai/resources'
import { describe, expect, it } from 'vitest'
import {
  fromTypeSafeSystemOneResponse,
  toTypeSafeSystemOneRequest,
} from '../src/adapters/typesafe-systemone'
import {
  fromTypeSafeSystemOneRequest,
  toTypeSafeSystemOneResponse,
} from '../src/adapters/typesafe-systemone-reverse'

const decisionRequest = {
  model: 'system-one-v1',
  input: 'The package arrived with a cracked screen. I need a replacement.',
  questions: [
    {
      type: 'predicate',
      name: 'damaged',
      instructions: 'Does the customer report that the item is damaged?',
    },
    {
      type: 'choice',
      name: 'department',
      instructions: 'Which department should handle this request?',
      choices: [
        { value: 'billing', description: 'Payments and refunds' },
        { value: 'technical', description: 'Technical support' },
        { value: 'priority', description: 'Priority queue' },
      ],
    },
    {
      type: 'score',
      name: 'severity',
      instructions: 'How severe is the reported issue?',
      levels: [
        { label: 'low', description: 'No material impact' },
        { label: 'medium', description: 'Usable with limitations' },
        { label: 'high', description: 'Product cannot be used as intended' },
      ],
    },
  ],
} satisfies DecisionCreateParams

describe('TypeSafe System One reverse adapter', () => {

  it('round-trips protocol-representable request fields through System One', () => {
    const systemOneRequest = toTypeSafeSystemOneRequest(decisionRequest)
    const reverseRequest = fromTypeSafeSystemOneRequest(systemOneRequest)

    expect(reverseRequest.questions).toHaveLength(decisionRequest.questions.length)
    expect(reverseRequest).toMatchObject({
      model: decisionRequest.model,
      input: decisionRequest.input,
      questions: [
        decisionRequest.questions[0],
        decisionRequest.questions[1],
        {
          name: 'severity',
          type: 'score',
          instructions: 'How severe is the reported issue?',
          levels: [
            { description: 'No material impact' },
            { description: 'Usable with limitations' },
            { description: 'Product cannot be used as intended' },
          ],
        },
      ],
    })
  })

  it('round-trips a response through Decisions by question name', () => {
    const systemOneRequest = toTypeSafeSystemOneRequest(decisionRequest)
    const systemOneResponse = {
      model: 'system-one-v1',
      answers: {
        damaged: {
          type: 'noul',
          noul: 0.9,
        },
        department: {
          type: 'choice',
          choice: 'technical',
          confidence: 0.8,
          probabilities: {
            billing: 0.1,
            technical: 0.7,
            priority: 0.2,
          },
        },
        severity: {
          type: 'score',
          score: 1.5,
          confidence: 0.75,
          legend: {
            0: 'No material impact',
            1: 'Usable with limitations',
            2: 'Product cannot be used as intended',
          },
          probabilities: {
            0: 0.1,
            1: 0.3,
            2: 0.6,
          },
        },
      },
      usage: {
        input_tokens: 24,
        output_tokens: 12,
      },
    } as unknown as SystemOneResult<Questions>
    const decisionResponse = fromTypeSafeSystemOneResponse(
      systemOneResponse,
      decisionRequest,
    )
    const namedDecisionResponse = {
      ...decisionResponse,
      answers: [...decisionResponse.answers].reverse(),
    }

    expect(toTypeSafeSystemOneResponse(
      namedDecisionResponse,
      systemOneRequest,
    )).toEqual(systemOneResponse)
  })
})
