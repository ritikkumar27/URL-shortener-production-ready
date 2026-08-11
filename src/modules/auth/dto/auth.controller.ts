import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './../dto/auth.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '../../../common/decorators/current-user.decorator';



@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({summary: 'Register a new Account'})
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }
}