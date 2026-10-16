import type {
  EntryType,
  Question,
  Questions,
  ScoreCriteria,
  SystemOneRequest,
  SystemOneResult,
  Usage,
} from '@typesafe-ai/sdk'
import type { Decision, DecisionCreateParams } from 'openai/resources'
import type { DecisionPonyData } from '../decision'
import { getAnswers } from '../decision'

function keyOf(type: 'question' | 'choice' | 'level', index: number): string {
  return `${type}-${index}`
}

function toTypeSafeState(input: DecisionCreateParams['input']): SystemOneRequest['state'] {
  if (typeof input === 'string') {
    return input
  }
  return input.map(message => {
    if (typeof message.content === 'string') {
      return message.content
    }
    return message.content.map(part => {
      if (part.type === 'input_text') {
        return part.text
      }
      throw new TypeError('TypeSafe API does not support image input')
    }).join('\n')
  })
}

function toTypeSafeQuestion(
  question: DecisionCreateParams['questions'][number],
): Question {
  switch (question.type) {
    case 'predicate':
      return {
        type: 'noul',
        instructions: question.instructions,
      }
    case 'choice':
      return {
        type: 'choice',
        instructions: question.instructions,
        criteria: Object.fromEntries(question.choices.map((choice, index) => {
          return [keyOf('choice', index), {
            description: choice.description ?? null,
            value: choice.value,
          }]
        })),
      }
    case 'score': {
      const criteria = question.levels.map<EntryType>((level, index) => {
        return {
          [keyOf('level', index)]: {
            description: level.description ?? null,
            label: level.label,
          },
        }
      })
      if (criteria.length < 2) {
        throw new RangeError('A TypeSafe system-one score question must have at least two levels')
      }
      return {
        type: 'score',
        instructions: question.instructions,
        criteria: criteria as unknown as ScoreCriteria,
      }
    }
    default:
      // @ts-expect-error never type fallback
      throw new TypeError(`The 'type' of question must be one of 'predicate', 'choice' or 'score', got ${question.type}`)
  }
}

function toTypeSafeQuestions(
  questions: DecisionCreateParams['questions'],
): SystemOneRequest['questions'] {
  return Object.fromEntries(questions.map((question, index) => {
    return [keyOf('question', index), toTypeSafeQuestion(question)]
  }))
}

function toDecisionPonyData(
  response: SystemOneResult<Questions>,
  request: DecisionCreateParams,
): DecisionPonyData {
  return {
    answers: request.questions.map((question, questionIndex) => {
      const questionKey = keyOf('question', questionIndex)
      const answer = response.answers[questionKey]
      switch (question.type) {
        case 'predicate':
          if (answer.type !== 'noul') {
            throw new TypeError(`The answer for '${questionKey}' must have type 'noul'`)
          }
          return {
            status: 'answered',
            probabilities: [answer.noul],
          }
        case 'choice':
          if (answer.type !== 'choice') {
            throw new TypeError(`The answer for '${questionKey}' must have type 'choice'`)
          }
          return {
            status: 'answered',
            confidence: answer.confidence,
            probabilities: question.choices.map((choice, choiceIndex) => {
              const choiceKey = keyOf('choice', choiceIndex)
              if (!(choiceKey in answer.probabilities)) {
                throw new TypeError(`The 'probabilities' must contain '${choiceKey}'`)
              }
              return answer.probabilities[choiceKey]
            }),
          }
        case 'score':
          if (answer.type !== 'score') {
            throw new TypeError(`The answer for '${questionKey}' must have type 'score'`)
          }
          return {
            status: 'answered',
            confidence: answer.confidence,
            probabilities: question.levels.map((level, levelIndex) => {
              const levelKey = keyOf('level', levelIndex)
              if (!(levelKey in answer.probabilities)) {
                throw new TypeError(`The 'probabilities' must contain '${levelKey}'`)
              }
              return answer.probabilities[levelKey]
            }),
          }
        default:
          // @ts-expect-error never type fallback
          throw new TypeError(`The 'type' of question must be one of 'predicate', 'choice' or 'score', got ${question.type}`)
      }
    }),
  }
}

function fromTypeSafeSystemOneUsage(usage: Usage): Decision['usage'] {
  const inputTokens = usage.input_tokens ?? 0
  const outputTokens = usage.output_tokens ?? 0
  return {
    input_tokens: inputTokens,
    input_tokens_details: {
      cached_tokens: 0,
      cache_write_tokens: 0,
    },
    output_tokens: outputTokens,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: inputTokens + outputTokens,
  }
}

export function toTypeSafeSystemOneRequest(
  request: DecisionCreateParams,
): SystemOneRequest {
  return {
    model: request.model,
    state: toTypeSafeState(request.input),
    questions: toTypeSafeQuestions(request.questions),
  }
}

export function fromTypeSafeSystemOneResponse(
  response: SystemOneResult<Questions>,
  request: DecisionCreateParams,
): Decision {
  return {
    model: response.model,
    answers: getAnswers(toDecisionPonyData(response, request), request),
    usage: fromTypeSafeSystemOneUsage(response.usage),
  }
}
