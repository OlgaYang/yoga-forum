import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'
import { GraphQLSchema, GraphQLError, defaultFieldResolver } from 'graphql'

export function authDirectiveTransformer(schema: GraphQLSchema) {
    return mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
            const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0]
            if (authDirective != null) {
                const { resolve = defaultFieldResolver } = fieldConfig
                fieldConfig.resolve = async function (source, args, context, info) {
                    if (!context.jwt) {
                        throw new GraphQLError('Unauthorized')
                    }
                    return resolve.call(this, source, args, context, info)
                }
            }
            return fieldConfig
        }
    })
}