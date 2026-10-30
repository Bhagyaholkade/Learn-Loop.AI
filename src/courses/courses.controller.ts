
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  DefaultValuePipe,
  ParseIntPipe as ParseIntegerPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a course (Admin only)' })
  create(@Body() data: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get courses with pagination and filters' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of courses per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by course title or description',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by course category',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntegerPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntegerPipe) limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.coursesService.findAll({
      page,
      limit,
      search,
      category,
      sortBy,
      order,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Course> {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCourseDto,
  ): Promise<Course> {
    return this.coursesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.coursesService.remove(id);
  }
}
