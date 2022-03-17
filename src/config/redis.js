import { createClient } from "redis";
import { REDIS_URL } from "./key_var";

let client

(async() => {
 client = createClient({
  url: REDIS_URL
 })
 await client.connect()
})() 

client?.on("connect", () => console.log("Connected to redis"))

client?.on("ready", () => console.log("Client connected to redis and ready for use"))

client?.on("error", (err) => console.log("Error from redis client", err))

client?.on("end", () => console.log("Client disconnected from redis"))

export default client