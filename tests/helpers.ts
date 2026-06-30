export function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(message ?? `Expected ${right}, received ${left}`);
  }
}

export function assertMatch(value: string, expression: RegExp, message?: string): void {
  if (!expression.test(value)) {
    throw new Error(message ?? `Expected '${value}' to match ${expression}`);
  }
}