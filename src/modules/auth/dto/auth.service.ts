import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import * as argon2 from 'argon2';
import { JwtPayload } from './strategies/jwt.strategy';







@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,

    ) {}


    async register(dto: RegisterDto){
        const existing = await this.prisma.user.findUnique({
            where: {email: dto.email},
        });

        if(existing) {
            throw new ConflictException('An account with this email already exists');
        }

        const passwordHash = await argon2.hash(dto.password);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name ?? null,
            },

            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,

        })

        return {user, ...tokens};

        
    }

    async login(dto: LoginDto){

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid email or password');
            }
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        };


    }

    private async generateTokens(payload: JwtPayload){
        const accessSecret = this.configService.get<string>('JWT_SECRET', 'default_secret');
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'default_refresh_secret');
        const accessExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
        const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: accessSecret,
                expiresIn: accessExpiry as any,
            }),
            this.jwtService.signAsync(payload, {
            secret: refreshSecret,
            expiresIn: refreshExpiry as any,
            }),
        ]);
        return {
            accessToken,
            refreshToken,
            expiresIn: accessExpiry,
        };

    }


    async refreshToken(dto: RefreshTokenDto){

        try {
            const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'default_refresh_secret');
            const decoded = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
                secret: refreshSecret,
            });
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.sub },
            });
            if (!user) {
                throw new UnauthorizedException('User no longer exists');
            }
            return this.generateTokens({
                sub: user.id,
                email: user.email,
                role: user.role,
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

    }




    
}


