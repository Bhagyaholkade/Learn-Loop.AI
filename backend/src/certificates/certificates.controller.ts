
import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('Certificates')
@ApiBearerAuth('bearer')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
  ) {}

  @Get('eligibility/:courseId')
  checkEligibility(
    @Req() req: AuthenticatedRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.certificatesService.checkEligibility(
      req.user.id,
      courseId,
    );
  }

  @Post(':courseId/issue')
  issueCertificate(
    @Req() req: AuthenticatedRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.certificatesService.issueCertificate(
      req.user.id,
      courseId,
    );
  }

  @Get('my')
  getMyCertificates(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.certificatesService.getMyCertificates(
      req.user.id,
    );
  }

  @Get(':courseId')
  getCourseCertificate(
    @Req() req: AuthenticatedRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.certificatesService.getCourseCertificate(
      req.user.id,
      courseId,
    );
  }
}
