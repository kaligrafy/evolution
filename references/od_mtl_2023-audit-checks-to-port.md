# od_mtl_2023 audit checks not yet in Evolution

Tracking which audit checks from `od_mtl_2023-fork` still need to be ported into
Evolution's generic audit check infrastructure
(`packages/evolution-backend/src/services/audits/auditChecks/checks/`).

Goal: move project-agnostic checks into Evolution core; keep only
project-specific ones (custom geojson zones, project lookups) in od_mtl.

Legend (Status):

- **In Evolution**: equivalent already exists in core.
- **To port**: generic enough to belong in core (often parameterized).
- **Project-specific**: depends on od_mtl data/geojson/lookups; likely stays
  in the project (or core needs a generic, config-driven version first).
  May be converted to generic though.
- **Skip**: no Evolution equivalent and nothing meaningful to audit; not ported.

Legend (Priority): 1 = most urgent to port, 2 = medium, 3 = least urgent.
Leave blank for checks already in Evolution or that stay project-specific.
Dash in priority column means ignored, not in scope for Evolution

Legend (Check type, from the `[OBJECTPREFIX]_[TYPE]_[Description]` errorCode
naming convention, see `checks/README.md`):

- **M** — Missing: a required piece of data is missing.
- **I** — Invalid: erroneous data, e.g. an error in an email or phone number
  format.
- **L** — Logical: a logical error, such as an incompatibility between two
  values.

---

## Interview — `survey/src/admin/validations/interviewV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/interviewV2.validations.ts`
Evolution core: `checks/InterviewAuditChecks.ts` (+ empty `InterviewExtendedAuditChecks.ts`)

Note: this table lists only checks **not yet in Evolution**. The 3 already
covered in core are excluded (`I_M_accessCode` → `I_M_AccessCode`,
`I_I_accessCode` → `I_I_InvalidAccessCodeFormat`, `I_I_contactEmail` →
`I_I_ContactEmail`). Core also already has `I_M_Languages`, `I_M_StartedAt`,
and `I_I_HelpContactEmail` with no direct od_mtl_2023 equivalent in this file.

**Partial-equivalence note:** `I_I_unknownSurveyOrDateOutsideRange` and
`I_I_dateOutsideRange` are excluded too — core's generic
`I_I_StartedAtBeforeSurveyStartDate` / `I_I_StartedAtAfterSurveyEndDate`
(driven by `projectConfig.startDateTimeWithTimezoneOffset` /
`endDateTimeWithTimezoneOffset`) cover the same idea for a single-survey
deployment. od_mtl_2023 branches per `survey.shortname` because several
distinct surveys (`od_mtl_2023`, `od_qc_2023`, `od_mtl_ete_2023`,
`od_mtl_pilote_2021`) share one codebase, each with its own date window —
that multi-survey branching itself has no core equivalent and would only
matter for a similarly multi-survey Evolution deployment.

**v1 note (`interview.validations.ts`):** old framework (`isValid` functions,
not the current `[errorCode]: check` shape). `I_M_ContactEmailButAcceptedToBeContacted`
(contact email required if user opted in to be contacted) was **dropped in v2**
and has no v2 equivalent — **ported to core** as
`I_M_ContactEmailButWouldLikeToParticipateInOtherSurveys` (uses the
already-existing core `Interview.wouldLikeToParticipateInOtherSurveys` and
`Interview.contactEmail` attributes; email format itself stays covered
separately by `I_I_ContactEmail`).

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 2 | `I_I_accessCode_testCode` | **To port (config-driven)** | Flags a known "test" access code (`0000-0000`). Generic pattern; core would need a configurable list of reserved/test access codes. |
| 3 | `I_I_contactPhoneNumber` | **To port** | Phone number format validation (via `libphonenumber-js`) on `contactPhoneNumber`. `contactPhoneNumber` already exists on core `Interview`; core has a `TODO` comment for exactly this. |
| 3 | `I_I_helpContactPhoneNumber` | **To port** | Same phone-format validation for `helpContactPhoneNumber`, which also already exists on core `Interview`. |
| 1 | `I_M_assignedDate` | **In review** | Missing `assignedDate`. Generic; `assignedDate` already exists on core `Interview`. |
| - | `I_L_householdTripsDateMustMatchAssignedDate` | **Obsolete** | Cross-checks `household.tripsDate`  against `interview.assignedDate`. Core has no separate `household.tripsDate` to be inconsistent with. |
| 1 | `I_L_AtLeastOneTransitTripNeedsValidation` | **Project-specific** | Depends on the od_mtl transit-matching pipeline (`household.hasAtLeastOneTransitTripNeedingValidation()`, `config.transitTripValidationByAgency`) — same dependency as the Trip section's transit-matching block. |
| 2 | `I_L_interviewSectionHomeComplete` | **To port (config-driven)** | Info flag when the "home" section is complete. Needs a generic, configurable section-completion mechanism (`interview.getSectionCompletionStatus()` is currently an od_mtl-only helper). |
| 2 | `I_L_interviewSectionHouseholdMembersComplete` | **To port (config-driven)** | Same pattern for the "householdMembers" section. |
| 2 | `I_L_interviewSectionVisitedPlacesComplete` | **To port (config-driven)** | Same pattern for the "visitedPlaces" section. |
| 2 | `I_L_interviewSectionTripsComplete` | **To port (config-driven)** | Same pattern for the "trips" section. |
| 2 | `I_L_interviewSectionTravelBehaviorComplete` | **To port (config-driven)** | Same pattern for the "travelBehavior" section. |
| 2 | `I_L_interviewSectionEndComplete` | **To port (config-driven)** | Same pattern for the "end" section. |
| 2 | `I_L_interviewSectionHomeIncomplete` | **To port (config-driven)** | Inverse of `I_L_interviewSectionHomeComplete`, at `error` level. Same section-completion mechanism. |
| 2 | `I_L_interviewSectionHouseholdMembersIncomplete` | **To port (config-driven)** | Inverse, `error` level. |
| 2 | `I_L_interviewSectionVisitedPlacesIncomplete` | **To port (config-driven)** | Inverse, `warning` level. |
| 2 | `I_L_interviewSectionTripsIncomplete` | **To port (config-driven)** | Inverse, `warning` level. |
| 2 | `I_L_interviewSectionTravelBehaviorIncomplete` | **To port (config-driven)** | Inverse, `warning` level. |
| 2 | `I_L_interviewSectionEndIncomplete` | **To port (config-driven)** | Inverse, `warning` level. |
| 2 | `I_L_atLeastOnePersonCompletedVisitedPlaces` | **To port (config-driven)** | Info flag when at least one household member completed the "visitedPlaces" section. Needs per-person section-completion aggregation on top of the mechanism above. |
| 2 | `I_L_atLeastOnePersonCompletedTrips` | **To port (config-driven)** | Same pattern for "trips". |
| 2 | `I_L_atLeastOnePersonCompletedTravelBehavior` | **To port (config-driven)** | Same pattern for "travelBehavior". |

### Summary (Interview)

- To port (generic, possibly needs config/parameterization): 17
- Project-specific (od_mtl-only fields, contest/opt-in emails, transit-matching, strike): 6
- Skip: 0
- (Already in Evolution: 3 direct — `I_M_accessCode`, `I_I_accessCode`,
  `I_I_contactEmail`, plus 2 partial-equivalent date-range checks — excluded
  from the table above; core also has `I_M_Languages`, `I_M_StartedAt`,
  `I_I_HelpContactEmail` with no direct od_mtl_2023 equivalent)

### Open questions for porting (Interview)

