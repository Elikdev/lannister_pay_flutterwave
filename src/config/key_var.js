import dotenv from "dotenv"
import fs from "fs"

dotenv.config()

export const PORT = process.env.PORT || 5000
export const REDIS_URL = process.env.REDIS_URL

class ConfigRepository {
 constructor (dbFile = "db.json") {
  if (!dbFile) {
   console.log("file name is required")
  }
  this.dbFile = dbFile
  this.dbData = []

  try {
   fs.accessSync(this.dbFile)
  } catch (error) {
   //create the file
   fs.writeFileSync(this.dbFile, '[]') 
  }
 }

 //add data to file
  async addData(data) {
    this.dbData = data
    await fs.promises.writeFile(this.dbFile, JSON.stringify(data), null, 2)
    return true
 }

 async getDdata() {
  const dataRecord = await fs.promises.readFile(this.dbFile, {
   encoding: "utf8"
  })

  //parse data records
  const objData = JSON.parse(dataRecord)

  this.dbData = objData

  return this.dbData
 }
}

export const configRepository = new ConfigRepository("dataConfig.json")