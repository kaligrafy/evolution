/*
 * Copyright 2024, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

import { getAuditTranslationParams } from '../auditCheckTranslatableMessages';

describe('getAuditTranslationParams', () => {
    it('returns params for HH_I_Size', () => {
        expect(getAuditTranslationParams('HH_I_Size')).toEqual({ min: '1', max: '18' });
    });

    it('returns empty object when unmapped', () => {
        expect(getAuditTranslationParams('SOME_UNKNOWN_CODE')).toEqual({});
    });
});
