// deno-lint-ignore-file require-await
import {MongoClient} from "mongodb"
import{ApolloServer} from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone";
import { schema } from "./schema.ts";
import { resolvers } from "./resolvers.ts";
import { Contactdb } from "./types.ts";
const MONGO_URL=Deno.env.get("MONGO_URL")
if(!MONGO_URL){
  console.log("url is not set")
  Deno.exit(0)
}

const client=new MongoClient(MONGO_URL)
await client.connect()

const db=client.db("Agenda")

const contactscollection=db.collection<Contactdb>("contacts")

const server= new ApolloServer({
  typeDefs:schema,resolvers
})

const { url } = await startStandaloneServer(server, {
  context: async () => ({ contactscollection }),
});
console.log(url)


