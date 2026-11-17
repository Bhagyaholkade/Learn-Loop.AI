
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { AiCourseService } from './ai-course.service';

import { GenerateCourseOutlineDto } from './dto/generate-course-outline.dto';
import { SaveCourseOutlineDto } from './dto/save-course-outline.dto';
import { GenerateLessonContentDto } from './dto/generate-lesson-content.dto';
import { SaveLessonContentDto } from './dto/save-lesson-content.dto';
import { UpdateAiCourseDraftDto } from './dto/update-ai-course-draft.dto';
import { ApproveAiCourseDraftDto } from './dto/approve-ai-course-draft.dto';

interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@ApiTags('AI Course Creator')
@ApiBearerAuth('bearer')
@Controller('ai-course')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AiCourseController {
  constructor(
    private readonly aiCourseService: AiCourseService,
  ) {}

  // ==========================================
  // 1. GENERATE COURSE OUTLINE
  // Automatically saves generated outline as a draft
  // ==========================================

  @Post('generate-outline')
  @ApiOperation({
    summary: 'Generate and automatically save an AI course draft',
  })
  async generateCourseOutline(
    @Body() dto: GenerateCourseOutlineDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const outline =
      await this.aiCourseService.generateCourseOutline(
        dto,
        req.user.id,
      );

    return {
      success: true,
      message: 'AI course outline generated and saved as a draft.',
      data: outline,
    };
  }

  // ==========================================
  // 2. GET ALL MY AI COURSE DRAFTS
  // ==========================================

  @Get('drafts')
  @ApiOperation({
    summary: 'Get all AI course drafts belonging to the logged-in admin',
  })
  async getMyDrafts(
    @Req() req: AuthenticatedRequest,
  ) {
    const drafts =
      await this.aiCourseService.getMyDrafts(
        req.user.id,
      );

    return {
      success: true,
      message: 'AI course drafts retrieved successfully.',
      data: drafts,
    };
  }

  // ==========================================
  // 3. GET A SINGLE DRAFT
  // Used to resume editing after login or refresh
  // ==========================================

  @Get('drafts/:draftId')
  @ApiOperation({
    summary: 'Get an individual AI course draft',
  })
  async getDraftById(
    @Param('draftId', ParseIntPipe) draftId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const draft =
      await this.aiCourseService.getDraftById(
        req.user.id,
        draftId,
      );

    return {
      success: true,
      message: 'AI course draft retrieved successfully.',
      data: draft,
    };
  }

  // ==========================================
  // 4. UPDATE / AUTOSAVE DRAFT
  // Saves edited chapters and lessons
  // ==========================================

  @Patch('drafts/:draftId')
  @ApiOperation({
    summary: 'Update an AI course draft',
    description:
      'Saves the latest edited course outline, including chapters and lessons.',
  })
  async updateDraft(
    @Param('draftId', ParseIntPipe) draftId: number,
    @Body() dto: UpdateAiCourseDraftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const draft =
      await this.aiCourseService.updateDraft(
        req.user.id,
        draftId,
        dto,
      );

    return {
      success: true,
      message: 'AI course draft updated successfully.',
      data: draft,
    };
  }

  // ==========================================
  // 5. DELETE DRAFT
  // ==========================================

  @Delete('drafts/:draftId')
  @ApiOperation({
    summary: 'Delete an AI course draft',
  })
  async deleteDraft(
    @Param('draftId', ParseIntPipe) draftId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.aiCourseService.deleteDraft(
      req.user.id,
      draftId,
    );

    return {
      success: true,
      message: 'AI course draft deleted successfully.',
    };
  }

  // ==========================================
  // 6. APPROVE DRAFT
  // Converts AI draft into Course, Chapter and Lesson records
  // ==========================================

  @Post('drafts/:draftId/approve')
  @ApiOperation({
    summary: 'Approve an AI course draft and create a course',
  })
  async approveDraft(
    @Param('draftId', ParseIntPipe) draftId: number,
    @Body() dto: ApproveAiCourseDraftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const course =
      await this.aiCourseService.approveDraft(
        req.user.id,
        draftId,
        dto,
      );

    return {
      success: true,
      message: 'AI course draft approved and converted into a course.',
      data: course,
    };
  }

  // ==========================================
  // 7. LEGACY SAVE APPROVED COURSE OUTLINE
  // Preserved for existing manual course creation flow
  // ==========================================

  @Post('save-outline')
  @ApiOperation({
    summary: 'Save an approved course outline',
  })
  async saveCourseOutline(
    @Body() dto: SaveCourseOutlineDto,
  ) {
    const course =
      await this.aiCourseService.saveCourseOutline(dto);

    return {
      success: true,
      message: 'AI-generated course saved successfully as a draft.',
      data: course,
    };
  }

  // ==========================================
  // 8. GENERATE DETAILED LESSON CONTENT
  // ==========================================

  @Post('generate-lesson-content/:lessonId')
  @ApiOperation({
    summary: 'Generate detailed AI lesson content',
    description:
      'Generates a lesson preview without saving it to the database.',
  })
  async generateLessonContent(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: GenerateLessonContentDto,
  ) {
    const content =
      await this.aiCourseService.generateLessonContent(
        lessonId,
        dto,
      );

    return {
      success: true,
      message: 'AI lesson content generated successfully.',
      data: content,
    };
  }

  // ==========================================
  // 9. SAVE APPROVED LESSON CONTENT
  // ==========================================

  @Post('save-lesson-content/:lessonId')
  @ApiOperation({
    summary: 'Save admin-approved AI lesson content',
    description:
      'Saves reviewed lesson content into the lessons.aiContent column.',
  })
  async saveLessonContent(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: SaveLessonContentDto,
  ) {
    const lesson =
      await this.aiCourseService.saveLessonContent(
        lessonId,
        dto,
      );

    return {
      success: true,
      message: 'AI lesson content saved successfully.',
      data: lesson,
    };
  }
}
