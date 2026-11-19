
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('users')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // GET /api/v1/users/me
  @Get('me')
  getMyProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.id);
  }

  // PATCH /api/v1/users/me
  @Patch('me')
  updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string },
  ) {
    return this.usersService.updateProfile(
      req.user.id,
      body.name,
    );
  }
}
