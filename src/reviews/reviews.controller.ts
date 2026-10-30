
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  // Submit a review — login required
  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(
      req.user.id,
      data.courseId,
      data.rating,
      data.comment,
    );
  }

  // View reviews for a course
  @Get('course/:courseId')
  findCourseReviews(
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.reviewsService.findCourseReviews(courseId);
  }

  // View average rating for a course
  @Get('course/:courseId/rating')
  getCourseRating(
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.reviewsService.getCourseRating(courseId);
  }
}
