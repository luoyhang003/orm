import { isOperatorFunction } from './Operator'
import * as QueryGrammers from './QueryGrammar'
import { idify, preDestruct, arraify } from '../../Utils/array'

function mapComparisonOperatorToSymbol (op: FxOrmQueries.OPERATOR_TYPE_COMPARISON) {
  switch (op) {
    case 'eq': return '='
    case 'ne': return '<>'
    case 'gt': return '>'
    case 'gte': return '>='
    case 'lt': return '<'
    case 'lte': return '<='
  }
}

function mapConjunctionOpSymbolToText (op_sym: symbol) {
  switch (op_sym) {
    case QueryGrammers.Ql.Operators.and: return 'and'
    case QueryGrammers.Ql.Operators.or: return 'or'
    // case QueryGrammers.Ql.Operators.xor: return 'xor'
  }
}

function mapVType (value: any): FxHQLParser.ValueTypeRawNode['type'] | 'identifier' | 'column' {
  switch (typeof value) {
    default:
      if (isOperatorFunction(value) && value.operator_name === 'colref') return 'identifier'
      else if (isOperatorFunction(value) && value.operator_name === 'refTableCol') return 'column'
    case 'string':
      return 'string'
    case 'number':
      return 'decimal'
  }
}

function getComparisionNodeByValueNodeType (
  vtype: FxOrmTypeHelpers.ReturnType<typeof mapVType>,
  value: any
) {
  switch (vtype) {
    case 'identifier': return { type: 'identifier' as 'identifier', value: value }
    case 'decimal': return { type: 'decimal' as 'decimal', value: value }
    case 'string': return { type: 'string' as 'string', string: value }
    case 'column': return { type: 'column' as 'column', table: value.table, name: value.column }
  }
}

function normalizeWhereInput (input: any) {
  if (Array.isArray(input))
    return { lower: input[0], higher: input[1] }
  else if (typeof input === 'object')
    return { lower: input.lower, higher: input.higher }

  throw new Error(`[normalizeWhereInput] input must be tuple[lower, higher] or object{lower, higher}, check your input`)
}

function parseOperatorFunctionAsValue (opFnValue: FxOrmQueries.OperatorFunction): any {
  switch (opFnValue.operator_name) {
    case 'refTableCol': {
      const payload = opFnValue().value
      if (Array.isArray(payload))
        return { table: payload[0], column: payload[0] }
      else if (typeof payload === 'object')
        return { table: payload.table, column: payload.column }
      else if (typeof payload === 'string' && payload.indexOf('.') > 0) {
        const [table, column] = payload.split('.')
        return { table, column }
      }
    }
    case 'colref':
      return opFnValue().value
    case 'like':
      return opFnValue().value
    case 'between': {
      const payload = opFnValue().value
      return normalizeWhereInput(payload)
    }
    default:
      throw new Error('[parseOperatorFunctionAsValue] unsupported operator function as value! check your input!')
  }
}

function mapObjectToTupleList (input: object | any[]) {
  if (!input || typeof input !== 'object') return null

  return Array.isArray(input) ? input : Object.entries(input).map(([k, v]) => ({[k]: v}))
}

function isRawEqValue (input: any): input is (string | number | null | boolean) {
  const _t = typeof input
  return (_t === 'number')
  || (_t === 'string')
  || (_t === 'boolean')
  || input === null
}
function filterRawEqValue (input: any): string | number | null {
  const ty = typeof input
  switch (ty) {
    case 'string':
      if (!input) return ''
      return input
    case 'number':
      if (isNaN(input)) return 0
      if (!Number.isFinite(input)) return 0
      return input
    case 'undefined':
      return null
    case 'object':
      if (!input)
      return null
  }

  return null
}

