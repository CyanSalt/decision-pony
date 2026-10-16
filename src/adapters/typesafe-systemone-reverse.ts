import type {
  ChoiceCriteria,
  Question,
  Questions,
  ResultFor,
  ScoreCriteria,
  SystemOneRequest,
  SystemOneResult,
} from '@typesafe-ai/sdk'
import type {
  Decision,
  DecisionCreateParams,
  DecisionInputMessage,
} from 'openai/resources'

type SystemOneAnswer = ResultFor<Question>

type Choice = DecisionCreateParams.QuestionParamChoice.Choice & { value: string }

function toDecisionChoices(criteria: ChoiceCriteria): Choice[] {
  return Object.entries(criteria).map<Choice>(([key, criterion]) => {
    return {
      value: key,
      description: typeof criterion === 'string' ? criterion : undefined,
    }
  })
}

function toDecisionScoreLevels(
  criteria: ScoreCriteria,
): DecisionCreateParams.QuestionParamScore.Level[] {
  return criteria.map((criterion, index) => ({
    label: `level-${index}`,
    description: typeof criterion === 'string' ? criterion : undefined,
  }))
}

function toDecisionQuestion(
  question: Question,
  key: string,
): DecisionCreateParams['questions'][number] {
  if (typeof question.instructions !== 'string') {
    throw new TypeError(`The instructions for '${key}' must be a string`)
  }
  const instructions = question.instructions
  switch (question.type) {
    case 'noul':
      return {
        instructions,
        type: 'predicate',
        name: key,
      }
    case 'choice':
      return {
        choices: toDecisionChoices(question.criteria),
        instructions,
        type: 'choice',
        name: key,
      }
    case 'score':
      return {
        instructions,
        levels: toDecisionScoreLevels(question.criteria),
        type: 'score',
        name: key,
      }
    default:
      throw new TypeError(`The question type '${question.type}' is not supported`)
  }
}

function toDecisionInput(
  state: SystemOneRequest['state'],
): DecisionCreateParams['input'] {
  if (typeof state === 'string') {
    return state
  }
  return Array.isArray(state)
    ? state.filter(part => typeof part === 'string')
      .map<DecisionInputMessage>(part => ({ role: 'user', content: part }))
    : []
}

function toSystemOneAnswer(
  answer: Decision['answers'][number],
  question: Question,
  key: string,
): SystemOneAnswer {
  switch (question.type) {
    case 'noul':
      if (answer.type !== 'predicate') {
        throw new TypeError(`The answer for '${key}' must have type 'predicate', got ${answer.type}`)
      }
      return {
        type: 'noul',
        noul: answer.probability,
      }
    case 'choice': {
      if (answer.type !== 'choice') {
        throw new TypeError(`The answer for '${key}' must have type 'choice', got ${answer.type}`)
      }
      const choices = toDecisionChoices(question.criteria)
      if (answer.probabilities.length !== choices.length) {
        throw new RangeError(`The choice probabilities must have length ${choices.length}, got ${answer.probabilities.length}`)
      }
      return {
        type: 'choice',
        choice: String(answer.choice),
        confidence: answer.confidence,
        probabilities: Object.fromEntries(choices.map(choice => {
          const probability = answer.probabilities.find(item => item.value === choice.value)
          if (!probability) {
            throw new Error(`Cannot find choice probability for '${choice.value}'`)
          }
          return [choice.value, probability.probability]
        })),
      }
    }
    case 'score': {
      if (answer.type !== 'score') {
        throw new TypeError(`The answer for '${key}' must have type 'score', got ${answer.type}`)
      }
      const levels = toDecisionScoreLevels(question.criteria)
      if (answer.probabilities.length !== levels.length) {
        throw new RangeError(`The score probabilities must have length ${levels.length}, got ${answer.probabilities.length}`)
      }
      return {
        type: 'score',
        score: answer.score,
        confidence: answer.confidence,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        legend: Object.fromEntries(levels.map((level, index) => [index, level.description ?? ''])) as never,
        probabilities: Object.fromEntries(levels.map((level, index) => {
          const probability = answer.probabilities[index]
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!probability) {
            throw new Error(`Cannot find choice probability for '${level.label}'`)
          }
          return [index, probability.probability]
        })),
      }
    }
    default:
      throw new TypeError(`The question type '${question.type}' is not supported`)
  }
}

export function fromTypeSafeSystemOneRequest(
  request: SystemOneRequest,
): DecisionCreateParams {
  if (typeof request.model !== 'string') {
    throw new TypeError(`The 'model' must be a string`)
  }
  return {
    model: request.model,
    input: toDecisionInput(request.state),
    questions: Object.entries(request.questions).map(([key, question]) => {
      return toDecisionQuestion(question, key)
    }),
  }
}

export function toTypeSafeSystemOneResponse(
  response: Decision,
  request: SystemOneRequest,
): SystemOneResult<Questions> {
  const questions = Object.entries(request.questions)
  if (response.answers.length !== questions.length) {
    throw new RangeError(`The length of 'answers' must be ${questions.length}, got ${response.answers.length}`)
  }
  return {
    model: response.model,
    answers: Object.fromEntries(questions.map<[string, SystemOneAnswer]>(([key, question]) => {
      const answer = response.answers.find(item => item.name === key)
      if (!answer) {
        throw new Error(`Cannot find answer for question '${key}'`)
      }
      return [key, toSystemOneAnswer(answer, question, key)]
    })),
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  }
}