- Section-completion mechanism: 15 of the 17 "to port" checks (6 complete +
  6 incomplete + 3 at-least-one-person) all depend on a single underlying
  concept — a configurable list of survey sections with a way to compute
  per-section (and per-person, for household surveys) completion status. This
  is the single highest-value generic mechanism to design here; the two
  `I_M_assignedDate`/phone-format checks are unrelated and much simpler to
  port on their own.
- Phone number validation: core `InterviewAuditChecks.ts` already has a
  `TODO` comment acknowledging phone format validation is missing. od_mtl's
  `libphonenumber-js` + hard-coded `'CA'` region approach is a reasonable
  starting point but the region should be configurable per project.
- Multi-survey-in-one-codebase pattern: `I_I_unknownSurveyOrDateOutsideRange`
  / `I_I_dateOutsideRange` show od_mtl_2023 hosting several distinct surveys
  (different shortnames, different date windows) from one codebase. Evolution
  core assumes one project config per deployment; nothing to port unless
  Evolution wants to support that multi-survey pattern generically.
- Test/reserved access codes: `I_I_accessCode_testCode` is a simple pattern
  (flag when access code matches a reserved value) that could generalize to
  a configurable list, similar to other config-driven enum/list checks in
  other sections.

---

## Home — `survey/src/admin/validations/homeV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/homeV2.validations.ts`
Evolution core: `checks/HomeAuditChecks.ts` (+ empty `HomeExtendedAuditChecks.ts`)

Note: this table lists only checks **not yet in Evolution**. The 4 already
covered in core are excluded (`HM_M_geography`, `HM_I_geographyNotInSurveyTerritory`,
`HM_I_preGeographyAndHomeGeographyMoreThan200MetersApart`,
`HM_I_preGeographyAndHomeGeographyMoreThan50MetersApart`).
od_mtl uses `version: 2`; Evolution core checks are `version: 1`.

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 3 | `HM_I_isNotInMtlLavalLongueuilButShould` | **Project-specific** | Depends on `mtlLavalLongueuil.json` + `home._isInMtlLavalLongueuil`. Could become a generic "point in/out of a named zone" check if core supports configurable zones. |
| 3 | `HM_I_isInMtlLavalLongueuilButShouldNot` | **Project-specific** | Same as above (inverse). |
| 3 | `HM_I_isNotInMtlIslandButShould` | **Project-specific** | Depends on `montrealIslandForCarParkingType.json` + `home._isInMtlIsland`. |
| 3 | `HM_I_isInMtlIslandButShouldNot` | **Project-specific** | Same (inverse). |
| 3 | `HM_I_isNotInCouronnesButShould` | **Project-specific** | Depends on `couronnes.json` + `home._isInCouronnes`. |
| 3 | `HM_I_isInCouronnesButShouldNot` | **Project-specific** | Same (inverse). |
| 2 | `HM_I_geographyInInaccessibleZone` | **To port (config-driven)** | Generic idea: flag geography inside an "inaccessible zone" polygon. od_mtl uses `inaccessibleZones.json`; core would need a configurable inaccessible-zone input. |
| 2 | `HM_M_postalCode` | **To port** | Missing postal code (warning). Generic. |
| 2 | `HM_I_postalCode` | **To port** | Postal code format regex (Canadian). Generic if regex configurable. |
| 2 | `HM_I_dwellingType` | **To port** | Dwelling type not in allowed values. Allowed values list is project attribute (`HMAttr.dwellingTypeValues`); core needs configurable enum. |
| 3 | `HM_I_preDataMunicipalityCode` | **Project-specific** | Depends on `quebecMunicipalityCodesMappingNames` lookup. |
| 3 | `HM_I_preDataGeocodingPrecision` | **To port** | preData geocoding precision not in allowed values. Allowed values are project attribute; core needs configurable enum. |
| 3 | `HM_I_preGeographyLastAction` | **To port** | preGeography lastAction not in allowed values. Same enum-config caveat. |
| 2 | `HM_I_accessCodeWasAssociatedWithMoreThanOneAddress` | **To port** | Flags `preData.unmatchedId === true`. Generic if Evolution's preData model exposes `unmatchedId`. |

### Summary (Home)

- To port (generic, possibly needs config/parameterization): 10
- Project-specific (custom geojson zones / lookups): 7
- (Already in Evolution: 4, excluded from the table above)

### Open questions for porting

- Several "allowed values" checks (`dwellingType`, `geocodingPrecision`,
  `preGeographyLastAction`) rely on project-defined enums. Core would need a
  config-driven allowed-values mechanism before porting.
- The "point in/out of named zone" checks (Mtl/Laval/Longueuil, Mtl Island,
  Couronnes) follow one pattern. A single generic, config-driven
  "point membership vs expected zone" check could replace all 6.
- `inaccessibleZones` and `regionNotQuebec` need configurable polygons/lists.

---

## Household — `survey/src/admin/validations/householdV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/householdV2.validations.ts`
Evolution core: `checks/HouseholdAuditChecks.ts` (+ empty `HouseholdExtendedAuditChecks.ts`)

Note: this table lists only checks **not yet in Evolution**. The 4 already
covered in core are excluded (`H_M_home`, `H_M_size`, `H_L_sizeMembersMismatch`,
and car-number range covered by `HH_I_CarNumber`).
od_mtl uses `version: 2`; Evolution core checks are `version: 1`.

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 2 | `H_L_twoWheelNumberConsistencyCheck` | **To port** | Same radio/specify pattern for two-wheel count. |
| 2 | `H_L_carNumberConsistencyCheck` | **To port** | Same radio/specify pattern for car count. |
| 2 | `H_I_homeAvailableBikesRadio` | **To port** | Value not in allowed values (`HAttr.homeAvailableBikesRadioValues`); core needs configurable enum. |
| 2 | `H_I_homeAvailableElectricBikesRadio` | **To port** | Value not in allowed values; configurable enum. |
| 2 | `H_L_homeAvailableBikesAndElectricBikesConsistencyCheck` | **Project-specific** | Hard-coded values (`bikes === '1' && eBikes === '2+'`); depends on od_mtl coding. |
| 3 | `H_I_atLeastOnePersonWithDisability` | **To port** | Value not in `yesNoRefusalValues`; configurable enum. |
| 2 | `H_M_carsharingUsageInTheLast6Months` | **Project-specific** | Required only inside `mtlLavalLongueuil.json` and only for od_mtl surveys (shortname check). |
| 3 | `H_I_carsharingUsageInTheLast6Months` | **To port** | Value not in `yesNoDontKnowValues`; configurable enum. |
| 2 | `H_M_bikesharingUsageInTheLast6Months` | **Project-specific** | Same geojson + shortname gating as carsharing missing check. |
| 3 | `H_I_bikesharingUsageInTheLast6Months` | **To port** | Value not in `yesNoDontKnowValues`; configurable enum. |
| 2 | `H_L_electricCarNumberShouldBeLessOrEqualToCarNumber` | **To port** | electricCarNumber > carNumber. Generic. |
| 2 | `H_L_pluginHybridCarNumberShouldBeLessOrEqualToCarNumber` | **To port** | pluginHybridCarNumber > carNumber. Generic. |
| 2 | `H_L_pluginHybridCarNumberPlusElectricCarShouldBeLessOrEqualToCarNumber` | **To port** | electric + plugin hybrid > carNumber. Generic. |
| 3 | `H_I_incomeLevel` | **To port** | Value not in `HAttr.incomeLevelValues`; configurable enum (project-coded income brackets). |
| 2 | `H_I_ownership` | **To port** | Value not in `HAttr.ownershipValues`; configurable enum. |
| 3 | `H_I_bedroomsCountMoreThan2PerPerson` | **To port** | bedroomsCount / size > 2 warning. Threshold configurable. |
| 2 | `H_M_carParkingsPrivate` | **Project-specific** | Missing when car > 0, gated by `montrealIslandForCarParkingType.json` + od_mtl shortnames. |
| 2 | `H_M_carParkings` | **Project-specific** | Pilote-only (array form), gated by geojson + shortnames. |
| 2 | `H_M_carParkingsResidentialSticker` | **Project-specific** | Gated by geojson + od_mtl shortnames. |
| 1 | `H_L_missingCarDriverTrips` | **To port** | carPassenger segment without a matching car-driver trip in the same household (time/distance thresholds). Generic but complex; thresholds configurable. |
| 2 | `H_L_carDriverSegmentWithNoHouseholdCar` | **To port** | carNumber 0 but a member has a car-driver segment and no carsharing membership. Generic. |

