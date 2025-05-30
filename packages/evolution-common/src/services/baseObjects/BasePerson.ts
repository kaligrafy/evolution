/*
 * Copyright 2023, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

import { Optional } from '../../types/Optional.type';
import { IValidatable } from './IValidatable';
import { WeightableAttributes, Weight, validateWeights } from './Weight';
import { Uuidable } from './Uuidable';
import * as PAttr from './attributeTypes/PersonAttributes';

type BasePersonAttributes = {
    _uuid?: string;

    age?: PAttr.Age;
    ageGroup?: PAttr.AgeGroup;
    gender?: PAttr.Gender;
    drivingLicenseOwnership?: PAttr.DrivingLicenseOwnership;
    transitPassOwnership?: PAttr.TransitPassOwnership;
    carsharingMember?: PAttr.CarsharingMember;
    carsharingUser?: PAttr.CarsharingUser;
    bikesharingMember?: PAttr.BikesharingMember;
    bikesharingUser?: PAttr.BikesharingUser;
    ridesharingMember?: PAttr.RidesharingMember;
    ridesharingUser?: PAttr.RidesharingUser;
    occupation?: PAttr.Occupation;
    jobCategory?: PAttr.JobCategory;
    jobName?: PAttr.JobName;
    isOnTheRoadWorker?: PAttr.IsOnTheRoadWorker;
    isJobTelecommuteCompatible?: PAttr.IsJobTelecommuteCompatible;
    educationalAttainment?: PAttr.EducationalAttainment;

    // must be anonymized:
    nickname?: string;
    contactPhoneNumber?: string;
    contactEmail?: string;
} & WeightableAttributes;

type ExtendedPersonAttributes = BasePersonAttributes & { [key: string]: any };

/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type */
interface IBasePersonAttributes extends BasePersonAttributes {}

class BasePerson extends Uuidable implements IBasePersonAttributes, IValidatable {
    _isValid: Optional<boolean>;
    _weights?: Weight[];

    age?: PAttr.Age;
    ageGroup?: PAttr.AgeGroup;
    gender?: PAttr.Gender;
    drivingLicenseOwnership?: PAttr.DrivingLicenseOwnership;
    transitPassOwnership?: PAttr.TransitPassOwnership;
    carsharingMember?: PAttr.CarsharingMember;
    carsharingUser?: PAttr.CarsharingUser;
    bikesharingMember?: PAttr.BikesharingMember;
    bikesharingUser?: PAttr.BikesharingUser;
    ridesharingMember?: PAttr.RidesharingMember;
    ridesharingUser?: PAttr.RidesharingUser;
    occupation?: PAttr.Occupation;
    jobCategory?: PAttr.JobCategory;
    jobName?: PAttr.JobName;
    isOnTheRoadWorker?: PAttr.IsOnTheRoadWorker;
    isJobTelecommuteCompatible?: PAttr.IsJobTelecommuteCompatible;
    educationalAttainment?: PAttr.EducationalAttainment;

    // must be anonymized:
    nickname?: string;
    contactPhoneNumber?: string;
    contactEmail?: string;

    _confidentialAttributes: string[] = [
        // these attributes should be hidden when exporting
        'contactPhoneNumber',
        'contactEmail',
        'nickname'
    ];

    constructor(params: BasePersonAttributes | ExtendedPersonAttributes) {
        super(params._uuid);

        this._isValid = undefined;
        this._weights = params._weights;

        this.age = params.age;
        this.ageGroup = params.ageGroup;
        this.gender = params.gender;
        this.drivingLicenseOwnership = params.drivingLicenseOwnership;
        this.transitPassOwnership = params.transitPassOwnership;
        this.carsharingMember = params.carsharingMember;
        this.carsharingUser = params.carsharingUser;
        this.bikesharingMember = params.bikesharingMember;
        this.bikesharingUser = params.bikesharingUser;
        this.ridesharingMember = params.ridesharingMember;
        this.ridesharingUser = params.ridesharingUser;
        this.occupation = params.occupation;
        this.jobCategory = params.jobCategory;
        this.jobName = params.jobName;
        this.isOnTheRoadWorker = params.isOnTheRoadWorker;
        this.isJobTelecommuteCompatible = params.isJobTelecommuteCompatible;
        this.educationalAttainment = params.educationalAttainment;

        this.nickname = params.nickname;
        this.contactPhoneNumber = params.contactPhoneNumber;
        this.contactEmail = params.contactEmail;
    }

    // params must be sanitized and must be valid:
    static unserialize(params: BasePersonAttributes): BasePerson {
        return new BasePerson(params);
    }

    /**
     * Factory that validates input from an interview and makes
     * sure types and required fields are valid before returning a new object
     * @param dirtyParams
     * @returns BasePerson | Error[]
     */
    static create(dirtyParams: { [key: string]: any }): BasePerson | Error[] {
        const errors = BasePerson.validateParams(dirtyParams);
        return errors.length > 0 ? errors : new BasePerson(dirtyParams as ExtendedPersonAttributes);
    }

    validate(): Optional<boolean> {
        // TODO: implement:
        this._isValid = true;
        return true;
    }

    isValid(): Optional<boolean> {
        return this._isValid;
    }

