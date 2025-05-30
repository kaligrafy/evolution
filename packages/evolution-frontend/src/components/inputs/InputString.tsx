/*
 * Copyright 2022, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */
import React from 'react';

import { _isBlank } from 'chaire-lib-common/lib/utils/LodashExtensions';
import { InputStringType } from 'evolution-common/lib/services/questionnaire/types';
import { parseString } from 'evolution-common/lib/utils/helpers';
import { CommonInputProps } from './CommonInputProps';

export type InputStringProps = CommonInputProps & {
    value?: string;
    inputRef?: React.LegacyRef<HTMLInputElement>;
    widgetConfig: InputStringType;
    updateKey: number;
};

const getStateValue = (props: InputStringProps) => {
    const value = _isBlank(props.value)
        ? parseString(props.widgetConfig.defaultValue, props.interview, props.path, props.user)
        : props.value;
    return _isBlank(value) ? '' : value;
};

export const InputString = (props: InputStringProps) => {
    const [value, setValue] = React.useState(getStateValue(props));
    // Update the value with props when updateKey prop is updated. Not using the
    // `key` to avoid loosing the identity of the component (which causes the
    // focus to get lost)
    React.useEffect(() => {
        setValue(getStateValue(props));
    }, [props.updateKey]);
    return (
        <input
            style={{ textTransform: props.widgetConfig.textTransform || ('none' as any) }}
            autoComplete="none"
            type="text"
            placeholder={props.widgetConfig.placeholder}
            inputMode={props.widgetConfig.keyboardInputMode}
            className={`apptr__form-input apptr__input-string input-${props.widgetConfig.size || 'large'}`}
            name={props.id}
            id={props.id}
            value={value}
            onBlur={props.onValueChange}
            onChange={(e) =>
                setValue(
                    !_isBlank(props.widgetConfig.inputFilter)
                        ? props.widgetConfig.inputFilter!(e.target.value)
                        : e.target.value
                )
            }
            ref={props.inputRef}
            maxLength={props.widgetConfig.maxLength ? props.widgetConfig.maxLength : 255}
        />
    );
};

export default InputString;
