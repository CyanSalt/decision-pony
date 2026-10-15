import OpenAI from 'openai'
import type { DecisionCreateParams } from 'openai/resources'
import { describe, expect, it } from 'vitest'
import {
  fromOpenAIResponsesResponse,
  toOpenAIResponsesRequest,
} from '../src/protocols/openai-responses'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
})

describe('OpenAI Responses adapter', () => {
  it('converts a Decisions request and a real Responses response', async () => {
    const request = {
      model: import.meta.env.VITE_OPENAI_DECISION_MODEL!,
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
            { value: 'technical', description: 'Product setup and software problems' },
            { value: 'shipping', description: 'Delivery and damaged shipments' },
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
      safety_identifier: 'decision-pony-test',
    } satisfies DecisionCreateParams

    const response = await client.responses.create(
      toOpenAIResponsesRequest(request),
    )
    const decision = fromOpenAIResponsesResponse(response, request)

    expect(decision.model).toBe(response.model)
    expect(decision.answers).toHaveLength(3)
    expect(decision.answers[0]).toMatchObject({
      type: 'predicate',
      name: 'damaged',
    })
    expect(decision.answers[1]).toMatchObject({
      type: 'choice',
      name: 'department',
    })
    expect(decision.answers[2]).toMatchObject({
      type: 'score',
      name: 'severity',
    })

    for (const answer of decision.answers) {
      if (answer.type === 'choice' || answer.type === 'score') {
        expect(answer.probabilities.reduce((sum, item) => sum + item.probability, 0))
          .toBeCloseTo(1)
      }
    }

    expect(decision.usage.input_tokens).toBeGreaterThan(0)
    expect(decision.usage.output_tokens).toBeGreaterThan(0)
    expect(decision.usage.total_tokens).toBeGreaterThan(0)
  }, 30_000)
})