### Summary (Household)

- To port (generic, possibly needs config/parameterization): 21
- Project-specific (custom geojson zones / shortnames / coded values): 6
- Skip (no Evolution equivalent / nothing to audit): 1 (`H_I__interviewablePersonsCount`)
- (Already in Evolution: 4, excluded from the table above; core also has
  `HH_I_Size`, `HH_M_CarNumber`, `HH_L_CarNumberVehiclesCountMismatch` with no
  direct od_mtl equivalent in this file)

### Open questions for porting (Household)

- `validateIntegerRadioSpecify` is a reusable "integer vs radio vs specify"
  consistency helper used by 3 checks. It should move to core as a shared util.
- Many checks validate a value against a project-defined enum
  (`incomeV1/V2`, `ownership`, bikes radios, yes/no variants). Same config-driven
  allowed-values need as in Home.
- `H_M_carsharing/bikesharing` and `H_M_carParkings*` mix a generic "missing
  required field" rule with project gating (geojson zone + survey shortname).
  Only the generic core could be ported; the gating stays project-side.

---

## Person — `survey/src/admin/validations/personV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/personV2.validations.ts`
Evolution core: `checks/PersonAuditChecks.ts` (+ empty `PersonExtendedAuditChecks.ts`)
Tests: `checks/__tests__/person/P_M_Age.test.ts` only (plus runner integration in `PersonAuditChecks.test.ts`)

Note: this table lists only checks **not yet in Evolution**. Excluded from the
table: `P_M_age` → core `P_M_Age`; `P_I_age` and `P_I_ageNegative` → covered by
`Person.validateParams` (`isPositiveInteger('age')`) and surfaced as audits via
`convertParamsErrorsToAudits`; `P_I_ageTooHigh` → core `P_I_AgeTooHigh`;
`P_I_VeryOldAge` → core `P_W_VeryOldAge` (warning when age ≥ `minReviewPersonAge`, default 100–125).
Invalid age prevents person creation in the survey object tree. od_mtl uses `version: 2`/`3`;
Evolution core checks are `version: 1`. od_mtl uses lowercase suffixes
(`P_M_age`); Evolution uses PascalCase (`P_M_Age`).

**v1 notes (not duplicated below):** `P_I_Age` was split into `P_I_age`,
`P_I_ageNegative`, `P_I_ageTooHigh`; the first two are covered in Evolution by
`Person.validateParams` (see exclusion note above); `P_I_ageTooHigh` → core
`P_I_AgeTooHigh` + `P_W_VeryOldAge` (warning). `P_I_VeryOldAge` (>100 warning) replaced by
`P_I_ageTooHigh` (>115) in od_mtl v2; core uses 125 max and 100–125 warning. `P_M_DidTripsOnTripsDate` renamed to
`P_M_personDidTrips`. v1-only checks **dropped from v2** (not in table):
`P_I_DrivingLicenseOwnerTooYoung`, `P_I_DrivingLicenseOwnerEmpty`,
`P_I_TransitPassOwnershipTooYoung`, `P_I_TransitPassOwnershipEmpty`,
`P_M_TransitPassesForOwner`, `P_I_DidNoTripsButTrips`,
`P_I_DidTripsButNoVisitedPlaces`, `P_I_DidTripsButNoTrips`,
`P_I_DidTripsButTooYoung`, `P_I_VisitedPlacesTripsCountMismatch`,
`P_M_UsualWorkPlaceName`, `P_M_UsualWorkPlaceGeography`, `P_M_UsualSchoolPlace`,
`P_M_UsualSchoolPlaceName`, `P_M_UsualSchoolPlaceGeography`,
`P_I_RetiredTooYoung`, `P_I_WorkerTooYoung`, `P_I_Proxy`, `P_M_WorkOnTheRoad`,
`P_I_WorkOnTheRoad`.

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 2 | `P_M_sequence` | **To port** | Missing `_sequence`. Generic ordering check on Person. |
| 1 | `P_M_gender` | **To port** | Gender required when age ≥ 5 (uses `ageCompare`). Needs shared age-threshold helper accepting `age` or `ageGroup`. |
| 2 | `P_M_usedTransitInLast30Days` | **Project-specific** | Required only for `od_mtl_2023` / `od_mtl_ete_2023` shortnames. Field not on core `Person` (`transitPassOwnership` exists instead). |
| 1 | `P_M_drivingLicenseOwner` | **To port** | `drivingLicenseOwnership` required when age ≥ 16. Generic. |
| 1 | `P_M_transitPassOwnership` | **To port** | `transitPassOwnership` required when age ≥ 6. Generic. |
| 2 | `P_I_transitPassesDontKnow` | **Project-specific** | `transitPasses` multi-select: `dontKnow` combined with other values. Mtl V1 attribute. |
| 2 | `P_I_transitPassesNone` | **Project-specific** | `none` combined with other values in `transitPasses`. |
| 2 | `P_I_transitPasses` | **Project-specific** | Value not in `transitPassValuesMtl`. Project enum. |
| 2 | `P_I_transitPassTypesDontKnowNoSingleElement` | **To port** | Generic multi-select rule: exclusive sentinel (`dontKnow`/`no`) must be alone. Reusable helper. |

