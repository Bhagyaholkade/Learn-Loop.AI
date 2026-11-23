
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  
} from '@nestjs/common';

import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() data: CreateLessonDto) {
    return this.lessonsService.create(data);
  }

 @Get()
findAll(@Query('courseId') courseId?: string) {
  if (courseId !== undefined) {
    const parsedCourseId = Number(courseId);

    if (!Number.isInteger(parsedCourseId) || parsedCourseId < 1) {
      throw new BadRequestException('Invalid courseId');
    }

    return this.lessonsService.findAll(parsedCourseId);
  }

  return this.lessonsService.findAll();
}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.remove(id);
  }
}
