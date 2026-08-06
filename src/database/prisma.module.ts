import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}



// import {Global, Module} from '@nestjs/common';
// import { PrismaServie } from './prisma.service';

// @Global()
// @Module({
//     providers: [PrismaServie],
//     exports: [PrismaServie],
// })

// export class PrismaModule {}