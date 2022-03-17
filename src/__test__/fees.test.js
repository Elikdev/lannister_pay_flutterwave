import app from "../app"
import request from "supertest"
import client from "../config/redis"
import {feeConfigurationSpec, fee_test_1, fee_test_2, fee_test_3} from "./feeConfig"

describe("Testing the lannisterpay API", () => {
  it("testing POST /fees", async () => {
   const response = await request(app).post("/fees").send({FeeConfigurationSpec: feeConfigurationSpec}) 

   //expects response statusCode to be 200
   expect(response.statusCode).toBe(200)
   expect(response.body.status).toBe("OK")
  })

  it("testing with data _1", async() => {
   const response = await request(app).post("/compute-transaction-fee").send(fee_test_1)

   //expects response to be 200
   expect(response.statusCode).toBe(200)
   expect(response.body).toStrictEqual(
    {
     "AppliedFeeID": "LNPY1223",
     "AppliedFeeValue": 120,
     "ChargeAmount": 5120,
     "SettlementAmount": 5000
    }
   )
  })

  it("testing with data _2", async() => {
   const response = await request(app).post("/compute-transaction-fee").send(fee_test_2)

   //expects response to be 200
   expect(response.statusCode).toBe(200)
   expect(response.body).toStrictEqual(
    {
     "AppliedFeeID": "LNPY1221",
     "AppliedFeeValue": 49,
     "ChargeAmount": 3500,
     "SettlementAmount": 3451
    }
   )
  })

  it("testing with data _3", async() => {
   const response = await request(app).post("/compute-transaction-fee").send(fee_test_3)
    //expects response to be 400
    expect(response.statusCode).toBe(400)
  })
})

afterAll(async () => {
 await client?.disconnect()
 return
})