const noOp = function () { return null as any };
export function gnrWalkWhere<T extends FxHQLParser.WhereNode['condition']> ({
  onNode = noOp,
}: {
  onNode?: (nodeInfo: {
    /**
     * @shouldit be symbol?
     */
    scene: 'inputIs:opfn:bracketRound'
    | 'inputAs:conjunctionAsAnd'
    | 'walkOn:opfn:bracketRound'
    | 'walkOn:opfn:refTableCol'
    | 'walkOn:opfn:colref'
    | 'walkOn:opfn:like'
    | 'walkOn:opfn:between'
    | 'walkOn:opfn:comparator'
    | 'walkOn:opsymbol:bracketRound'
    | 'walkOn:opsymbol:conjunction'
    ,
    walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkWhere>,
    walk_fn_options: any
    input: any,
    payload: any
  }) => {
    isReturn: Boolean,
    result: any
  }
} = {}): ((
  input: FxOrmTypeHelpers.ItOrListOfIt<null | undefined | FxOrmQueries.WhereObjectInput | FxOrmQueries.OperatorFunction>,
  opts?: {
    source_collection?: string
    parent_conjunction_op?: FxOrmQueries.OPERATOR_TYPE_CONJUNCTION
  }
) => T) {
  const walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkWhere> = function (input, opts?) {
    const staticOnNodeParams = <FxOrmTypeHelpers.FirstParameter<typeof onNode>>{ input, walk_fn, walk_fn_options: opts, payload: undefined }
    if (!input) return null
    else if (isOperatorFunction(input)) {
      switch (input.$wrapper) {
        case QueryGrammers.Qlfn.Others.bracketRound:
          const state = onNode({ scene: 'inputIs:opfn:bracketRound', ...staticOnNodeParams })
          if (state && state.isReturn)
            return state.result
        default:
          break
      }
    }

    if (typeof input !== 'object') return null

    let parsedNode = <T>{};

    if (Array.isArray(input)) {
      if (!input.length) return null
      if (input.length === 1) return walk_fn(idify(input))

      const state = onNode({ scene: 'inputAs:conjunctionAsAnd', ...staticOnNodeParams })
      if (state && state.isReturn)
        return state.result
    }

    const inputSyms = Object.getOwnPropertySymbols(input)
    const inputKeys = Object.keys(input)
    const topAnd = inputSyms.length + inputKeys.length > 1

    if (topAnd)
      return walk_fn({
        [QueryGrammers.Ql.Operators.and]: []
                          .concat(inputSyms.map(sym => ({[sym]: (<any>input)[sym]})))
                          .concat(inputKeys.map(key => ({[key]: (<any>input)[key]})))
      })

    inputSyms.forEach((_sym) => {
      switch (_sym) {
        case QueryGrammers.Ql.Others.bracketRound: {
          parsedNode = onNode({
            scene: 'walkOn:opsymbol:bracketRound',
            ...staticOnNodeParams,
            payload: { symbol: _sym }
          }).result
          break
        }
        case QueryGrammers.Ql.Operators.or:
        case QueryGrammers.Ql.Operators.and: {
          parsedNode = onNode({
            scene: 'walkOn:opsymbol:conjunction',
            ...staticOnNodeParams,
            payload: { symbol: _sym }
          }).result

          break
        }
      }
    })

    inputKeys.forEach((fieldName: string) => {
      let v = (<any>input)[fieldName]
      if (isRawEqValue(v))
        v = QueryGrammers.Qlfn.Operators.eq(filterRawEqValue(v))

      if (!isOperatorFunction(v)) return

      const payv = v()

      // for some special operator: like, between
      let isNot = false

      switch (payv.func_ref) {
        // case QueryGrammers.Qlfn.Others.bracketRound: {
        //   parsedNode = onNode({
        //     scene: 'walkOn:opfn:bracketRound',
        //     ...staticOnNodeParams,
        //     payload: { opfn_value: payv }
        //   }).result

        //   break
        // }
        // case QueryGrammers.Qlfn.Others.refTableCol: {
        //   parsedNode = onNode({
        //     scene: 'walkOn:opfn:refTableCol',
        //     ...staticOnNodeParams,
        //     payload: { opfn_value: payv }
        //   }).result
        //   break
        // }
        // case QueryGrammers.Qlfn.Operators.colref: {
        //   parsedNode = onNode({
        //     scene: 'walkOn:opfn:colref',
        //     ...staticOnNodeParams,
        //     payload: { opfn_value: payv }
        //   }).result
        //   break
        // }
        /* comparison verb :start */
        case QueryGrammers.Qlfn.Operators.notLike: isNot = true
        case QueryGrammers.Qlfn.Operators.like: {
          parsedNode = onNode({
            scene: 'walkOn:opfn:like',
            ...staticOnNodeParams,
            payload: { opfn_value: payv, not: isNot, fieldName }
          }).result
          break
        }
        case QueryGrammers.Qlfn.Operators.notBetween: isNot = true
        case QueryGrammers.Qlfn.Operators.between: {
          parsedNode = onNode({
            scene: 'walkOn:opfn:between',
            ...staticOnNodeParams,
            payload: { opfn_value: payv, not: isNot, fieldName }
          }).result
          break
        }
        /* comparison verb :end */
        /* comparison operator :start */
        case QueryGrammers.Qlfn.Operators.ne:
        case QueryGrammers.Qlfn.Operators.eq:
        case QueryGrammers.Qlfn.Operators.gt:
        case QueryGrammers.Qlfn.Operators.gte:
        case QueryGrammers.Qlfn.Operators.lt:
        case QueryGrammers.Qlfn.Operators.lte:
        {
          parsedNode = onNode({
            scene: 'walkOn:opfn:comparator',
            ...staticOnNodeParams,
            payload: { opfn_value: payv, fieldName, }
          }).result
          break
        }
        /* comparison operator :end */
        default:
          throw new Error(`[gnrWalkWhere::walk_fn] unsupported op_name ${payv.op_name}`)
      }
    })

    return parsedNode
  }

  return walk_fn
}

/**
 * default use preorder-strategy to build where condition
 */