| 2 | `P_I_bixiBikesharingUsage` | **Project-specific** | - |
| 2 | `P_I_bikeOwnership` | **To port** | Value not in `yesNoDontKnowValues`. Field not on core `Person` today; generic enum check. |
| 1 | `P_I_canRemoteWork` | **Project-specific** | od_mtl `canRemoteWorkValues`; core has `hasTelecommuteCompatibleJob` (different attribute/semantics). |
| 1 | `P_I_communautoFlexCarsharingUsage` | **Project-specific** | Communauto-specific enum. |
| 1 | `P_I_daysAtOfficePerWeek` | **Project-specific** | od_mtl hybrid-work enum. |
| 2 | `P_I_disabilities` | **Project-specific** | Array values against `disabilityValues` (od_mtl list). |
| 1 | `P_I_doesNotStudyFromFixedLocationReason` | **Project-specific** | od_mtl enum. |
| 1 | `P_I_educationalAttainment` | **To port** | Value not in allowed list. `educationalAttainmentValues` exists in evolution-common. |
| 2 | `P_I_electricBikeOwnership` | **To port** | `yesNoDontKnow` allowed-values check. Generic. |
| 1 | `P_I_enrolledInSchool` | **Project-specific** | od_mtl `enrolledInSchoolValues`. |
| 1 | `P_I_everUsedBixiBikesharingServices` | **Project-specific** | Bixi-specific attribute. |
| 1 | `P_I_everUsedCommunautoFlexCarsharingServicesAsADriver` | **Project-specific** | Communauto-specific attribute. |
| 1 | `P_I_freeParkingAtSchool` | **Project-specific** | od_mtl `freeParkingValues`. |
| 1 | `P_I_freeParkingAtWork` | **Project-specific** | Same. |
| 1 | `P_I_hasDisability` | **To port** | Value not in `yesNoPreferNotToAnswerValues`. Core `Person` has `hasDisability` typed as `YesNoDontKnowPreferNotToAnswer`. Check consistent with household value if size > 1 |
| 1 | `P_I_jobActivitySector` | **Project-specific** | od_mtl `jobActivitySectorValues`. Core has `jobCategory` as free string. |
| - | `P_I_jobCategory` | **To port** | Invalid enum value. Core `JobCategory` is `string \| dontKnow \| nonApplicable`; strict enum validation would be config-driven. |
| 1 | `P_I_jobCompatibleWithTelecommuting` | **To port** | Maps conceptually to core `hasTelecommuteCompatibleJob` (`yesNoDontKnow` pattern). |
| 1 | `P_I_jobHoursFlexibility` | **Project-specific** | od_mtl enum. |
| 1 | `P_I_jobHoursSchedulesType` | **Project-specific** | od_mtl enum. |
| 3 | `P_I_mobilityAssistiveDevices` | **Project-specific** | od_mtl assistive-device enum list. |
| 3 | `P_I_mostUsedMobilityAssistiveDevice` | **Project-specific** | Same enum. |
| 2 | `P_I_noSchoolTripReason` | **To port** | Versioned od_mtl reason codes. |
| 2 | `P_I_noUsualSchoolPlaceReason` | **To port** | `noUsualSchoolPlaceReasonValues` exists in evolution-common. |
| 2 | `P_I_noWorkTripReason` | **To port** | Versioned od_mtl reason codes. |
| 1 | `P_I_occupation` | **To port** | occupation enum. |
| 1 | `P_I_remoteStudyDays` | **Project-specific** | Weekday array vs `weekDaysNoPreferNotToAnswerValues`. Core `Journey` uses `WeekdaySchedule` object, different shape. |
| 1 | `P_I_remoteWorkDays` | **Project-specific** | Same weekday-array pattern. |
| 1 | `P_I_schoolType` | **To port** | `schoolTypeValues` in evolution-common. |
| 1 | `P_I_previousWeekNoWorkingDaysReasons` | **Project-specific** | od_mtl `PreviousWeekNoWorkingDaysReasonValues`. |
| 1 | `P_I_studiesFromFixedLocation` | **Project-specific** | yes/no field; core uses `schoolPlaceType` (`onLocation`/`hybrid`/`remote`) — different semantics. |
| - | `P_I_transitPassTypes` | **Project-specific** | od_mtl `transitPassTypeValues`. |
| - | `P_I_transitFaresUsed` | **Project-specific** | od_mtl `transitFareUsedValues`. |
| 1 | `P_I_travelToStudyDays` | **Project-specific** | Weekday array enum; no direct core equivalent. |
| 1 | `P_I_travelToWorkDays` | **Project-specific** | Same. |
| 1 | `P_I_useBikeForUtilitarianTravel` | **To port** | `yesNoDontKnow` allowed-values. Generic. |
| 1 | `P_I_usedBixiBikesharingServicesInLast30Days` | **Project-specific** | Bixi-specific usage fields. |
| 1 | `P_I_usedBixiBikesharingServicesInLast6Months` | **Project-specific** | Bixi-specific usage fields. |
| 1 | `P_I_usedCommunautoCarsharingServicesAsADriverInLast6Months` | **Project-specific** | Communauto-specific; core has generic `carsharingUser` instead. |
| 1 | `P_I_usedTransitInLast30Days` | **Project-specific** | Validates od_mtl `usedTransitInLast30Days`; not on core `Person`. |
| 1 | `P_I_useParatransit` | **To port** | `yesNoDontKnowPreferNotToAnswer` allowed-values. Generic. |
| 2 | `P_I_usualSchoolPlaceParkingType` | **Project-specific** | od_mtl parking-type enum. |
| 2 | `P_I_usualWorkPlaceParkingType` | **Project-specific** | Same. |
| 1 | `P_I_usualWorkPlaceUsageAtLeastOnceAWeek` | **Project-specific** | od_mtl hybrid-work enum. |
| 1 | `P_I_workTripsDaysCountPerWeek` | **Project-specific** | od_mtl count enum. |
| 1 | `P_M_usualWorkPlace` | **To port** | Missing work place when `shouldHaveAUsualWorkPlace()` (worker logic + `workPlaces` array). Generic concept; logic currently in od_mtl `Person` class methods. |
| 1 | `P_L_workerWithNoWorkTrip` | **To port** | Info when worker should have work trip on `tripsDate` but doesn't. Complex business rules (`shouldAskForNoWorkTripReason`); needs worker/tripsDate helpers. |
| 1 | `P_L_studentWithNoSchoolTrip` | **To port** | Info when student should have school trip but doesn't. Same pattern as worker check. |
| 1 | `P_L_departureOfDayNotHomeOrCompatibleActivity` | **To port (config-driven)** | First VP activity should be home-compatible. od_mtl hard-codes acceptable activities; core needs configurable list. |
| 1 | `P_L_arrivalOfDayNotHomeOrCompatibleActivity` | **To port (config-driven)** | Last VP activity should be home-compatible. Same. |
| 2 | `P_L_visitedPlacesSectionIncomplete` | **To port** | `isCompleteVisitedPlaces() === false`. Needs completeness helper on Journey (or person wrapper). |
| 2 | `P_L_tripsSectionIncomplete` | **To port** | `isCompleteTrips() === false`. Same. |

### Summary (Person)

- To port (generic, possibly needs config/parameterization or Journey relocation): 33
- Project-specific (od_mtl enums, shortname gating, Montreal services, versioned attributes): 70
- Skip: 0
- (Already in Evolution: 5 — `P_M_age` → `P_M_Age`; `P_I_age` and `P_I_ageNegative`
  → `Person.validateParams` + `convertParamsErrorsToAudits`; `P_I_ageTooHigh` →
  `P_I_AgeTooHigh`; `P_I_VeryOldAge` → `P_W_VeryOldAge`; excluded from the table
  above; core does not yet accept `ageGroup` as a substitute for missing `age`)

### Open questions for porting (Person)

- `ageCompare` helper: many od_mtl checks use `person.ageCompare(threshold)`
  (handles `age` or `ageGroup`). Core `P_M_Age` only tests numeric `age`. A
  shared `ageCompare` (or equivalent) in evolution-common is a prerequisite for
  porting age-gated missing/invalid checks.
- Person vs Journey object model: od_mtl attaches `personDidTrips`, visited
  places, and trips directly to Person. Evolution nests them under `Journey`
  (`didTrips`, `_visitedPlaces`, `_trips`). Sequence/time/completeness logic
  checks (`P_L_*`, `P_M_personDidTrips`, `P_I_personDidTrips*`) likely belong in
  `JourneyAuditChecks.ts`, not `PersonAuditChecks.ts`.
  `PersonAuditCheckContext` has no `journey` today.
- Exclusive-sentinel multi-select pattern: `P_I_transitPassTypesDontKnowNoSingleElement`
  plus the transit-pass `dontKnow`/`none`/`no` variants share one rule (sentinel
  value must be the only selection). Worth one reusable helper.
