import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from './auth.dto';
import * as argon2 from 'argon2';







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

    




    
}


