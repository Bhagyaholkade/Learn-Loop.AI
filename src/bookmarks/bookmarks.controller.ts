import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(
    private readonly bookmarksService: BookmarksService,
  ) {}

  @Post()
  addBookmark(
    @Req() req: AuthenticatedRequest,
    @Body('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.bookmarksService.addBookmark(
      req.user.id,
      courseId,
    );
  }

  @Get('my')
  getMyBookmarks(@Req() req: AuthenticatedRequest) {
    return this.bookmarksService.getMyBookmarks(req.user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  async removeBookmark(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.bookmarksService.removeBookmark(
      id,
      req.user.id,
    );
  }
}