export const dfltWalkWhere = gnrWalkWhere({
  onNode: (nodeInfo) => {
    const { scene, walk_fn, input, walk_fn_options, payload } = nodeInfo;

    switch (scene) {
      case 'inputIs:opfn:bracketRound':
        return {
          isReturn: true,
          result: {
            type: 'expr_comma_list',
            exprs: [walk_fn(input().value)]
          }
        }
      case 'walkOn:opfn:bracketRound':
        return {
          isReturn: false,
          result: {
            type: 'expr_comma_list',
            exprs: [walk_fn(payload.opfn_value)]
          }
        }
      case 'walkOn:opfn:refTableCol':
        return {
          isReturn: false,
          result: {
            type: 'column',
            table: payload.opfn_value.value.table,
            column: payload.opfn_value.value.column,
          }
        }
      case 'walkOn:opfn:colref':
        return {
          isReturn: false,
          result: {
            type: 'identifier',
            value: payload.opfn_value.value
          }
        }
      case 'walkOn:opfn:comparator':
      case 'walkOn:opfn:like':
      case 'walkOn:opfn:between': {
        let value = payload.opfn_value.value

        const { source_collection } = walk_fn_options || {};
        const varNode = !!source_collection ? {
          type: 'column',
          table: source_collection,
          name: payload.fieldName,
        } : {
          type: 'identifier',
          value: payload.fieldName
        }

        switch (scene) {
          case 'walkOn:opfn:comparator': {
            const vtype = mapVType(payload.opfn_value.value)
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)

            return {
              isReturn: false,
              result: {
                type: 'operator',
                operator: mapComparisonOperatorToSymbol(payload.opfn_value.op_name),
                op_left: varNode,
                op_right: getComparisionNodeByValueNodeType(vtype, value)
              }
            }
          }
          case 'walkOn:opfn:like': {
            const vtype = mapVType(payload.opfn_value.value)
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)

            return {
              isReturn: false,
              result: {
                type: "like",
                not: payload.not,
                value: varNode,
                comparison: getComparisionNodeByValueNodeType(vtype, value)
              }
            }
          }
          case 'walkOn:opfn:between': {
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
            else value = normalizeWhereInput(value)

            return {
              isReturn: false,
              result: {
                type: "between",
                value: varNode,
                not: payload.not,
                lower: getComparisionNodeByValueNodeType(mapVType(value.lower), value.lower),
                upper: getComparisionNodeByValueNodeType(mapVType(value.higher), value.higher),
              }
            }
          }
        }
      }
      case 'walkOn:opsymbol:bracketRound': {
        return {
          isReturn: false,
          result: {
            type: 'expr_comma_list',
            exprs: [walk_fn((<any>input)[payload.symbol])]
          }
        }
      }
      case 'walkOn:opsymbol:conjunction': {
        const [pres, last] = preDestruct(mapObjectToTupleList((<any>input)[payload.symbol]))
        const op_name = mapConjunctionOpSymbolToText(payload.symbol)

        return {
          isReturn: false,
          result: {
            type: 'operator',
            operator: op_name,
            op_left: walk_fn(pres, { ...walk_fn_options, parent_conjunction_op: op_name }),
            op_right: walk_fn(last, { ...walk_fn_options, parent_conjunction_op: op_name }),
          }
        }
      }
      case 'inputAs:conjunctionAsAnd':
        const {
          // when input is array with length >= 2, 'and' is valid
          parent_conjunction_op = 'and'
        } = walk_fn_options || {}

        const [pres, last] = preDestruct(input)
        return {
          isReturn: true,
          result: {
            type: 'operator',
            operator: parent_conjunction_op,
            op_left: walk_fn(pres),
            op_right: walk_fn(last)
          }
        }
      default:
        return {isReturn: false, result: null}
    }
  }
});

export function dfltWalkOn (
  input: FxOrmTypeHelpers.ItOrListOfIt<FxOrmQueries.WhereObjectInput>,
  opts: {
    source_collection: string,
    is_joins?: boolean
  }
): FxOrmTypeHelpers.ItOrListOfIt<FxOrmQueries.Class_QueryNormalizer['joins'][any]> {
  if (!input) return null
  else if (isOperatorFunction(input)) return null

  if (typeof input !== 'object') return null

  const { source_collection, is_joins = false } = opts || {}

  let jonNode: FxOrmQueries.Class_QueryNormalizer['joins'][any] = null

  Object.keys(input).forEach((fieldName: string) => {
    const v = input[fieldName]
    if (!isOperatorFunction(v)) return

    const payv = v()

    jonNode = {
      side: undefined,
      specific_outer: false,
      inner: false,
      columns: [{ type: 'column', table: source_collection, name: fieldName }],
      ref_right: {
        type: 'table',
        table: payv.value.table
      }
    }

    switch (payv.op_name) {
      case 'refTableCol': {
        jonNode.columns.push({ type: 'column', table: payv.value.table, name: payv.value.column })
        break
      }
      default:
        throw new Error(`[dfltWalkOn::] unsupported op_name ${payv.op_name}`)
    }
  })

  return is_joins ? [jonNode] : jonNode
}