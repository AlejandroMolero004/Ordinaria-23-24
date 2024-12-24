export const schema=`#graphql

    type Contact{
        _id:ID!
        name:String!
        phone:String!
        country:String!
        time:String!
    }

    type Query{
        getContacts:[Contact!]!
        getContact(phone:String!):Contact!
    }

    type Mutation{
        addContact(name:String!,phone:String!):Contact
        updateContact(id:String!,name:String,phone:String):Contact
        deleteContact(id:String):Boolean
    }

`




