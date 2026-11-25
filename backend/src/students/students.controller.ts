import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { StudentsService, StudentView } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Students')
@ApiBearerAuth('bearer')
@Controller('students')
// Every route exposes or changes real user accounts, so all are admin-only.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
  ) {}

  // GET: Test admin access
  @Get('admin-test')
  @ApiOperation({ summary: 'Test admin access' })
  adminTest() {
    return {
      message: 'Welcome, admin!',
    };
  }

  // GET: Retrieve students with pagination, search, and sorting
  @Get()
  @ApiOperation({
    summary: 'Get students with pagination and filters (Admin only)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Bhagya',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt'],
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,

    @Query('search')
    search?: string,

    @Query('sortBy')
    sortBy?: string,

    @Query('order')
    order?: string,
  ) {
    const validSortBy =
      sortBy === 'name' ? 'name' : 'createdAt';

    const validOrder =
      order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    return this.studentsService.findAll(
      page,
      limit,
      search,
      validSortBy,
      validOrder,
    );
  }

  // POST: Create a student (Admin only)
  @Post()
  @ApiOperation({ summary: 'Create a student account with a temporary password (Admin only)' })
  create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentView> {
    return this.studentsService.create(createStudentDto);
  }

  // GET: Retrieve one student by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID (Admin only)' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StudentView> {
    return this.studentsService.findOne(id);
  }

  // PATCH: Update a student (Admin only)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a student (Admin only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentView> {
    return this.studentsService.update(
      id,
      updateStudentDto,
    );
  }

  // DELETE: Delete a student (Admin only)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student (Admin only)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.studentsService.remove(id);
  }
}