/*
 * Copyright 2025, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */
import { defaultConfig } from 'evolution-backend/lib/config/projectConfig';
import { InterviewListAttributes } from 'evolution-common/lib/services/questionnaire/types';

// TODO Type the unknown attributes here
// Add the access code to the validation status list
export default (interview: InterviewListAttributes) => {
    const status = defaultConfig.validationListFilter(interview);
    status.responses = {
        ...status.responses,
        accessCode: interview.responses ? (interview.responses as any).accessCode : undefined
    } as any;
    return status;
};
