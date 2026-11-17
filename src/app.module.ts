
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Core application
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AiQuizModule } from './ai-quiz/ai-quiz.module';
import { AiCourseModule } from './ai-course/ai-course.module';
import { ChaptersModule } from './chapters/chapters.module';


@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MySQL database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    // Application feature modules
    StudentsModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    ReviewsModule,
    BookmarksModule,
    QuizzesModule,
    CertificatesModule,
    AiQuizModule,
    AiQuizModule,
    AiCourseModule,
    ChaptersModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
