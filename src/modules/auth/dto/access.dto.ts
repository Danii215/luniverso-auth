import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AccessTokenPayload {
    @Field()
    accessToken: string;

    @Field()
    refreshToken: string;
}
