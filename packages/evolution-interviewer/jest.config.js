/*
 * Copyright 2023, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */
/* eslint-disable n/no-unpublished-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
const baseConfig = require('../../tests/jest.config.base');

module.exports = {
    ...baseConfig,
    'testPathIgnorePatterns': ['(/__tests__/.*(db\\.test)\\.(jsx?|tsx?))$'],
};

