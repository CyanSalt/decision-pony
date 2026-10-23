import type { DecisionCreateParams } from 'openai/resources'
import { describe, expect, it } from 'vitest'
import { getAnswers } from '../src/decision'

describe('getAnswers', () => {

  it('removes insignificant floating-point error from a score expectation', () => {
    const request = {
      model: 'test-model',
      input: 'evidence',
      questions: [
        {
          type: 'score',
          instructions: 'How severe is the issue?',
          levels: [
            { label: 'low', description: 'Low severity' },
            { label: 'medium', description: 'Medium severity' },
            { label: 'high', description: 'High severity' },
          ],
        },
      ],
    } satisfies DecisionCreateParams

    const [answer] = getAnswers({
      answers: [{
        status: 'answered',
        confidence: 0.8,
        probabilities: [0.15, 0.3, 0.55],
      }],
    }, request)

    expect(answer).toMatchObject({
      type: 'score',
      score: 1.4,
    })
  })

})
