import { celebrate } from "celebrate"
import Joi from "joi"

export const computeFeeValidation = () => {
  return celebrate({
    body: Joi.object({
      ID: Joi.any().required(),
      Amount: Joi.number().positive().required(),
      Currency: Joi.string().required(),
      CurrencyCountry: Joi.string().required(),
      Customer: Joi.object()
        .keys({
          ID: Joi.any().optional(),
          EmailAddress: Joi.string().email().optional(),
          FullName: Joi.string().optional(),
          BearsFee: Joi.boolean().required(),
        })
        .required(),
      PaymentEntity: Joi.object()
        .keys({
          ID: Joi.any().required(),
          Issuer: Joi.string().allow(null, "").optional(),
          Brand: Joi.string().allow(null, "").optional(),
          Number: Joi.string().allow(null, "").optional(),
          SixID: Joi.any().allow(null, "").optional(),
          Type: Joi.valid(
            "CREDIT-CARD",
            "DEBIT-CARD",
            "BANK-ACCOUNT",
            "USSD",
            "WALLET-ID"
          ).required(),
          Country: Joi.string().required(),
        })
        .required(),
    }),
  })
}
