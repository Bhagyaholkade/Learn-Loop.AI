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

import { StudentsService } from './students.service';
import { Student } from './entities/student.entity/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Students')
@ApiBearerAuth('bearer')
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
  ) {}

  // GET: Test admin access
  @Get('admin-test')
  @ApiOperation({ summary: 'Test admin access' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminTest() {
    return {
      message: 'Welcome, admin!',
    };
  }

  // GET: Retrieve students with pagination, search, and sorting
  @Get()
  @ApiOperation({
    summary: 'Get students with pagination and filters',
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
  @ApiOperation({ summary: 'Create a student (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<Student> {
    return this.studentsService.create(createStudentDto);
  }

  // GET: Retrieve one student by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Student> {
    return this.studentsService.findOne(id);
  }

  // PATCH: Update a student (Admin only)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a student (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    return this.studentsService.update(
      id,
      updateStudentDto,
    );
  }

  // DELETE: Delete a student (Admin only)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.studentsService.remove(id);
  }
}