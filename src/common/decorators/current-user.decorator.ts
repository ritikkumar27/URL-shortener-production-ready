import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayLoad {
    id: string,
    email: string;
    role: 'USER' | 'ADMIN';
}

export const CurrentUser = createParamDecorator(
    (data: keyof UserPayLoad | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as UserPayLoad | undefined;
        return data && user ? user[data] : user;
    },
);