- Configurable allowed-values: dozens of `P_I_*` checks are structurally
  identical (field not in enum). Same config-driven enum mechanism needed as
  Home/Household.
- v1 checks dropped from v2: coherence checks (`P_I_DidNoTripsButTrips`,
  `P_I_DidTripsButNoVisitedPlaces`, `P_I_DidTripsButNoTrips`,
  `P_I_VisitedPlacesTripsCountMismatch`, age-occupation warnings, inverse
  license/transit checks) were removed in v2 but may still be worth generic
  Journey-level checks in Evolution.
- `shouldHaveAUsualWorkPlace` / `shouldAskForNo*TripReason`: complex od_mtl
  `Person` class methods gate `P_M_usualWorkPlace`, `P_L_workerWithNoWorkTrip`,
  `P_L_studentWithNoSchoolTrip`. Porting needs worker/student classification
  helpers on evolution-common `Person` (from `occupation`/`workerType`/`studentType`)
  plus business-day logic.
- Montreal-specific block: Bixi, Communauto, Mtl/QC transit-pass variants
  (`transitPassesV1/V2/QC`, `P_I_transitPassesWrongSurvey`) form a coherent
  project-only cluster — keep in od_mtl unless core gains survey-configurable
  service modules.
- `personDidTripsChangeConfirm`: referenced in v2 but absent from core `Journey`
  model. Confirm-match checks need a model decision before porting.

---

## Journey — no dedicated od_mtl_2023 validation file

od_mtl_2023 has no `journeyV2.validations.ts` (or v1 equivalent): its data
model attaches trip-diary fields (`personDidTrips`, visited places, trips)
directly to `Person`, whereas Evolution nests these under a `Journey` object
per person. There is nothing to directly compare against
`checks/JourneyAuditChecks.ts` (currently only `J_M_StartDate`) /
`JourneyExtendedAuditChecks.ts` (empty).

However, several `personV2.validations.ts` checks listed in the Person table
above are functionally journey-level in Evolution's object model and are the
real candidates for `JourneyAuditChecks.ts` once `JourneyAuditCheckContext`
exposes what's needed (it already has `journey` and `person`):

| 1 | `J_M_personDidTrips` | **To port** | Missing `personDidTrips` when interviewable (≥ `interviewableMinimumAge` / core `interviewableAge`). In Evolution, `didTrips` lives on `Journey` — likely a Journey missing check, not Person (see Journey section below). |
| 1 | `J_I_personDidTrips` | **To port** | Value not in `yesNoDontKnowValues`. Same `didTrips` / Journey model caveat. |
| - | `J_I_didTripsOnTripsDate` | **To port** | - |
| 1 | `J_I_departurePlaceIsHome` | **To port** | - |
| 1 | `J_L_departurePlaceIsHomeConfirmMustMatchDeparturePlaceIsHome` | **To port** | Cross-field match on departure attributes. |
| 2 | `J_I_departurePlaceOther` | **Project-specific** | Value not in `departurePlaceOtherValues` (enum). |
| 1 | `J_L_departurePlaceTypeIsHomeMatch` | **Project-specific** | `departurePlaceType` vs `departurePlaceIsHome` coherence; od_mtl fields. |
| 1 | `J_I_personDidTripsChangeConfirm` | **To port** | Value not in `yesNoValues`. Confirm field absent from core `Journey` model today. |
| 1 | `J_L_personDidTripsConfirmMatch` | **To port** | `personDidTripsChangeConfirm` must match `personDidTrips`. Generic confirm-match pattern; Journey model gap. |
| 1 | `J_L_invalidVisitedPlaceSequences` | **To port** | Visited-place `_sequence` must be 1..n. Generic; in Evolution belongs on `Journey` (VP/trips nested under journey, not person). See Journey section. |
| 1 | `J_L_invalidTripSequences` | **To port** | Trip `_sequence` must be 1..n after sort. Same Journey-target caveat. |
| 1 | `J_L_visitedPlacesSequentialTimes` | **To port** | Departure time of VP *i−1* must not be after arrival time of VP *i*. Generic temporal ordering. |
| 1 | `J_L_firstLastVisitedPlaceTimesWithWrongTime` | **To port** | First VP must not have arrival time; last VP must not have departure time. Generic. |
| 1 | `J_N_noTrip` | **To port** | Info-level flag when `personDidTrips === 'no'`. Generic reviewer hint. |

### Open questions for porting (Journey)

- `PersonAuditCheckContext` currently has no `journey` field, while
  `JourneyAuditCheckContext` already exposes `journey` and `person` — moving
  the checks above to `JourneyAuditChecks.ts` seems like the more natural fit
  than adding journey traversal to person checks.
- Needs the same `_sequence`/temporal-ordering/completeness helpers noted in
  the Person section (shared with `VisitedPlace`/`Trip` sections below).

---

## Visited Place — `survey/src/admin/validations/visitedPlaceV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/visitedPlaceV2.validations.ts`
Evolution core: `checks/VisitedPlaceAuditChecks.ts` (+ empty `VisitedPlaceExtendedAuditChecks.ts`)

Note: this table lists only checks **not yet in Evolution**. The 2 already
covered in core are excluded (`VP_M_geography` → `VP_M_Geography`,
`VP_I_geography` → `VP_I_Geography`). od_mtl uses `version: 2`; Evolution core
checks are `version: 1`. od_mtl v2 uses camelCase suffixes; Evolution uses
PascalCase (`VP_M_Geography`).

**Partial-equivalence note:** od_mtl `VP_M_geography` skips loop activities
(`visitedPlace.isLoop()`); Evolution `VP_M_Geography` flags any missing
geography with no loop exemption. Worth aligning when hardening the core check
(Evolution has `isLoopActivity()` in `odSurvey/helpers.ts`).

**v1 → v2 renames only:** `VP_M_Geog` → `VP_M_geography`, `VP_I_Geog` →
`VP_I_geography`. **v1 checks absent from v2** (not duplicated below):
`VP_I_DepartureOfDayNotHome`, `VP_I_ArrivalOfDayNotHome`, `VP_I_RepeatedHome`,
`VP_M_DepartureTime`, `VP_M_ArrivalTime`, `VP_I_DepartureTimeTooHigh` (28h
threshold in v1 vs 29h in v2), `VP_I_InversedDepartureTimes`,
`VP_I_InversedArrivalTimes`, `VP_I_InversedArrivalDepartureTimes`,
`VP_I_InversedPrevDepartureArrivalTimes`, `VP_I_SchoolActivityTooShort`,
`VP_M_Activity`, `VP_I_ActivityIncompatibleWithAge`,
`T_I_DepartureTimeForSchoolTooEarly`.

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 1 | `VP_I_previousArrivalTimeTooHigh` | **To port** | Flags `_previousArrivalTime >= 29*3600`. Generic max-time bound; field is questionnaire metadata (not on typed `VisitedPlace`, lives in response/customAttributes). |
| 1 | `VP_I_previousDepartureTimeTooHigh` | **To port** | Same pattern for `_previousDepartureTime`. |
| 1 | `VP_I_previousPreviousDepartureTimeTooHigh` | **To port** | Same pattern for `_previousPreviousDepartureTime`. |
| 1 | `VP_I_arrivalTimeTooHigh` | **To port** | Same pattern for `arrivalTime`. Evolution typed model uses `startTime`/`endTime`; port needs arrival↔start mapping. |
| 1 | `VP_I_departureTimeTooHigh` | **To port** | Same for `departureTime` (→ `endTime` in core objects). v1 used 28h here; v2 uses 29h — threshold should be configurable. |
| 1 | `VP_I_activity` | **To port** | Value not in `VPAttr.activityValues`. core would validate `activity` (or a configured attribute) against a configurable allowed-values enum. |
| 1 | `VP_I_nextPlaceCategory` | **To port** | Value not in `VPAttr.nextPlaceCategoryValues`. Field exists in questionnaire data but not on typed `VisitedPlace`; needs customAttributes access or model extension. |
| 1 | `VP_I_onTheRoadArrivalType` | **To port** | Value not in `VPAttr.onTheRoadArrivalTypeValues`. On-the-road questionnaire metadata; same customAttributes caveat. |
| 1 | `VP_I_onTheRoadDepartureType` | **To port** | Value not in `VPAttr.onTheRoadDepartureTypeValues`. Same. |
| 1 | `VP_L_isGeocodingImprecise` | **To port** | Warning when geocoding marked imprecise. od_mtl reads top-level `visitedPlace.isGeocodingImprecise`; Evolution questionnaire sets `geography.properties.isGeocodingImprecise` — port must agree on canonical location. |
| 1 | `VP_M_sequence` | **To port** | Missing `_sequence`. Generic; `_sequence` already exists on Evolution `VisitedPlace`. |
| 1 | `VP_L_arrivalDepartureTimeSequential` | **To port** | `arrivalTime > departureTime`. Generic logical error; map to `startTime`/`endTime` in core. v1 `VP_I_InversedArrivalDepartureTimes` had a `dropFetchSomeone` equal-time exception; v2 does not. |
| 1 | `VP_L_activityLessThan30MinDurationPossibleMismatch` | **To port** | Warning when duration < 30 min for `home`, `workUsual`, `schoolUsual`. Generic duration-vs-activity mismatch; activities list and threshold should be configurable. |

