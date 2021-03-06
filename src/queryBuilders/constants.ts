export const postreSymbol = Symbol.for('postre');

export const sqlTokens = {
  parameterPrefix: '$',
  true: 'TRUE',
  false: 'FALSE',
  null: 'NULL',
  and: 'AND',
  or: 'OR',
  assignmentOperator: '=',
  default: 'DEFAULT',
} as const;
