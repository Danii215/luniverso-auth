import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
    @Field()
    accessToken: string;

    @Field()
    refreshToken: string;
}