### Summary (Visited Place)

- To port (generic, possibly needs config/parameterization): 16
- Project-specific (od_mtl shortname / dual-schema gating): 2
- Skip: 0
- (Already in Evolution: 2 — `VP_M_geography`/`VP_M_Geography`,
  `VP_I_geography`/`VP_I_Geography`, excluded from the table above)

### Open questions for porting (Visited Place)

- Time field naming: od_mtl v2 audits `arrivalTime`/`departureTime` and
  `_previous*` metadata; Evolution `VisitedPlace` exposes `startTime`/`endTime`.
  Need a shared accessor or explicit mapping before porting the 5 "time too
  high" checks and `VP_L_arrivalDepartureTimeSequential`.
- The five "time too high" checks share one pattern (if field defined and
  ≥ maxSeconds, flag). A single configurable helper (`fieldName`,
  `maxSeconds = 29*3600`) could replace all five; v1 used 28h for departure only.
- Questionnaire metadata on typed objects: `_previousArrivalTime`,
  `_previousDepartureTime`, `_previousPreviousDepartureTime`,
  `nextPlaceCategory`, `onTheRoadArrivalType`, `onTheRoadDepartureType` are
  metadata-only on `VisitedPlace`. Audits may need `customAttributes`, raw
  response access, or a model extension before enum/time checks work in core.
- Allowed-values checks (`activityV1/V2`, `activityPreV1/V2`,
  `nextPlaceCategory`, on-the-road types) follow the same config-driven enum
  pattern as Home/Household. Core likely wants one generic "attribute not in
  allowedValues" mechanism rather than eight near-identical checks.
- Dual activity schema: `activityV1`/`activityV2` + wrong-survey checks are
  od_mtl migration artifacts. Generic core should probably audit a normalized
  `activity` with one enum config; the two wrong-survey checks stay
  project-side.
- `isGeocodingImprecise` location: reconcile top-level visited-place flag
  (od_mtl admin object) vs `geography.properties.isGeocodingImprecise`
  (Evolution questionnaire widgets).
- Loop-activity geography exemption: `VP_M_geography` and several v1 checks
  respect loop activities (`workOnTheRoad`, `leisureStroll`, etc.). Any ported
  missing-geography or time logic should reuse `isLoopActivity()` consistently.
- v1 checks dropped in v2 may still be worth porting separately: missing
  arrival/departure on non-first/last places (`VP_M_ArrivalTime`,
  `VP_M_DepartureTime`), cross-place sequential time order (4 "Inversed*"
  checks), first/last-of-day activity warnings, repeated home, activity vs age,
  school departure before 4h. These need journey-level context (sibling
  visited places, person age) — `VisitedPlaceAuditCheckContext` already
  provides `journey` and `person`.

---

## Trip — `survey/src/admin/validations/tripV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/tripV2.validations.ts`
Evolution core: `checks/TripAuditChecks.ts` (+ empty `TripExtendedAuditChecks.ts`)

Note: no tripV2 checks are already in Evolution core. Evolution defines only
`T_M_Segments` (missing segments), which has no tripV2 equivalent.

