import { ObjectId } from "mongodb";

export type Contactdb={
    _id?:ObjectId
    name:string
    phone:string
    country:string
    timezone:string
}

export type APIphone={
    is_valid:boolean
    country:string
    timezones:string[]
}