import * as Yup from "yup";
import type { ObjectShape } from "yup/lib/object";

import type { PowerField, PowerType } from "@/app/store/general/types";
import { PowerFieldScope, PowerFieldType } from "@/app/store/general/types";
import type { PowerParameters } from "@/app/store/types/node";

/**
 * Formats power parameters by what is expected by the api. Also, React expects
 * controlled inputs to have some associated state. Because the power parameters
 * are dynamic and dependent on what power type is selected, the form is
 * initialised with all possible power parameters from all power types. Before
 * the action is dispatched, the power parameters are trimmed to only those
 * relevant to the selected power type.
 *
 * @param powerType - selected power type
 * @param powerParameters - all power parameters entered in Formik form
 * @param fieldScopes - the scopes of the fields to show.
 * @param forChassis - whether the parameters need to be formatted for adding a chassis
 * @returns power parameters relevant to selected power type
 */

const chassisParameterMap = new Map([
  ["power_address", "hostname"],
  ["power_pass", "password"],
  ["power_port", "port"],
  ["power_protocol", "protocol"],
  ["power_token_name", "token_name"],
  ["power_token_secret", "token_secret"],
  ["power_user", "username"],
  ["power_verify_ssl", "verify_ssl"],
]);
export const formatPowerParameters = (
  powerType: PowerType | null,
  powerParameters: PowerParameters,
  fieldScopes: PowerFieldScope[] = [PowerFieldScope.BMC, PowerFieldScope.NODE],
  forChassis = false
): PowerParameters =>
  powerType?.fields?.reduce<PowerParameters>((params, field) => {
    if (fieldScopes.includes(field.scope)) {
      if (forChassis) {
        // The add_chassis api expects different field names than what's given
        // in the list of power type fields.
        const fieldName = chassisParameterMap.get(field.name) || field.name;
        params[fieldName] = powerParameters[field.name];
      } else {
        params[field.name] = powerParameters[field.name];
      }
    }
    return params;
  }, {}) || {};

/**
 * Generates a Yup validation object shape for power parameters based on the
 * selected power type and the field scopes.
 * @param powerType - Power type selected in the form.
 * @param fieldScopes - The scopes of the fields to be validated.
 * @returns Yup validation object shape for power parameters.
 */
export const generatePowerParametersSchema = (
  powerType?: PowerType | null,
  fieldScopes: PowerFieldScope[] = [PowerFieldScope.BMC, PowerFieldScope.NODE]
): ObjectShape =>
  powerType?.fields?.reduce<ObjectShape>((schema, field) => {
    if (fieldScopes.includes(field.scope)) {
      let fieldSchema =
        field.field_type === PowerFieldType.MULTIPLE_CHOICE
          ? Yup.array().of(Yup.string())
          : Yup.string();
      if (field.required) {
        fieldSchema = fieldSchema.required(`${field.label} required`);
      }
      schema[field.name] = fieldSchema;
    }
    return schema;
  }, {}) || {};

/**
 * Get a list of power fields that are included in the given field scopes.
 * @param powerType - Power type whose fields to check.
 * @param fieldScopes - The scopes of the fields to be included.
 * @returns List of power fields included in given field scopes.
 */
export const getFieldsInScope = (
  powerType: PowerType | null,
  fieldScopes: PowerFieldScope[] = [PowerFieldScope.BMC, PowerFieldScope.NODE]
): PowerField[] =>
  powerType?.fields.filter((field) => fieldScopes.includes(field.scope)) || [];

/**
 * Get a power type from its name.
 * @param powerTypes - List of power types to check.
 * @param name - Name of the power type to find.
 * @returns Power type that matches given name.
 */
export const getPowerTypeFromName = (
  powerTypes: PowerType[],
  name: string | null
): PowerType | null => powerTypes.find((type) => type.name === name) || null;
