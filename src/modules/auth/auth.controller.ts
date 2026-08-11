import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';



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

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Log in with email and password' })
    login(@Body() dto: LoginDto){
        return this.authService.login(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh an expired access token' })
    refresh(@Body() dto: RefreshTokenDto){
        return this.authService.refreshToken(dto);

    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current logged-in user profile' })
    getProfile(@currentUserDecorator.CurrentUser() user: currentUserDecorator.UserPayload) {
        return user;
    }


}