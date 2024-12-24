import {  GraphQLError } from "graphql";
import { APIphone, Contactdb } from "./types.ts"
import { Collection,ObjectId } from "mongodb";


type context={
    contactscollection:Collection<Contactdb>
}

export const resolvers={
    Contact:{
        _id:(parent:Contactdb):string=>{
            return parent._id!.toString()
        },
        time:async(parent:Contactdb):Promise<string>=>{
            const API_KEY="VZjSRKRf4AUDU8thHksqxA==q86QGMKJOFiLGtVJ"
            if(!API_KEY){
                throw new GraphQLError("API KEY is not set")
            }
            const timezone=parent.timezone
            const url=`https://api.api-ninjas.com/v1/worldtime?timezone=${timezone}`

            const data=await fetch(url,
                {
                    headers:{
                        'X-Api-Key':API_KEY
                    }
                }
            );
            if(data.status!=200) throw new GraphQLError("API NINJA ERROR")
            const response=await data.json()
            return response.datetime;
        } 
    },
    Query:{
        getContacts:async(_:unknown,__:unknown,ctx:context):Promise<Contactdb[]>=>{
            if (!ctx.contactscollection) {
                throw new Error("Contacts collection is not initialized");
            }
           const contactsdb=await ctx.contactscollection.find().toArray()
           return contactsdb
        },
        getContact:async(_:unknown,args:{phone:string},ctx:context):Promise<Contactdb|null>=>{
            const contactdb=await ctx.contactscollection.findOne({phone:args.phone})
            console.log(contactdb)
            if(!contactdb) return null
            return contactdb
        }
    },
    Mutation:{
        addContact:async(_:unknown,args:{name:string,phone:string},ctx:context):Promise<Contactdb>=>{
            const API_KEY=Deno.env.get("API_KEY")
            if(!API_KEY){
                throw new GraphQLError("KEY is not set")
            }
            const{phone,name}=args
            // cuenta el numero de telefonos iguales al que le estas insertando si es >=1 no lo inserta
            const phoneexist=await ctx.contactscollection.countDocuments({phone})
            if(phoneexist>=1) throw new GraphQLError("Phone exists")
            const url=`https://api.api-ninjas.com/v1/validatephone?number=${phone}`
            const data=await fetch(url,
                {
                        headers:{
                            'X-Api-Key':API_KEY
                        }
                }
            );
            console.log(data.status)
            if(data.status!==200){
                throw new GraphQLError("API NINJA Error")
            }
            
            const response:APIphone=await data.json()

            if(!response.is_valid){
                throw new GraphQLError("Format number is not valid")
            }
            const country=response.country
            const timezone=response.timezones[0]

            const{insertedId}=await ctx.contactscollection.insertOne({
                name:args.name,
                phone:args.phone,
                country:country,
                timezone:timezone
            })
            return {
                _id:insertedId,
                name:args.name,
                phone:args.phone,
                country:country,
                timezone:timezone
            }
        
        },
        updateContact:async(_:unknown,args:{id:string,name:string,phone:string},ctx:context):Promise<Contactdb|null>=>{
            const API_KEY=Deno.env.get("API_KEY")
            if(!API_KEY){
                throw new GraphQLError("Key is not set")
            }
            const {phone,name}=args
            if(!phone&&!name){
                throw new GraphQLError("you must update one value")
            }
            
            const contactdb=await ctx.contactscollection.findOne({_id:new ObjectId(args.id)})
            if(!contactdb)return null

            const updatecontact={
                name:args.name??contactdb.name,
                phone:args.phone??contactdb.phone
            }

            const url=`https://api.api-ninjas.com/v1/validatephone?number=${updatecontact.phone}`
            const data=await fetch(url,
                {
                    headers:{
                        'X-Api-Key':API_KEY
                    }
                }
            );
            if(data.status!==200)throw new GraphQLError("error")
            const response:APIphone=await data.json()
            console.log(response)
            if(!response.is_valid) throw new GraphQLError("numer not valid")
            const country=response.country
            const timezone=response.timezones

            const newuser=await ctx.contactscollection.findOneAndUpdate(
                {_id:new ObjectId(args.id)},
                {$set:{name:updatecontact.name,phone:updatecontact.phone,country:country,timezone:timezone[0]}}
            )
            return newuser
            

        },
        deleteContact:async(_:unknown,args:{id:string},ctx:context):Promise<boolean|null>=>{
            const contactdb=await ctx.contactscollection.findOne({_id:new ObjectId(args.id)})
            if(!contactdb) return null
            const{deletedCount}=await ctx.contactscollection.deleteOne({_id:new ObjectId(args.id)})
            if(deletedCount===0) return false
            return true
        }
    }
}