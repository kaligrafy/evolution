/*
 * Copyright 2023, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

/**
 * A visited place is a place visited by a person during a journey or specific day
 * Usually, visited palces are used as origin and/or destination for trips
 */

import { Uuidable } from './Uuidable';
import { OptionalValidity, IValidatable } from './Validatable';
import { BasePlace, BasePlaceAttributes } from './BasePlace';
import { BaseAddressAttributes } from './BaseAddress';
import { Weightable, Weight, validateWeights } from './Weight';
import * as VPAttr from './attributeTypes/VisitedPlaceAttributes';
import { parseDate } from '../../utils/DateUtils';

export type BaseVisitedPlaceAttributes = {
    _uuid?: string;

    arrivalDate?: Date | string;
    departureDate?: Date | string;
    arrivalTime?: number;
    departureTime?: number;
    activityCategory?: VPAttr.ActivityCategory;
    activity?: VPAttr.Activity;

    /**
     * Departure and arrival time must be calculated from visited places,
     * so shortcuts must be converted to places and each visited place
     * cloned for each occurence before creating trips here
     * */
} & Weightable;

export type ExtendedVisitedPlaceAttributes = BaseVisitedPlaceAttributes & { [key: string]: any };

export class BaseVisitedPlace extends Uuidable implements IValidatable {
    _isValid: OptionalValidity;
    _weights?: Weight[];

    basePlace?: BasePlace;

    arrivalDate?: Date;
    departureDate?: Date;
    arrivalTime?: number; // seconds since midnight
    departureTime?: number; // seconds since midnight
    activityCategory?: VPAttr.ActivityCategory; // TODO: This should maybe removed and included in the activity object
    activity?: VPAttr.Activity;

    _confidentialAttributes: string[] = [
        // these attributes should be hidden when exporting
    ];

    constructor(params: (BaseVisitedPlaceAttributes | ExtendedVisitedPlaceAttributes) & { basePlace: BasePlace }) {
        super(params._uuid);

        this._isValid = undefined;
        this._weights = params._weights;

        this.basePlace = params.basePlace;
        this.arrivalDate = parseDate(params.arrivalDate);
        this.departureDate = parseDate(params.departureDate);
        this.arrivalTime = params.arrivalTime;
        this.departureTime = params.departureTime;
        this.activityCategory = params.activityCategory;
        this.activity = params.activity;
    }

    // params must be sanitized and must be valid:
    static unserialize(params: BaseVisitedPlaceAttributes & { basePlace: BasePlaceAttributes & { address?: BaseAddressAttributes } }): BaseVisitedPlace {
        return new BaseVisitedPlace({ ...params, basePlace: BasePlace.unserialize(params.basePlace) });
    }

    validate(): OptionalValidity {
        // TODO: implement:
        this._isValid = true;
        return true;
    }

    isValid(): OptionalValidity {
        return this._isValid;
    }

    /**
     * Factory that validates input from an interview and makes
     * sure types and required fields are valid before returning a new object
     * @param dirtyParams
     * @returns BaseVisitedPlace | Error[]
     */
    static create(dirtyParams: { [key: string]: any }): BaseVisitedPlace | Error[] {

        const basePlaceParams = {
            ...dirtyParams,
            geography: dirtyParams.geography,
            geocodingQueryString: dirtyParams.geography?.properties?.geocodingQueryString,
            lastAction: dirtyParams.geography?.properties?.lastAction,
            deviceUsed: dirtyParams.geography?.properties?.platform,
            zoom: dirtyParams.geography?.properties?.zoom
        };

        // validate params for both baseVisitedPlace and basePlace:
        const errors = [...BasePlace.validateParams(basePlaceParams), ...BaseVisitedPlace.validateParams(dirtyParams)];
        if (errors.length > 0) {
            return errors;
        } else {
            const basePlace = BasePlace.create(basePlaceParams) as BasePlace;
            const baseVisitedPlace = new BaseVisitedPlace({basePlace, ...dirtyParams} as ExtendedVisitedPlaceAttributes & { basePlace: BasePlace });
            return baseVisitedPlace;
        }
    }

    /**
     * Validates attributes types for BaseVisitedPlace
     * @param dirtyParams The params input
     * @returns Error[] TODO: specialize this error class
     */
    static validateParams(dirtyParams: { [key: string]: any }): Error[] {
        const errors: Error[] = [];

        dirtyParams.arrivalDate = parseDate(dirtyParams.arrivalDate);
        dirtyParams.departureDate = parseDate(dirtyParams.departureDate);

        // Validate params object:
        if (!dirtyParams || typeof dirtyParams !== 'object') {
            errors.push(new Error('BaseVisitedPlace validateParams: params is undefined or invalid'));
            return errors; // stop now otherwise it will crash because params are not valid
        }

        // Validate uuid:
        const uuidErrors = Uuidable.validateParams(dirtyParams);
        if (uuidErrors.length > 0) {
            errors.push(...uuidErrors);
        }

        // Validate weights:
        const weightsErrors = validateWeights(dirtyParams._weights);
        if (weightsErrors.length > 0) {
            errors.push(...weightsErrors);
        }

        // Validate base place:
        if (dirtyParams.basePlace !== undefined) {
            const basePlaceErrors = BasePlace.validateParams(dirtyParams.basePlace);
            if (basePlaceErrors.length > 0) {
                errors.push(...basePlaceErrors);
            }
        }

        // Validate arrivalDate (if provided):
        if (
            dirtyParams.arrivalDate !== undefined &&
            (!(dirtyParams.arrivalDate instanceof Date) || isNaN(dirtyParams.arrivalDate.getDate()))
        ) {
            errors.push(new Error('BaseVisitedPlace validateParams: arrivalDate should be a valid Date'));
        }

        // Validate departureDate (if provided):
        if (
            dirtyParams.departureDate !== undefined &&
            (!(dirtyParams.departureDate instanceof Date) || isNaN(dirtyParams.departureDate.getDate()))
        ) {
            errors.push(new Error('BaseVisitedPlace validateParams: departureDate should be a valid Date'));
        }

        // Validate arrivalTime (if provided):
        if (
            dirtyParams.arrivalTime !== undefined &&
            (!Number.isInteger(dirtyParams.arrivalTime) || dirtyParams.arrivalTime < 0)
        ) {
            errors.push(new Error('BaseVisitedPlace validateParams: arrivalTime should be a positive integer'));
        }

        // Validate departureTime (if provided):
        if (
            dirtyParams.departureTime !== undefined &&
            (!Number.isInteger(dirtyParams.departureTime) || dirtyParams.departureTime < 0)
        ) {
            errors.push(new Error('BaseVisitedPlace validateParams: departureTime should be a positive integer'));
        }

        // TODO: use updated activity categories to test from list of possible values:
        // Validate activityCategory (if provided):
        if (dirtyParams.activityCategory !== undefined && typeof dirtyParams.activityCategory !== 'string') {
            errors.push(new Error('BaseVisitedPlace validateParams: activityCategory should be a string'));
        }
        // TODO: use updated activites to test from list of possible values:
        // Validate activity (if provided):
        if (dirtyParams.activity !== undefined && typeof dirtyParams.activity !== 'string') {
            errors.push(new Error('BaseVisitedPlace validateParams: activity should be a string'));
        }

        return errors;
    }
}