    /**
     * Validates attributes types for BasePerson.
     * @param dirtyParams The parameters to validate.
     * @returns Error[] TODO: specialize this error class
     */
    static validateParams(dirtyParams: { [key: string]: any }): Error[] {
        const errors: Error[] = [];

        // Validate params object:
        if (!dirtyParams || typeof dirtyParams !== 'object') {
            errors.push(new Error('BasePerson validateParams: params is undefined or invalid'));
            return errors; // Stop now; further validation depends on valid params object.
        }

        // Validate UUID
        const uuidErrors: Error[] = Uuidable.validateParams(dirtyParams);
        if (uuidErrors.length > 0) {
            errors.push(...uuidErrors);
        }

        // Validate weights:
        const weightsErrors = validateWeights(dirtyParams._weights);
        if (weightsErrors.length > 0) {
            errors.push(...weightsErrors);
        }

        // Validate age (if provided)
        if (dirtyParams.age !== undefined && (!Number.isInteger(dirtyParams.age) || dirtyParams.age < 0)) {
            errors.push(new Error('BasePerson validateParams: age must be a positive integer'));
        }

        // Validate ageGroup (if provided)
        if (dirtyParams.ageGroup !== undefined && typeof dirtyParams.ageGroup !== 'string') {
            errors.push(new Error('BasePerson validateParams: ageGroup is not a valid value'));
        }

        // Validate gender (if provided)
        if (dirtyParams.gender !== undefined && typeof dirtyParams.gender !== 'string') {
            errors.push(new Error('BasePerson validateParams: gender is not a valid value'));
        }

        // Validate drivingLicenseOwnership (if provided)
        if (
            dirtyParams.drivingLicenseOwnership !== undefined &&
            typeof dirtyParams.drivingLicenseOwnership !== 'string'
        ) {
            errors.push(new Error('BasePerson validateParams: drivingLicenseOwnership is not a valid value'));
        }

        // Validate transitPassOwnership (if provided)
        if (dirtyParams.transitPassOwnership !== undefined && typeof dirtyParams.transitPassOwnership !== 'string') {
            errors.push(new Error('BasePerson validateParams: transitPassOwnership is not a valid value'));
        }

        // Validate carsharingMember (if provided)
        if (dirtyParams.carsharingMember !== undefined && typeof dirtyParams.carsharingMember !== 'string') {
            errors.push(new Error('BasePerson validateParams: carsharingMember is not a valid value'));
        }

        // Validate carsharingUser (if provided)
        if (dirtyParams.carsharingUser !== undefined && typeof dirtyParams.carsharingUser !== 'string') {
            errors.push(new Error('BasePerson validateParams: carsharingUser is not a valid value'));
        }

        // Validate bikesharingMember (if provided)
        if (dirtyParams.bikesharingMember !== undefined && typeof dirtyParams.bikesharingMember !== 'string') {
            errors.push(new Error('BasePerson validateParams: bikesharingMember is not a valid value'));
        }

        // Validate bikesharingUser (if provided)
        if (dirtyParams.bikesharingUser !== undefined && typeof dirtyParams.bikesharingUser !== 'string') {
            errors.push(new Error('BasePerson validateParams: bikesharingUser is not a valid value'));
        }

        // Validate ridesharingMember (if provided)
        if (dirtyParams.ridesharingMember !== undefined && typeof dirtyParams.ridesharingMember !== 'string') {
            errors.push(new Error('BasePerson validateParams: ridesharingMember is not a valid value'));
        }

        // Validate ridesharingUser (if provided)
        if (dirtyParams.ridesharingUser !== undefined && typeof dirtyParams.ridesharingUser !== 'string') {
            errors.push(new Error('BasePerson validateParams: ridesharingUser is not a valid value'));
        }

        // Validate occupation (if provided)
        if (dirtyParams.occupation !== undefined && typeof dirtyParams.occupation !== 'string') {
            errors.push(new Error('BasePerson validateParams: occupation is not a valid value'));
        }

        // Validate jobCategory (if provided)
        if (dirtyParams.jobCategory !== undefined && typeof dirtyParams.jobCategory !== 'string') {
            errors.push(new Error('BasePerson validateParams: jobCategory is not a valid value'));
        }

        // Validate jobName (if provided)
        if (dirtyParams.jobName !== undefined && typeof dirtyParams.jobName !== 'string') {
            errors.push(new Error('BasePerson validateParams: jobName should be a string'));
        }

        // Validate isOnTheRoadWorker (if provided)
        if (dirtyParams.isOnTheRoadWorker !== undefined && typeof dirtyParams.isOnTheRoadWorker !== 'boolean') {
            errors.push(new Error('BasePerson validateParams: isOnTheRoadWorker should be a boolean'));
        }

        // Validate isJobTelecommuteCompatible (if provided)
        if (
            dirtyParams.isJobTelecommuteCompatible !== undefined &&
            typeof dirtyParams.isJobTelecommuteCompatible !== 'boolean'
        ) {
            errors.push(new Error('BasePerson validateParams: isJobTelecommuteCompatible should be a boolean'));
        }

        // Validate educationalAttainment (if provided)
        if (dirtyParams.educationalAttainment !== undefined && typeof dirtyParams.educationalAttainment !== 'string') {
            errors.push(new Error('BasePerson validateParams: educationalAttainment is not a valid value'));
        }

        // Validate nickname (if provided)
        if (dirtyParams.nickname !== undefined && typeof dirtyParams.nickname !== 'string') {
            errors.push(new Error('BasePerson validateParams: nickname should be a string'));
        }

        // Validate contactPhoneNumber (if provided)
        if (dirtyParams.contactPhoneNumber !== undefined && typeof dirtyParams.contactPhoneNumber !== 'string') {
            errors.push(new Error('BasePerson validateParams: contactPhoneNumber should be a string'));
        }

        // Validate contactEmail (if provided)
        if (dirtyParams.contactEmail !== undefined && typeof dirtyParams.contactEmail !== 'string') {
            errors.push(new Error('BasePerson validateParams: contactEmail should be a string'));
        }

        return errors;
    }
}

export { BasePerson, BasePersonAttributes, ExtendedPersonAttributes };