**v1 note (`trip.validations.ts`):** v2 split `T_M_OriginOrDestination` into
`T_M_missingOrigin` + `T_M_missingDestination`. v1 bird-speed checks
(`T_I_BirdSpeedTooFast`, `T_I_BirdSpeedTooLow`, commented
`T_I_BirdSpeedNotInValidRange`) were consolidated into `T_L_speedNotInRange`.
v1 checks **not carried into v2** (may still be worth porting separately from
v1): `T_I_PublicPrivateTransferGeog`, `T_I_OriginTooCloseToDestination`,
`T_I_OriginTooCloseToPublicPrivateTransferLocation`,
`T_I_DestinationTooCloseToPublicPrivateTransferLocation`,
`T_I_TransferLocationExistsWithoutPublicPrivateTransfer`,
`T_I_WalkingBirdDistanceGreaterThan3km`, `T_I_OriginOrDestinationGeog`,
`T_I_RepeatedParatransitMode`, `T_M_Modes` (rough Evolution equivalent:
`T_M_Segments`, already in core).

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 1 | `T_M_missingOrigin` | **To port** | Missing origin/start place. Generic; Evolution `Trip.startPlace`. |
| 1 | `T_M_missingDestination` | **To port** | Missing destination/end place. Generic; Evolution `Trip.endPlace`. |
| 1 | `T_I_negativeDuration` | **To port** | Arrival before departure. Generic; Evolution `startTime`/`endTime` (or derived from places). |
| 1 | `T_M_departureTime` | **To port** | Missing departure time. od_mtl reads from origin visited place; Evolution may use `startTime` or `startPlace.endTime`. |
| 1 | `T_M_arrivalTime` | **To port** | Missing arrival time. Same pattern as departure; Evolution `endTime` or `endPlace.startTime`. |
| 1 | `T_M_sequence` | **To port** | Missing trip `_sequence`. Generic ordering field on Evolution `Trip`. |
| 1 | `T_L_invalidSegmentSequences` | **To port** | Segment `_sequence` not 1..n after sort. Same pattern as `HH_L_InvalidPersonSequences`; trip iterates child segments. |
| 2 | `T_L_transitTripNoMatch` | **Project-specific** | Audits `transitMatching.matchType === undefined` on cached `transitDeclaredTrip`/`transitMatching`. No equivalent fields in Evolution core. |
| 2 | `T_L_transitTripPartialMatch` | **Project-specific** | Umbrella partial-match info audit on `transitMatching.matchType`. Depends on od_mtl transit-matching pipeline. |
| 2 | `T_L_transitTripPartialMatchType_same_lines_same_order_same_stations_different_order` | **Project-specific** | Info tag for a specific `matchType` enum value. Hard-coded od_mtl transit-matching taxonomy. |
| 2 | `T_L_transitTripPartialMatchType_same_lines_different_order_same_stations_same_order` | **Project-specific** | Same as above (different `matchType`). |
| 2 | `T_L_transitTripPartialMatchType_same_lines_different_order_same_stations_different_order` | **Project-specific** | Same as above (different `matchType`). |
| 2 | `T_L_transitTripPartialMatchType_same_lines_same_order_different_stations` | **Project-specific** | Same as above (different `matchType`). |
| 2 | `T_L_transitTripPartialMatchType_same_lines_same_order_different_stations_but_next_or_previous` | **Project-specific** | Same as above; treated as "complete enough" in other checks. |
| 2 | `T_L_transitTripPartialMatchType_same_lines_different_order_different_stations` | **Project-specific** | Same as above (different `matchType`). |
| 2 | `T_L_transitTripMatch` | **Project-specific** | Info when `matchType === 'complete'`. Cached transit-matching output. |
| 2 | `T_L_transitTripMatchFirstAlternative` | **Project-specific** | Info when earliest matching alternative selected (`isMatchingAlternativeEarliest`). Cached transit-matching output. |
| 1 | `T_L_hasTransitSegment` | **Project-specific** | Info tag when trip has transit segment. Logic is generic (`hasTransit()`), but used as od_mtl transit-review filter label. |
| 2 | `T_L_transitNoMatchReason_at_least_one_undefined_line_or_station` | **Project-specific** | Audits `transitMatching.noMatchReason` enum. Cached validation output. |
| 2 | `T_L_transitNoMatchReason_at_least_one_other_line_or_station` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_at_least_one_dontKnow_line_or_station` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_at_least_one_subway_or_train_no_possible_route` | **Project-specific** | Same `noMatchReason` pattern (error level). |
| 2 | `T_L_transitNoMatchReason_at_least_one_integrated_school_bus_line` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_at_least_one_taxibus_bus_line` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_bimodal_not_yet_implemented` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_no_routing_found` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_routing_error` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitNoMatchReason_no_match_found` | **Project-specific** | Same `noMatchReason` pattern. |
| 2 | `T_L_transitDeclaredUsed_stm` | **Project-specific** | Hard-coded STM agency acronym in `transitDeclaredTrip.agencyAcronyms`. Montreal operator set. |
| 2 | `T_L_transitDeclaredUsed_stl` | **Project-specific** | Hard-coded STL agency acronym. |
| 2 | `T_L_transitDeclaredUsed_rtl` | **Project-specific** | Hard-coded RTL agency acronym. |
| 2 | `T_L_transitDeclaredUsed_exo` | **Project-specific** | Hard-coded EXO agency acronym. |
| 2 | `T_L_transitDeclaredUsed_rem` | **Project-specific** | Hard-coded REM agency acronym. |
| 1 | `T_L_speedNotInRange` | **To port** | Bird-speed and optional routing-duration plausibility vs mode. Generic but complex; needs configurable `birdSpeedKphRangeByMode`, short-trip exemptions, and optional `travelTimeByMode`/routing comparison. |

### Summary (Trip)

- To port (generic, possibly needs config/parameterization): 8
- Project-specific (transit matching pipeline, agency acronyms, review workflow): 36
- Skip: 0
- Already in Evolution: 0 (core has `T_M_Segments` only; no tripV2 equivalent)

### Open questions for porting (Trip)

- Transit matching block (36 checks): all depend on od_mtl validation-time
  cached fields (`transitDeclaredTrip`, `transitMatching`,
  `transitAgenciesDidAudit`, `travelTimeByMode`) that Evolution core does not
  model. Porting would require a generic transit-matching extension layer
  first, or these stay in od_mtl.
- Partial-match / noMatchReason proliferation: eight `matchType` checks + one
  umbrella + nine `noMatchReason` checks could collapse into one or two
  parameterized checks driven by config enums, if core ever supports transit
  matching.
- Agency acronym checks: `stm`/`stl`/`rtl`/`exo`/`rem`/`mtmd`/`artm` are
  hard-coded Montreal-area operators; a generic version would need a
  configurable agency list + `transitTripValidationByAgency` flag.
- `T_L_speedNotInRange`: needs shared configurable `birdSpeedKphRangeByMode`
  (from od_mtl `speedAndDistanceRangesByMode`), short-distance exemptions
  (ARTM 20 min / 1 km), multimode→`other` aggregation, transit+walk aggregate
  mode, and optional routing-duration comparison (`travelTimeByMode`,
  congestion factor for driving ≤70 km). v1's simpler bird-speed checks were
  dropped from v2 in favour of this one.
- Time semantics: od_mtl `getDepartureTime()`/`getArrivalTime()` come from
  origin/destination visited places; Evolution uses `Trip.startTime`/`endTime`
  with `setupStartAndEndTimes()` fallback — port must align which source is
  authoritative.
- v1-only checks dropped from v2: junction/proximity/paratransit/geo checks
  (`T_I_OriginTooCloseToDestination`, transfer-location checks,
  `T_I_RepeatedParatransitMode`, etc.) are not in tripV2 but may still be worth
  porting from v1 into core separately.
- Missing segments: Evolution already has `T_M_Segments`; tripV2 dropped v1's
  `T_M_Modes`. Consider whether od_mtl should rely on core `T_M_Segments`
  instead of re-adding.

---

## Segment — `survey/src/admin/validations/segmentV2.validations.ts`

Source: `/Users/admin/ws/od_mtl_2023-fork/survey/src/admin/validations/segmentV2.validations.ts`
Evolution core: `checks/SegmentAuditChecks.ts` (+ empty `SegmentExtendedAuditChecks.ts`)

Note: this table lists only checks **not yet in Evolution**. The 1 already
covered in core is excluded (`S_M_mode` → Evolution `S_M_Mode`). od_mtl uses
`version: 2`; Evolution core checks are `version: 1`.

**v1-only checks dropped in v2** (not in table): `S_I_SchoolBusModeForOlderThan17`,
`S_I_ModeCarDriverYoungerThan16`, `S_I_ModeCarDriverYoungerWithoutLicense`,
`S_I_CarDriverNotInHousehold`, `S_I_CarDriverWithoutDrivingLicense`,
`S_I_VehicleOccupancy` (occupancy set when mode is not car-driver — different
from v2's `S_I_vehicleOccupancy`), `S_I_ParkingPaymentTypeNotCarDriver`,
`S_I_BridgesNotCarDriver`. v2 also comments out `S_I_sameModeAsReverseTrip`
(not exported).

| Priority | od_mtl_2023 check | Status | Notes |
| :---: | --- | --- | --- |
| 1 | `S_I_busLines` | **To port** | `busLines` must be a string array with no empty/whitespace entries. `busLines` exists on Evolution `Segment`. |
| 1 | `S_I_busLinesWarning` | **To Port** | Audits `busLinesWarning` (widget-computed cache; only `'ok'` is valid). Field does not exist on Evolution `Segment`; |
| 1 | `S_I_driver` | **To port** | Value not in allowed values (`SAttr.driverValues`). Maps to Evolution `driverType` (core has its own `driverValues`); needs configurable enum. |
| 1 | `S_I_driverUuid` | **To port** | `driverUuid` must be a valid UUID when set. Generic; field exists in core. |
| 1 | `S_I_busAccess` | **Project-specific** | Value not in `SAttr.busAccessValues` (`walk`/`bicycle`/`paratransit`). `busAccess` is od_qc_2023-only and not in Evolution `Segment` schema. |
| 1 | `S_M_sequence` | **To port** | `_sequence` is missing. Generic required-field check; `_sequence` exists in core. |
| 1 | `S_M_modeCategory` | **To port** | `modeCategory` is missing. Generic; core exposes `modeCategory` as a derived getter from `mode`. |
| 1 | `S_I_mode` | **To port** | Value not in allowed values (`SAttr.modeValues`). od_mtl mode list differs from Evolution core `modeValues`; core needs configurable enum (or survey-specific extended check). |
| 1 | `S_I_modeCategory` | **To port** | Value not in `SAttr.modeCategoryValues`. Core has `modeCategoryValues` but od_mtl list differs (no `preferNotToAnswer`); configurable enum. |
| 1 | `S_I_modeOtherSpecify` | **To port** | `modeOtherSpecify` must be a non-empty string when set. Generic. |
| 2 | `S_I_vehicleOccupancy` | **To port** | `vehicleOccupancy` must be a number ≥ 0 when set. Generic (distinct from v1's mode-conditional `S_I_VehicleOccupancy`). |
| 2 | `S_I_paidForParking` | **Project-specific** | Validates against `yesNoDontKnow` string enum. Evolution core types `paidForParking` as `boolean` (already validated in `validateParams`); enum audit does not apply to core schema. |
| 2 | `S_I_parkingPaidByEmployer` | **Project-specific** | Value not in `yesNoDontKnowValues`. Field is od_mtl-only; not in Evolution `Segment` schema. |
| 2 | `S_I_parkingPaymentType` | **To port** | Value not in `SAttr.parkingPaymentTypeValues`. Not in core `SegmentAttributes` but generic allowed-values pattern; configurable enum (used in demo_survey widgets as custom path). |
| 2 | `S_I_parkingType` | **To port** | Value not in `SAttr.parkingTypeValues`. Same as above. |
| 1 | `S_I_remStationStart` | **Project-specific** | Value not in `SAttr.remStationValues` (built from `stationsREM.json` geojson). Montreal REM infrastructure. |
| 1 | `S_I_remStationEnd` | **Project-specific** | Same as `S_I_remStationStart`. |
| 1 | `S_I_subwayStationStart` | **To port (config-driven)** | Value not in `SAttr.subwayStationValues` (from `subwayStations.json`). Generic "station shortname in configured list" pattern; core needs configurable station list. |
| 1 | `S_I_subwayStationEnd` | **To port (config-driven)** | Same as `S_I_subwayStationStart`. |
| 1 | `S_I_trainStationStart` | **Project-specific** | Value not in `SAttr.trainStationValues` (from `trainStations.json`). Regional rail network lookup. |
| 1 | `S_I_trainStationEnd` | **Project-specific** | Same as `S_I_trainStationStart`. |
| 1 | `S_I_subwayTransferStations` | **To port** | Each element must be in `SAttr.subwayTransferStations` (hardcoded Montreal transfer stations). Generic array-of-enum pattern; list should be configurable. |
| 1 | `S_I_tripJunctionParkingType` | **Project-specific** | Value not in `SAttr.tripJunctionParkingTypeValues`. od_mtl/od_mtl_ete attribute with project-coded parking-at-junction enum. |
| 1 | `S_I_tripJunctionPoint` | **Project-specific** | Value not in `SAttr.junctionPointValues` (from `pointJonctionBus.json`); also allows `'other'`/`'dontKnow'`. od_mtl bus-junction geojson lookup. |
| 1 | `S_I_tripJunctionPointUnknown` | **Project-specific** | Warning when `tripJunctionPoint === 'dontKnow'`. Depends on od_mtl `tripJunctionPoint` field (not in core schema). |

### Summary (Segment)

- To port (generic, possibly needs config/parameterization): 14
- Project-specific (custom geojson / shortnames / od_mtl attributes / type mismatches): 12
- Skip: 1 (`S_I_busLinesWarning`)
- (Already in Evolution: 1 — `S_M_mode` → `S_M_Mode`, excluded from the table above)

### Open questions for porting (Segment)

- v1 had 9 cross-object / mode-conditional logic checks (age vs school bus,
  car-driver license, driver in household, bridges/parking/occupancy when
  mode ≠ car-driver) that were removed in v2. Decide whether to re-introduce
  any as core checks (they need `person` + household person lookup, which
  `SegmentAuditCheckContext` already provides).
- `driver` vs `driverType`: od_mtl audits `segment.driver`; Evolution core
  field is `driverType`. Port should target `driverType` and use core
  `driverValues` (or configurable override).
- Mode / modeCategory enums differ substantially between od_mtl `SAttr` and
  Evolution core `SegmentAttributes`. `S_I_mode` and `S_I_modeCategory` likely
  belong in `SegmentExtendedAuditChecks` per survey unless core adopts a single
  canonical mode list.
- Station / junction allowed-values checks (`subway`, `train`, `REM`,
  `tripJunctionPoint`) share one pattern: value must be in a list derived from
  project geojson. A single config-driven "value in named lookup list"
  mechanism (like Home's zone checks) could cover subway start/end; train/REM/
  junction stay project-specific.
- `bridgesAndLinksQC` vs `bridgesAndTunnels` are mutually exclusive by survey
  shortname — both need survey identity in context (not currently in
  `SegmentAuditCheckContext`) or stay entirely project-side.
- `busLinesWarning` audits a widget-side computed flag; if similar patterns
  arise elsewhere, document that computed UI state fields are out of scope for
  core audits.
- `SegmentExtendedAuditChecks.ts` is empty — natural home for survey-specific
  segment checks (od_mtl modes, parking enums, geojson stations) while generic
  checks (`_sequence`, UUID, busLines array, vehicleOccupancy range) go in
  `SegmentAuditChecks.ts`.

---

## TODO: other od_mtl_2023 validation files to review

- [x] `homeV2.validations.ts` — done above
- [x] `householdV2.validations.ts` — done above
- [x] `personV2.validations.ts` — done above
- [x] `visitedPlaceV2.validations.ts` — done above
- [x] `tripV2.validations.ts` — done above
- [x] `segmentV2.validations.ts` — done above
- [x] `interviewV2.validations.ts` — done above
- [x] journey validations — no dedicated od_mtl_2023 file exists; old versions in od_mtl_2023 were in person and moved to journey for this TODO.

---

## Rapport : checks restants par priorité

Décompte des lignes de checks od_mtl_2023 encore listées dans ce document
(donc pas déjà dans Evolution), par valeur de priorité assignée, tous statuts
confondus (To port / Project-specific / Skip).

| Section | Priorité 1 | Priorité 2 | Priorité 3 | Sans priorité | Total |
| --- | :---: | :---: | :---: | :---: | :---: |
| Interview | 3 | 16 | 2 | 0 | 21 |
| Home | 0 | 5 | 9 | 0 | 14 |
| Household | 1 | 16 | 5 | 1 | 23 |
| Person | 41 | 18 | 2 | 4 | 65 |
| Journey | 12 | 1 | 0 | 1 | 14 |
| Visited Place | 13 | 0 | 0 | 0 | 13 |
| Trip | 9 | 25 | 0 | 0 | 34 |
| Segment | 20 | 5 | 0 | 0 | 25 |
| **Total** | **99** | **86** | **18** | **6** | **209** |

- **Priorité 1 (plus urgent) : 99**
- **Priorité 2 (moyen) : 86**
- **Priorité 3 (moins urgent) : 18**
- **Total priorisé (1+2+3) : 203**
- Sans priorité assignée : 6 (dashes = hors scope pour Evolution, ou
  quelques cas isolés non encore priorisés)
- Total général des checks catalogués (tous statuts, pas encore dans
  Evolution) : 209
