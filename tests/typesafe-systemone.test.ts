import { TypeSafeClient } from '@typesafe-ai/sdk'
import type { DecisionCreateParams } from 'openai/resources'
import { describe, expect, it } from 'vitest'
import {
  fromTypeSafeSystemOneResponse,
  toTypeSafeSystemOneRequest,
} from '../src/adapters/typesafe-systemone'

describe('TypeSafe System One adapter', () => {

  it.skipIf(
    !import.meta.env.VITE_TYPESAFE_DECISION_MODEL,
  )('converts a Decisions request and a real System One response', async () => {
    const client = new TypeSafeClient({
      apiKey: import.meta.env.VITE_TYPESAFE_API_KEY,
      baseURL: import.meta.env.VITE_TYPESAFE_BASE_URL,
    })
    const request = {
      model: import.meta.env.VITE_TYPESAFE_DECISION_MODEL!,
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
    } satisfies DecisionCreateParams

    const response = await client.systemOne(
      toTypeSafeSystemOneRequest(request),
    )
    const decision = fromTypeSafeSystemOneResponse(response, request)

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
    expect(decision.usage.output_tokens).toBeGreaterThanOrEqual(0)
    expect(decision.usage.total_tokens).toBeGreaterThan(0)
  }, 30_000)

})
