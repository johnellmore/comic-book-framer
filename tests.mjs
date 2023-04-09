import assert from 'node:assert';
import test from 'node:test';
import { unitStrToInches } from './pageSizeComponent.mjs';

test('unitStrToInches converts measurements to inches correctly', (t) => {
  // anything within a thou (1/1000th inch) is considered "equal"
  const epsilonEquals = (actual, expected) => Math.abs(actual - expected) < 0.001;

  assert(epsilonEquals(unitStrToInches('8.5in'), 8.5));
  assert(epsilonEquals(unitStrToInches('10 in'), 10));
  assert(epsilonEquals(unitStrToInches('45.7"'), 45.7));
  assert(epsilonEquals(unitStrToInches('49 "'), 49));
  assert(epsilonEquals(unitStrToInches('10 inches'), 10));
  assert(epsilonEquals(unitStrToInches('.5  in'), 0.5));
  assert(epsilonEquals(unitStrToInches('297mm'), 11.69291));
  assert(epsilonEquals(unitStrToInches('20.8cm'), 8.188976));
  assert(epsilonEquals(unitStrToInches('  97mm  '), 3.818898));
});
