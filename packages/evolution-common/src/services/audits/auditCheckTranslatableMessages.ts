/*
 * Copyright Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

/**
 * Interpolation params for audit error codes whose locale strings use placeholders.
 * The translation key is always the error code (`t('audits:' + errorCode, params)`).
 *
 * Stored audits ({@link AuditForObject}) only persist `errorCode`; the admin UI merges
 * with this map when calling `t`.
 */
const AUDIT_TRANSLATION_PARAMS_BY_CODE: Partial<Record<string, Record<string, string>>> = {
    HH_I_Size: { min: '1', max: '18' },
    HH_I_CarNumber: { min: '0', max: '13' }
};

/** Params for `t('audits:${errorCode}', params)`; empty object when the code has no placeholders. */
export const getAuditTranslationParams = (errorCode: string): Record<string, string> =>
    AUDIT_TRANSLATION_PARAMS_BY_CODE[errorCode] ?? {};
