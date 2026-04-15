import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenInput {
    /** Opcional quando o refresh vem do cookie HttpOnly. */
    @IsOptional()
    @IsString()
    refreshToken?: string;
}
