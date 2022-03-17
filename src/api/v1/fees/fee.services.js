import { internalResponse } from "../../../helpers/response.helpers"
import Joi from "joi"
import { configRepository } from "../../../config/key_var"

class FeeService {
  async inputFee(feeDTO) {
    const { FeeConfigurationSpec } = feeDTO

    if (!FeeConfigurationSpec) {
      return internalResponse(false, {}, 400, "Fee configuration required")
    }

    //replace any new-line character with character "<&"
    let new_config = FeeConfigurationSpec.replace(/[\r\n]+/gm, "<&")

    //split into an array
    new_config = new_config.split("<&")

    let config_array = []
    //check the syntax {FEE-ID} {FEE-CURRENCY} {FEE-LOCALE} {FEE-ENTITY}({ENTITY-PROPERTY}) : APPLY {FEE-TYPE} {FEE-VALUE}
    for (const config of new_config) {
      //replace the first instance of ":" with another character(+&)
      let data = config.replace(/:/, "+&")
      data = data.split("+&") //split

      if (data.length > 2) {
        return internalResponse(
          false,
          { config_spec: config },
          400,
          "Syntax error: Check the right format for the config spec!"
        )
      }

      if (
        data[0].trim().split(" ").length < 4 ||
        data[1].trim().split(" ").length < 3
      ) {
        return internalResponse(
          false,
          { config_spec: config },
          400,
          "Syntax error: Check the right format for the config spec!"
        )
      }

      const data_1 = data[0].trim().split(" ")  // {FEE-ID} {FEE-CURRENCY} {FEE-LOCALE} {FEE-ENTITY}({ENTITY-PROPERTY})
      const data_2 = data[1].trim().split(" ") // APPLY {FEE-TYPE} {FEE-VALUE}

      if (data_2[0].toLowerCase() !== "apply") {
        return internalResponse(
          false,
          { config_spec: config },
          400,
          "Syntax error: Check the right format for the config spec!"
        )
      }

      let fee_enttity_data = data_1[3].replace(/[()]+/gm, " ") //remove the "()" in {FEE-ENTITY}({ENTITY-PROPERTY})

      fee_enttity_data = fee_enttity_data.trim().split(" ")

      if (fee_enttity_data.length < 2) {
        return internalResponse(
          false,
          { config_spec: config },
          400,
          "Syntax error: Check the right format for the config spec!"
        )
      }

      // each config data
      const fee_config = {
        fee_id: data_1[0],
        fee_currency: data_1[1],
        fee_locale: data_1[2],
        fee_entity: fee_enttity_data[0],
        fee_entity_property: fee_enttity_data[1],
        fee_type: data_2[1],
        fee_value: {
          flat_value:
            data_2[1].toLowerCase() === "flat_perc"
              ? data_2[2].split(":")[0]
              : data_2[1].toLowerCase() === "flat"
              ? data_2[2]
              : "0",
          perc_value:
            data_2[1].toLowerCase() === "flat_perc"
              ? data_2[2].split(":")[1]
              : data_2[1].toLowerCase() === "perc"
              ? data_2[2]
              : "0",
        },
      }

      //extra validation with Joi
      const schema = Joi.object().keys({
        fee_id: Joi.string().alphanum().required(),
        fee_currency: Joi.valid("*", "NGN", "USA").required(),
        fee_locale: Joi.valid("*", "INTL", "LOCL").required(),
        fee_entity: Joi.valid(
          "*",
          "CREDIT-CARD",
          "DEBIT-CARD",
          "BANK-ACCOUNT",
          "USSD",
          "WALLET-ID"
        ).required(),
        fee_entity_property: Joi.string().required(),
        fee_type: Joi.valid("FLAT", "PERC", "FLAT_PERC").required(),
        fee_value: Joi.object().keys({
          flat_value: Joi.number().required(),
          perc_value: Joi.number().required(),
        }),
      })

      const result = schema.validate(fee_config)

      if (result.error) {
        return internalResponse(
          false,
          { config_spec: config },
          400,
          result.error?.details
            ? result.error?.details[0]?.message
            : "Syntax error: Check the right format for the config spec!"
        )
      }

      config_array.push(fee_config)
    }

    if(config_array.length <= 0) {
      return internalResponse(false, {}, 400, "error in saving the config")
    }

    //store to dataConfig.js
    await configRepository.addData(config_array)

    return internalResponse(
      true,
      {status: "OK"},
      200,
      "Fee config received and stored!"
    )
  }

  async computeFees(feeDTO) {
    const { Amount, Currency, CurrencyCountry, Customer, PaymentEntity } =
      feeDTO

    const {
      ID: id,
      Issuer,
      Brand,
      Number: any_number,
      SixID,
      Type,
      Country,
    } = PaymentEntity


    //fee locale 
    const inc_fee_locale = CurrencyCountry === Country ? "LOCL" : CurrencyCountry !== Country ? "INTL" : ""
    
    const configs = await configRepository.getDdata()

    const find_config = configs.filter((config) => {
      return (
        (config.fee_currency === Currency || config.fee_currency === "*") &&
        (config.fee_locale === inc_fee_locale || config.fee_locale === "*") &&
        (config.fee_entity === Type || config.fee_entity === "*") &&
        (config.fee_entity_property === id ||
          config.fee_entity_property === Issuer ||
          config.fee_entity_property === Brand ||
          config.fee_entity_property === any_number ||
          config.fee_entity_property === SixID ||
          config.fee_entity_property === "*")
      )
    })

    if (find_config.length <= 0) {
      return internalResponse(
        false,
        {},
        400,
        "No fee configuration for this type of transaction"
      )
    }

    let data_cont = []
    let i = 0

    //geting the specific one --lesser * values
    for (const fee_config of find_config) {
      //{FEE-CURRENCY} {FEE-LOCALE} {FEE-ENTITY}({ENTITY-PROPERTY})
      const data = `${fee_config.fee_currency} ${fee_config.fee_locale} ${fee_config.fee_entity}(${fee_config.fee_entity_property})`

      const spec_length = data.split("*").length - 1

      data_cont.push({ spec: { i: i, spec_length } })
      i++
    }

    //sort the data container --lowwest to heighest
    data_cont.sort((a, b) =>
      a.spec.spec_length > b.spec.spec_length
        ? 1
        : b.spec.spec_length > a.spec.spec_length
        ? -1
        : 0
    )

    //actual fee_config
    const applied_fee_config = find_config[data_cont[0].spec.i]

    //transaction fee calculations
    const fee_type = applied_fee_config.fee_type
    let calc

    if (fee_type === "PERC") {
      calc =
        (parseFloat(applied_fee_config.fee_value.perc_value) / 100) *
        parseFloat(Amount)
    }

    if (fee_type === "FLAT") {
      calc = parseFloat(applied_fee_config.fee_value.flat_value)
    }

    if (fee_type === "FLAT_PERC") {
      calc =
        (parseFloat(applied_fee_config.fee_value.perc_value) / 100) *
          parseFloat(Amount) +
        parseFloat(applied_fee_config.fee_value.flat_value)
    }

    const charged_amount = Customer.BearsFee
      ? parseFloat(Amount) + calc
      : parseFloat(Amount)

    //response
    const response = {
      AppliedFeeID: applied_fee_config.fee_id,
      AppliedFeeValue: Math.round(calc),
      ChargeAmount: charged_amount,
      SettlementAmount: charged_amount - calc,
    }

    return internalResponse(
      true,
      response,
      200,
      "Transaction fees computation done"
    )
  }
}

export const feeService = new FeeService()
